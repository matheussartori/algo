import { clamp, cel as celWith, DEG, EASE, K, type Key, label as labelWith, limb, mix, Particles, type Pose, rnd, sample, type Spring, spring, Stage } from '../cutout/kit';
import type { Scene, SceneSetup } from '../engine';

/**
 * The island: Captain Stubble walks tree to tree and digs where the code looked.
 * Cutout rig on Canvas 2D (see ../cutout/kit.ts). World units: 560 tall, ground at GY.
 */

const H = 560;
const GY = 470;
const HOME = 110;
const GAP = 112;
const treeX = (i: number) => 262 + i * GAP;
const stopX = (i: number) => treeX(i) - 80;
const spotX = (i: number) => treeX(i) - 14;

/* palette: dusk island. Outline is a warm dark plum, not black; one shade tone per material */
const INK = '#2b1418';
const C = {
	skin: '#f2b78d', skinS: '#d48a66', coat: '#c63d2f', coatS: '#8c2a25', shirt: '#f6ead2', shirtS: '#d4bd96',
	pants: '#2f4a72', pantsS: '#203354', boot: '#6b3f24', bootS: '#47281a', gold: '#f5c450', goldS: '#c98a2b',
	hat: '#3a2a3f', hatS: '#241a28', beard: '#4a2b1c', beardS: '#2f1a10', band: '#e0703a', bandS: '#a84a28',
	wood: '#a8703c', woodS: '#7a4a28', iron: '#c3cbd2', ironS: '#7d8891', leaf: '#5aa84a', leafS: '#2f6a3a', leafHi: '#8fd16a',
	trunk: '#b9814a', trunkS: '#7e5230', sand: '#ecc582', sandS: '#d9a868', sandD: '#c08a55',
};
const PARROT = { body: '#f0603a', bodyS: '#b8402a', wing: '#3b82c4', wingS: '#2a5a96' };

/* ---------- poses ---------- */

const EMO: Record<string, Pose> = {
	neutral: { fe: 1, fb: 0, fbr: 0, fm: 0.3, fo: 0, fl: 0, fx: 0, ft: 0, fr: 0, fj: 0 },
	focus: { fe: 0.7, fb: 0.6, fbr: 0, fm: -0.1, fo: 0, fl: 1, fx: 0, ft: 0, fr: 0, fj: 0 },
	sad: { fe: 0.7, fb: -1, fbr: 0.3, fm: -0.9, fo: 0, fl: 0, fx: 0, ft: 1, fr: 0, fj: 0 },
	angry: { fe: 0.8, fb: 1, fbr: 0, fm: -0.7, fo: 0.75, fl: 1, fx: 0, ft: 0, fr: 1, fj: 0 },
	joy: { fe: 0.8, fb: -0.2, fbr: 1, fm: 1, fo: 0.85, fl: 0, fx: 0, ft: 0, fr: 0, fj: 1 },
	confused: { fe: 1, fb: -0.3, fbr: 0.2, fm: -0.25, fo: 0.15, fl: 0, fx: 1, ft: 0, fr: 0, fj: 0 },
	shock: { fe: 1.3, fb: -0.2, fbr: 1, fm: 0, fo: 0.9, fl: 0, fx: 0, ft: 0, fr: 0, fj: 0 },
};
const BASE: Pose = { jy: 0, sx: 1, sy: 1, hx: 0, hy: 0, lean: 0, head: 0, hat: 0, turn: 0, aLu: 6, aLf: 12, aRu: -4, aRf: 12, lLt: 3, lLs: 0, lRt: -3, lRs: 0, sh: 0, shA: 0, ...EMO.neutral };
const P = (o: Pose = {}, emo?: keyof typeof EMO): Pose => ({ ...BASE, ...(emo ? EMO[emo] : {}), ...o });

const CARRY = { sh: 1, aRu: 30, aRf: 100, shA: 84 };
const WALK: Key[] = [
	K(0, P({ ...CARRY, hy: 7, lean: 7, lLt: 30, lLs: -6, lRt: -26, lRs: -14, aLu: 32, aLf: 28, head: -3 })),
	K(85, P({ ...CARRY, hy: -2, lean: 5, lLt: 2, lLs: 0, lRt: 26, lRs: -58, aLu: 8, aLf: 14, head: 2 })),
	K(170, P({ ...CARRY, hy: 7, lean: 7, lLt: -26, lLs: -14, lRt: 30, lRs: -6, aLu: -26, aLf: 10, head: -3 })),
	K(255, P({ ...CARRY, hy: -2, lean: 5, lLt: 26, lLs: -58, lRt: 2, lRs: 0, aLu: 8, aLf: 14, head: 2 })),
	K(340, P({ ...CARRY, hy: 7, lean: 7, lLt: 30, lLs: -6, lRt: -26, lRs: -14, aLu: 32, aLf: 28, head: -3 })),
];
const DIG_HELD = { sh: 1, aRu: 40, aRf: 40, shA: -60, lean: 12, hy: 8, lLt: 22, lLs: -16, lRt: -12, lRs: -22 };
const DIG: Key[] = [
	K(0, P({ ...CARRY, lean: 4 }, 'focus')),
	K(190, P({ sh: 1, aRu: 88, aRf: 64, shA: 18, aLu: 70, aLf: 50, lean: -8, hy: 3, sy: 1.05, sx: 0.97, lLt: 10, lLs: -10, lRt: -10, lRs: -10, head: -6 }, 'focus'), 'out'),
	K(255, P({ sh: 1, aRu: 52, aRf: 24, shA: -72, aLu: 40, aLf: 40, lean: 26, hy: 13, sy: 0.92, sx: 1.07, lLt: 30, lLs: -20, lRt: -14, lRs: -24, head: 10 }, 'focus'), 'in'),
	K(450, P(DIG_HELD, 'focus'), 'out'),
];
const SHRUG = { aLu: 38, aLf: -30, aRu: 38, aRf: -30, sh: 0 };
const shakeKeys = (amp: number, n = 4, dur = 62): Key[] =>
	Array.from({ length: n + 1 }, (_, k) =>
		K(450 + (k + 1) * dur, P({ ...DIG_HELD, ...SHRUG, sh: 1, aRu: 30, aRf: 30, lean: 4, hy: 6, head: k === n ? 0 : (k % 2 ? 1 : -1) * amp * (1 - k / (n + 1)) }, 'sad'), 'sine'),
	);

/* ---------- rig geometry ---------- */

