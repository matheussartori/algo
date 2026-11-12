// @ts-check
/** Fontshare (Clash Display, Switzer) and Google Fonts (JetBrains Mono), only the weights in use. */
/** @type {{ tag: 'link'; attrs: Record<string, string | boolean> }[]} */
export const fontLinks = [
	{ tag: 'link', attrs: { rel: 'preconnect', href: 'https://api.fontshare.com' } },
	{ tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' } },
	{ tag: 'link', attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true } },
	{
		tag: 'link',
		attrs: {
			rel: 'stylesheet',
			href: 'https://api.fontshare.com/v2/css?f[]=array@600,700&f[]=switzer@400,600&display=swap',
		},
	},
	{
		tag: 'link',
		attrs: {
			rel: 'stylesheet',
			href: 'https://fonts.googleapis.com/css2?family=Tektur:wdth,wght@75..100,500..800&family=JetBrains+Mono:wght@400;600&display=swap',
		},
	},
];
