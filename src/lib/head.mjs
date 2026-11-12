// @ts-check
/** Icons, manifest and theme colour: shared by Starlight's head and the landing. */
/** @type {{ tag: 'link' | 'meta'; attrs: Record<string, string> }[]} */
export const iconLinks = [
	{ tag: 'link', attrs: { rel: 'icon', href: '/favicon.ico', sizes: '32x32' } },
	{ tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } },
	{ tag: 'link', attrs: { rel: 'manifest', href: '/site.webmanifest' } },
	{ tag: 'meta', attrs: { name: 'theme-color', content: '#161311' } },
];

export const SITE = 'https://algo.mattsartori.com.br';
