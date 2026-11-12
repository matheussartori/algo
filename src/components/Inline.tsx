/** Renders `inline code` inside short localized strings (hints, notes). */
export function Inline({ text }: { text: string }) {
	return (
		<>
			{text.split(/(`[^`]+`)/g).map((part, i) =>
				part.startsWith('`') && part.endsWith('`') ? <code key={i}>{part.slice(1, -1)}</code> : part,
			)}
		</>
	);
}
