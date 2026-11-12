import type { Gpu } from 'vgpu';

/**
 * One WebGPU device for the whole page; every canvas borrows it. A lost device
 * clears the cache so the next canvas asks for a fresh one. Anything short of a
 * hardware adapter (no WebGPU, a software fallback, Save-Data) resolves to null,
 * and the page keeps its flat, CSS-only look.
 */
let pending: Promise<Gpu | null> | null = null;

export function gpuAllowed(): boolean {
	if (typeof navigator === 'undefined' || !('gpu' in navigator)) return false;
	const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
	return !connection?.saveData;
}

export function getGpu(): Promise<Gpu | null> {
	if (!gpuAllowed()) return Promise.resolve(null);
	pending ??= (async () => {
		try {
			const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
			const info = adapter as (GPUAdapter & { info?: GPUAdapterInfo; isFallbackAdapter?: boolean }) | null;
			const label = `${info?.info?.vendor ?? ''} ${info?.info?.description ?? ''}`;
			if (!adapter || info?.isFallbackAdapter || /swiftshader|llvmpipe|software/i.test(label)) return null;
			const { init } = await import('vgpu');
			const gpu = await init({ powerPreference: 'high-performance' });
			void gpu.lost.then(() => {
				pending = null;
			});
			return gpu;
		} catch {
			return null;
		}
	})();
	return pending;
}

type Rgb = [number, number, number, number];

/** Resolves any CSS colour (OKLCH tokens included) to sRGB floats through a 1px canvas. */
export function cssColour(value: string): Rgb {
	const canvas = document.createElement('canvas');
	canvas.width = canvas.height = 1;
	const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
	ctx.fillStyle = value;
	ctx.fillRect(0, 0, 1, 1);
	const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
	return [r / 255, g / 255, b / 255, 1];
}

export function tokenColour(name: string, scope: Element = document.documentElement): Rgb {
	const value = getComputedStyle(scope).getPropertyValue(name).trim();
	return cssColour(value || 'gray');
}

export function prefersReducedMotion(): boolean {
	return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}
