/**
 * The cutout kit: what every illustrated world shares. Flash-era cutout animation drawn on
 * Canvas 2D — vector parts on a bone rig, tinted ink outlines, one cel-shade tone, poses as
 * numbers tweened with easing, springs for secondary motion, particles, a camera.
 * A world (island, pond…) supplies its art and its acting; the kit supplies the machinery.
 */

export const DEG = Math.PI / 180;
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const rnd = (a: number, b: number) => a + Math.random() * (b - a);
export const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export const EASE = {
	lin: (t: number) => t,
	out: (t: number) => 1 - (1 - t) ** 3,
	in: (t: number) => t * t * t,
	inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
	back: (t: number) => {
		const c1 = 1.9;
		const c3 = c1 + 1;
		return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
	},
	sine: (t: number) => 0.5 - Math.cos(Math.PI * t) / 2,
};
export type Ease = keyof typeof EASE;

/* ---------- poses and timelines ---------- */

export type Pose = Record<string, number>;
export interface Key {
	t: number;
	p: Pose;
	e: Ease;
}
export const K = (t: number, p: Pose, e: Ease = 'inOut'): Key => ({ t, p, e });

export function mix(a: Pose, b: Pose, u: number): Pose {
	const r: Pose = {};
	for (const k in a) r[k] = a[k] + ((b[k] ?? a[k]) - a[k]) * u;
	return r;
}

/** Samples a keyframe timeline at `ms`. */
export function sample(keys: Key[], ms: number): Pose {
	if (ms <= keys[0].t) return keys[0].p;
	for (let i = 1; i < keys.length; i++) {
		if (ms <= keys[i].t) {
			const a = keys[i - 1];
			const b = keys[i];
			return mix(a.p, b.p, EASE[b.e](clamp((ms - a.t) / (b.t - a.t || 1), 0, 1)));
		}
	}
	return keys[keys.length - 1].p;
}

/** Damped spring for hats, tails, plumes: they lag behind and overshoot. */
export interface Spring {
	x: number;
	v: number;
}
export function spring(s: Spring, target: number, dt: number, w = 0.03, z = 0.32, limit = 45) {
	s.v += (w * w * (target - s.x) - 2 * z * w * s.v) * dt;
	s.x = clamp(s.x + s.v * dt, -limit, limit);
}

/* ---------- drawing ---------- */

export interface Ink {
	/** Outline colour: a dark tint of the world, never pure black. */
	ink: string;
}

const holes = new WeakMap<Path2D, Path2D>();

/**
 * Cel shading: fill, then darken the part of the shape the light (top-left) doesn't reach,
 * then outline. One shadow tone per material, like the Flash-era games.
 */
export function cel(ctx: CanvasRenderingContext2D, ink: string, p: Path2D, base: string, shade?: string | null, o = 5, lw = 5) {
	ctx.fillStyle = base;
	ctx.fill(p);
	if (shade) {
		let h = holes.get(p);
		if (!h) {
			h = new Path2D();
			h.rect(-600, -600, 1200, 1200);
			h.addPath(p, new DOMMatrix().translate(-o, -o * 1.15));
			holes.set(p, h);
		}
		ctx.save();
		ctx.clip(p);
		ctx.fillStyle = shade;
		ctx.fill(h, 'evenodd');
		ctx.restore();
	}
	if (lw > 0) {
		ctx.lineWidth = lw;
		ctx.strokeStyle = ink;
		ctx.lineJoin = 'round';
		ctx.lineCap = 'round';
		ctx.stroke(p);
	}
}

/** A tapered limb (thigh, upper arm…) hanging down from its joint. */
export function limb(len: number, w0: number, w1: number): Path2D {
	const p = new Path2D();
	p.moveTo(-w0 / 2, 0);
	p.bezierCurveTo(-w0 / 2, -w0 * 0.6, w0 / 2, -w0 * 0.6, w0 / 2, 0);
	p.lineTo(w1 / 2, len);
	p.bezierCurveTo(w1 / 2, len + w1 * 0.6, -w1 / 2, len + w1 * 0.6, -w1 / 2, len);
	p.closePath();
	return p;
}

