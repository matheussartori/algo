// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import { wgslVitePlugin } from '@vgpu/wgsl/loader-vite';
import { fontLinks } from './src/lib/fonts.mjs';
import { SITE, iconLinks } from './src/lib/head.mjs';

/**
 * A lesson's exercises live outside Starlight, on the full-screen solve route.
 * Links are written for the root locale; src/routeData.ts prefixes them on /en/ pages.
 * @param {[id: string, pt: string, en: string][]} items
 */
const exercises = (items) => ({
	label: 'Exercícios',
	translations: { en: 'Exercises' },
	collapsed: false,
	items: items.map(([id, pt, en], i) => ({
		label: `${i + 1}. ${pt}`,
		translations: { en: `${i + 1}. ${en}` },
		link: `/solve/${id}/`,
	})),
});

// https://astro.build/config
export default defineConfig({
	site: SITE,
	vite: {
		plugins: [wgslVitePlugin({ minify: true })],
	},
	integrations: [
		starlight({
			title: 'algo',
			description: 'Algoritmos e estruturas de dados, passo a passo, em TypeScript e JavaScript.',
			logo: {
				dark: './src/assets/brand/mark-dark.svg',
				light: './src/assets/brand/mark-light.svg',
			},
			defaultLocale: 'root',
			locales: {
				root: { label: 'Português', lang: 'pt-BR' },
				en: { label: 'English', lang: 'en' },
			},
			head: [...fontLinks, ...iconLinks],
			favicon: '/favicon.svg',
			routeMiddleware: './src/routeData.ts',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/matheussartori/algo' }],
			customCss: ['./src/styles/custom.css'],
			components: { Footer: './src/components/starlight/Footer.astro' },
			// code blocks share the player's card: same hairline, radius and paper
			expressiveCode: {
				styleOverrides: {
					borderRadius: '14px',
					borderColor: 'var(--color-rule)',
					codeFontFamily: 'var(--font-mono)',
					uiFontFamily: 'var(--font-display)',
					codeBackground: 'var(--color-paper-2)',
					frames: {
						editorTabBarBackground: 'var(--color-paper-2)',
						editorActiveTabBackground: 'var(--color-paper-3)',
						editorActiveTabIndicatorTopColor: 'var(--color-accent)',
						editorTabBarBorderBottomColor: 'var(--color-rule)',
						terminalTitlebarBackground: 'var(--color-paper-2)',
						frameBoxShadowCssValue: 'none',
					},
				},
			},
			sidebar: [
				{
					label: 'Começando',
					translations: { en: 'Getting started' },
					items: ['getting-started'],
				},
				{
					label: 'Busca',
					translations: { en: 'Search' },
					items: [
						'search/linear-search',
						exercises([['linear-search/pirate-treasure', 'O mapa do Barba-Rala', "Captain Stubble's map"]]),
						'search/binary-search',
						exercises([['binary-search/frog-mail', 'Correio do Sapo Ribas', 'Ribbit Post']]),
					],
				},
			],
		}),
		react(),
	],
});
