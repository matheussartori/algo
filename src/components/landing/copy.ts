import type { Locale } from '../../lib/i18n';

export interface LandingCopy {
	title: string;
	description: string;
	prefix: string;
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
}

export const copy: Record<Locale, LandingCopy> = {
	'pt-BR': {
		title: 'algo: algoritmos, passo a passo',
		description: 'Aprenda algoritmos vendo o código rodar linha por linha, chutando o próximo passo e resolvendo exercícios no navegador, em TypeScript ou JavaScript.',
		prefix: '',
		nav: { path: 'Lições', method: 'Como funciona', start: 'Começar' },
		hero: {
			head: ['Algoritmos,', 'passo a passo.'],
			lede: 'Você vê o código rodando, tenta adivinhar o que ele faz em seguida e depois escreve o seu. Tudo aqui mesmo, no navegador.',
			primary: 'Começar pela busca linear',
			secondary: 'Como estudar aqui',
		},
		chapter: {
			head: '64 números em ordem. Qualquer um sai em 7 tentativas.',
			remaining: 'ainda no páreo',
			steps: [
				'Olha o do meio.',
				'Menor que o alvo? Esquece a metade da esquerda.',
				'Maior? Esquece a da direita.',
				'Repete até achar, ou até não sobrar nada.',
			],
		},
		try: {
			head: 'Tenta aí.',
			lede: 'Clica na coluna que a busca vai olhar agora. Se errar, tudo bem: é errando que a regra gruda.',
		},
		method: {
			head: 'Só assistir não basta.',
			lede: 'Vídeo de algoritmo parece claríssimo até você fechar a aba e tentar escrever. Por isso toda lição aqui segue o mesmo roteiro.',
			steps: [
				{ title: 'Intuição', body: 'Começa por um problema de verdade e pela ideia que resolve ele.' },
				{ title: 'Visualização', body: 'O código roda linha por linha e você vê cada variável mudando.' },
				{ title: 'Previsão', body: 'Antes de cada passo, você chuta o que vem. Errar aqui não custa nada.' },
				{ title: 'Prática', body: 'Cinco exercícios por tópico, com uns testes escondidos. TypeScript ou JavaScript, você que sabe.' },
				{ title: 'Revisão', body: 'No fim, umas perguntas pra responder de cabeça, sem voltar a página.' },
			],
		},
		invariant: {
			statement: 'Se o alvo existe, ele está entre low e high.',
			caption: 'É a regra que a busca binária nunca quebra. Pegou essa, pegou o algoritmo.',
		},
		path: {
			head: 'O que já tem aqui',
			lede: 'Por enquanto são dois tópicos, com cinco exercícios cada. Vem mais.',
			rows: [
				{ href: '/search/linear-search/', title: 'Busca linear', cost: 'O(n)', detail: 'Olha um por um. Serve pra qualquer array, até bagunçado.' },
				{ href: '/search/binary-search/', title: 'Busca binária', cost: 'O(log n)', detail: 'Corta o problema pela metade a cada passo. Só que o array precisa estar em ordem.' },
			],
			open: 'Abrir',
		},
	},
	en: {
		title: 'algo: algorithms, step by step',
		description: 'Learn algorithms by watching the code run line by line, guessing the next step and solving exercises right in the browser, in TypeScript or JavaScript.',
		prefix: '/en',
		nav: { path: 'Lessons', method: 'How it works', start: 'Start' },
		hero: {
			head: ['Algorithms,', 'step by step.'],
			lede: "You watch the code run, take a guess at what it does next, then write your own. All of it right here in the browser.",
			primary: 'Start with linear search',
			secondary: 'How to study here',
		},
		chapter: {
			head: '64 sorted numbers. Any one of them in 7 tries.',
			remaining: 'still in play',
			steps: [
				'Look at the middle one.',
				'Smaller than the target? Forget the left half.',
				'Bigger? Forget the right half.',
				'Keep going until you find it, or nothing is left.',
			],
		},
		try: {
			head: 'Give it a go.',
			lede: "Click the column the search checks next. Getting it wrong is fine, that's how the rule sinks in.",
		},
		method: {
			head: "Watching isn't enough.",
			lede: 'An algorithm video feels crystal clear until you close the tab and try to write it. So every lesson here follows the same routine.',
			steps: [
				{ title: 'Intuition', body: 'It starts with a real problem and the idea that cracks it.' },
				{ title: 'Visualization', body: 'The code runs line by line and you watch every variable change.' },
				{ title: 'Prediction', body: 'Before each step, you guess what comes next. Being wrong here is free.' },
				{ title: 'Practice', body: 'Five exercises per topic, some tests hidden. TypeScript or JavaScript, your call.' },
				{ title: 'Review', body: 'A few questions at the end to answer from memory, no scrolling back.' },
			],
		},
		invariant: {
			statement: 'If the target exists, it is between low and high.',
			caption: "The one rule binary search never breaks. Get this and you've got the algorithm.",
		},
		path: {
			head: "What's here so far",
			lede: 'Two topics for now, five exercises each. More on the way.',
			rows: [
				{ href: '/en/search/linear-search/', title: 'Linear search', cost: 'O(n)', detail: 'Check them one by one. Works on any array, even a messy one.' },
				{ href: '/en/search/binary-search/', title: 'Binary search', cost: 'O(log n)', detail: 'Cuts the problem in half every step. The catch: the array has to be sorted.' },
			],
			open: 'Open',
		},
	},
};