const path = (d: string) => new Path2D(d);
// built on first use: Path2D doesn't exist while the page renders on the server
const geometry = () => ({
	thigh: limb(27, 18, 14), shin: limb(25, 14, 11), upper: limb(24, 15, 12), fore: limb(22, 12, 10),
	boot: path('M-8 -4 L-8 9 C-9 17 18 17 20 10 C20 5 12 4 8 1 L8 -4 Z'), cuff: path('M-8.5 -5 L8.5 -5 L8.5 1 L-8.5 1 Z'),
	hand: path('M-6.5 0 C-6.5 -6 6.5 -6 6.5 0 C6.5 8 -6.5 8 -6.5 0 Z'),
	torso: path('M-19 3 C-25 -12 -22 -30 -15 -43 C-6 -50 10 -50 17 -43 C24 -30 24 -12 19 3 C8 9 -8 9 -19 3 Z'),
	shirt: path('M-3 -47 L6 -20 L15 -46 C8 -52 2 -52 -3 -47 Z'),
	belt: path('M-20 -7 L20 -7 L20 2 L-20 2 Z'), buckle: path('M2 -8 L13 -8 L13 3 L2 3 Z'),
	tail: path('M-14 0 C-32 8 -34 28 -26 38 C-14 32 -6 16 4 2 Z'),
	head: path('M-24 -26 C-26 -52 18 -58 26 -34 C30 -18 18 -2 -2 -2 C-18 -2 -24 -12 -24 -26 Z'),
	chin: path('M-15 -7 C-13 9 11 11 13 -4 C5 -2 -4 -2 -15 -7 Z'), nose: path('M22 -28 C22 -35 34 -33 33 -25 C32 -19 22 -21 22 -28 Z'),
	band: path('M-25 -34 C-18 -52 18 -58 27 -38 L28 -33 C15 -45 -14 -47 -25 -28 Z'), knot: path('M-25 -36 C-38 -34 -44 -26 -40 -16 C-36 -24 -30 -28 -22 -30 Z'),
	hatBody: path('M-34 -3 C-36 -28 -10 -44 12 -42 C32 -40 40 -20 44 -4 C22 -10 -8 -10 -34 -3 Z'),
	hatTrim: path('M-34 -3 C-8 -10 22 -10 44 -4'), plume: path('M-26 -22 C-52 -38 -64 -10 -48 4 C-50 -12 -40 -18 -28 -12 Z'),
	shovelH: path('M-3 -26 L3 -26 L3 62 L-3 62 Z'), grip: path('M-7 -30 L7 -30 L7 -24 L-7 -24 Z'),
	blade: path('M-11 58 C-13 78 -5 92 0 94 C5 92 13 78 11 58 Z'),
	pBody: path('M-8 2 C-13 -14 -3 -28 8 -22 C15 -15 13 -2 6 3 Z'), pWing: path('M-5 -8 C-14 -4 -16 8 -10 14 C-4 10 4 0 6 -8 Z'),
	pTail: path('M-5 0 C-9 10 -10 20 -6 28 C-1 20 3 10 4 1 Z'), pBeak: path('M11 -28 C20 -29 22 -21 19 -17 C17 -22 14 -23 11 -22 Z'),
	chestBody: path('M-28 -24 L28 -24 L28 10 C28 14 24 16 20 16 L-20 16 C-24 16 -28 14 -28 10 Z'),
	chestLid: path('M-28 0 C-28 -22 28 -22 28 0 Z'), band2: path('M-28 -12 L28 -12 L28 -6 L-28 -6 Z'), lock: path('M-6 -16 L6 -16 L6 -4 L-6 -4 Z'),
});
let G: ReturnType<typeof geometry>;

/* ---------- the scene ---------- */

