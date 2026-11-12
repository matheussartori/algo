import type { Scene, SceneSetup } from '../engine';

/**
 * The plain scene: the array as a row of cells and one pointer that goes where the code
 * looked. It is the fallback for every world (no WebGL, reduced motion, or a world whose art
 * is not built yet) and it carries the same information as the illustrated scenes.
 */
export function createStripScene(host: HTMLElement, setup: SceneSetup): Scene {
	const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
	let speed = 1;
	const ms = (base: number) => (reduced ? Math.min(base, 80) : base / speed);
	const wait = (base: number) => new Promise<void>((r) => setTimeout(r, ms(base)));

	host.replaceChildren();
	const root = el('div', 'algo-strip');
	const row = el('ol', 'algo-strip__row');
	const cells = setup.slots.map((value, i) => {
		const li = el('li', 'algo-strip__cell');
		li.append(el('span', 'algo-strip__value', String(value)), el('span', 'algo-strip__index', String(i)));
		row.append(li);
		return li;
	});
	if (setup.total > setup.slots.length) {
		const more = el('li', 'algo-strip__more', `+${setup.total - setup.slots.length}`);
		row.append(more);
	}
	const pointer = el('div', 'algo-strip__pointer');
	const pin = el('span', 'algo-strip__face');
	const face = el('span', 'algo-strip__glyph', 'i');
	pin.append(face);
	pointer.append(pin);
	row.prepend(el('li', 'algo-strip__home'));
	root.append(pointer, row);
	host.append(root);

	let x = 0;
	const xOf = (i: number) => {
		const target = i < 0 ? (row.firstElementChild as HTMLElement) : (cells[i] ?? (row.lastElementChild as HTMLElement));
		const extra = i >= cells.length ? target.offsetWidth : 0;
		return target.offsetLeft + target.offsetWidth / 2 - pointer.offsetWidth / 2 + extra - row.scrollLeft;
	};
	const place = (to: number) => {
		x = to;
		pointer.style.transform = `translateX(${x}px)`;
	};
	requestAnimationFrame(() => place(xOf(-1)));

	const animate = (node: HTMLElement, frames: Keyframe[], base: number) =>
		node.animate(frames, { duration: ms(base), easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }).finished.then(() => undefined);

	return {
		idle() {
			pointer.dataset.mood = pointer.dataset.mood === 'happy' ? 'happy' : '';
		},
		async moveTo(i) {
			const cell = cells[i];
			cell?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduced ? 'auto' : 'smooth' });
			const from = x;
			const to = xOf(i);
			place(to);
			if (from !== to) await animate(pointer, [{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }], 260);
		},
		async inspect(i, isTarget) {
			const cell = cells[i];
			if (!cell) return;
			cell.dataset.state = 'active';
			await animate(pointer, [{ transform: `translateX(${x}px)` }, { transform: `translateX(${x}px) translateY(6px)` }, { transform: `translateX(${x}px)` }], 300);
			cell.dataset.state = isTarget ? 'match' : 'seen';
		},
		async found(i) {
			cells[i].dataset.state = 'found';
			pointer.dataset.mood = 'happy';
			face.textContent = '✓';
			await wait(500);
		},
		async nothing(i) {
			cells[i].dataset.state = 'wrong';
			await animate(cells[i], [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], 320);
		},
		async outOfBounds() {
			pointer.dataset.mood = 'sad';
			face.textContent = '!';
			const to = xOf(cells.length);
			await animate(pointer, [{ transform: `translateX(${x}px)` }, { transform: `translateX(${to}px)` }], 300);
			place(to);
		},
		async celebrate() {
			await animate(pointer, [{ transform: `translateX(${x}px)` }, { transform: `translateX(${x}px) translateY(-10px)` }, { transform: `translateX(${x}px)` }], 420);
		},
		async frustrated() {
			pointer.dataset.mood = 'sad';
			face.textContent = '✗';
			await animate(pointer, [{ transform: `translateX(${x}px)` }, { transform: `translateX(${x - 5}px)` }, { transform: `translateX(${x + 5}px)` }, { transform: `translateX(${x}px)` }], 420);
			await wait(300);
		},
		async confused() {
			pointer.dataset.mood = 'sad';
			face.textContent = '?';
			await wait(700);
		},
		setSpeed(next) {
			speed = next;
		},
		destroy() {
			host.replaceChildren();
		},
	};
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
	const node = document.createElement(tag);
	node.className = className;
	if (text !== undefined) node.textContent = text;
	return node;
}
