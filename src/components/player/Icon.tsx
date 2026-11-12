const paths = {
	first: 'M6 5v14M19 5 9 12l10 7V5Z',
	prev: 'M17 5 7 12l10 7V5Z',
	next: 'M7 5l10 7-10 7V5Z',
	play: 'M7 4.5v15L19.5 12 7 4.5Z',
	pause: 'M8 5v14M16 5v14',
	restart: 'M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5',
} as const;

/** Stroke icons for the player controls (24px grid, drawn at 16px). */
export function Icon({ name }: { name: keyof typeof paths }) {
	const filled = name !== 'pause' && name !== 'restart';
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 2.4} strokeLinecap="round" strokeLinejoin="round">
			<path d={paths[name]} />
			{name === 'first' && <path d="M6 5v14" fill="none" strokeWidth={2.4} />}
		</svg>
	);
}
