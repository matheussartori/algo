import { useEffect, useRef, useState } from 'react';
import type { BarsHandle, CellState } from '../../gfx/bars';
import type { ArrayFrame } from '../../lib/trace';

/** Maps a frame to column heights and states: the same data the DOM cells show, in 3D. */
function toCells(frame: ArrayFrame): CellState[] {
	const numbers = frame.values.map((v) => (typeof v === 'number' ? v : Number.NaN));
	const finite = numbers.filter(Number.isFinite);
	const min = Math.min(...finite, 0);
	const max = Math.max(...finite, 1);
	const dimmed = new Set(frame.dimmed);
	return frame.values.map((_, i) => {
		const n = numbers[i];
		const height = Number.isFinite(n) ? 0.18 + (0.82 * (n - min)) / (max - min || 1) : 0.5;
		return {
			height,
			discarded: dimmed.has(i) ? 1 : 0,
			mid: frame.active === i && frame.found !== i ? 1 : 0,
			found: frame.found === i ? 1 : 0,
		};
	});
}

/** The player's 3D stage, drawn with vGPU. Hidden (and never mounted) without WebGPU. */
export function Stage3D({ frame }: { frame: ArrayFrame }) {
	const canvas = useRef<HTMLCanvasElement>(null);
	const handle = useRef<BarsHandle | null>(null);
	const latest = useRef(frame);
	const [ready, setReady] = useState(false);
	latest.current = frame;

	useEffect(() => {
		let cancelled = false;
		const count = frame.values.length;
		(async () => {
			const { mountBars } = await import('../../gfx/bars');
			if (cancelled || !canvas.current) return;
			const mounted = await mountBars({
				canvas: canvas.current,
				cells: toCells(latest.current),
				camera: { angle: 0.38, elevation: 0.3, distance: 2.6 + count * 0.62, lens: 2.1 },
				geo: { spacing: 1, width: 0.74, depth: 0.74, maxHeight: Math.min(5, 2.2 + count * 0.22) },
				ground: '--color-paper-2',
				tokens: canvas.current,
				vignette: 0,
				dpr: [1, 2],
			}).catch(() => null);
			if (cancelled) return mounted?.destroy();
			if (mounted) {
				handle.current = mounted;
				setReady(true);
			}
		})();
		return () => {
			cancelled = true;
			handle.current?.destroy();
			handle.current = null;
		};
	}, [frame.values.length]);

	useEffect(() => {
		handle.current?.setCells(toCells(frame));
	}, [frame]);

	return <canvas ref={canvas} className="algo-stage3d" data-ready={ready} aria-hidden="true" />;
}
