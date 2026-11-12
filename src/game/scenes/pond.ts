import { clamp, cel as celWith, DEG, EASE, K, type Key, label as labelWith, limb, mix, Particles, type Pose, rnd, sample, type Spring, spring, Stage } from '../cutout/kit';
import type { Scene, SceneSetup } from '../engine';

/**
 * The pond: Ribas the postal frog hops pad to pad looking for the address on his letter.
 * Binary search makes him leap across the pond, which is the point: big jumps, few reads.
 * Cutout rig on Canvas 2D (see ../cutout/kit.ts). World units: 560 tall, water line at WY.
 */

const H = 560;
const WY = 432;
const HOME = 104;
const HOME_Y = WY - 30;
const GAP = 124;
const padX = (i: number) => 262 + i * GAP;

/* twilight pond: cool blues and teals behind, the frog is the warmest, most saturated thing */
const INK = '#0c2a28';
const C = {
	frog: '#9be564', frogS: '#5fae3e', belly: '#eef7c2', bellyS: '#c9dc8a', sac: '#f4f0b0',
	cap: '#2f5aa8', capS: '#1f3c78', gold: '#f5c450', goldS: '#c98a2b', bag: '#e8a33d', bagS: '#b0721f',
	pad: '#4fbf6a', padS: '#2c8a57', padV: '#2f9a5c', flower: '#ff9ec4', flowerS: '#e06a9a',
	rock: '#6f7d8c', rockS: '#4a5563', moss: '#5aa84a', wood: '#a8703c', woodS: '#7a4a28', paper: '#fbf3df', paperS: '#dccba3',
};

/* ---------- poses ---------- */

const EMO: Record<string, Pose> = {
	neutral: { fe: 1, fb: 0, fm: 0.35, fo: 0, fr: 0, ft: 0, fj: 0, fx: 0, fl: 0, fd: 0 },
	focus: { fe: 0.75, fb: 0.5, fm: 0, fo: 0, fr: 0, ft: 0, fj: 0, fx: 0, fl: 1, fd: 1 },
	sad: { fe: 0.7, fb: -1, fm: -0.8, fo: 0, fr: 0, ft: 1, fj: 0, fx: 0, fl: 0, fd: 0.6 },
	angry: { fe: 0.8, fb: 1, fm: -0.6, fo: 0.4, fr: 1, ft: 0, fj: 0, fx: 0, fl: 0, fd: 0 },
	joy: { fe: 0.8, fb: -0.3, fm: 1, fo: 0.8, fr: 0, ft: 0, fj: 1, fx: 0, fl: 0, fd: 0 },
	confused: { fe: 1, fb: -0.3, fm: -0.2, fo: 0.1, fr: 0, ft: 0, fj: 0, fx: 1, fl: -0.6, fd: -0.4 },
	shock: { fe: 1.3, fb: -0.3, fm: 0, fo: 0.9, fr: 0, ft: 0, fj: 0, fx: 0, fl: 0, fd: 0 },
};
/** jy: height off the ground · sx/sy: squash · lean: body tilt · lT/lS: back thigh and shin · aU/aF: front arm · th: throat sac · turn: spin */
const BASE: Pose = { jy: 0, sx: 1, sy: 1, lean: 0, lT: -62, lS: 128, aU: 8, aF: -30, th: 0.3, turn: 0, cap: 0, ...EMO.neutral };
const P = (o: Pose = {}, emo?: keyof typeof EMO): Pose => ({ ...BASE, ...(emo ? EMO[emo] : {}), ...o });

const CROUCH = { sy: 0.8, sx: 1.16, lT: -78, lS: 150, lean: 8, aU: 30, aF: -40 };
const STRETCH = { sy: 1.2, sx: 0.86, lT: 52, lS: 6, lean: -14, aU: -70, aF: 10 };
const TUCK = { sy: 1.02, sx: 0.98, lT: -20, lS: 80, lean: -4, aU: -30, aF: -10 };
const LAND = { sy: 0.76, sx: 1.24, lT: -74, lS: 146, lean: 6, aU: 40, aF: -50 };
/** One hop, in units of the hop's own duration: crouch, launch, air, land, settle. */
const HOP: Key[] = [
	K(0, P()),
	K(0.18, P(CROUCH), 'out'),
	K(0.27, P(STRETCH), 'out'),
	K(0.55, P(TUCK), 'sine'),
	K(0.84, P(LAND), 'in'),
	K(1, P(), 'back'),
];

/* ---------- rig geometry ---------- */

const path = (d: string) => new Path2D(d);
const oval = (x: number, y: number, rx: number, ry: number) => {
	const p = new Path2D();
	p.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
	return p;
};
// built on first use: Path2D doesn't exist while the page renders on the server
const geometry = () => ({
	body: path('M-32 -2 C-44 -24 -32 -54 0 -56 C30 -58 46 -40 42 -16 C40 -2 26 2 2 2 C-14 2 -26 1 -32 -2 Z'),
	belly: path('M2 -2 C22 -2 36 -8 39 -22 C28 -14 12 -12 -6 -15 C-8 -8 -4 -3 2 -2 Z'),
	socket: oval(0, 0, 12.5, 12),
	thigh: limb(24, 20, 12), shin: limb(22, 11, 8),
	foot: path('M-4 -3 C6 -6 20 -4 24 2 L18 2 L16 6 L10 3 L6 7 L2 3 C-2 3 -6 1 -4 -3 Z'),
	upper: limb(15, 10, 8),
	hand: path('M-5 0 C-6 -5 6 -6 6 0 L9 5 L4 3 L1 7 L-2 3 L-7 5 Z'),
	cap: path('M-20 0 C-22 -16 -6 -24 8 -22 C20 -20 24 -10 22 0 Z'), brim: path('M14 -4 C24 -6 34 -4 36 0 C30 2 20 2 14 0 Z'),
	emblem: path('M-6 -14 L6 -14 L6 -6 L-6 -6 Z'),
	bag: path('M-14 -10 C-14 -14 14 -14 14 -10 L14 10 C14 14 -14 14 -14 10 Z'), flap: path('M-14 -10 C-14 -14 14 -14 14 -10 L0 2 Z'),
	letter: path('M-12 -8 L12 -8 L12 8 L-12 8 Z'),
	box: path('M-16 -14 C-16 -26 16 -26 16 -14 L16 8 L-16 8 Z'), post: path('M-3 8 L3 8 L3 70 L-3 70 Z'),
	flag: path('M14 -4 L18 -4 L18 -26 L32 -26 L32 -16 L18 -16 L18 -4 Z'),
	rock: path('M-74 30 C-80 4 -62 -24 -30 -30 C0 -36 40 -32 62 -16 C82 0 80 24 72 32 Z'),
});
let G: ReturnType<typeof geometry>;

