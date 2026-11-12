import { getGpu, tokenColour } from '../gpu';

/**
 * The landing's stage: one fixed WebGPU canvas behind the page, built on vgpu.
 *   compute    sim.wgsl moves the swarm toward the formation of the section in view
 *   trail      last frame dimmed (fade.wgsl) + every particle as a streak (particles.wgsl)
 *   bloom      bright pass and two blur rounds at a third of the height
 *   composite  the light on the night, split into channels by scroll speed and scene changes
 * The page drives it by writing to the state object.
 */

export const FORMS = { array: 0, tree: 1, cycle: 2, curves: 3, bounds: 4 } as const;
export type FormName = keyof typeof FORMS;
const MAX = 64;
const HDR = 'rgba16float' as const;
const STRIDE = 8; // floats per particle (sim.wgsl Particle)

export interface StageState {
	form: FormName;
	/** The element the formation fills; it scrolls with its section. */
	anchor: Element | null;
	/** Time runs and the swarm drifts (false: paused or reduced motion). */
	running: boolean;
	/** No glitch or chromatic split (reduced motion). */
	calm: boolean;
	/** Scroll speed as Lenis reports it, px per frame. */
	velocity: number;
	/** Client pixels, or null when the pointer is away. */
	pointer: [number, number] | null;
	/** Dims the light behind reading text (0..1). */
	gain: number;
	cells: Float32Array;
	span: { low: number; high: number; mid: number; found: number };
	tree: { target: number; depth: number; found: number };
	cycle: number;
	curves: number;
	/** The invariant's ruler: low, high and target as fractions of its width. */
	bounds: [number, number, number];
}

export function createState(): StageState {
	return {
		form: 'array',
		anchor: null,
		running: true,
		calm: false,
		velocity: 0,
		pointer: null,
		gain: 1,
		cells: new Float32Array(MAX * 4),
		span: { low: 0, high: 63, mid: -1, found: 0 },
		tree: { target: 0, depth: 0, found: 0 },
		cycle: 0,
		curves: 0,
		bounds: [0, 1, 0.62],
	};
}

export interface StageHandle {
	/** Ask for frames after changing the state while paused. */
	wake(): void;
	destroy(): void;
}

function seedParticles(count: number, aspect: number) {
	const data = new Float32Array(count * STRIDE);
	for (let i = 0; i < count; i++) {
		const o = i * STRIDE;
		data[o] = (Math.random() - 0.5) * aspect * 1.2;
		data[o + 1] = (Math.random() - 0.5) * 1.2;
		data[o + 4] = Math.random();
	}
	return data;
}

/** An element's box in stage units: screen heights, origin at the centre, y up. */
function boxOf(el: Element | null): [number, number, number, number] {
	const h = innerHeight;
	if (!el) return [0, 0, 0.5, 0.3];
	const r = el.getBoundingClientRect();
	return [(r.left + r.width / 2 - innerWidth / 2) / h, -(r.top + r.height / 2 - h / 2) / h, r.width / 2 / h, r.height / 2 / h];
}

