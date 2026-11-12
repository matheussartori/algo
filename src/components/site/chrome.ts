import type { Locale } from '../../lib/i18n';

export const REPO = 'https://github.com/matheussartori/algo';

export interface ChromeCopy {
	prefix: string;
	blurb: string;
	learn: string;
	project: string;
	lessons: { href: string; label: string }[];
	links: { href: string; label: string }[];
	license: string;
}

const pt: ChromeCopy = {
	prefix: '',
	blurb: 'Um cantinho pra aprender algoritmos mexendo neles. Sem cadastro, sem anúncio, e o seu código não sai do navegador.',
	learn: 'Lições',
	project: 'Projeto',
	lessons: [
		{ href: '/search/linear-search/', label: 'Busca linear' },
		{ href: '/search/binary-search/', label: 'Busca binária' },
		{ href: '/getting-started/', label: 'Como estudar aqui' },
	],
	links: [
		{ href: REPO, label: 'Código no GitHub' },
		{ href: `${REPO}/issues/new/choose`, label: 'Achou um erro?' },
		{ href: '/terms/', label: 'Termos de uso' },
	],
	license: 'Código MIT, conteúdo CC BY 4.0',
};

const en: ChromeCopy = {
	prefix: '/en',
	blurb: 'A small place to learn algorithms by poking at them. No sign-up, no ads, and your code never leaves the browser.',
	learn: 'Lessons',
	project: 'Project',
	lessons: [
		{ href: '/en/search/linear-search/', label: 'Linear search' },
		{ href: '/en/search/binary-search/', label: 'Binary search' },
		{ href: '/en/getting-started/', label: 'How to study here' },
	],
	links: [
		{ href: REPO, label: 'Source on GitHub' },
		{ href: `${REPO}/issues/new/choose`, label: 'Found a mistake?' },
		{ href: '/en/terms/', label: 'Terms of use' },
	],
	license: 'Code MIT, content CC BY 4.0',
};

export const chrome: Record<Locale, ChromeCopy> = { 'pt-BR': pt, en };
