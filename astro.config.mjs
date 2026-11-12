// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import { wgslVitePlugin } from '@vgpu/wgsl/loader-vite';
import { fontLinks } from './src/lib/fonts.mjs';
import { SITE, iconLinks } from './src/lib/head.mjs';

/** @param {string} directory */
const exercises = (directory) => ({
	label: 'Exercícios',
	translations: { en: 'Exercises' },
	collapsed: true,
	items: [{ autogenerate: { directory } }],
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
						exercises('search/linear-search-exercises'),
						'search/binary-search',
						exercises('search/binary-search-exercises'),
					],
				},
			],
		}),
		react(),
	],
});