export function createIslandScene(host: HTMLElement, setup: SceneSetup): Scene {
	G ??= geometry();
	const slots = setup.slots;
	const N = slots.length;
	const more = setup.total - N;
	const lastX = N > 0 ? treeX(N - 1) : treeX(0);
	const edgeX = lastX + (more > 0 ? 190 : 120);
	const worldWidth = Math.max(1000, edgeX + 140);

	const cel = (ctx: CanvasRenderingContext2D, p: Path2D, base: string, shade?: string | null, o?: number, lw?: number) => celWith(ctx, INK, p, base, shade, o, lw);
	const text = (ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, fill: string, stroke: string | null = INK, lw = 6, align: CanvasTextAlign = 'center') =>
		labelWith(ctx, s, x, y, size, fill, stroke, lw, align);

	const S = {
		x: HOME, fs: 1, face: 1, hatOn: true, chest: null as null | { i: number; p: number; lid: number }, holes: new Set<number>(),
		hat: null as null | { x: number; y: number; vx: number; vy: number; rot: number; vr: number; b: number; landed?: boolean },
		q: null as null | { ms: number }, hand: { x: HOME, y: GY - 80 }, treeShake: new Array(N).fill(0) as number[],
		plate: new Array(N).fill(0) as number[], steps: [] as { x: number; t: number; f: number }[], vx: 0, vy: 0, jyPrev: 0, px: HOME, splash: 0,
	};
	let cur: Pose = P();
	let blendFrom: Pose = cur;
	let blendT0 = 0;
	let blendDur = 0;
	const sp: Record<string, Spring> = { hat: { x: 0, v: 0 }, plume: { x: 0, v: 0 }, tail: { x: 0, v: 0 }, par: { x: 0, v: 0 }, pTail: { x: 0, v: 0 } };

	const stage = new Stage(host, { height: H, worldWidth, band: [150, 548], minView: 640, draw });
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
	const atHome = () => {
		S.holes.clear();
		S.chest = null;
		S.hatOn = true;
		S.hat = null;
	};

	/* particles */
	const dust = (x: number, y: number, n = 4) => {
		for (let i = 0; i < n; i++)
			parts.emit({ t: 'dust', x: x + rnd(-14, 14), y, vx: rnd(-0.08, 0.08) + (i < n / 2 ? -0.05 : 0.05), vy: rnd(-0.05, -0.02), r: rnd(5, 9), life: 520, g: 0, c: '#f6dca0' });
	};
	const stars = (x: number, y: number, n: number) => {
		for (let i = 0; i < n; i++) parts.emit({ t: 'star', x: x + rnd(-40, 40), y: y + rnd(-50, 10), vy: rnd(-0.04, -0.01), r: rnd(6, 12), life: rnd(500, 800), g: 0, c: i % 2 ? '#fff6c8' : C.gold });
	};
	const strike = (i: number) => {
		S.holes.add(i);
		S.treeShake[i] = 1;
		S.plate[i] = 1;
		stage.shake = Math.max(stage.shake, 2.5);
		parts.burst('dirt', spotX(i) + 4, GY + 4, 9, { v0: 0.12, v1: 0.42, r0: 3, r1: 6, cols: ['#7a4b2c', '#3e2417', '#a06a3c', '#e0b370'] });
		dust(spotX(i), GY + 6, 3);
	};
	const stompDust = () => {
		dust(S.x - 18, GY + 2, 3);
		dust(S.x + 18, GY + 2, 3);
		stage.shake = 4;
	};

	/* ---- beats ---- */

	function walk(tx: number, after?: () => void): Promise<void> {
		const x0 = S.x;
		const dx = tx - x0;
		if (Math.abs(dx) < 1) {
			after?.();
			S.face = 1;
			return Promise.resolve();
		}
		S.face = dx > 0 ? 1 : -1;
		const base = Math.max(160, (300 * Math.abs(dx)) / GAP);
		return act(
			base,
			(ms, fl) => {
				const p = clamp(ms / base, 0, 1);
				S.x = reduced ? tx : x0 + dx * (p * 0.7 + EASE.sine(p) * 0.3);
				const w = sample(WALK, ms % 340);
				const ph = Math.floor(ms / 85);
				if (ph !== fl.ph) {
					fl.ph = ph;
					if (ph % 2 === 0 && ph > 0) dust(S.x - S.face * 10, GY + 2, 1);
					if (ph > 0) S.steps.push({ x: S.x + (ph % 2 ? 6 : -6), t: performance.now(), f: S.face });
				}
				return S.hatOn ? w : { ...w, head: w.head + 14, lean: w.lean + 3, fm: -0.6, fb: -0.6 };
			},
			() => {
				S.x = tx;
				S.face = 1;
				after?.();
			},
		);
	}
	const dig = (ms: number, i: number, fl: Record<string, number>) => {
		if (ms >= 255 && !fl.s) {
			fl.s = 1;
			strike(i);
		}
		return sample(DIG, ms);
	};

	const scene: Scene = {
		idle() {
			stage.stopAct();
		},
		moveTo(i) {
			return walk(i < 0 ? HOME : stopX(i), i < 0 ? atHome : undefined);
		},
		inspect(i, isTarget) {
			S.face = 1;
			const keys = shakeKeys(16);
			return act(isTarget ? 450 : 740, (ms, fl) => (ms < 450 || isTarget ? dig(ms, i, fl) : sample(keys, ms)));
		},
		nothing(i) {
			S.face = 1;
			const sad = (o: Pose) => P({ ...SHRUG, lean: 2, hy: 5, sh: 1, ...o }, 'sad');
			const drop: Key[] = [
				K(450, P(DIG_HELD, 'focus')),
				K(560, sad({ head: -10 }), 'out'),
				K(650, sad({ head: 14 }), 'sine'),
				K(740, sad({ head: -14 }), 'sine'),
				K(830, sad({ head: 10 }), 'sine'),
				K(1050, P({ aLu: 4, aRu: 4, aLf: 10, aRf: 10, lean: 8, hy: 12, head: 22, sh: 0, sy: 0.96, sx: 1.03 }, 'sad'), 'out'),
				K(1250, P({ aLu: 4, aRu: 4, aLf: 10, aRf: 10, lean: 8, hy: 12, head: 22, sy: 0.96, sx: 1.03 }, 'sad'), 'lin'),
			];
			return act(1250, (ms, fl) => {
				if (ms >= 1050 && !fl.d) {
					fl.d = 1;
					parts.emit({ t: 'drop', x: S.x + 22, y: GY - 120, vy: 0.03, life: 700, r: 5, g: 0.0004, c: '#7ec8e3' });
				}
				return ms < 450 ? dig(ms, i, fl) : sample(drop, ms);
			});
		},
		found(i) {
			S.face = 1;
			S.chest = { i, p: 0, lid: 0 };
			const keys: Key[] = [
				K(0, P(DIG_HELD, 'focus')),
				K(130, P({ lean: -4, hy: 2, sh: 0, aLu: 20, aRu: 20, sx: 0.98, sy: 1.04 }, 'shock'), 'out'),
				K(300, P({ lean: 0, hy: 16, sy: 0.84, sx: 1.12, aLu: -10, aRu: -10, aLf: 10, aRf: 10, lLt: 24, lLs: -34, lRt: -24, lRs: -34 }, 'shock')),
				K(430, P({ jy: 42, sy: 1.12, sx: 0.92, aLu: 160, aRu: 160, aLf: 10, aRf: 10, lLt: 6, lLs: -6, lRt: -6, lRs: -6, head: -6 }, 'joy'), 'out'),
				K(640, P({ jy: 46, sy: 1.02, aLu: 150, aRu: 150, lLt: 14, lLs: -30, lRt: -14, lRs: -30 }, 'joy'), 'sine'),
				K(770, P({ jy: 0, hy: 14, sy: 0.86, sx: 1.12, aLu: 120, aRu: 120, lLt: 22, lLs: -30, lRt: -22, lRs: -30 }, 'joy'), 'in'),
				K(900, P({ aLu: 150, aRu: 150, hy: 2 }, 'joy'), 'out'),
			];
			return act(900, (ms, fl) => {
				const chest = S.chest;
				if (chest) {
					chest.p = clamp((ms - 140) / 330, 0, 1);
					chest.lid = clamp((ms - 420) / 260, 0, 1);
				}
				if (ms >= 140 && !fl.a) {
					fl.a = 1;
					stage.shake = 3;
				}
				if (ms >= 430 && !fl.b) {
					fl.b = 1;
					parts.burst('coin', spotX(i), GY - 20, 12, { v0: 0.22, v1: 0.6, r0: 7, r1: 9, cols: [C.gold] });
					stars(spotX(i), GY - 40, 6);
				}
				if (ms >= 770 && !fl.c) {
					fl.c = 1;
					dust(S.x, GY + 2, 4);
					stage.shake = 3;
				}
				return sample(keys, ms);
			});
		},
		celebrate() {
			S.face = 1;
			const cx = S.chest ? spotX(S.chest.i) : S.x + 70;
			const jump = (t0: number, spin: boolean): Key[] => [
				K(t0, P({ hy: 3, aLu: 120, aRu: 120, turn: spin ? 0 : 0 }, 'joy'), 'out'),
				K(t0 + 130, P({ hy: 17, sy: 0.82, sx: 1.14, aLu: -20, aRu: -20, lLt: 26, lLs: -36, lRt: -26, lRs: -36 }, 'joy')),
				K(t0 + 290, P({ jy: 82, sy: 1.14, sx: 0.9, aLu: 165, aRu: 165, lLt: 8, lLs: -8, lRt: -8, lRs: -8, turn: spin ? 0.5 : 0, head: -8 }, 'joy'), 'out'),
				K(t0 + 520, P({ jy: 70, aLu: 150, aRu: 150, lLt: 18, lLs: -36, lRt: -18, lRs: -36, turn: spin ? 0.85 : 0 }, 'joy'), 'sine'),
				K(t0 + 700, P({ jy: 0, hy: 18, sy: 0.84, sx: 1.14, aLu: 100, aRu: 100, lLt: 24, lLs: -34, lRt: -24, lRs: -34, turn: spin ? 1 : 0 }, 'joy'), 'in'),
				K(t0 + 800, P({ hy: 2, aLu: 140, aRu: 140, turn: spin ? 1 : 0 }, 'joy'), 'back'),
			];
			const keys = [...jump(0, false), ...jump(800, true), K(1700, P({ aLu: 20, aRu: 20 }, 'joy'), 'out')];
			return act(1700, (ms, fl) => {
				for (const t0 of [290, 1090])
					if (ms >= t0 && !fl[`c${t0}`]) {
						fl[`c${t0}`] = 1;
						parts.burst('coin', cx, GY - 30, 14, { v0: 0.2, v1: 0.65, r0: 6, r1: 9, cols: [C.gold, '#f6ead2', C.gold] });
						stars(S.x, GY - 120, 5);
					}
				for (const t0 of [700, 1500])
					if (ms >= t0 && !fl[`d${t0}`]) {
						fl[`d${t0}`] = 1;
						dust(S.x, GY + 2, 4);
						stage.shake = 3;
					}
				return sample(keys, ms);
			});
		},
		frustrated() {
			S.face = 1;
			const f = (o: Pose) => P({ lean: 8, ...o }, 'angry');
			const stomp = (t0: number, left: boolean): Key[] => [
				K(t0, f({ hy: 4, aLu: 20, aLf: 100, aRu: 20, aRf: 100, [left ? 'lLt' : 'lRt']: 60, [left ? 'lLs' : 'lRs']: -70 }), 'out'),
				K(t0 + 90, f({ hy: 14, sy: 0.9, sx: 1.08, aLu: 10, aLf: 110, aRu: 10, aRf: 110, lLt: 8, lLs: -8, lRt: 8, lRs: -8 }), 'in'),
			];
			const keys: Key[] = [
				K(0, f({ head: 18, hy: 6, lean: 12 }), 'out'),
				...stomp(110, true),
				...stomp(310, false),
				K(520, f({ hy: 4, aRu: 160, aRf: 20, aLu: 20, aLf: 100, lean: -8, head: -6 }), 'out'),
				K(700, f({ aRu: 150, aRf: 20, aLu: 20, aLf: 100, lean: -14, hy: 8, head: -8 }), 'out'),
				K(780, f({ aRu: 60, aRf: 10, lean: 16, hy: 8, head: 8 }), 'in'),
				K(1000, P({ aLu: 6, aRu: 6, aLf: 12, aRf: 12, lean: 6, hy: 12, head: 20, sy: 0.97, sx: 1.02 }, 'sad'), 'out'),
				K(1200, P({ aLu: 6, aRu: 6, aLf: 12, aRf: 12, lean: 8, hy: 11, head: 22, sy: 0.98 }, 'sad'), 'sine'),
			];
			return act(1200, (ms, fl) => {
				for (const t of [200, 400])
					if (ms >= t && !fl[`s${t}`]) {
						fl[`s${t}`] = 1;
						stompDust();
					}
				if (ms >= 700 && !fl.rel) {
					fl.rel = 1;
					S.hatOn = false;
					stage.shake = 3;
					S.hat = { x: S.hand.x, y: S.hand.y, vx: 0.55 * S.face, vy: -0.42, rot: 0, vr: 0.012 * S.face, b: 0 };
					stars(S.hand.x, S.hand.y, 3);
				}
				return sample(keys, ms);
			});
		},
		confused() {
			const base = P({ aRu: 140, aRf: 75, aLu: 8, aLf: 14, lean: -2, hy: 2 }, 'confused');
			return act(
				1600,
				(ms) => {
					S.q = { ms };
					const rub = Math.sin(ms / 55) * 14;
					const tilt = Math.sin(ms / 420) * 9;
					const e = EASE.back(clamp(ms / 220, 0, 1));
					return { ...base, aRf: 75 + rub, aRu: 140 + rub * 0.3, head: tilt + 8, hat: Math.sin(ms / 55) * 5, sy: 1 - (1 - e) * 0.08, sx: 1 + (1 - e) * 0.08 };
				},
				() => {
					S.q = null;
				},
			);
		},
		async outOfBounds() {
			// the code read past the last tree: the captain walks off the beach and into the sea
			await walk(edgeX - 40);
			S.face = 1;
			const keys: Key[] = [
				K(0, P({ lean: 10 }, 'shock')),
				K(160, P({ lean: 22, aLu: 150, aRu: 150, aLf: 40, aRf: 40, hy: 2 }, 'shock'), 'out'),
				K(320, P({ lean: -12, aLu: 120, aRu: 170, aLf: 80, aRf: 20, hy: 2 }, 'shock'), 'sine'),
				K(480, P({ lean: 26, aLu: 170, aRu: 120, aLf: 20, aRf: 80, hy: 2, hx: 6 }, 'shock'), 'sine'),
				K(700, P({ jy: -90, lean: 40, aLu: 170, aRu: 170, hx: 40, sy: 1.1, sx: 0.9 }, 'shock'), 'in'),
				K(1100, P({ jy: -90, lean: 40, hx: 40 }, 'sad'), 'lin'),
			];
			await act(1100, (ms, fl) => {
				if (ms >= 640 && !fl.sp) {
					fl.sp = 1;
					S.splash = 1;
					stage.shake = 5;
					for (let k = 0; k < 14; k++)
						parts.emit({ t: 'drop', x: S.x + 40 + rnd(-20, 20), y: GY + 30, vx: rnd(-0.2, 0.2), vy: rnd(-0.6, -0.3), r: rnd(3, 6), life: 700, g: 0.0016, c: '#9fd8ec' });
					parts.emit({ t: 'ring', x: S.x + 40, y: GY + 40, r: 22, life: 900, g: 0, c: '#d8f0ff' });
				}
				return sample(keys, ms);
			});
			S.splash = 0;
		},
		setSpeed(v) {
			stage.speed = v || 1;
		},
		destroy() {
			stage.destroy();
		},
	};

	/* ---- idle ---- */
	let blinkAt = performance.now() + 2500;
	function idlePose(now: number): Pose {
		if (reduced) return P({ lean: 1 });
		const b = Math.sin(now / 460);
		const bh = Math.sin((now - 300) / 460); // the head breathes a beat behind the torso
		if (now > blinkAt + 130) blinkAt = now + rnd(2000, 6000);
		const blink = now > blinkAt ? 0.05 : 1;
		const lk = now % 9000;
		const looking = lk > 5200 && lk < 6200;
		const sway = Math.sin(now / 1900);
		return {
			...BASE, ...EMO.neutral, fe: blink, fl: looking ? 1 : Math.sin(now / 2300),
			hy: b * 1.4, lean: -1 + b * 0.8, head: Math.sin(now / 1500) * 3 + bh * 1.2 + (looking ? 7 : 0), sy: 1 + b * 0.008, sx: 1 - b * 0.006,
			aLu: 6 + b * 2, aLf: 12 + b * 3, aRu: -4 - b * 2, aRf: 12 + b * 3, lLt: 4 + sway, lRt: -4 - sway, hat: sway * 1.5,
		};
	}

	/* ---- drawing: the pirate ---- */
	function eye(ctx: CanvasRenderingContext2D, cx: number, p: Pose, big: number) {
		const ry = 7.5 * big * Math.max(0.06, p.fe);
		const rx = 6.4 * big;
		ctx.save();
		ctx.globalAlpha = 1 - p.fj;
		ctx.beginPath();
		ctx.ellipse(cx, -30, rx, ry, 0, 0, 7);
		ctx.fillStyle = '#fffaf0';
		ctx.fill();
		ctx.save();
		ctx.clip();
		ctx.fillStyle = INK;
		ctx.beginPath();
		ctx.arc(cx + p.fl * 2.4, -30 + (p.ft > 0.5 ? 1.5 : 0), 3.6, 0, 7);
		ctx.fill();
		ctx.fillStyle = '#fff';
		ctx.beginPath();
		ctx.arc(cx + p.fl * 2.4 - 1.2, -31.5, 1.2, 0, 7);
		ctx.fill();
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
			ctx.arc(cx, -28, 5.5, Math.PI * 1.1, Math.PI * 1.9);
			ctx.stroke();
			ctx.restore();
		}
	}
	function face(ctx: CanvasRenderingContext2D, p: Pose) {
		if (p.fr > 0.01) {
			ctx.save();
			ctx.clip(G.head);
			ctx.fillStyle = `rgba(232,70,50,${p.fr * 0.45})`;
			ctx.fillRect(-40, -70, 90, 80);
			ctx.restore();
		}
		ctx.fillStyle = 'rgba(240,100,100,.3)';
		ctx.beginPath();
		ctx.arc(12, -17, 6, 0, 7);
		ctx.fill();
		eye(ctx, 7, p, 0.95);
		eye(ctx, 21, p, 1.1);
		ctx.lineWidth = 3.6;
		ctx.strokeStyle = INK;
		ctx.lineCap = 'round';
		const brow = (x: number, extra: number) => {
			const y0 = -41.5 - p.fbr * 4 - extra;
			ctx.beginPath();
			ctx.moveTo(x - 6.5, y0 - 4.5 * p.fb);
			ctx.lineTo(x + 6.5, y0 + 4.5 * p.fb);
			ctx.stroke();
		};
		brow(7, 0);
		brow(21, p.fx * 6);
		const my = -12;
		const cy = my + p.fm * 8;
		ctx.beginPath();
		ctx.moveTo(5, my);
		ctx.quadraticCurveTo(13, cy - p.fo * 2, 21, my);
		if (p.fo > 0.05) {
			ctx.quadraticCurveTo(13, cy + p.fo * 13 + 2, 5, my);
			ctx.fillStyle = '#5a1e1e';
			ctx.fill();
		}
		ctx.lineWidth = 3;
		ctx.stroke();
		if (p.ft > 0.05) {
			ctx.fillStyle = `rgba(126,200,227,${p.ft})`;
			ctx.strokeStyle = INK;
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			ctx.moveTo(24, -22);
			ctx.quadraticCurveTo(29, -15, 24, -11);
			ctx.quadraticCurveTo(19, -15, 24, -22);
			ctx.fill();
		}
	}
	function hatShape(ctx: CanvasRenderingContext2D) {
		ctx.lineWidth = 9;
		ctx.strokeStyle = INK;
		ctx.lineCap = 'round';
		ctx.stroke(G.hatTrim);
		cel(ctx, G.hatBody, C.hat, C.hatS, 5, 5);
		ctx.lineWidth = 4.5;
		ctx.strokeStyle = C.gold;
		ctx.stroke(G.hatTrim);
		ctx.fillStyle = '#fffaf0';
		ctx.beginPath();
		ctx.arc(6, -26, 6.5, 0, 7);
		ctx.fill();
		ctx.fillStyle = INK;
		ctx.fillRect(2.5, -28, 3, 3.5);
		ctx.fillRect(7.5, -28, 3, 3.5);
		ctx.fillRect(4.5, -21, 3, 3);
		ctx.fillRect(8.5, -21, 2, 3);
	}
	function parrot(ctx: CanvasRenderingContext2D, now: number, flap: number) {
		ctx.save();
		ctx.translate(-13, -45 + Math.sin(now / 260) * 0.6);
		ctx.rotate(sp.par.x * DEG);
		ctx.save();
		ctx.rotate((8 + sp.pTail.x) * DEG);
		cel(ctx, G.pTail, PARROT.wing, PARROT.wingS, 3, 3.5);
		ctx.restore();
		cel(ctx, G.pBody, PARROT.body, PARROT.bodyS, 3, 3.5);
		ctx.save();
		ctx.rotate(flap * DEG);
		cel(ctx, G.pWing, PARROT.wing, PARROT.wingS, 3, 3.5);
		ctx.restore();
		ctx.fillStyle = PARROT.body;
		ctx.beginPath();
		ctx.arc(5, -25, 8, 0, 7);
		ctx.fill();
		ctx.lineWidth = 3.5;
		ctx.strokeStyle = INK;
		ctx.stroke();
		ctx.fillStyle = '#fffaf0';
		ctx.beginPath();
		ctx.ellipse(8, -25, 4.5, 4, 0, 0, 7);
		ctx.fill();
		ctx.fillStyle = INK;
		ctx.beginPath();
		ctx.arc(9, -25.5, 1.6, 0, 7);
		ctx.fill();
		cel(ctx, G.pBeak, C.gold, C.goldS, 2, 3);
		ctx.restore();
	}
	function arm(ctx: CanvasRenderingContext2D, x: number, u: number, f: number, near: boolean, p: Pose) {
		ctx.save();
		ctx.translate(x, -44);
		ctx.rotate(-u * DEG);
		cel(ctx, G.upper, C.coat, C.coatS, 4, 4.5);
		ctx.translate(0, 23);
		ctx.rotate(-f * DEG);
		cel(ctx, G.fore, C.shirt, C.shirtS, 3, 4.5);
		ctx.translate(0, 21);
		if (near && p.sh > 0.02) {
			ctx.save();
			ctx.rotate(-p.shA * DEG);
			ctx.scale(p.sh, p.sh);
			ctx.save();
			stage.clipAbove(GY + 14);
			cel(ctx, G.shovelH, C.wood, C.woodS, 3, 4);
			cel(ctx, G.blade, C.iron, C.ironS, 4, 4.5);
			ctx.restore();
			cel(ctx, G.grip, C.woodS, null, 2, 3.5);
			ctx.restore();
		}
		cel(ctx, G.hand, C.skin, C.skinS, 3, 4.5);
		if (near) {
			const m = ctx.getTransform();
			const q = stage.base.inverse().transformPoint(new DOMPoint(m.e, m.f));
			S.hand.x = q.x;
			S.hand.y = q.y;
		}
		ctx.restore();
	}
	function leg(ctx: CanvasRenderingContext2D, x: number, t: number, s: number, pants: string, pantsS: string) {
		ctx.save();
		ctx.translate(x, 0);
		ctx.rotate(-t * DEG);
		cel(ctx, G.thigh, pants, pantsS, 4, 4.5);
		ctx.translate(0, 26);
		ctx.rotate(-s * DEG);
		cel(ctx, G.shin, pants, pantsS, 3, 4.5);
		ctx.translate(0, 24);
		ctx.rotate((t + s) * DEG * 0.85);
		cel(ctx, G.boot, C.boot, C.bootS, 3, 4.5);
		cel(ctx, G.cuff, C.goldS, null, 2, 3.5);
		ctx.restore();
	}
	function pirate(ctx: CanvasRenderingContext2D, p: Pose, now: number, x: number) {
		const a = stage.act;
		const flap = a && (a.base === 900 || a.base === 1700) ? Math.sin(now / 45) * 28 : a && a.base === 1200 ? Math.sin(now / 40) * 20 : Math.sin(now / 700) > 0.96 ? 18 : 0;
		ctx.save();
		ctx.translate(x + p.hx, GY - p.jy);
		ctx.scale(S.fs * Math.cos(p.turn * Math.PI * 2) * p.sx, p.sy);
		ctx.save();
		ctx.translate(0, -65 + p.hy);
		ctx.save();
		ctx.translate(-8, 0);
		ctx.rotate((8 + sp.tail.x) * DEG);
		ctx.translate(8, 0);
		cel(ctx, G.tail, C.coatS, '#6a1f1c', 3, 4.5);
		ctx.restore();
		leg(ctx, -7, p.lLt, p.lLs, C.pantsS, '#1a2740');
		ctx.save();
		ctx.rotate(p.lean * DEG);
		arm(ctx, -10, p.aLu, p.aLf, false, p);
		cel(ctx, G.torso, C.coat, C.coatS, 5, 5);
		cel(ctx, G.shirt, C.shirt, C.shirtS, 3, 3.5);
		ctx.fillStyle = C.gold;
		for (const by of [-34, -26]) {
			ctx.beginPath();
			ctx.arc(10.5 - (by + 34) * 0.2, by, 1.8, 0, 7);
			ctx.fill();
		}
		cel(ctx, G.belt, C.boot, C.bootS, 2, 4);
		cel(ctx, G.buckle, C.gold, C.goldS, 2, 3.5);
		parrot(ctx, now, flap);
		ctx.restore();
		leg(ctx, 7, p.lRt, p.lRs, C.pants, C.pantsS);
		ctx.save();
		ctx.rotate(p.lean * DEG);
		ctx.translate(2, -45);
		ctx.rotate(p.head * DEG);
		cel(ctx, G.knot, C.band, C.bandS, 3, 4);
		cel(ctx, G.head, C.skin, C.skinS, 5, 5);
		cel(ctx, G.chin, C.beard, C.beardS, 3, 4);
		cel(ctx, G.nose, C.skin, C.skinS, 3, 4);
		ctx.fillStyle = C.gold;
		ctx.beginPath();
		ctx.arc(-21, -17, 3, 0, 7);
		ctx.fill();
		ctx.lineWidth = 2;
		ctx.strokeStyle = INK;
		ctx.stroke();
		face(ctx, p);
		cel(ctx, G.band, C.band, C.bandS, 3, 4.5);
		if (S.hatOn) {
			ctx.save();
			ctx.translate(0, -43);
			ctx.rotate((p.hat + sp.hat.x) * DEG);
			ctx.save();
			ctx.rotate(sp.plume.x * DEG);
			cel(ctx, G.plume, '#f6ead2', '#d4bd96', 3, 4);
			ctx.restore();
			hatShape(ctx);
			ctx.restore();
		}
		ctx.restore();
		arm(ctx, 10, p.aRu, p.aRf, true, p);
		ctx.restore();
		ctx.restore();
	}

	/* ---- drawing: the world ---- */
	function frond(ctx: CanvasRenderingContext2D, cx: number, cy: number, ang: number, len: number, sw: number) {
		const a = ang * DEG;
		const dx = Math.cos(a);
		const dy = Math.sin(a);
		const nx = -dy;
		const ny = dx;
		const th = len * 0.17;
		const tipx = cx + dx * len;
		const tipy = cy + dy * len + len * 0.38 + sw;
		const cpx = cx + dx * len * 0.55;
		const cpy = cy + dy * len * 0.55 - len * 0.22;
		const p = new Path2D();
		p.moveTo(cx, cy);
		p.quadraticCurveTo(cpx + nx * th, cpy + ny * th, tipx, tipy);
		p.quadraticCurveTo(cpx - nx * th, cpy - ny * th, cx, cy);
		cel(ctx, p, C.leaf, C.leafS, 3, 3.5);
	}
	function tree(ctx: CanvasRenderingContext2D, i: number, now: number) {
		const x = treeX(i);
		const n = Number(slots[i]);
		S.treeShake[i] *= 0.94;
		S.plate[i] *= 0.9;
		const sw = (reduced ? 0 : Math.sin(now / 900 + i) * 3) + S.treeShake[i] * Math.sin(now / 35) * 4;
		ctx.fillStyle = 'rgba(60,24,30,.28)';
		ctx.beginPath();
		ctx.ellipse(x + 6, GY + 6, 44, 9, 0, 0, 7);
		ctx.fill();
		const tr = new Path2D();
		const cxr = x + 14 + sw * 0.8;
		const cyr = GY - 190;
		tr.moveTo(x - 9, GY);
		tr.bezierCurveTo(x - 4, GY - 90, x + 8, GY - 140, cxr - 7, cyr);
		tr.lineTo(cxr + 7, cyr);
		tr.bezierCurveTo(x + 22, GY - 140, x + 14, GY - 90, x + 11, GY);
		tr.closePath();
		cel(ctx, tr, C.trunk, C.trunkS, 5, 5);
		ctx.save();
		ctx.clip(tr);
		ctx.strokeStyle = C.trunkS;
		ctx.lineWidth = 3;
		for (let r = 0; r < 9; r++) {
			const y = GY - 20 - r * 19;
			ctx.beginPath();
			ctx.moveTo(x - 20, y);
			ctx.quadraticCurveTo(x + 4, y + 7, x + 30, y - 2);
			ctx.stroke();
		}
		ctx.restore();
		// one frond per branch: the count is drawn, not only written
		const count = Number.isFinite(n) ? clamp(Math.round(n), 1, 14) : 5;
		for (let f = 0; f < count; f++) {
			const u = count === 1 ? 0.5 : f / (count - 1);
			const ang = -176 + u * 172 + Math.sin(now / 700 + f + i) * (reduced ? 0 : 2) + S.treeShake[i] * Math.sin(now / 30 + f) * 5;
			frond(ctx, cxr, cyr, ang, 66 + (f % 2) * 8, sw * 0.4);
		}
		ctx.fillStyle = C.boot;
		for (const [dx, dy] of [[-6, 8], [6, 9], [0, 14]]) {
			ctx.beginPath();
			ctx.arc(cxr + dx, cyr + dy, 7, 0, 7);
			ctx.fill();
			ctx.lineWidth = 3.5;
			ctx.strokeStyle = INK;
			ctx.stroke();
		}
		plate(ctx, x, String(slots[i]), String(i), S.plate[i], i);
	}
	function plate(ctx: CanvasRenderingContext2D, x: number, value: string, index: string, pop: number, i: number) {
		ctx.save();
		ctx.translate(x, GY + 40 - pop * 8);
		ctx.rotate((i % 2 ? 1 : -1) * 2 * DEG);
		ctx.scale(1 + pop * 0.15, 1 + pop * 0.15);
		const w = Math.max(44, value.length * 15 + 18);
		const pl = new Path2D();
		pl.roundRect(-w / 2, -17, w, 34, 9);
		cel(ctx, pl, C.wood, C.woodS, 3, 4.5);
		text(ctx, value, 0, 1, 25, C.shirt, INK, 5);
		ctx.restore();
		text(ctx, index, x, GY + 72, 15, 'rgba(255,240,215,.7)', null);
	}
	function background(ctx: CanvasRenderingContext2D, now: number) {
		const t = reduced ? 0 : now / 1000;
		const hz = 255;
		const cam = stage.cam;
		const L = cam - 200;
		const R = cam + stage.viewWidth + 200;
		const sky = ctx.createLinearGradient(0, 0, 0, hz);
		sky.addColorStop(0, '#2b2150');
		sky.addColorStop(0.35, '#6a3a78');
		sky.addColorStop(0.62, '#d4586a');
		sky.addColorStop(0.85, '#f4955e');
		sky.addColorStop(1, '#ffc874');
		ctx.fillStyle = sky;
		ctx.fillRect(L, -600, R - L, hz + 602);
		// far layers move slower than the island (parallax)
		ctx.save();
		ctx.translate(cam * 0.85, 0);
		ctx.fillStyle = '#fff6e0';
		for (const [sx, sy, sr] of [[60, 150, 1.6], [180, 196, 1.2], [320, 140, 1.8], [470, 186, 1.2], [610, 150, 1.5], [860, 176, 1.3], [990, 136, 1.8], [1120, 196, 1.5], [1260, 160, 1.4]]) {
			ctx.globalAlpha = 0.55 + Math.sin(t * 2 + sx) * 0.3;
			ctx.beginPath();
			ctx.arc(sx, sy, sr, 0, 7);
			ctx.fill();
		}
		ctx.globalAlpha = 1;
		const sunX = 720;
		const sg = ctx.createRadialGradient(sunX, hz, 10, sunX, hz, 320);
		sg.addColorStop(0, 'rgba(255,214,130,.85)');
		sg.addColorStop(1, 'rgba(255,160,90,0)');
		ctx.fillStyle = sg;
		ctx.fillRect(sunX - 400, -600, 800, hz + 600);
		ctx.save();
		ctx.beginPath();
		ctx.rect(-4000, -4000, 12000, 4000 + hz);
		ctx.clip();
		ctx.beginPath();
		ctx.arc(sunX, hz + 8, 62, 0, 7);
		ctx.fillStyle = '#ffd98a';
		ctx.fill();
		ctx.lineWidth = 5;
		ctx.strokeStyle = '#ff9f5a';
		ctx.stroke();
		ctx.restore();
		for (const [cx0, cy0, sc, v] of [[120, 196, 0.9, 6], [560, 222, 1.2, 4], [900, 172, 0.7, 8], [1300, 206, 1, 5]]) {
			const cx = ((cx0 + t * v + 300) % 1800) - 300;
			ctx.fillStyle = '#f09a82';
			ctx.beginPath();
			ctx.ellipse(cx, cy0, 70 * sc, 16 * sc, 0, 0, 7);
			ctx.ellipse(cx - 30 * sc, cy0 - 12 * sc, 34 * sc, 16 * sc, 0, 0, 7);
			ctx.ellipse(cx + 22 * sc, cy0 - 16 * sc, 40 * sc, 18 * sc, 0, 0, 7);
			ctx.fill();
		}
		// a pair of gulls crossing slowly, wings on a 4-step flap
		ctx.strokeStyle = '#3a2242';
		ctx.lineWidth = 2.5;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		for (const [bx0, by, v, ph] of [[0, 178, 14, 0], [60, 196, 12, 1.3]]) {
			const bx = ((bx0 + t * v) % 1700) - 200;
			const w = [6, 2, -3, 2][Math.floor(t * 6 + ph * 3) % 4];
			ctx.beginPath();
			ctx.moveTo(bx - 9, by - w);
			ctx.quadraticCurveTo(bx - 4, by - 3, bx, by);
			ctx.quadraticCurveTo(bx + 4, by - 3, bx + 9, by - w);
			ctx.stroke();
		}
		ctx.restore();
		// sea bands
		const cols = ['#a8506e', '#8a4676', '#6e407a', '#573a78', '#443470', '#352c62', '#2b2556'];
		for (let b = 0; b < cols.length; b++) {
			const y0 = hz + b * 30;
			const wave = (x: number) => y0 + Math.sin(x / (60 + b * 12) + t * (1 + b * 0.2) + b * 2) * (2 + b * 1.2);
			ctx.fillStyle = cols[b];
			ctx.beginPath();
			ctx.moveTo(L, H + 40);
			for (let x = L; x <= R; x += 20) ctx.lineTo(x, wave(x));
			ctx.lineTo(R, H + 40);
			ctx.closePath();
			ctx.fill();
			ctx.lineWidth = 3 + b * 0.6;
			ctx.strokeStyle = b < 3 ? 'rgba(255,214,150,.55)' : 'rgba(210,170,230,.35)';
			ctx.lineCap = 'round';
			ctx.beginPath();
			for (let x = L; x <= R; x += 20) (x === L ? ctx.moveTo : ctx.lineTo).call(ctx, x, wave(x));
			ctx.stroke();
		}
		ctx.save();
		ctx.translate(cam * 0.85, 0);
		for (let r = 0; r < 7; r++) {
			const w = 120 - r * 14;
			const wob = Math.sin(t * 2 + r) * 6;
			ctx.fillStyle = r % 2 ? '#ffd27a' : '#ffb45e';
			ctx.beginPath();
			ctx.roundRect(720 - w / 2 + wob, hz + 8 + r * 15, w, 5, 3);
			ctx.fill();
		}
		ctx.restore();
		// sparkles blinking on the water
		if (!reduced)
			for (let k = 0; k < 9; k++) {
				const seed = k * 97.3;
				const cyc = (t * 1000 + seed * 13) % 2600;
				if (cyc > 420) continue;
				const a = Math.sin((cyc / 420) * Math.PI);
				const sx2 = L + ((seed * 7.7 + Math.floor((t * 1000 + seed * 13) / 2600) * 211) % (R - L));
				const sy2 = hz + 14 + ((seed * 3.1) % 110);
				ctx.fillStyle = `rgba(255,236,190,${a * 0.9})`;
				ctx.beginPath();
				ctx.moveTo(sx2, sy2 - 6 * a);
				ctx.lineTo(sx2 + 1.4, sy2);
				ctx.lineTo(sx2, sy2 + 6 * a);
				ctx.lineTo(sx2 - 1.4, sy2);
				ctx.closePath();
				ctx.moveTo(sx2 - 6 * a, sy2);
				ctx.lineTo(sx2, sy2 + 1.4);
				ctx.lineTo(sx2 + 6 * a, sy2);
				ctx.lineTo(sx2, sy2 - 1.4);
				ctx.fill();
			}
		// the island: from the left edge of the world to the beach after the last tree
		const e = edgeX;
		const isl = new Path2D();
		isl.moveTo(-2000, 470);
		isl.bezierCurveTo(-900, 452, -400, 444, -300, 440);
		isl.bezierCurveTo(60, 392, 300, 402, 520, 396);
		isl.bezierCurveTo(e * 0.7, 390, e - 140, 392, e - 40, 420);
		isl.bezierCurveTo(e, 436, e + 30, 470, e + 10, 520);
		isl.bezierCurveTo(e - 10, 560, e - 40, 600, e - 80, 640);
		isl.lineTo(-2000, 640);
		isl.closePath();
		ctx.fillStyle = C.sand;
		ctx.fill(isl);
		ctx.save();
		ctx.clip(isl);
		ctx.fillStyle = C.sandS;
		ctx.beginPath();
		ctx.moveTo(-2000, 520);
		ctx.bezierCurveTo(100, 500, 400, 540, 700, 516);
		ctx.bezierCurveTo(900, 504, 1100, 520, e + 300, 512);
		ctx.lineTo(e + 300, 700);
		ctx.lineTo(-2000, 700);
		ctx.fill();
		ctx.fillStyle = C.sandD;
		ctx.beginPath();
		ctx.moveTo(-2000, 545);
		ctx.bezierCurveTo(200, 540, 500, 570, 800, 552);
		ctx.lineTo(e + 300, 548);
		ctx.lineTo(e + 300, 700);
		ctx.lineTo(-2000, 700);
		ctx.fill();
		ctx.restore();
		ctx.lineWidth = 6;
		ctx.strokeStyle = INK;
		ctx.stroke(isl);
		ctx.lineWidth = 7;
		ctx.strokeStyle = 'rgba(255,244,220,.9)';
		ctx.setLineDash([60, 28]);
		ctx.lineDashOffset = -t * 14;
		const foam = new Path2D();
		foam.moveTo(-2000, 462);
		foam.bezierCurveTo(-900, 444, -400, 436, -300, 432);
		foam.bezierCurveTo(60, 384, 300, 394, 520, 388);
		foam.bezierCurveTo(e * 0.7, 382, e - 140, 384, e - 40, 412);
		foam.bezierCurveTo(e + 8, 430, e + 40, 470, e + 20, 520);
		ctx.stroke(foam);
		ctx.setLineDash([]);
		ctx.fillStyle = '#b07a48';
		for (let rx = 40; rx < e; rx += 137) {
			ctx.beginPath();
			ctx.ellipse(rx + ((rx * 7) % 40), 505 + ((rx * 3) % 30), 9, 3, 0, 0, 7);
			ctx.fill();
		}
	}
	function moreSign(ctx: CanvasRenderingContext2D) {
		if (more <= 0) return;
		const x = lastX + 110;
		ctx.save();
		ctx.translate(x, GY);
		cel(ctx, new Path2D('M-4 0 L4 0 L4 -70 L-4 -70 Z'), C.wood, C.woodS, 2, 4);
		const sign = new Path2D('M-46 -100 L36 -100 L52 -82 L36 -64 L-46 -64 Z');
		cel(ctx, sign, '#d9a466', C.woodS, 3, 4.5);
		text(ctx, `+${more}`, -6, -82, 24, C.shirt, INK, 5);
		ctx.restore();
	}
	function chestDraw(ctx: CanvasRenderingContext2D, c: { i: number; p: number; lid: number }) {
		const x = spotX(c.i);
		const rise = (1 - EASE.back(c.p)) * 46;
		ctx.save();
		ctx.translate(x, GY + 10 + rise);
		ctx.save();
		stage.clipAbove(GY + 22);
		if (c.lid > 0) {
			const gl = ctx.createRadialGradient(0, -30, 4, 0, -30, 90);
			gl.addColorStop(0, `rgba(255,230,140,${0.9 * c.lid})`);
			gl.addColorStop(1, 'rgba(255,190,80,0)');
			ctx.globalCompositeOperation = 'lighter';
			ctx.fillStyle = gl;
			ctx.fillRect(-100, -130, 200, 200);
			ctx.globalCompositeOperation = 'source-over';
		}
		cel(ctx, G.chestBody, C.wood, C.woodS, 5, 5);
		cel(ctx, G.band2, C.gold, C.goldS, 2, 4);
		if (c.lid > 0) {
			ctx.fillStyle = C.gold;
			for (let q = 0; q < 6; q++) {
				ctx.beginPath();
				ctx.arc(-20 + q * 8, -26 - (q % 2) * 4, 7, 0, 7);
				ctx.fill();
				ctx.lineWidth = 2.5;
				ctx.strokeStyle = INK;
				ctx.stroke();
			}
		}
		ctx.save();
		ctx.translate(-28, -24);
		ctx.rotate(-EASE.back(c.lid) * 110 * DEG);
		ctx.translate(28, 0);
		cel(ctx, G.chestLid, C.woodS, '#4e2f1c', 5, 5);
		ctx.fillStyle = C.gold;
		ctx.fillRect(-28, -14, 56, 5);
		ctx.restore();
		cel(ctx, G.lock, C.gold, C.goldS, 2, 4);
		ctx.restore();
		ctx.restore();
	}
	function question(ctx: CanvasRenderingContext2D, now: number) {
		if (!S.q) return;
		for (let q = 0; q < 3; q++) {
			const t = S.q.ms - q * 260;
			if (t <= 0) continue;
			const e = EASE.back(clamp(t / 260, 0, 1));
			ctx.save();
			ctx.translate(S.x + [-34, 10, 52][q], GY - 205 - [0, 16, 2][q] + Math.sin(now / 220 + q * 2) * 5);
			ctx.rotate([-12, 6, 14][q] * DEG);
			ctx.scale(e, e);
			text(ctx, '?', 0, 0, [46, 58, 42][q], C.gold, INK, 9);
			ctx.restore();
		}
	}

	function draw(ctx: CanvasRenderingContext2D, now: number, dt: number) {
		const sampled = stage.sampleAct(now) ?? idlePose(now);
		const w = blendDur > 0 ? clamp((now - blendT0) / blendDur, 0, 1) : 1;
		const p = w < 1 ? mix(blendFrom, sampled, EASE.out(w)) : sampled;
		cur = p;
		S.fs += clamp(S.face - S.fs, -dt / 90, dt / 90);
		if (!stage.act && !reduced) {
			const lk = now % 9000;
			S.face = lk > 5400 && lk < 6000 && S.x === HOME ? -1 : 1;
		}
		S.vx = (S.x - S.px) / Math.max(1, dt);
		S.px = S.x;
		S.vy = (p.jy - S.jyPrev) / Math.max(1, dt);
		S.jyPrev = p.jy;
		const lv = S.vx * S.face;
		spring(sp.hat, -lv * 38 + clamp(S.vy, -1, 1) * 14, dt);
		spring(sp.plume, -lv * 50 - S.vy * 20, dt, 0.022, 0.28);
		spring(sp.tail, -lv * 55 + S.vy * 18, dt, 0.026, 0.3);
		spring(sp.par, -lv * 20, dt, 0.035, 0.35);
		spring(sp.pTail, S.vy * 25 - lv * 30, dt, 0.03, 0.3);
		parts.step(dt);
		const h = S.hat;
		if (h && !h.landed) {
			h.vy += 0.0011 * dt;
			h.x += h.vx * dt;
			h.y += h.vy * dt;
			h.rot += h.vr * dt;
			if (h.y > GY + 6) {
				h.y = GY + 6;
				if (h.b < 2) {
					h.vy *= -0.38;
					h.vx *= 0.5;
					h.vr *= 0.5;
					h.b++;
					dust(h.x, GY + 8, 2);
				} else h.landed = true;
			}
		}
		stage.follow(S.x + p.hx);

		background(ctx, now);
		for (let i = 0; i < N; i++) tree(ctx, i, now);
		moreSign(ctx);
		S.steps = S.steps.filter((f) => now - f.t < 4000);
		for (const f of S.steps) {
			ctx.fillStyle = `rgba(150,90,70,${0.35 * (1 - (now - f.t) / 4000)})`;
			ctx.beginPath();
			ctx.ellipse(f.x, GY + 12 + (f.x % 2) * 3, 7, 2.6, 0, 0, 7);
			ctx.fill();
		}
		for (const i of S.holes) {
			const mound = new Path2D();
			mound.ellipse(spotX(i) + 46, GY + 4, 20, 9, 0, Math.PI, 0);
			mound.closePath();
			cel(ctx, mound, '#b07a48', '#7a4b2c', 2, 3.5);
			ctx.fillStyle = C.sandD;
			ctx.beginPath();
			ctx.ellipse(spotX(i), GY + 6, 36, 11, 0, 0, 7);
			ctx.fill();
			ctx.lineWidth = 4;
			ctx.strokeStyle = INK;
			ctx.stroke();
			ctx.fillStyle = '#3e2417';
			ctx.beginPath();
			ctx.ellipse(spotX(i), GY + 8, 28, 7.5, 0, 0, 7);
			ctx.fill();
		}
		if (S.chest) chestDraw(ctx, S.chest);
		const air = Math.max(0, p.jy);
		if (p.jy > -20) {
			ctx.fillStyle = 'rgba(60,24,30,.3)';
			ctx.beginPath();
			ctx.ellipse(S.x, GY + 6, 34 * (1 - air / 220) * p.sx, 8 * (1 - air / 260), 0, 0, 7);
			ctx.fill();
		}
		const speed = Math.abs(S.vx);
		if (!reduced && speed > 0.26) {
			ctx.strokeStyle = 'rgba(255,240,210,.5)';
			ctx.lineCap = 'round';
			ctx.lineWidth = 3;
			for (const [yy, l] of [[GY - 30, 1], [GY - 62, 0.7], [GY - 94, 0.9]]) {
				const x1 = S.x - Math.sign(S.vx) * 34;
				ctx.beginPath();
				ctx.moveTo(x1, yy);
				ctx.lineTo(x1 - Math.sign(S.vx) * speed * 90 * l, yy);
				ctx.stroke();
			}
		}
		if (S.splash) {
			ctx.save();
			stage.clipAbove(GY + 34);
			pirate(ctx, p, now, S.x);
			ctx.restore();
		} else pirate(ctx, p, now, S.x);
		if (h) {
			ctx.save();
			ctx.translate(h.x, h.y);
			ctx.rotate(h.rot);
			ctx.translate(-5, 20);
			hatShape(ctx);
			ctx.restore();
		}
		parts.draw(ctx, INK, C);
		question(ctx, now);
		stage.screen((c, cw, ch) => {
			const vg = c.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.45, cw / 2, ch / 2, Math.max(cw, ch) * 0.8);
			vg.addColorStop(0, 'rgba(20,8,18,0)');
			vg.addColorStop(1, 'rgba(20,8,18,.4)');
			c.fillStyle = vg;
			c.fillRect(0, 0, cw, ch);
		});
	}

	return scene;
}