export async function mountStage(canvas: HTMLCanvasElement, S: StageState): Promise<StageHandle | null> {
	const maybeGpu = await getGpu();
	if (!maybeGpu) return null;
	const gpu = maybeGpu;

	const [V, sim, particles, fade, bright, blur, composite] = await Promise.all([
		import('vgpu'),
		import('./sim.wgsl').then((m) => m.default),
		import('./particles.wgsl').then((m) => m.default),
		import('./fade.wgsl').then((m) => m.default),
		import('./bright.wgsl').then((m) => m.default),
		import('./blur.wgsl').then((m) => m.default),
		import('./composite.wgsl').then((m) => m.default),
	]);

	const small = innerWidth < 760;
	const COUNT = small ? 16384 : (navigator.hardwareConcurrency ?? 8) <= 4 ? 32768 : 65536;
	const surface = V.surface(gpu, canvas, { dpr: [1, 1.5] });
	const samp = V.sampler(gpu, { minFilter: 'linear', magFilter: 'linear' });

	const buf = V.storage(gpu, COUNT * STRIDE * 4, 'read-write');
	buf.write(seedParticles(COUNT, innerWidth / innerHeight));

	const additive = { color: { src: 'one', dst: 'one' }, alpha: { src: 'one', dst: 'one' } } as const;
	const fx = {
		sim: V.compute(gpu, sim, { label: 'algo-sim' }),
		fade: V.effect(gpu, fade, { label: 'algo-fade', set: { samp } }),
		dots: V.draw(gpu, { shader: particles, vertices: 6, instances: COUNT, blend: additive, label: 'algo-dots' }),
		bright: V.effect(gpu, bright, { label: 'algo-bright', set: { samp } }),
		blur: [0, 1, 2, 3].map((i) => V.effect(gpu, blur, { label: `algo-blur-${i}`, set: { samp } })),
		out: V.effect(gpu, composite, { label: 'algo-out', set: { samp } }),
	};
	fx.sim.set({ ps: buf });
	fx.dots.set({ ps: buf });

	const bloomSize = (): [number, number] => {
		const [w, h] = surface.size;
		const bh = Math.max(1, Math.round(h / 3));
		return [Math.max(1, Math.round((w * bh) / h)), bh];
	};
	const [w0, h0] = surface.size;
	const trail = V.pingPong(gpu, w0, h0, { format: HDR });
	const bloom = [V.target(gpu, { size: bloomSize(), format: HDR }), V.target(gpu, { size: bloomSize(), format: HDR })];

	await Promise.all([
		fx.sim.compile(),
		fx.fade.compile(trail.write),
		fx.dots.compile(trail.write),
		fx.bright.compile(bloom[0]),
		...fx.blur.map((b) => b.compile(bloom[0])),
		fx.out.compile({ colors: [surface.format] }),
	]);

	const palette = {
		bg: tokenColour('--color-paper'),
		neon: tokenColour('--gfx-neon'),
		accent: tokenColour('--color-accent'),
		found: tokenColour('--color-found'),
	};

	let time = 0;
	let formT = 10;
	let form: number = FORMS[S.form];
	let fadeIn = 0;
	let gain = S.gain;
	let aberr = 0;
	let raf = 0;
	let visible = !document.hidden;
	let last = performance.now();
	let awakeUntil = 0;
	let lastBox: [number, number, number, number] | null = null;
	let lastAnchor: Element | null = null;
	const pointer = { x: 0, y: -9, vx: 0, vy: 0, power: 0 };

	const onVisibility = () => {
		visible = !document.hidden;
		wake();
	};
	document.addEventListener('visibilitychange', onVisibility);
	surface.onResize(() => {
		const size = surface.size;
		trail.read.resize(size);
		trail.write.resize(size);
		bloom[0].resize(bloomSize());
		bloom[1].resize(bloomSize());
		wake();
	});

	function wake() {
		awakeUntil = performance.now() + 2500;
		if (!raf && visible) {
			last = performance.now();
			raf = requestAnimationFrame(tick);
		}
	}

	function tick(now: number) {
		raf = 0;
		const dt = Math.min(1 / 30, Math.max(1 / 240, (now - last) / 1000));
		last = now;
		const still = S.running ? 0 : 1;
		if (S.running) time += dt;

		const want = FORMS[S.form];
		if (want !== form) {
			form = want;
			formT = 0;
		}
		formT += dt;

		const [w, h] = surface.size;
		const aspect = w / h;
		const k = (rate: number) => 1 - Math.exp(-rate * dt);
		gain += (S.gain - gain) * k(3);
		aberr += (0 - aberr) * k(8);
		S.velocity *= Math.exp(-dt * 6);
		fadeIn = Math.min(1, fadeIn + dt * 0.8);

		// the pointer in stage units, with its velocity
		if (S.pointer) {
			const px = (S.pointer[0] - innerWidth / 2) / innerHeight;
			const py = -(S.pointer[1] - innerHeight / 2) / innerHeight;
			pointer.vx = (px - pointer.x) / dt;
			pointer.vy = (py - pointer.y) / dt;
			pointer.x = px;
			pointer.y = py;
			pointer.power += (Math.min(1, Math.hypot(pointer.vx, pointer.vy) * 0.6) - pointer.power) * k(10);
		} else {
			pointer.power -= pointer.power * k(10);
		}

		const cells: number[][] = [];
		for (let i = 0; i < MAX; i++) cells.push(Array.from(S.cells.subarray(i * 4, i * 4 + 4)));

		// how far the anchor moved since the last frame; the sim carries the swarm by exactly that
		const box = boxOf(S.anchor);
		const shift =
			lastBox && lastAnchor === S.anchor && formT > dt ? [box[0] - lastBox[0], box[1] - lastBox[1], 0, 0] : [0, 0, 0, 0];
		lastBox = box;
		lastAnchor = S.anchor;

		fx.sim.set({
			sim: {
				box,
				bounds: [...S.bounds, 0],
				shift,
				pointer: [pointer.x, pointer.y, pointer.vx * 0.02, pointer.vy * 0.02],
				span: [S.span.low, S.span.high, S.span.mid, S.span.found],
				tree: [S.tree.target, S.tree.depth, S.tree.found, 0],
				misc: [S.cycle, S.curves, 0, 0],
				time,
				dt,
				aspect,
				form,
				formT,
				still,
				power: S.calm ? 0 : pointer.power,
				count: COUNT,
				cells,
			},
		});

		const glitch = S.calm || formT > 0.7 ? 0 : Math.sin((formT / 0.7) * Math.PI);
		V.frame(gpu, (frame) => {
			frame.computePass((p) => p.dispatch(fx.sim, Math.ceil(COUNT / 256)));
			fx.fade.set({ src: trail.read, fade: { decay: still ? 0 : 0.9, drift: shift[1] } });
			fx.dots.set({
				look: {
					neon: palette.neon,
					accent: palette.accent,
					found: palette.found,
					aspect,
					px: h,
					gain: small ? 0.55 : 0.42,
					still,
				},
			});
			frame.pass({ target: trail.write, clear: [0, 0, 0, 1] }, (pass) => {
				pass.draw(fx.fade);
				pass.draw(fx.dots);
			});
			trail.swap();

			fx.bright.set({ src: trail.read });
			frame.pass({ target: bloom[0], clear: [0, 0, 0, 1] }, (pass) => pass.draw(fx.bright));
			const radii = [1, 1, 2.4, 2.4];
			fx.blur.forEach((b, i) => {
				const src = bloom[i % 2];
				b.set({ src, blur: { texel: src.texelSize, dir: i % 2 ? [0, 1] : [1, 0], radius: radii[i] } });
				frame.pass({ target: bloom[(i + 1) % 2], clear: [0, 0, 0, 1] }, (pass) => pass.draw(b));
			});
			fx.out.set({
				light: trail.read,
				bloom: bloom[0],
				post: { bg: palette.bg, res: [w, h], time, glitch, aberr, fadeIn, gain, unused: 0 },
			});
			frame.pass({ target: surface, clear: [0, 0, 0, 1] }, (pass) => pass.draw(fx.out));
		});

		const busy = S.running || now < awakeUntil || aberr > 1e-4;
		if (busy && visible && !raf) raf = requestAnimationFrame(tick);
	}

	wake();
	return {
		wake,
		destroy() {
			cancelAnimationFrame(raf);
			document.removeEventListener('visibilitychange', onVisibility);
			gpu.dispose();
		},
	};
}
