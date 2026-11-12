import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { prefersReducedMotion } from '../../gfx/gpu';
import { createState, type FormName, type StageHandle } from '../../gfx/stage/stage';

const COUNT = 64;

/** 64 sorted heights: a gentle ramp with a little irregularity, like real data. */
function sortedHeights(): number[] {
	let seed = 7;
	const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
	const raw = Array.from({ length: COUNT }, () => 0.2 + rand() * 0.8).sort((a, b) => a - b);
	return raw.map((h, i) => 0.08 + 0.92 * (0.55 * h + 0.45 * (i / (COUNT - 1))));
}

interface SearchStep {
	low: number;
	high: number;
	mid: number;
	found: boolean;
}

/** The real binary search over the field, one entry per look. */
function searchSteps(target: number): SearchStep[] {
	const steps: SearchStep[] = [{ low: 0, high: COUNT - 1, mid: -1, found: false }];
	let low = 0;
	let high = COUNT - 1;
	while (low <= high) {
		const mid = Math.floor((low + high) / 2);
		if (mid === target) {
			steps.push({ low, high, mid, found: true });
			break;
		}
		steps.push({ low, high, mid, found: false });
		if (mid < target) low = mid + 1;
		else high = mid - 1;
	}
	return steps;
}

/** The rule that explains the move from step i to step i + 1 (drop left, drop right, or done). */
function nextRule(steps: SearchStep[], index: number): number {
	const step = steps[index];
	if (step.found) return 3;
	const next = steps[index + 1];
	if (!next) return 3;
	return next.low > step.low ? 1 : 2;
}

/** Smooth scrolling on GSAP's ticker, so ScrollTrigger and the scroll share a frame. */
function smoothScroll(onVelocity: (v: number) => void): Lenis | null {
	if (prefersReducedMotion()) return null;
	const lenis = new Lenis({ lerp: 0.1, autoRaf: false, anchors: { offset: -72 } });
	lenis.on('scroll', (l: Lenis) => {
		onVelocity(l.velocity);
		ScrollTrigger.update();
	});
	gsap.ticker.add((time) => lenis.raf(time * 1000));
	gsap.ticker.lagSmoothing(0);
	return lenis;
}

