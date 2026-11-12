import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

/** Every docs page shares its locale's OpenGraph card (public/og/<lang>.png). */
export const onRequest = defineRouteMiddleware((context) => {
	const route = context.locals.starlightRoute;
	const lang = route.lang === 'en' ? 'en' : 'pt-BR';
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