export const FONT = '"Baloo 2","Fredoka","Trebuchet MS",system-ui,sans-serif';

export function label(
	ctx: CanvasRenderingContext2D,
	s: string,
	x: number,
	y: number,
	size: number,
	fill: string,
	stroke: string | null,
	lw = 6,
	align: CanvasTextAlign = 'center',
) {
	ctx.font = `800 ${size}px ${FONT}`;
	ctx.textAlign = align;
	ctx.textBaseline = 'middle';
	ctx.lineJoin = 'round';
	if (stroke) {
		ctx.lineWidth = lw;
		ctx.strokeStyle = stroke;
		ctx.strokeText(s, x, y);
	}
	ctx.fillStyle = fill;
	ctx.fillText(s, x, y);
}

/* ---------- particles ---------- */

export interface Particle {
	t: string;
	x: number;
	y: number;
	vx: number;
	vy: number;
	r: number;
	rot: number;
	vr: number;
	g: number;
	c: string;
	age: number;
	life: number;
}

export class Particles {
	list: Particle[] = [];
	constructor(private reduced: boolean) {}
	emit(o: Partial<Particle> & { t: string; x: number; y: number }) {
		if (this.reduced) return;
		this.list.push({ age: 0, life: 700, vx: 0, vy: 0, r: 4, rot: 0, vr: 0, g: 0.0011, c: '#fff', ...o });
	}
	/** A fan of particles thrown upward. */
	burst(t: string, x: number, y: number, n: number, o: { v0?: number; v1?: number; r0?: number; r1?: number; cols?: string[]; spread?: number } = {}) {
		const spread = o.spread ?? 0.9;
		for (let i = 0; i < n; i++) {
			const a = -Math.PI / 2 + rnd(-spread, spread) * (Math.PI / 2);
			const v = rnd(o.v0 ?? 0.15, o.v1 ?? 0.5);
			this.emit({ t, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: rnd(o.r0 ?? 2, o.r1 ?? 5), life: rnd(500, 900), vr: rnd(-0.02, 0.02), c: o.cols ? o.cols[i % o.cols.length] : '#fff' });
		}
	}
	step(dt: number) {
		for (let i = this.list.length - 1; i >= 0; i--) {
			const q = this.list[i];
			q.age += dt;
			q.vy += q.g * dt;
			q.x += q.vx * dt;
			q.y += q.vy * dt;
			q.rot += q.vr * dt;
			if (q.age > q.life) this.list.splice(i, 1);
		}
	}
	draw(ctx: CanvasRenderingContext2D, ink: string, palette: { gold: string; goldS: string }) {
		for (const q of this.list) {
			const u = q.age / q.life;
			ctx.save();
			ctx.translate(q.x, q.y);
			ctx.globalAlpha = clamp((1 - u) * 2.2, 0, 1);
			if (q.t === 'coin') {
				ctx.scale(Math.abs(Math.cos(q.rot * 9)) * 0.85 + 0.15, 1);
				ctx.beginPath();
				ctx.arc(0, 0, q.r, 0, 7);
				ctx.fillStyle = palette.gold;
				ctx.fill();
				ctx.lineWidth = 2.5;
				ctx.strokeStyle = ink;
				ctx.stroke();
				ctx.fillStyle = palette.goldS;
				ctx.beginPath();
				ctx.arc(0, 0, q.r * 0.5, 0, 7);
				ctx.fill();
			} else if (q.t === 'dust' || q.t === 'ring') {
				ctx.globalAlpha *= 0.6;
				if (q.t === 'ring') {
					ctx.strokeStyle = q.c;
					ctx.lineWidth = 3 * (1 - u) + 1;
					ctx.beginPath();
					ctx.ellipse(0, 0, q.r * (1 + u * 2.4), q.r * 0.32 * (1 + u * 2.4), 0, 0, 7);
					ctx.stroke();
				} else {
					ctx.beginPath();
					ctx.arc(0, 0, q.r * (1 + u * 1.4), 0, 7);
					ctx.fillStyle = q.c;
					ctx.fill();
				}
			} else if (q.t === 'star') {
				const r = q.r * (1 - u * 0.4);
				ctx.rotate(q.rot);
				ctx.fillStyle = q.c;
				ctx.beginPath();
				for (let i = 0; i < 8; i++) {
					const rr = i % 2 ? r * 0.32 : r;
					ctx.lineTo(Math.cos((i * Math.PI) / 4) * rr, Math.sin((i * Math.PI) / 4) * rr);
				}
				ctx.closePath();
				ctx.fill();
			} else if (q.t === 'drop') {
				ctx.fillStyle = q.c;
				ctx.strokeStyle = ink;
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(0, -q.r * 1.6);
				ctx.quadraticCurveTo(q.r, 0, 0, q.r);
				ctx.quadraticCurveTo(-q.r, 0, 0, -q.r * 1.6);
				ctx.fill();
				ctx.stroke();
			} else {
				ctx.beginPath();
				ctx.arc(0, 0, q.r, 0, 7);
				ctx.fillStyle = q.c;
				ctx.fill();
			}
			ctx.restore();
		}
	}
}

