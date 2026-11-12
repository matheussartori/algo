import { LayoutGroup, motion } from 'motion/react';
import type { ArrayFrame } from '../../lib/trace';

interface Props {
	frame: ArrayFrame;
	/** When set, cells become buttons (predict mode). */
	onPick?: (index: number) => void;
	/** Index flagged as a wrong or revealed answer in predict mode. */
	marked?: { index: number; kind: 'wrong' | 'reveal' };
	uid: string;
}

export function ArrayView({ frame, onPick, marked, uid }: Props) {
	const dimmed = new Set(frame.dimmed);
	const pointersAt = new Map<number, string[]>();
	for (const [name, index] of Object.entries(frame.pointers ?? {})) {
		if (index < 0 || index >= frame.values.length) continue;
		pointersAt.set(index, [...(pointersAt.get(index) ?? []), name]);
	}

	return (
		<LayoutGroup id={uid}>
			<div className="algo-array" role="list">
				{frame.values.map((value, index) => {
					const state =
						frame.found === index
							? 'found'
							: frame.active === index
								? 'active'
								: dimmed.has(index)
									? 'dimmed'
									: 'idle';
					const mark = marked?.index === index ? marked.kind : undefined;
					const Cell = onPick ? 'button' : 'div';
					return (
						<div className="algo-array__slot" role="listitem" key={index}>
							<Cell
								type={onPick ? 'button' : undefined}
								className="algo-array__cell"
								data-state={state}
								data-mark={mark}
								onClick={onPick ? () => onPick(index) : undefined}
								aria-label={`[${index}] = ${value}`}
							>
								{state === 'active' && (
									<motion.span
										layoutId="active"
										className="algo-array__focus"
										transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
									/>
								)}
								<span className="algo-array__value">{String(value)}</span>
							</Cell>
							<span className="algo-array__index">{index}</span>
							<span className="algo-array__pointers">
								{(pointersAt.get(index) ?? []).map((name) => (
									<motion.span
										key={name}
										layoutId={`pointer-${name}`}
										className="algo-array__pointer"
										data-pointer={name}
										transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
									>
										{name}
									</motion.span>
								))}
							</span>
						</div>
					);
				})}
			</div>
		</LayoutGroup>
	);
}
