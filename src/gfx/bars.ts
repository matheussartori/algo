import { getGpu, tokenColour } from './gpu';

export const MAX_CELLS = 64;

export interface CellState {
	/** 0..1 */
	height: number;
	discarded?: number;
	mid?: number;
	found?: number;
}

export interface Camera {
	angle: number;
	elevation: number;
	distance: number;
	lens: number;
}

export interface BarsOptions {
	canvas: HTMLCanvasElement;
	cells: CellState[];
	camera: Camera;
	geo?: { spacing?: number; width?: number; depth?: number; maxHeight?: number };
	/** 0 = no vignette, 1 = full. */
	vignette?: number;
	/** CSS custom property holding the ground colour the scene sits on. */
	ground?: string;
	/** Element whose computed tokens supply the colours (defaults to <html>). */
	tokens?: Element;
	/** How fast cell states ease toward their targets (per second). */
	ease?: number;
	/** Called every animated frame before drawing; mutate the handle to drive the scene. */
	onFrame?: (time: number, dt: number, handle: BarsHandle) => void;
	dpr?: [number, number];
}

export interface BarsHandle {
	setCells(cells: CellState[]): void;
	setCamera(camera: Partial<Camera>): void;
	/** Moves the picture on screen (in units of half the viewport height; y up). */
	setShift(x: number, y?: number): void;
	/** Runs the per-frame callback continuously (true) or renders only on change (false). */
	setAnimating(on: boolean): void;
	destroy(): void;
}

/**
 * Mounts the bars scene on a canvas. Resolves to null when WebGPU is not usable;
 * the caller keeps its fallback in that case.
 */
export async function mountBars(options: BarsOptions): Promise<BarsHandle | null> {
	const maybeGpu = await getGpu();
	if (!maybeGpu) return null;
	const gpu = maybeGpu;

	const [V, { default: shader }] = await Promise.all([import('vgpu'), import('./bars.wgsl')]);
	const { canvas } = options;
	const surface = V.surface(gpu, canvas, { dpr: options.dpr ?? [1, 1.5] });
	const fx = V.effect(gpu, shader, { label: 'algo-bars' });
	await fx.compile({ colors: [surface.format] });

	const count = Math.min(MAX_CELLS, options.cells.length);
	const target = new Float32Array(MAX_CELLS * 4);
	const current = new Float32Array(MAX_CELLS * 4);
	const writeTarget = (cells: CellState[]) => {
		cells.slice(0, MAX_CELLS).forEach((c, i) => {
			target.set([c.height, c.discarded ?? 0, c.mid ?? 0, c.found ?? 0], i * 4);
		});
	};
	writeTarget(options.cells);
	current.set(target);

	const camera = { ...options.camera };
	const geo = { spacing: 1, width: 0.72, depth: 0.72, maxHeight: 6, ...options.geo };
	const shift = [0, 0];
	const currentShift = [0, 0];
	const ease = options.ease ?? 7;
	const tokens = options.tokens ?? document.documentElement;
	const ground = options.ground ?? '--color-paper';

	let palette = readPalette();
	function readPalette() {
		return {
			bg: tokenColour(ground, tokens),
			bar: tokenColour('--gfx-bar', tokens),
			dim: tokenColour('--gfx-dim', tokens),
			mid: tokenColour('--color-accent', tokens),
			found: tokenColour('--color-found', tokens),
			dark: document.documentElement.dataset.theme === 'light' ? 0 : 1,
		};
	}

	const themeWatch = new MutationObserver(() => {
		palette = readPalette();
		request();
	});
	themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

	let fadeIn = 0;
	let ticking = false;
	let animating = false;
	let visible = true;
	let raf = 0;
	let last = performance.now();
	const start = last;

	const handle: BarsHandle = {
		setCells(cells) {
			writeTarget(cells);
			request();
		},
		setCamera(next) {
			Object.assign(camera, next);
			request();
		},
		setShift(x, y = 0) {
			shift[0] = x;
			shift[1] = y;
			request();
		},
		setAnimating(on) {
			animating = on;
			request();
		},
		destroy() {
			cancelAnimationFrame(raf);
			themeWatch.disconnect();
			io.disconnect();
			surface.onResize(() => {});
			(fx as { destroy?: () => void }).destroy?.();
		},
	};

	const io = new IntersectionObserver(([entry]) => {
		visible = entry.isIntersecting;
		if (visible) request();
	});
	io.observe(canvas);
	surface.onResize(() => request());

	function request() {
		// inside a tick the end of the tick decides whether to schedule the next one
		if (!raf && !ticking && visible) {
			last = performance.now();
			raf = requestAnimationFrame(tick);
		}
	}

	function tick(now: number) {
		raf = 0;
		const dt = Math.min(0.05, (now - last) / 1000);
		last = now;
		const time = (now - start) / 1000;
		ticking = true;
		if (animating) options.onFrame?.(time, dt, handle);
		ticking = false;

		// ease every cell toward its target; keep drawing until settled
		const k = 1 - Math.exp(-ease * dt);
		let moving = false;
		for (let i = 0; i < current.length; i++) {
			const d = target[i] - current[i];
			if (Math.abs(d) > 1e-3) moving = true;
			current[i] += d * k;
		}
		for (let a = 0; a < 2; a++) {
			currentShift[a] += (shift[a] - currentShift[a]) * k;
			if (Math.abs(shift[a] - currentShift[a]) > 1e-3) moving = true;
		}
		fadeIn = Math.min(1, fadeIn + dt * 1.6);
		if (fadeIn < 1) moving = true;

		const [w, h] = surface.size;
		const cells: number[][] = [];
		for (let i = 0; i < MAX_CELLS; i++) cells.push(Array.from(current.subarray(i * 4, i * 4 + 4)));
		fx.set({
			scene: {
				res: [w, h],
				time,
				count,
				cam: [camera.angle, camera.elevation, camera.distance, camera.lens],
				geo: [geo.spacing, geo.width, geo.depth, geo.maxHeight],
				bg: palette.bg,
				bar: palette.bar,
				dim: palette.dim,
				mid: palette.mid,
				found: palette.found,
				look: [palette.dark, fadeIn, options.vignette ?? 0, 0],
				view: [currentShift[0], currentShift[1], 0, 0],
				cells,
			},
		});
		V.frame(gpu, (frame) => frame.pass(surface, fx));

		if ((animating || moving) && visible && !raf) raf = requestAnimationFrame(tick);
	}

	request();
	return handle;
}
