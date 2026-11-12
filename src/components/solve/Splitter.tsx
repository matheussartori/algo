import { useRef } from 'react';

interface Props {
	/** Percentage of the container given to the first pane. */
	value: number;
	min: number;
	max: number;
	onChange: (value: number) => void;
	orientation: 'vertical' | 'horizontal';
	controls: string;
	label: string;
}

/**
 * WAI-ARIA window splitter: drag with a pointer, arrow keys move 2%, Home/End jump to the
 * limits, Enter toggles between the limit and the last position.
 */
export function Splitter({ value, min, max, onChange, orientation, controls, label }: Props) {
	const ref = useRef<HTMLDivElement>(null);
	const last = useRef(value);
	const vertical = orientation === 'vertical';
	const clamp = (v: number) => Math.min(max, Math.max(min, v));

	const onPointerDown = (event: React.PointerEvent) => {
		const handle = ref.current;
		const box = handle?.parentElement?.getBoundingClientRect();
		if (!handle || !box) return;
		event.preventDefault();
		handle.setPointerCapture(event.pointerId);
		const move = (e: PointerEvent) => {
			const pct = vertical ? ((e.clientX - box.left) / box.width) * 100 : ((e.clientY - box.top) / box.height) * 100;
			onChange(clamp(Math.round(pct * 10) / 10));
		};
		const up = () => {
			handle.removeEventListener('pointermove', move);
			handle.removeEventListener('pointerup', up);
			handle.removeEventListener('pointercancel', up);
		};
		handle.addEventListener('pointermove', move);
		handle.addEventListener('pointerup', up);
		handle.addEventListener('pointercancel', up);
	};

	const onKeyDown = (event: React.KeyboardEvent) => {
		const back = vertical ? 'ArrowLeft' : 'ArrowUp';
		const forward = vertical ? 'ArrowRight' : 'ArrowDown';
		let next: number | null = null;
		if (event.key === back) next = value - 2;
		else if (event.key === forward) next = value + 2;
		else if (event.key === 'Home') next = min;
		else if (event.key === 'End') next = max;
		else if (event.key === 'Enter') {
			if (value === min) next = last.current;
			else {
				last.current = value;
				next = min;
			}
		}
		if (next === null) return;
		event.preventDefault();
		onChange(clamp(next));
	};

	return (
		<div
			ref={ref}
			className="solve-splitter"
			data-orientation={orientation}
			role="separator"
			tabIndex={0}
			aria-orientation={orientation}
			aria-controls={controls}
			aria-label={label}
			aria-valuenow={Math.round(value)}
			aria-valuemin={min}
			aria-valuemax={max}
			onPointerDown={onPointerDown}
			onKeyDown={onKeyDown}
		/>
	);
}