export function startLanding() {
	gsap.registerPlugin(ScrollTrigger);
	const reduced = prefersReducedMotion();
	const heights = sortedHeights();
	const canvas = document.getElementById('field') as HTMLCanvasElement | null;
	const html = document.documentElement;
	const status = {
		low: document.querySelector<HTMLElement>('[data-field="low"]'),
		mid: document.querySelector<HTMLElement>('[data-field="mid"]'),
		high: document.querySelector<HTMLElement>('[data-field="high"]'),
		remaining: document.querySelector<HTMLElement>('[data-field="remaining"]'),
	};

	const S = createState();
	S.running = !reduced;
	S.calm = reduced;
	const anchor = (name: string) => document.querySelector(`[data-stage="${name}"]`);
	S.anchor = anchor('hero');
	let stage: StageHandle | null = null;
	const wake = () => stage?.wake();

	let mode: 'hero' | 'chapter' = 'hero';
	const paused = reduced;

	// ---- the array: a search over the 64 columns
	const show = (step: SearchStep) => {
		heights.forEach((height, i) => {
			const out = i < step.low || i > step.high;
			S.cells.set([height, out ? 1 : 0, i === step.mid && !step.found ? 1 : 0, i === step.mid && step.found ? 1 : 0], i * 4);
		});
		S.span = { low: step.low, high: step.high, mid: step.mid, found: step.found ? 1 : 0 };
		if (status.low) status.low.textContent = String(step.low);
		if (status.high) status.high.textContent = String(step.high);
		if (status.mid) status.mid.textContent = step.mid < 0 ? '-' : String(step.mid);
		if (status.remaining) status.remaining.textContent = String(Math.max(0, step.high - step.low + 1));
		wake();
	};

	const heroTargets = [41, 12, 57, 26, 3, 49];
	let heroRound = 0;
	let heroSteps = searchSteps(heroTargets[0]);
	let heroIndex = 0;
	const heroTick = () => {
		heroIndex++;
		if (heroIndex >= heroSteps.length + 1) {
			heroRound = (heroRound + 1) % heroTargets.length;
			heroSteps = searchSteps(heroTargets[heroRound]);
			heroIndex = 0;
		}
		show(heroSteps[Math.min(heroIndex, heroSteps.length - 1)]);
	};

	// ---- the tree: the same decisions, drawn as the path from the root to a leaf
	const treeTargets = [45, 9, 30, 58, 21, 2, 37];
	let treeRound = 0;
	S.tree.target = treeTargets[0];
	const treeTick = () => {
		if (S.tree.depth < 6) {
			S.tree.depth++;
			S.tree.found = S.tree.depth >= 6 ? 1 : 0;
		} else if (S.tree.found < 3) {
			S.tree.found++; // hold the found leaf for a few beats
		} else {
			treeRound = (treeRound + 1) % treeTargets.length;
			S.tree.target = treeTargets[treeRound];
			S.tree.depth = 0;
			S.tree.found = 0;
		}
		wake();
	};

	// ---- the invariant: low and high close in on the target, which never leaves the interval
	const boundTargets = [39, 18, 51, 7, 44];
	let boundRound = 0;
	let boundSteps = searchSteps(boundTargets[0]);
	let boundIndex = 0;
	const setBounds = () => {
		const step = boundSteps[Math.min(boundIndex, boundSteps.length - 1)];
		S.bounds = [step.low / COUNT, (step.high + 1) / COUNT, (boundTargets[boundRound] + 0.5) / COUNT];
	};
	setBounds();
	const boundsTick = () => {
		boundIndex++;
		if (boundIndex > boundSteps.length + 1) {
			boundRound = (boundRound + 1) % boundTargets.length;
			boundSteps = searchSteps(boundTargets[boundRound]);
			boundIndex = 0;
		}
		setBounds();
		wake();
	};

	// one clock for every loop; it only moves the scene on screen
	window.setInterval(() => {
		if (paused) return;
		if (S.form === 'array' && mode === 'hero') heroTick();
		if (S.form === 'tree') treeTick();
		if (S.form === 'bounds') boundsTick();
	}, 1100);


	// ---- the stage (WebGPU only; the page is complete without it)
	show(heroSteps[0]);
	if (canvas) {
		import('../../gfx/stage/stage')
			.then(({ mountStage }) => mountStage(canvas, S))
			.then((handle) => {
				if (!handle) throw new Error('no gpu');
				stage = handle;
				html.classList.add('gfx');
			})
			.catch(() => {
				html.classList.add('no-gfx');
				canvas.remove();
			});
	}

	window.addEventListener(
		'pointermove',
		(e: PointerEvent) => {
			S.pointer = [e.clientX, e.clientY];
			if (!S.running) wake();
		},
		{ passive: true },
	);

	smoothScroll((v) => {
		S.velocity = v;
	});

	document.documentElement.addEventListener('pointerleave', () => {
		S.pointer = null;
	});

	// ---- the chapter: the search plays once, a look every 0.6s, when the section comes into view
	const chapterSteps = searchSteps(46);
	const chapterItems = gsap.utils.toArray<HTMLElement>('.chapter__steps li');
	let chapterTimer = 0;
	const chapterAt = (index: number) => {
		show(chapterSteps[index]);
		const rule = index === 0 ? -1 : chapterSteps[index].found ? 3 : 0;
		chapterItems.forEach((li, i) =>
			li.classList.toggle('is-on', i === rule || (index > 0 && i === nextRule(chapterSteps, index))),
		);
	};
	const playChapter = () => {
		mode = 'chapter';
		window.clearInterval(chapterTimer);
		if (reduced) return chapterAt(chapterSteps.length - 1);
		let index = 0;
		chapterAt(0);
		chapterTimer = window.setInterval(() => {
			index++;
			if (index >= chapterSteps.length) return window.clearInterval(chapterTimer);
			chapterAt(index);
		}, 600);
	};
	const leaveChapter = () => {
		mode = 'hero';
		window.clearInterval(chapterTimer);
	};
	ScrollTrigger.create({
		trigger: '.chapter',
		start: 'top 45%',
		end: 'bottom 30%',
		onEnter: playChapter,
		onEnterBack: playChapter,
		onLeave: leaveChapter,
		onLeaveBack: () => {
			leaveChapter();
			show(heroSteps[Math.min(heroIndex, heroSteps.length - 1)]);
		},
	});

	// ---- each section has its scene; the reading sections dim the light a little
	const scenes: [string, FormName, string, number][] = [
		['.hero', 'array', 'hero', 1],
		['.chapter', 'array', 'chapter', 1],
		['.try', 'tree', 'try', 1],
		['.method', 'cycle', 'method', 1],
		['.invariant', 'bounds', 'invariant', 1],
		['.path', 'curves', 'path', 0.85],
		['.footer', 'array', 'footer', 1],
	];
	for (const [selector, name, place, gain] of scenes) {
		ScrollTrigger.create({
			trigger: selector,
			start: 'top 55%',
			end: 'bottom 55%',
			onToggle: (self) => {
				if (!self.isActive) return;
				S.form = name;
				S.anchor = anchor(place);
				S.gain = gain;
				wake();
			},
		});
	}

	// the study loop follows the reader down the method list
	const methodItems = gsap.utils.toArray<HTMLElement>('.method__steps li');
	ScrollTrigger.create({
		trigger: '.method__steps',
		start: 'top 70%',
		end: 'bottom 45%',
		onUpdate: (self) => {
			const step = Math.min(4, Math.floor(self.progress * 5));
			if (S.cycle !== step) {
				S.cycle = step;
				methodItems.forEach((li, i) => li.classList.toggle('is-on', i === step));
				wake();
			}
		},
	});

	// the cost curves draw themselves as the path comes in
	ScrollTrigger.create({
		trigger: '.path',
		start: 'top 85%',
		end: 'bottom 70%',
		onUpdate: (self) => {
			S.curves = self.progress;
			wake();
		},
	});

	// the hero settles in once
	if (!reduced) {
		gsap.from('.hero__line, .hero__lede, .hero__actions', {
			y: 24,
			opacity: 0,
			duration: 0.7,
			ease: 'power3.out',
			stagger: 0.08,
			clearProps: 'transform,opacity',
		});
	}
}
