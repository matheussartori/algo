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
		'pt-BR': 'Sua vez: clique no índice que o algoritmo vai examinar agora.',
		en: 'Your turn: click the index the algorithm will examine next.',
	},
	'player.predictNone': { 'pt-BR': 'Nenhum: a busca termina', en: 'None: the search ends' },
	'player.predictRight': { 'pt-BR': 'Isso!', en: 'Right!' },
	'player.predictWrong': { 'pt-BR': 'Não foi esse. Pense na regra e tente de novo.', en: 'Not that one. Think about the rule and try again.' },
	'player.predictReveal': { 'pt-BR': 'Era este. Veja a explicação abaixo.', en: 'It was this one. See the explanation below.' },
	'player.score': { 'pt-BR': 'Acertos', en: 'Correct' },
	'player.done': { 'pt-BR': 'Fim da execução.', en: 'End of execution.' },
	'player.restart': { 'pt-BR': 'Recomeçar', en: 'Restart' },
	'player.variables': { 'pt-BR': 'Variáveis', en: 'Variables' },

	'exercise.run': { 'pt-BR': 'Rodar testes', en: 'Run tests' },
	'exercise.running': { 'pt-BR': 'Rodando…', en: 'Running…' },
	'exercise.reset': { 'pt-BR': 'Restaurar código', en: 'Reset code' },
	'exercise.hint': { 'pt-BR': 'Dica', en: 'Hint' },
	'exercise.noMoreHints': { 'pt-BR': 'Sem mais dicas', en: 'No more hints' },
	'exercise.solution': { 'pt-BR': 'Ver solução', en: 'Show solution' },
	'exercise.solutionLocked': {
		'pt-BR': 'Tente rodar os testes pelo menos uma vez antes de ver a solução.',
		en: 'Try running the tests at least once before looking at the solution.',
	},
	'exercise.solutionWarning': {
		'pt-BR': 'Depois de ler a solução, feche-a e reescreva de memória. É aí que o aprendizado fixa.',
		en: 'After reading the solution, close it and rewrite it from memory. That is where learning sticks.',
	},
	'exercise.hideSolution': { 'pt-BR': 'Esconder solução', en: 'Hide solution' },
	'exercise.passed': { 'pt-BR': 'passaram', en: 'passed' },
	'exercise.allPassed': {
		'pt-BR': 'Todos os testes passaram. Volte amanhã e tente resolver de novo sem olhar.',
		en: 'All tests passed. Come back tomorrow and solve it again without looking.',
	},
	'exercise.hiddenTest': { 'pt-BR': 'Teste oculto', en: 'Hidden test' },
	'exercise.expected': { 'pt-BR': 'esperado', en: 'expected' },
	'exercise.received': { 'pt-BR': 'recebido', en: 'received' },
	'exercise.timeout': {
		'pt-BR': 'Tempo esgotado (3s). Será que tem um loop infinito?',
		en: 'Timed out (3s). Is there an infinite loop?',
	},
	'exercise.compileError': { 'pt-BR': 'Erro de sintaxe', en: 'Syntax error' },
	'exercise.missingEntry': {
		'pt-BR': 'Não encontrei a função',
		en: 'Could not find the function',
	},
	'exercise.console': { 'pt-BR': 'Console', en: 'Console' },
	'exercise.shortcut': { 'pt-BR': '⌘/Ctrl + Enter para rodar', en: '⌘/Ctrl + Enter to run' },

	'quiz.check': { 'pt-BR': 'Responder', en: 'Check' },
	'quiz.right': { 'pt-BR': 'Correto!', en: 'Correct!' },
	'quiz.wrong': { 'pt-BR': 'Ainda não.', en: 'Not quite.' },
	'quiz.retry': { 'pt-BR': 'Tentar de novo', en: 'Try again' },
} satisfies Record<string, Msg>;

export type UiKey = keyof typeof ui;

export function t(locale: Locale, key: UiKey): string {
	return ui[key][locale];
}
