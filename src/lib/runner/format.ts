export const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

export function deepEqual(a: unknown, b: unknown): boolean {
	if (Object.is(a, b)) return true;
	if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
	if (Array.isArray(a) !== Array.isArray(b)) return false;
	const keysA = Object.keys(a);
	const keysB = Object.keys(b);
	if (keysA.length !== keysB.length) return false;
	return keysA.every((key) =>
		deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
	);
}

/** Readable, single-line representation of a value, close to how it is written in code. */
export function format(value: unknown, seen = new Set<object>()): string {
	if (value === undefined) return 'undefined';
	if (typeof value === 'string') return JSON.stringify(value);
	if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`;
	if (typeof value !== 'object' || value === null) return String(value);
	if (seen.has(value)) return '[Circular]';
	seen.add(value);
	try {
		if (Array.isArray(value)) return `[${value.map((v) => format(v, seen)).join(', ')}]`;
		const entries = Object.entries(value).map(([k, v]) => `${IDENTIFIER.test(k) ? k : JSON.stringify(k)}: ${format(v, seen)}`);
		return entries.length ? `{ ${entries.join(', ')} }` : '{}';
	} finally {
		seen.delete(value);
	}
}
