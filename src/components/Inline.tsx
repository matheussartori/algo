/** Renders `inline code` and **bold** inside short localized strings (hints, notes, quiz text). */
export function Inline({ text }: { text: string }) {
	return (
		<>
			{text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, i) => {
				if (part.length > 1 && part.startsWith('`') && part.endsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>;
				if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
				return part;
			})}
		</>
	);
}