/* ---------- the stage: canvas, fit, camera, loop, acting ---------- */

export interface Act {
	t0: number;
	dur: number;
	base: number;
	fn: (ms: number, flags: Record<string, number>) => Pose;
	flags: Record<string, number>;
	done: boolean;
	finish(cancel: boolean): void;
}

export interface StageOptions {
	/** The world's design height. */
	height: number;
	/** Total world width; wider than the view makes the camera pan. */
	worldWidth: number;
	/** The vertical band [top, bottom] that fills the view (the action); defaults to the whole height. */
	band?: [number, number];
	/** Never show less than this many world units across; the band grows upward instead. */
	minView?: number;
	draw(ctx: CanvasRenderingContext2D, now: number, dt: number): void;
}

/**
 * Owns the canvas, the resize, the frame loop, the camera and the current act (a timed pose
 * function). Worlds call `act()` for each beat and read `pose()` when drawing.
 */
export class Stage {
	readonly canvas: HTMLCanvasElement;
	readonly ctx: CanvasRenderingContext2D;
	readonly reduced = reducedMotion();
	speed = 1;
	shake = 0;
	/** Camera left edge in world units, and where it is heading. */
	cam = 0;
	camTarget = 0;
	/** The matrix of world space, for clipping against the ground line. */
	base = new DOMMatrix();
	private current: Act | null = null;
	private raf = 0;
	private last = performance.now();
	private k = 1;
	private ox = 0;
	private oy = 0;
	private dpr = 1;
	private cw = 1;
	private ch = 1;
	private ro: ResizeObserver;

