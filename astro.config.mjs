// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';

/** @param {string} directory */
const exercises = (directory) => ({
	label: 'Exercícios',
	translations: { en: 'Exercises' },
	collapsed: true,
	items: [{ autogenerate: { directory } }],
});

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'algo',
			description: 'Algoritmos e estruturas de dados, passo a passo, em TypeScript e JavaScript.',
			defaultLocale: 'root',
			locales: {
				root: { label: 'Português', lang: 'pt-BR' },
				en: { label: 'English', lang: 'en' },
			},
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
