import type { Locale } from '../../lib/i18n';

export interface LandingCopy {
	title: string;
	description: string;
	prefix: string;
	switchLabel: string;
	switchHref: string;
	nav: { path: string; method: string; start: string };
	hero: { head: [string, string]; lede: string; primary: string; secondary: string };
	chapter: { head: string; remaining: string; steps: string[] };
	try: { head: string; lede: string };
	method: { head: string; lede: string; steps: { title: string; body: string }[] };
	invariant: { statement: string; caption: string };
	path: {
		head: string;
		lede: string;
		rows: { href: string; title: string; cost: string; detail: string }[];
		open: string;
	};
	footer: { line: string; source: string; terms: string; license: string };
}

export const copy: Record<Locale, LandingCopy> = {
	'pt-BR': {
		title: 'algo: algoritmos, passo a passo',
		description: 'Veja o algoritmo rodar, preveja o próximo passo e escreva o seu, em TypeScript ou JavaScript, no navegador.',
		prefix: '',
		switchLabel: 'English',
		switchHref: '/en/',
		nav: { path: 'Trilha', method: 'Método', start: 'Começar' },
		hero: {
			head: ['Algoritmos,', 'passo a passo.'],
			lede: 'Veja rodar, preveja o próximo passo, escreva o seu.',
			primary: 'Começar pela busca linear',
			secondary: 'Como estudar aqui',
		},
		chapter: {
			head: '64 colunas ordenadas. No máximo 7 olhadas.',
			remaining: 'ainda possíveis',
			steps: [
				'Olhe a coluna do meio.',
				'Menor que o alvo? Descarte a metade esquerda.',
				'Maior? Descarte a metade direita.',
				'Repita até achar, ou até não sobrar nada.',
			],
		},
		try: {
			head: 'Sua vez.',
			lede: 'Clique na coluna que a busca vai examinar a seguir.',
		},
		method: {
			head: 'Assistir ensina pouco. Prever ensina muito.',
			lede: 'Cada tópico segue o mesmo ciclo, tirado de pesquisa sobre como se aprende.',
			steps: [
				{ title: 'Intuição', body: 'Um problema real e a ideia por trás da solução.' },
				{ title: 'Visualização', body: 'O código roda linha a linha, com as variáveis à mostra.' },
				{ title: 'Previsão', body: 'Você escolhe o próximo passo antes de vê-lo.' },
				{ title: 'Prática', body: 'Exercícios com testes ocultos, em TypeScript ou JavaScript.' },
				{ title: 'Revisão', body: 'Perguntas para responder de memória, sem reler.' },
			],
		},
		invariant: {
			statement: 'Se o alvo existe, ele está entre low e high.',
			caption: 'O invariante da busca binária: verdadeiro antes, durante e depois de cada passo.',
		},
		path: {
			head: 'A trilha, por enquanto.',
			lede: 'Dois tópicos completos, cada um com cinco exercícios.',
			rows: [
				{ href: '/search/linear-search/', title: 'Busca linear', cost: 'O(n)', detail: 'Um elemento de cada vez, em qualquer array.' },
				{ href: '/search/binary-search/', title: 'Busca binária', cost: 'O(log n)', detail: 'Metade descartada a cada passo, num array ordenado.' },
			],
			open: 'Abrir',
		},
		footer: {
			line: 'Seu código roda no navegador, num Web Worker. Nada vai para um servidor.',
			source: 'Código-fonte',
			terms: 'Termos de uso',
			license: 'Licença',
		},
	},
	en: {
		title: 'algo: algorithms, step by step',
		description: 'Watch the algorithm run, predict the next step and write your own, in TypeScript or JavaScript, in the browser.',
		prefix: '/en',
		switchLabel: 'Português',
		switchHref: '/',
		nav: { path: 'Path', method: 'Method', start: 'Start' },
		hero: {
			head: ['Algorithms,', 'step by step.'],
			lede: 'Watch it run, predict the next step, write your own.',
			primary: 'Start with linear search',
			secondary: 'How to study here',
		},
		chapter: {
			head: '64 sorted columns. At most 7 looks.',
			remaining: 'still possible',
			steps: [
				'Look at the middle column.',
				'Smaller than the target? Drop the left half.',
				'Larger? Drop the right half.',
				'Repeat until found, or until nothing is left.',
			],
		},
		try: {
			head: 'Your turn.',
			lede: 'Click the column the search will examine next.',
		},
		method: {
			head: 'Watching teaches little. Predicting teaches a lot.',
			lede: 'Every topic runs the same loop, taken from research on how people learn.',
			steps: [
				{ title: 'Intuition', body: 'A real problem and the idea behind the solution.' },
				{ title: 'Visualization', body: 'The code runs line by line, variables in view.' },
				{ title: 'Prediction', body: 'You pick the next step before you see it.' },
				{ title: 'Practice', body: 'Exercises with hidden tests, in TypeScript or JavaScript.' },
				{ title: 'Review', body: 'Questions to answer from memory, without re-reading.' },
			],
		},
		invariant: {
			statement: 'If the target exists, it is between low and high.',
			caption: 'The binary search invariant: true before, during and after every step.',
		},
		path: {
			head: 'The path, so far.',
			lede: 'Two complete topics, five exercises each.',
			rows: [
				{ href: '/en/search/linear-search/', title: 'Linear search', cost: 'O(n)', detail: 'One element at a time, in any array.' },
				{ href: '/en/search/binary-search/', title: 'Binary search', cost: 'O(log n)', detail: 'Half dropped at every step, in a sorted array.' },
			],
			open: 'Open',
		},
		footer: {
			line: 'Your code runs in the browser, in a Web Worker. Nothing goes to a server.',
			source: 'Source code',
			terms: 'Terms of use',
			license: 'License',
		},
	},
};