	constructor(
		private host: HTMLElement,
		private o: StageOptions,
	) {
		this.canvas = document.createElement('canvas');
		Object.assign(this.canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block' });
		this.canvas.setAttribute('aria-hidden', 'true');
		host.style.position = host.style.position || 'relative';
		host.appendChild(this.canvas);
		const ctx = this.canvas.getContext('2d');
		if (!ctx) throw new Error('no 2d context');
		this.ctx = ctx;
		this.ro = new ResizeObserver(() => this.fit());
		this.ro.observe(host);
		this.fit();
		this.raf = requestAnimationFrame(this.frame);
	}

	get act() {
		return this.current;
	}

	/** Scales real durations by the speed; reduced motion collapses them. */
	ms(base: number) {
		return this.reduced ? Math.min(base / this.speed, 120) : base / this.speed;
	}

	/** Starts a beat: `fn` returns the pose for each ms of the beat's base timeline. */
	play(base: number, fn: Act['fn'], onEnd?: () => void): Promise<void> {
		this.current?.finish(true);
		return new Promise((resolve) => {
			const a: Act = {
				t0: performance.now(),
				dur: Math.max(16, this.ms(base)),
				base,
				fn,
				flags: {},
				done: false,
				finish: (cancel) => {
					if (a.done) return;
					a.done = true;
					if (!cancel) onEnd?.();
					if (this.current === a) this.current = null;
					resolve();
				},
			};
			this.current = a;
			setTimeout(() => a.finish(false), a.dur);
		});
	}

	stopAct() {
		this.current?.finish(true);
	}

	/** Where the current act is, in base-timeline ms. */
	sampleAct(now: number): Pose | null {
		const a = this.current;
		if (!a) return null;
		const ms = clamp((now - a.t0) / a.dur, 0, 1) * a.base;
		return a.fn(ms, a.flags);
	}

	/** Keeps world x in the left-centre of the view; centres the world when it all fits. */
	follow(x: number) {
		const spare = this.o.worldWidth - this.viewWidth;
		// a world narrower than the view sits in the middle; the scene draws past its edges
		this.camTarget = spare <= 0 ? spare / 2 : clamp(x - this.viewWidth * 0.42, 0, spare);
	}

	private fit() {
		const r = this.host.getBoundingClientRect();
		this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
		this.cw = Math.max(1, r.width);
		this.ch = Math.max(1, r.height);
		this.canvas.width = Math.round(this.cw * this.dpr);
		this.canvas.height = Math.round(this.ch * this.dpr);
		// the action band fills the height, the ground sits on the bottom edge; a narrow pane
		// zooms out to keep minView across (more sky shows), a wide one zooms in to fill the width
		const [top, bottom] = this.o.band ?? [0, this.o.height];
		let k = this.ch / (bottom - top);
		if (this.o.minView && this.cw / k < this.o.minView) k = this.cw / this.o.minView;
		this.k = k;
		this.ox = 0;
		this.oy = this.ch - bottom * k;
		this.follow(this.camTarget + this.viewWidth * 0.42);
		this.cam = this.camTarget;
	}

	/** Visible width in world units. */
	get viewWidth() {
		return this.cw / this.k;
	}

	private frame = (now: number) => {
		this.raf = requestAnimationFrame(this.frame);
		const dt = Math.min(33, now - this.last);
		this.last = now;
		this.cam += (this.camTarget - this.cam) * (this.reduced ? 1 : 1 - Math.pow(0.992, dt));
		this.shake *= Math.pow(0.992, dt);
		const sx = this.reduced ? 0 : (Math.random() - 0.5) * this.shake;
		const sy = this.reduced ? 0 : (Math.random() - 0.5) * this.shake;
		const { ctx } = this;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		const s = this.k * this.dpr;
		ctx.setTransform(s, 0, 0, s, (this.ox + (sx - this.cam) * this.k) * this.dpr, (this.oy + sy * this.k) * this.dpr);
		this.base = ctx.getTransform();
		this.o.draw(ctx, now, dt);
	};

	/** Clips drawing to everything above world height `y` (things sinking into the ground). */
	clipAbove(y: number) {
		const { ctx } = this;
		const m = ctx.getTransform();
		ctx.setTransform(this.base);
		ctx.beginPath();
		ctx.rect(-4000, -4000, 12000, 4000 + y);
		ctx.clip();
		ctx.setTransform(m);
	}

	/** Screen-space pass (vignette, grain) after the world. */
	screen(fn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
		const { ctx } = this;
		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		fn(ctx, this.canvas.width, this.canvas.height);
		ctx.restore();
	}

	destroy() {
		cancelAnimationFrame(this.raf);
		this.ro.disconnect();
		this.current?.finish(true);
		this.canvas.remove();
	}
}
