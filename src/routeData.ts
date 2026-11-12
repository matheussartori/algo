import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

type SidebarEntry = { type: 'link'; href: string } | { type: 'group'; entries: SidebarEntry[] };

/** Exercise links point at /solve/…; on English pages they must point at /en/solve/…. */
function localizeSolveLinks(entries: SidebarEntry[], prefix: string) {
	for (const entry of entries) {
		if (entry.type === 'group') localizeSolveLinks(entry.entries, prefix);
		else if (entry.href.startsWith('/solve/')) entry.href = prefix + entry.href;
	}
}

export const onRequest = defineRouteMiddleware((context) => {
	const route = context.locals.starlightRoute;
	const lang = route.lang === 'en' ? 'en' : 'pt-BR';
	if (lang === 'en') localizeSolveLinks(route.sidebar as SidebarEntry[], '/en');

	// Every docs page shares its locale's OpenGraph card (public/og/<lang>.png).
	const image = new URL(`/og/${lang}.png`, context.site).href;
	const alt = lang === 'en' ? 'algo: algorithms, step by step' : 'algo: algoritmos, passo a passo';
	route.head.push(
		{ tag: 'meta', attrs: { property: 'og:image', content: image } },
		{ tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
		{ tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
		{ tag: 'meta', attrs: { property: 'og:image:alt', content: alt } },
		{ tag: 'meta', attrs: { name: 'twitter:image', content: image } },
	);
});
