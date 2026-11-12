export type Locale = 'pt-BR' | 'en';

/** A string available in every supported locale. */
export type Msg = Record<Locale, string>;

export function toLocale(lang: string | undefined): Locale {
	return lang?.toLowerCase().startsWith('en') ? 'en' : 'pt-BR';
}

const ui = {
	'player.first': { 'pt-BR': 'Início', en: 'First' },
	'player.prev': { 'pt-BR': 'Passo anterior', en: 'Previous step' },
	'player.play': { 'pt-BR': 'Reproduzir', en: 'Play' },
	'player.pause': { 'pt-BR': 'Pausar', en: 'Pause' },
	'player.next': { 'pt-BR': 'Próximo passo', en: 'Next step' },
	'player.last': { 'pt-BR': 'Fim', en: 'Last' },
	'player.speed': { 'pt-BR': 'Velocidade', en: 'Speed' },
	'player.step': { 'pt-BR': 'Passo', en: 'Step' },
	'player.watch': { 'pt-BR': 'Assistir', en: 'Watch' },
	'player.predict': { 'pt-BR': 'Prever', en: 'Predict' },
	'player.predictPrompt': {
		'pt-BR': 'Sua vez: qual índice a busca olha agora?',
		en: 'Your turn: which index does it check next?',
	},
	'player.predictNone': { 'pt-BR': 'Nenhum, ela para aqui', en: 'None, it stops here' },
	'player.predictRight': { 'pt-BR': 'Isso aí!', en: 'Yep, that one!' },
	'player.predictWrong': { 'pt-BR': 'Esse não. Lembra da regra e tenta de novo.', en: 'Not that one. Think about the rule and try again.' },
	'player.predictReveal': { 'pt-BR': 'Era esse aqui. Explico logo abaixo.', en: 'It was this one. The why is right below.' },
	'player.score': { 'pt-BR': 'Acertos', en: 'Correct' },
	'player.done': { 'pt-BR': 'Acabou.', en: 'Done.' },
	'player.restart': { 'pt-BR': 'Recomeçar', en: 'Restart' },
	'player.variables': { 'pt-BR': 'Variáveis', en: 'Variables' },

	'exercise.run': { 'pt-BR': 'Rodar testes', en: 'Run tests' },
	'exercise.running': { 'pt-BR': 'Rodando…', en: 'Running…' },
	'exercise.reset': { 'pt-BR': 'Restaurar código', en: 'Reset code' },
	'exercise.hint': { 'pt-BR': 'Dica', en: 'Hint' },
	'exercise.noMoreHints': { 'pt-BR': 'Sem mais dicas', en: 'No more hints' },
	'exercise.solution': { 'pt-BR': 'Ver solução', en: 'Show solution' },
	'exercise.solutionLocked': {
		'pt-BR': 'Roda os testes pelo menos uma vez antes de espiar a solução.',
		en: 'Run the tests at least once before you peek.',
	},
	'exercise.solutionWarning': {
		'pt-BR': 'Leu? Agora fecha e escreve de novo sem olhar. É isso que faz ficar.',
		en: "Read it? Now close it and write it again without looking. That's what makes it stick.",
	},
	'exercise.hideSolution': { 'pt-BR': 'Esconder solução', en: 'Hide solution' },
	'exercise.passed': { 'pt-BR': 'passaram', en: 'passed' },
	'exercise.allPassed': {
		'pt-BR': 'Passou tudo! Amanhã tenta de novo do zero, sem olhar.',
		en: 'All green! Try it again from scratch tomorrow, no peeking.',
	},
	'exercise.hiddenTest': { 'pt-BR': 'Teste oculto', en: 'Hidden test' },
	'exercise.expected': { 'pt-BR': 'esperado', en: 'expected' },
	'exercise.received': { 'pt-BR': 'recebido', en: 'received' },
	'exercise.timeout': {
		'pt-BR': 'Passou de 3 segundos. Tem cara de loop infinito.',
		en: 'Took longer than 3 seconds. Smells like an infinite loop.',
	},
	'exercise.compileError': { 'pt-BR': 'Erro de sintaxe', en: 'Syntax error' },
	'exercise.missingEntry': {
		'pt-BR': 'Não achei a função',
		en: "Couldn't find the function",
	},
	'exercise.console': { 'pt-BR': 'Console', en: 'Console' },
	'exercise.shortcut': { 'pt-BR': '⌘/Ctrl + Enter para rodar', en: '⌘/Ctrl + Enter to run' },

	'quiz.check': { 'pt-BR': 'Responder', en: 'Check' },
	'quiz.right': { 'pt-BR': 'Isso!', en: 'Yep!' },
	'quiz.wrong': { 'pt-BR': 'Quase.', en: 'Not quite.' },
	'quiz.retry': { 'pt-BR': 'Tentar de novo', en: 'Try again' },
} satisfies Record<string, Msg>;

export type UiKey = keyof typeof ui;

export function t(locale: Locale, key: UiKey): string {
	return ui[key][locale];
}