/* ---------- the scene ---------- */

export function createPondScene(host: HTMLElement, setup: SceneSetup): Scene {
	G ??= geometry();
	const slots = setup.slots;
	const N = slots.length;
	const more = setup.total - N;
	const lastX = N > 0 ? padX(N - 1) : padX(0);
	const edgeX = lastX + (more > 0 ? 230 : 160);
	const worldWidth = Math.max(1000, edgeX + 120);

	const cel = (ctx: CanvasRenderingContext2D, p: Path2D, base: string, shade?: string | null, o?: number, lw?: number) => celWith(ctx, INK, p, base, shade, o, lw);
	const text = (ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, fill: string, stroke: string | null = INK, lw = 6) => labelWith(ctx, s, x, y, size, fill, stroke, lw);

	type Cap = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; floating?: number };
	const S = {
		x: HOME, y: HOME_Y, face: 1, fs: 1, at: -1, capOn: true, cap: null as Cap | null, sunk: 0,
		dip: new Array(N).fill(0).map(() => ({ x: 0, v: 0 })) as Spring[], plate: new Array(N).fill(0) as number[], seen: new Set<number>(),
		box: null as null | { i: number; p: number; flag: number; letter: number }, bloom: new Set<number>(),
		q: null as null | { ms: number }, vx: 0, px: HOME, vy: 0, jyPrev: 0,
	};
	let cur: Pose = P();
	let blendFrom: Pose = cur;
	let blendT0 = 0;
	let blendDur = 0;
	const sp: Record<string, Spring> = { cap: { x: 0, v: 0 }, bag: { x: 0, v: 0 } };

	const stage = new Stage(host, { height: H, worldWidth, band: [150, 540], minView: 640, draw });
	const parts = new Particles(stage.reduced);
	const reduced = stage.reduced;
	const blend = () => {
		blendFrom = { ...cur };
		blendT0 = performance.now();
		blendDur = reduced ? 0 : 140 / stage.speed;
	};
	const act = (base: number, fn: (ms: number, fl: Record<string, number>) => Pose, onEnd?: () => void) => {
		blend();
		return stage.play(base, fn, () => {
			onEnd?.();
			blend();
		});
	};
	const groundY = (i: number) => (i < 0 ? HOME_Y : WY - 3);
	const atHome = () => {
		S.seen.clear();
		S.bloom.clear();
		S.box = null;
		S.capOn = true;
		S.cap = null;
	};

	/* particles */
	const ripple = (x: number, y: number, n = 2) => {
		for (let k = 0; k < n; k++) parts.emit({ t: 'ring', x, y: y + 4, r: 18 + k * 10, life: 800 + k * 160, g: 0, c: '#bff3e6' });
	};
	const splash = (x: number, y: number, n: number) => {
		for (let k = 0; k < n; k++) parts.emit({ t: 'drop', x: x + rnd(-14, 14), y, vx: rnd(-0.18, 0.18), vy: rnd(-0.5, -0.22), r: rnd(2.5, 4.5), life: 650, g: 0.0016, c: '#9fe3ee' });
	};
	const sparkle = (x: number, y: number, n: number, cols = ['#fff6c8', C.gold]) => {
		for (let k = 0; k < n; k++) parts.emit({ t: 'star', x: x + rnd(-36, 36), y: y + rnd(-40, 10), vy: rnd(-0.05, -0.01), r: rnd(5, 10), life: rnd(500, 800), g: 0, c: cols[k % cols.length] });
	};
	const petals = (x: number, y: number, n: number) => parts.burst('dot', x, y, n, { v0: 0.12, v1: 0.4, r0: 3, r1: 5, cols: [C.flower, '#ffd1e3', '#fff'] });
	const land = (i: number) => {
		if (i >= 0 && i < N) {
			S.dip[i].v += 0.16;
			S.plate[i] = 1;
		}
		ripple(S.x, i < 0 ? WY : WY, i < 0 ? 1 : 2);
		if (i >= 0) splash(S.x, WY - 2, 4);
	};

	/* ---- beats ---- */

	function hop(tx: number, ty: number, to: number): Promise<void> {
		const x0 = S.x;
		const y0 = S.y;
		const dx = tx - x0;
		if (Math.abs(dx) < 1 && Math.abs(ty - y0) < 1) {
			S.face = 1;
			return Promise.resolve();
		}
		S.face = dx >= 0 ? 1 : -1;
		const from = S.sunk;
		// longer leaps take a little longer and arc higher, but stay snappy
		const base = clamp(420 + Math.abs(dx) * 0.75, 460, 1150);
		const h = clamp(46 + Math.abs(dx) * 0.2, 46, 190);
		return act(
			base,
			(ms, fl) => {
				const u = ms / base;
				const p = clamp((u - 0.25) / 0.6, 0, 1);
				S.x = x0 + dx * p;
				S.y = y0 + (ty - y0) * p;
				S.sunk = from * (1 - clamp(u / 0.27, 0, 1));
				if (u >= 0.25 && !fl.go) {
					fl.go = 1;
					if (S.at >= 0 && S.at < N) S.dip[S.at].v += 0.1;
					ripple(x0, WY, 1);
				}
				if (u >= 0.85 && !fl.land) {
					fl.land = 1;
					S.at = to;
					land(to);
					stage.shake = Math.max(stage.shake, 1.5);
				}
				const pose = sample(HOP, u);
				return { ...pose, jy: reduced ? 0 : 4 * h * p * (1 - p) };
			},
			() => {
				S.x = tx;
				S.y = ty;
				S.sunk = 0;
				S.at = to;
				S.face = 1;
			},
		);
	}

	const peek = (i: number, fl: Record<string, number>, ms: number) => {
		if (ms >= 200 && !fl.p) {
			fl.p = 1;
			S.plate[i] = 1;
			S.seen.add(i);
		}
	};
	const PEEK: Key[] = [
		K(0, P({}, 'focus')),
		K(120, P({ sy: 1.06, sx: 0.96, lean: -6 }, 'focus'), 'out'),
		K(260, P({ lean: 20, sy: 0.92, sx: 1.06, aU: 40, aF: -60, lT: -70, lS: 140 }, 'focus'), 'out'),
		K(450, P({ lean: 22, sy: 0.92, sx: 1.06, aU: 40, aF: -60, lT: -70, lS: 140 }, 'focus'), 'lin'),
	];
	const headShake = (amp: number): Key[] =>
		[0, 1, 2, 3].map((k) => K(450 + (k + 1) * 75, P({ lean: 10, aU: 8, aF: -30, sx: 1 + (k % 2 ? 1 : -1) * 0.05 * (1 - k / 4), cap: (k % 2 ? 1 : -1) * amp * (1 - k / 4) }, 'sad'), 'sine'));

	const scene: Scene = {
		idle() {
			stage.stopAct();
		},
		moveTo(i) {
			if (i < 0) return hop(HOME, HOME_Y, -1).then(atHome);
			return hop(padX(i), groundY(i), i);
		},
		inspect(i, isTarget) {
			S.face = 1;
			const keys = [...PEEK, ...headShake(14)];
			return act(isTarget ? 450 : 750, (ms, fl) => {
				peek(i, fl, ms);
				return sample(keys, ms);
			});
		},
		nothing(i) {
			S.face = 1;
			const keys: Key[] = [
				...PEEK,
				K(600, P({ lean: 4, aU: -10, aF: -70, th: 0.1, sy: 1.04 }, 'sad'), 'out'),
				K(900, P({ lean: 12, aU: 6, aF: -20, th: 0.05, sy: 0.9, sx: 1.06 }, 'sad'), 'out'),
				K(1200, P({ lean: 12, aU: 6, aF: -20, th: 0.05, sy: 0.91, sx: 1.05 }, 'sad'), 'lin'),
			];
			return act(1200, (ms, fl) => {
				peek(i, fl, ms);
				if (ms >= 900 && !fl.d) {
					fl.d = 1;
					parts.emit({ t: 'drop', x: S.x + 30, y: S.y - 60, vy: 0.03, life: 700, r: 4, g: 0.0004, c: '#9fe3ee' });
				}
				return sample(keys, ms);
			});
		},
		found(i) {
			S.face = 1;
			S.box = { i, p: 0, flag: 0, letter: 0 };
			const keys: Key[] = [
				K(0, P({ lean: 20, sy: 0.92 }, 'focus')),
				K(140, P({ lean: -8, sy: 1.1, sx: 0.92, aU: -60 }, 'shock'), 'out'),
				K(420, P({ lean: -4, aU: -100, aF: 0, th: 0.8 }, 'joy'), 'out'),
				K(700, P({ lean: 4, aU: 30, aF: -40, sy: 0.9, sx: 1.08 }, 'joy'), 'out'),
				K(900, P({ aU: -60, aF: -10 }, 'joy'), 'back'),
			];
			return act(900, (ms, fl) => {
				const b = S.box;
				if (b) {
					b.p = clamp((ms - 120) / 320, 0, 1);
					b.letter = clamp((ms - 380) / 360, 0, 1);
					b.flag = clamp((ms - 720) / 160, 0, 1);
				}
				if (ms >= 120 && !fl.a) {
					fl.a = 1;
					ripple(padX(i) + 84, WY, 2);
					splash(padX(i) + 84, WY - 2, 6);
				}
				if (ms >= 720 && !fl.b) {
					fl.b = 1;
					S.bloom.add(i);
					petals(padX(i), WY - 10, 12);
					sparkle(padX(i) + 84, WY - 70, 6);
					stage.shake = 2;
				}
				return sample(keys, ms);
			});
		},
		celebrate() {
			S.face = 1;
			const jump = (t0: number, spin: boolean): Key[] => [
				K(t0, P({}, 'joy')),
				K(t0 + 140, P({ ...CROUCH }, 'joy'), 'out'),
				K(t0 + 300, P({ ...STRETCH, jy: 90, aU: -120, turn: spin ? 0.5 : 0 }, 'joy'), 'out'),
				K(t0 + 520, P({ ...TUCK, jy: 80, aU: -120, turn: spin ? 0.9 : 0 }, 'joy'), 'sine'),
				K(t0 + 700, P({ ...LAND, jy: 0, turn: spin ? 1 : 0 }, 'joy'), 'in'),
				K(t0 + 800, P({ aU: -90, aF: 0, turn: spin ? 1 : 0 }, 'joy'), 'back'),
			];
			const keys = [...jump(0, false), ...jump(800, true), K(1700, P({ aU: -30 }, 'joy'), 'out')];
			return act(1700, (ms, fl) => {
				for (const t0 of [300, 1100])
					if (ms >= t0 && !fl[`p${t0}`]) {
						fl[`p${t0}`] = 1;
						petals(S.x, S.y - 30, 10);
						sparkle(S.x, S.y - 110, 5);
					}
				for (const t0 of [700, 1500])
					if (ms >= t0 && !fl[`l${t0}`]) {
						fl[`l${t0}`] = 1;
						land(S.at);
					}
				return sample(keys, ms);
			});
		},
		frustrated() {
			S.face = 1;
			const f = (o: Pose) => P({ th: 1.4, ...o }, 'angry');
			const stomp = (t0: number): Key[] => [
				K(t0, f({ jy: 18, sy: 1.08, sx: 0.94, lT: -40, lS: 90, aU: 50, aF: -80 }), 'out'),
				K(t0 + 90, f({ jy: 0, sy: 0.8, sx: 1.2, lT: -78, lS: 150, aU: 30, aF: -40 }), 'in'),
			];
			const keys: Key[] = [
				K(0, f({ th: 0.4, sy: 1.06, sx: 0.96 }), 'out'),
				K(160, f({ th: 2, sy: 1.1, sx: 1.04 }), 'out'),
				...stomp(220),
				...stomp(420),
				K(620, f({ aU: -150, aF: 20, lean: -10, th: 1.6 }), 'out'),
				K(760, f({ aU: -160, aF: 30, lean: -14, th: 1.6 }), 'out'),
				K(840, f({ aU: 30, aF: -20, lean: 14, th: 1 }), 'in'),
				K(1050, P({ lean: 10, sy: 0.92, sx: 1.05, th: 0.1 }, 'sad'), 'out'),
				K(1200, P({ lean: 12, sy: 0.92, sx: 1.05, th: 0.1 }, 'sad'), 'sine'),
			];
			return act(1200, (ms, fl) => {
				for (const t of [310, 510])
					if (ms >= t && !fl[`s${t}`]) {
						fl[`s${t}`] = 1;
						land(S.at);
						stage.shake = 4;
					}
				if (ms >= 760 && !fl.cap) {
					fl.cap = 1;
					S.capOn = false;
					S.cap = { x: S.x + 6, y: S.y - 74, vx: 0.32, vy: -0.5, rot: 0, vr: 0.02 };
				}
				return sample(keys, ms);
			});
		},
		confused() {
			const base = P({ aU: -150, aF: 60, lean: -2 }, 'confused');
			return act(
				1600,
				(ms) => {
					S.q = { ms };
					const rub = Math.sin(ms / 55) * 12;
					const e = EASE.back(clamp(ms / 220, 0, 1));
					return { ...base, aF: 60 + rub, cap: Math.sin(ms / 55) * 4, lean: -2 + Math.sin(ms / 420) * 6, sy: 1 - (1 - e) * 0.08, sx: 1 + (1 - e) * 0.08 };
				},
				() => {
					S.q = null;
				},
			);
		},
		async outOfBounds() {
			// the code read past the last pad: Ribas jumps for a pad that isn't there
			await hop(edgeX, WY + 6, N);
			const keys: Key[] = [
				K(0, P({ sy: 0.8, sx: 1.2 }, 'shock')),
				K(200, P({ sy: 1.1, sx: 0.92, aU: -150 }, 'shock'), 'out'),
				K(900, P({ sy: 1.1, sx: 0.92, aU: -160 }, 'sad'), 'lin'),
			];
			await act(900, (ms, fl) => {
				S.sunk = EASE.in(clamp((ms - 120) / 600, 0, 1));
				if (!fl.s) {
					fl.s = 1;
					splash(S.x, WY, 14);
					ripple(S.x, WY, 3);
					stage.shake = 4;
				}
				if (ms > 500 && !fl.b) {
					fl.b = 1;
					for (let k = 0; k < 4; k++) parts.emit({ t: 'dot', x: S.x + rnd(-10, 10), y: WY - 2, vy: -0.03, r: rnd(2, 4), life: 600 + k * 120, g: 0, c: '#d8f7f0' });
				}
				return sample(keys, ms);
			});
		},
		setSpeed(v) {
			stage.speed = v || 1;
		},
		destroy() {
			stage.destroy();
		},
	};

	/* ---- idle: breathing throat, random blinks, and a fly that doesn't last ---- */
	let blinkAt = performance.now() + 2200;
	const FLY = 9000;
	function idlePose(now: number): Pose {
		if (reduced) return P();
		const b = Math.sin(now / 600);
		if (now > blinkAt + 130) blinkAt = now + rnd(2000, 6500);
		const ph = now % FLY;
		const gulp = ph > 8240 && ph < 8700 ? Math.sin(((ph - 8240) / 460) * Math.PI) : 0;
		return {
			...BASE, fe: now > blinkAt ? 0.05 : 1, fl: Math.sin(now / 1700), fd: ph > 7600 && ph < 8300 ? -0.8 : 0,
			th: 0.3 + (b * 0.5 + 0.5) * 0.25 + gulp * 0.6, sy: 1 + b * 0.015, sx: 1 - b * 0.01, lean: Math.sin(now / 2100) * 2,
		};
	}
	const flyPos = (now: number) => {
		const ph = now % FLY;
		const enter = 1 - EASE.out(clamp(ph / 1200, 0, 1));
		return { x: S.x + 70 + Math.sin(now / 430) * 34 + enter * 260, y: S.y - 120 + Math.sin(now / 270) * 14 - enter * 60, ph };
	};

	/* ---- drawing: the frog ---- */
	function eye(ctx: CanvasRenderingContext2D, x: number, y: number, p: Pose, big: number) {
		ctx.save();
		ctx.translate(x, y);
		cel(ctx, G.socket, C.frog, C.frogS, 3, 4);
		const ry = 8.2 * big * Math.max(0.06, p.fe);
		ctx.save();
		ctx.globalAlpha = 1 - p.fj;
		ctx.beginPath();
		ctx.ellipse(1, 0, 7.6 * big, ry, 0, 0, 7);
		ctx.fillStyle = '#fffdf0';
		ctx.fill();
		ctx.save();
		ctx.clip();
		ctx.fillStyle = INK;
		ctx.beginPath();
		ctx.arc(1 + p.fl * 2.6, p.fd * 2.6, 4, 0, 7);
		ctx.fill();
		ctx.fillStyle = '#fff';
		ctx.beginPath();
		ctx.arc(p.fl * 2.6 - 0.4, p.fd * 2.6 - 1.6, 1.4, 0, 7);
		ctx.fill();
		// eyelid: focus and sadness cut the top of the eye
		if (p.fe < 0.98) {
			ctx.fillStyle = C.frogS;
			ctx.fillRect(-10, -12, 22, 12 * (1 - p.fe) + 1);
		}
		ctx.restore();
		ctx.lineWidth = 2.5;
		ctx.strokeStyle = INK;
		ctx.stroke();
		ctx.restore();
		if (p.fj > 0.02) {
			ctx.save();
			ctx.globalAlpha = p.fj;
			ctx.lineWidth = 3;
			ctx.lineCap = 'round';
			ctx.strokeStyle = INK;
			ctx.beginPath();
			ctx.arc(1, 3, 5.5, Math.PI * 1.1, Math.PI * 1.9);
			ctx.stroke();
			ctx.restore();
		}
		ctx.restore();
	}
	function face(ctx: CanvasRenderingContext2D, p: Pose) {
		if (p.th > 0.05) {
			ctx.save();
			ctx.translate(28, -15);
			ctx.scale(0.5 + p.th * 0.55, 0.5 + p.th * 0.55);
			cel(ctx, oval(0, 0, 13, 9), C.sac, C.bellyS, 2, 3);
			ctx.restore();
		}
		if (p.fr > 0.01) {
			ctx.save();
			ctx.clip(G.body);
			ctx.fillStyle = `rgba(232,70,50,${p.fr * 0.35})`;
			ctx.fillRect(0, -60, 50, 40);
			ctx.restore();
		}
		ctx.fillStyle = 'rgba(255,120,140,.35)';
		ctx.beginPath();
		ctx.ellipse(30, -30, 6, 3.5, 0, 0, 7);
		ctx.fill();
		// the wide frog mouth: one curve, mood bends it
		const y0 = -24;
		const cy = y0 + p.fm * 7;
		ctx.lineWidth = 3;
		ctx.strokeStyle = INK;
		ctx.lineCap = 'round';
		ctx.beginPath();
		ctx.moveTo(14, y0 - 2);
		ctx.quadraticCurveTo(28, cy - p.fo * 2, 42, y0 - 4);
		if (p.fo > 0.05) {
			ctx.quadraticCurveTo(28, cy + p.fo * 12 + 2, 14, y0 - 2);
			ctx.fillStyle = '#7a2a3a';
			ctx.fill();
		}
		ctx.stroke();
		eye(ctx, 6, -54, p, 0.9);
		eye(ctx, 26, -52, p, 1.05);
		ctx.lineWidth = 3.4;
		const brow = (x: number, y: number, extra: number) => {
			ctx.beginPath();
			ctx.moveTo(x - 7, y - 12 - extra - 3.5 * p.fb);
			ctx.lineTo(x + 7, y - 12 - extra + 3.5 * p.fb);
			ctx.stroke();
		};
		brow(6, -56, 0);
		brow(26, -54, p.fx * 6);
		if (p.ft > 0.05) {
			ctx.fillStyle = `rgba(159,227,238,${p.ft})`;
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			ctx.moveTo(34, -46);
			ctx.quadraticCurveTo(39, -39, 34, -35);
			ctx.quadraticCurveTo(29, -39, 34, -46);
			ctx.fill();
			ctx.stroke();
		}
	}
	function capShape(ctx: CanvasRenderingContext2D) {
		cel(ctx, G.brim, C.capS, null, 2, 3.5);
		cel(ctx, G.cap, C.cap, C.capS, 4, 4);
		cel(ctx, G.emblem, C.paper, C.paperS, 1.5, 2.5);
		ctx.strokeStyle = INK;
		ctx.lineWidth = 1.5;
		ctx.beginPath();
		ctx.moveTo(-6, -14);
		ctx.lineTo(0, -9);
		ctx.lineTo(6, -14);
		ctx.stroke();
	}
	function backLeg(ctx: CanvasRenderingContext2D, x: number, p: Pose, col: string, colS: string) {
		ctx.save();
		ctx.translate(x, -14);
		ctx.rotate(-p.lT * DEG);
		cel(ctx, G.thigh, col, colS, 4, 4);
		ctx.translate(0, 22);
		ctx.rotate(-p.lS * DEG);
		cel(ctx, G.shin, col, colS, 3, 4);
		ctx.translate(0, 20);
		ctx.rotate((p.lT + p.lS) * DEG);
		cel(ctx, G.foot, col, colS, 2, 3.5);
		ctx.restore();
	}
	function arm(ctx: CanvasRenderingContext2D, x: number, p: Pose, col: string, colS: string) {
		ctx.save();
		ctx.translate(x, -20);
		ctx.rotate(-p.aU * DEG);
		cel(ctx, G.upper, col, colS, 3, 4);
		ctx.translate(0, 14);
		ctx.rotate(-p.aF * DEG);
		cel(ctx, G.upper, col, colS, 3, 4);
		ctx.translate(0, 14);
		cel(ctx, G.hand, col, colS, 2, 3.5);
		ctx.restore();
	}
	function frog(ctx: CanvasRenderingContext2D, p: Pose) {
		ctx.save();
		ctx.translate(S.x, S.y - p.jy + S.sunk * 70);
		ctx.scale(S.fs * Math.cos(p.turn * Math.PI * 2) * p.sx, p.sy);
		ctx.rotate(p.lean * DEG * 0.5);
		backLeg(ctx, -16, p, C.frogS, '#3f8a2c');
		arm(ctx, 18, p, C.frogS, '#3f8a2c');
		// mail bag on the back, on a strap; it swings behind every hop
		ctx.save();
		ctx.translate(-22, -16);
		ctx.rotate((sp.bag.x + 8) * DEG);
		cel(ctx, G.bag, C.bag, C.bagS, 3, 4);
		if (!S.box || S.box.letter < 0.05) cel(ctx, G.letter, C.paper, C.paperS, 2, 3);
		cel(ctx, G.flap, C.bagS, null, 2, 3.5);
		ctx.restore();
		cel(ctx, G.body, C.frog, C.frogS, 6, 5);
		cel(ctx, G.belly, C.belly, C.bellyS, 3, 3.5);
		ctx.strokeStyle = C.bagS;
		ctx.lineWidth = 5;
		ctx.lineCap = 'round';
		ctx.beginPath();
		ctx.moveTo(-18, -24);
		ctx.quadraticCurveTo(0, -42, 14, -48);
		ctx.stroke();
		ctx.fillStyle = 'rgba(47,106,40,.55)';
		for (const [sx, sy, r] of [[-14, -40, 4], [-22, -26, 3], [-4, -46, 2.6]]) {
			ctx.beginPath();
			ctx.arc(sx, sy, r, 0, 7);
			ctx.fill();
		}
		backLeg(ctx, -10, p, C.frog, C.frogS);
		face(ctx, p);
		if (S.capOn) {
			ctx.save();
			ctx.translate(14, -62);
			ctx.rotate((p.cap + sp.cap.x - 8) * DEG);
			capShape(ctx);
			ctx.restore();
		}
		arm(ctx, 24, p, C.frog, C.frogS);
		ctx.restore();
	}

	/* ---- drawing: the world ---- */
	function pad(ctx: CanvasRenderingContext2D, i: number, now: number) {
		const x = padX(i);
		const d = S.dip[i];
		spring(d, 0, 16, 0.05, 0.18, 1);
		const bob = (reduced ? 0 : Math.sin(now / 900 + i * 1.7) * 1.2) + d.x * 14;
		const tilt = d.x * 6 * Math.sin(now / 60);
		ctx.fillStyle = 'rgba(6,30,34,.35)';
		ctx.beginPath();
		ctx.ellipse(x + 4, WY + 8, 62, 15, 0, 0, 7);
		ctx.fill();
		ctx.save();
		ctx.translate(x, WY + bob);
		ctx.rotate(tilt * DEG);
		// a lily pad: an ellipse with a notch, veins from the notch
		const notch = (i % 3) * 0.6 + 1.1;
		const pp = new Path2D();
		pp.moveTo(0, 0);
		pp.ellipse(0, 0, 58, 17, 0, notch + 0.22, notch - 0.22 + Math.PI * 2);
		pp.closePath();
		cel(ctx, pp, C.pad, C.padS, 4, 4.5);
		ctx.save();
		ctx.clip(pp);
		ctx.strokeStyle = C.padV;
		ctx.lineWidth = 2;
		for (let v = 0; v < 7; v++) {
			const a = notch + 0.6 + v * 0.75;
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(Math.cos(a) * 54, Math.sin(a) * 15);
			ctx.stroke();
		}
		ctx.restore();
		if (S.bloom.has(i)) {
			for (let k = 0; k < 6; k++) {
				ctx.save();
				ctx.translate(-30, -6);
				ctx.rotate((k * 60 + now / 40) * DEG * (reduced ? 0 : 0.05));
				ctx.rotate(k * 60 * DEG);
				cel(ctx, oval(0, -8, 5, 9), C.flower, C.flowerS, 2, 2.5);
				ctx.restore();
			}
			ctx.fillStyle = C.gold;
			ctx.beginPath();
			ctx.arc(-30, -6, 4.5, 0, 7);
			ctx.fill();
		}
		ctx.restore();
		// the address: painted on a little floating cork at the front of the pad
		S.plate[i] *= 0.9;
		const pop = S.plate[i];
		const seen = S.seen.has(i) && !(S.box && S.box.i === i);
		ctx.save();
		ctx.translate(x + 6, WY + 30 + bob * 0.6 - pop * 8);
		ctx.rotate((i % 2 ? 1 : -1) * 2 * DEG);
		ctx.scale(1 + pop * 0.15, 1 + pop * 0.15);
		const value = String(slots[i]);
		const w = Math.max(42, value.length * 15 + 18);
		const pl = new Path2D();
		pl.roundRect(-w / 2, -16, w, 32, 16);
		cel(ctx, pl, seen ? '#c9c0a8' : C.paper, seen ? '#a59c86' : C.paperS, 3, 4);
		text(ctx, value, 0, 1, 23, seen ? '#6b6556' : '#24403c', null);
		ctx.restore();
		text(ctx, String(i), x + 6, WY + 64, 15, 'rgba(210,240,235,.6)', null);
	}
	function mailbox(ctx: CanvasRenderingContext2D) {
		const b = S.box;
		if (!b) return;
		const x = padX(b.i) + 84;
		const rise = (1 - EASE.back(b.p)) * 90;
		ctx.save();
		ctx.translate(x, WY - 60 + rise);
		ctx.save();
		stage.clipAbove(WY + 6); // it rises out of the water
		cel(ctx, G.post, C.wood, C.woodS, 2, 3.5);
		ctx.save();
		ctx.translate(23, 0);
		ctx.rotate(-(1 - EASE.back(b.flag)) * 90 * DEG);
		ctx.translate(-23, 0);
		cel(ctx, G.flag, '#e8504a', '#b03a36', 2, 3);
		ctx.restore();
		cel(ctx, G.box, '#3b7fd0', '#2a5a96', 4, 4.5);
		ctx.fillStyle = INK;
		ctx.fillRect(-10, -12, 20, 4);
		ctx.restore();
		ctx.restore();
		if (b.letter > 0 && b.letter < 1) {
			const u = EASE.inOut(b.letter);
			const sx = S.x - 22;
			const sy = S.y - 30;
			const lx = sx + (x - sx) * u;
			const ly = sy + (WY - 72 - sy) * u - Math.sin(u * Math.PI) * 70;
			ctx.save();
			ctx.translate(lx, ly);
			ctx.rotate(u * 4 * Math.PI * (reduced ? 0 : 1));
			cel(ctx, G.letter, C.paper, C.paperS, 2, 3);
			ctx.restore();
		}
	}
	function moreSign(ctx: CanvasRenderingContext2D) {
		if (more <= 0) return;
		ctx.save();
		ctx.translate(lastX + 120, WY + 6);
		cel(ctx, new Path2D('M-4 0 L4 0 L4 -70 L-4 -70 Z'), C.wood, C.woodS, 2, 4);
		cel(ctx, new Path2D('M-46 -100 L36 -100 L52 -82 L36 -64 L-46 -64 Z'), '#d9a466', C.woodS, 3, 4.5);
		text(ctx, `+${more}`, -6, -82, 24, C.paper, INK, 5);
		ctx.restore();
	}
	function reeds(ctx: CanvasRenderingContext2D, x: number, n: number, now: number, near: boolean) {
		for (let k = 0; k < n; k++) {
			const rx = x + k * 13 - n * 6;
			const h = 90 + ((k * 37) % 50);
			const sw = reduced ? 0 : Math.sin(now / 1100 + k + x) * 4;
			ctx.strokeStyle = near ? '#2f6a4a' : '#24504a';
			ctx.lineWidth = 4;
			ctx.lineCap = 'round';
			ctx.beginPath();
			ctx.moveTo(rx, WY + 10);
			ctx.quadraticCurveTo(rx + sw * 0.5, WY - h * 0.5, rx + sw, WY - h);
			ctx.stroke();
			if (k % 2 === 0) {
				const cat = new Path2D();
				cat.roundRect(rx + sw - 4.5, WY - h - 4, 9, 26, 4.5);
				cel(ctx, cat, '#8a5a34', '#5e3a20', 2, 3);
			}
		}
	}
	function background(ctx: CanvasRenderingContext2D, now: number) {
		const t = reduced ? 0 : now / 1000;
		const hz = 300;
		const cam = stage.cam;
		const L = cam - 200;
		const R = cam + stage.viewWidth + 200;
		const sky = ctx.createLinearGradient(0, 120, 0, hz);
		sky.addColorStop(0, '#1d2b53');
		sky.addColorStop(0.6, '#3a3f7a');
		sky.addColorStop(1, '#6b5a94');
		ctx.fillStyle = sky;
		ctx.fillRect(L, -600, R - L, hz + 602);
		ctx.save();
		ctx.translate(cam * 0.85, 0);
		ctx.fillStyle = '#eef4ff';
		for (const [sx, sy, sr] of [[40, 160, 1.4], [160, 200, 1.1], [300, 150, 1.7], [460, 190, 1.2], [620, 140, 1.5], [880, 186, 1.2], [1000, 150, 1.7], [1140, 200, 1.3]]) {
			ctx.globalAlpha = 0.5 + Math.sin(t * 2 + sx) * 0.3;
			ctx.beginPath();
			ctx.arc(sx, sy, sr, 0, 7);
			ctx.fill();
		}
		ctx.globalAlpha = 1;
		const mx = 760;
		const my = 196;
		const mg = ctx.createRadialGradient(mx, my, 8, mx, my, 150);
		mg.addColorStop(0, 'rgba(255,246,214,.5)');
		mg.addColorStop(1, 'rgba(255,246,214,0)');
		ctx.fillStyle = mg;
		ctx.fillRect(mx - 160, my - 160, 320, 320);
		ctx.fillStyle = '#fff3cf';
		ctx.beginPath();
		ctx.arc(mx, my, 30, 0, 7);
		ctx.fill();
		ctx.fillStyle = 'rgba(214,196,150,.6)';
		for (const [cx, cy, r] of [[-8, -6, 6], [9, 8, 4], [10, -10, 3]]) {
			ctx.beginPath();
			ctx.arc(mx + cx, my + cy, r, 0, 7);
			ctx.fill();
		}
		ctx.restore();
		// far bank: two rows of soft trees, lighter (further) behind darker
		for (const [par, col, y0, amp] of [[0.7, '#2e3f6a', hz - 14, 20], [0.5, '#21385a', hz - 2, 14]] as const) {
			ctx.save();
			ctx.translate(cam * par, 0);
			ctx.fillStyle = col;
			ctx.beginPath();
			ctx.moveTo(L - cam * par, hz + 4);
			for (let x = L - cam * par; x <= R - cam * par + 40; x += 34) ctx.quadraticCurveTo(x + 17, y0 - amp - Math.abs(Math.sin(x * 0.37)) * amp, x + 34, y0 - Math.abs(Math.sin(x * 0.19)) * amp * 0.4);
			ctx.lineTo(R - cam * par + 40, hz + 4);
			ctx.closePath();
			ctx.fill();
			ctx.restore();
		}
		// water: lighter where it meets the sky
		const wg = ctx.createLinearGradient(0, hz, 0, H + 20);
		wg.addColorStop(0, '#3d5f86');
		wg.addColorStop(0.35, '#1f6a73');
		wg.addColorStop(1, '#14394a');
		ctx.fillStyle = wg;
		ctx.fillRect(L, hz, R - L, H + 200 - hz);
		ctx.save();
		ctx.translate(cam * 0.85, 0);
		for (let r = 0; r < 8; r++) {
			const w = 70 - r * 7;
			const wob = Math.sin(t * 1.6 + r) * 5;
			ctx.fillStyle = r % 2 ? 'rgba(255,243,207,.55)' : 'rgba(255,243,207,.35)';
			ctx.beginPath();
			ctx.roundRect(760 - w / 2 + wob, hz + 8 + r * 13, w, 4, 2);
			ctx.fill();
		}
		ctx.restore();
		ctx.strokeStyle = 'rgba(143,227,208,.22)';
		ctx.lineWidth = 2.5;
		ctx.lineCap = 'round';
		for (let r = 0; r < 14; r++) {
			const y = hz + 20 + r * 17;
			const off = (t * (10 + r * 2) + r * 97) % 300;
			for (let x = L - 300 + off; x < R; x += 300) {
				ctx.beginPath();
				ctx.moveTo(x, y);
				ctx.lineTo(x + 40 + (r % 3) * 16, y);
				ctx.stroke();
			}
		}
		// fireflies, glowing on and off
		if (!reduced) {
			ctx.globalCompositeOperation = 'lighter';
			for (let k = 0; k < 10; k++) {
				const fx = L + ((k * 173 + Math.sin(t * 0.3 + k) * 60) % (R - L));
				const fy = hz - 30 + Math.sin(t * 0.7 + k * 2) * 24 + (k % 3) * 18;
				const a = clamp(Math.sin(t * 1.3 + k * 1.9) * 1.4, 0, 1);
				const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, 12);
				g.addColorStop(0, `rgba(230,255,150,${0.9 * a})`);
				g.addColorStop(1, 'rgba(230,255,150,0)');
				ctx.fillStyle = g;
				ctx.fillRect(fx - 12, fy - 12, 24, 24);
			}
			ctx.globalCompositeOperation = 'source-over';
		}
		// home: a mossy rock by the bank
		ctx.save();
		ctx.translate(HOME, HOME_Y + 30);
		ctx.fillStyle = 'rgba(6,30,34,.35)';
		ctx.beginPath();
		ctx.ellipse(0, 34, 86, 14, 0, 0, 7);
		ctx.fill();
		cel(ctx, G.rock, C.rock, C.rockS, 8, 5);
		const moss = new Path2D('M-60 -10 C-50 -28 -10 -36 20 -32 C40 -30 54 -22 60 -14 C40 -20 10 -22 -20 -16 C-36 -14 -50 -10 -60 -10 Z');
		cel(ctx, moss, C.moss, '#3c7a36', 2, 3.5);
		ctx.restore();
		reeds(ctx, HOME - 70, 5, now, false);
		reeds(ctx, edgeX + 70, 6, now, false);
	}
	function question(ctx: CanvasRenderingContext2D, now: number) {
		if (!S.q) return;
		for (let q = 0; q < 3; q++) {
			const t = S.q.ms - q * 260;
			if (t <= 0) continue;
			const e = EASE.back(clamp(t / 260, 0, 1));
			ctx.save();
			ctx.translate(S.x + [-30, 10, 48][q], S.y - 130 - [0, 16, 2][q] + Math.sin(now / 220 + q * 2) * 5);
			ctx.rotate([-12, 6, 14][q] * DEG);
			ctx.scale(e, e);
			text(ctx, '?', 0, 0, [42, 54, 38][q], C.gold, INK, 9);
			ctx.restore();
		}
	}
	function fly(ctx: CanvasRenderingContext2D, now: number, idle: boolean) {
		if (reduced) return;
		const f = flyPos(now);
		const eaten = idle && f.ph > 8120;
		// the tongue shoots out and back in 240 ms
		if (idle && f.ph > 8000 && f.ph < 8240) {
			const u = Math.sin(((f.ph - 8000) / 240) * Math.PI);
			const mx = S.x + 40 * S.fs;
			const my = S.y - 28;
			ctx.strokeStyle = '#e8607a';
			ctx.lineWidth = 5;
			ctx.lineCap = 'round';
			ctx.beginPath();
			ctx.moveTo(mx, my);
			ctx.lineTo(mx + (f.x - mx) * u, my + (f.y - my) * u);
			ctx.stroke();
		}
		if (eaten) return;
		ctx.fillStyle = 'rgba(220,240,255,.6)';
		const flap = Math.sin(now / 18) * 3;
		ctx.beginPath();
		ctx.ellipse(f.x - 2, f.y - 4 - flap * 0.3, 4, 2 + flap * 0.3, -0.5, 0, 7);
		ctx.ellipse(f.x + 2, f.y - 4 - flap * 0.3, 4, 2 + flap * 0.3, 0.5, 0, 7);
		ctx.fill();
		ctx.fillStyle = INK;
		ctx.beginPath();
		ctx.arc(f.x, f.y, 2.8, 0, 7);
		ctx.fill();
	}

	function draw(ctx: CanvasRenderingContext2D, now: number, dt: number) {
		const idle = !stage.act;
		const sampled = stage.sampleAct(now) ?? idlePose(now);
		const w = blendDur > 0 ? clamp((now - blendT0) / blendDur, 0, 1) : 1;
		const p = w < 1 ? mix(blendFrom, sampled, EASE.out(w)) : sampled;
		cur = p;
		S.fs += clamp(S.face - S.fs, -dt / 90, dt / 90);
		S.vx = (S.x - S.px) / Math.max(1, dt);
		S.px = S.x;
		S.vy = (p.jy - S.jyPrev) / Math.max(1, dt);
		S.jyPrev = p.jy;
		const lv = S.vx * S.face;
		spring(sp.cap, -lv * 30 + clamp(S.vy, -1, 1) * 22, dt, 0.03, 0.3);
		spring(sp.bag, -lv * 50 + S.vy * 40, dt, 0.024, 0.26);
		parts.step(dt);
		const c = S.cap;
		if (c) {
			if (c.floating === undefined) {
				c.vy += 0.0012 * dt;
				c.x += c.vx * dt;
				c.y += c.vy * dt;
				c.rot += c.vr * dt;
				if (c.y > WY + 6) {
					c.floating = now;
					ripple(c.x, WY, 2);
					splash(c.x, WY, 4);
				}
			} else {
				c.y = WY + 4 + Math.sin((now - c.floating) / 400) * 2;
				c.rot += (0.3 - c.rot) * 0.05;
			}
		}
		stage.follow(S.x);

		background(ctx, now);
		for (let i = 0; i < N; i++) pad(ctx, i, now);
		moreSign(ctx);
		mailbox(ctx);
		if (p.jy < 140 && S.sunk < 0.2) {
			const air = Math.max(0, p.jy);
			ctx.fillStyle = 'rgba(6,30,34,.32)';
			ctx.beginPath();
			ctx.ellipse(S.x, S.y + 4, 36 * (1 - air / 260) * p.sx, 8 * (1 - air / 300), 0, 0, 7);
			ctx.fill();
		}
		if (S.sunk > 0) {
			ctx.save();
			stage.clipAbove(WY + 2);
			frog(ctx, p);
			ctx.restore();
		} else frog(ctx, p);
		if (c) {
			ctx.save();
			ctx.translate(c.x, c.y);
			ctx.rotate(c.rot);
			if (c.floating !== undefined) stage.clipAbove(WY + 6);
			capShape(ctx);
			ctx.restore();
		}
		fly(ctx, now, idle);
		parts.draw(ctx, INK, C);
		question(ctx, now);
		stage.screen((g, cw, ch) => {
			const vg = g.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.45, cw / 2, ch / 2, Math.max(cw, ch) * 0.8);
			vg.addColorStop(0, 'rgba(4,14,24,0)');
			vg.addColorStop(1, 'rgba(4,14,24,.42)');
			g.fillStyle = vg;
			g.fillRect(0, 0, cw, ch);
		});
	}

	return scene;
}
