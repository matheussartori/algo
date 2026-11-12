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

	'exercise.run': { 'pt-BR': 'Rodar', en: 'Run' },
	'exercise.submit': { 'pt-BR': 'Enviar', en: 'Submit' },
	'exercise.running': { 'pt-BR': 'Rodando…', en: 'Running…' },
	'exercise.runHint': { 'pt-BR': 'Rodar usa os testes visíveis. Enviar usa todos.', en: 'Run uses the visible tests. Submit uses all of them.' },
	'exercise.reset': { 'pt-BR': 'Restaurar', en: 'Reset' },
	'exercise.resetConfirm': { 'pt-BR': 'Apagar meu código?', en: 'Erase my code?' },
	'exercise.hint': { 'pt-BR': 'Dica', en: 'Hint' },
	'exercise.nextHint': { 'pt-BR': 'Mostrar mais uma dica', en: 'Show one more hint' },
	'exercise.noHints': { 'pt-BR': 'Travou? As dicas vão da mais leve até quase a resposta. Abra uma de cada vez.', en: 'Stuck? The hints go from a light nudge to almost the answer. Open one at a time.' },
	'exercise.noMoreHints': { 'pt-BR': 'Essas eram todas as dicas.', en: 'Those were all the hints.' },
	'exercise.solution': { 'pt-BR': 'Ver solução', en: 'Show solution' },
	'exercise.solutionLocked': {
		'pt-BR': 'A solução abre depois que você rodar o código pelo menos uma vez.',
		en: 'The solution opens after you run your code at least once.',
	},
	'exercise.solutionWarning': {
		'pt-BR': 'Leu? Agora fecha e escreve de novo sem olhar. É isso que faz ficar.',
		en: "Read it? Now close it and write it again without looking. That's what makes it stick.",
	},
	'exercise.hideSolution': { 'pt-BR': 'Esconder solução', en: 'Hide solution' },
	'exercise.passed': { 'pt-BR': 'passaram', en: 'passed' },
	'exercise.allPassedRun': { 'pt-BR': 'Os testes visíveis passaram. Agora envia pra rodar os outros.', en: 'The visible tests pass. Now submit to run the rest.' },
	'exercise.solved': { 'pt-BR': 'Resolvido.', en: 'Solved.' },
	'exercise.solvedAgain': { 'pt-BR': 'Amanhã tenta de novo do zero, sem olhar. É assim que fica.', en: 'Try it again from scratch tomorrow, no peeking. That is how it sticks.' },
	'exercise.next': { 'pt-BR': 'Próximo exercício', en: 'Next exercise' },
	'exercise.backToLesson': { 'pt-BR': 'Voltar pra lição', en: 'Back to the lesson' },
	'exercise.hiddenTest': { 'pt-BR': 'Teste extra', en: 'Extra test' },
	'exercise.input': { 'pt-BR': 'entrada', en: 'input' },
	'exercise.expected': { 'pt-BR': 'esperado', en: 'expected' },
	'exercise.received': { 'pt-BR': 'recebido', en: 'received' },
	'exercise.tooManyReads': { 'pt-BR': 'Leu {reads} elementos, o limite é {max}. Olhou um por um?', en: 'Read {reads} elements, the limit is {max}. Did it look one by one?' },
	'exercise.timeout': {
		'pt-BR': 'Passou de 3 segundos. Tem cara de laço infinito.',
		en: 'Took longer than 3 seconds. Smells like an infinite loop.',
	},
	'exercise.compileError': { 'pt-BR': 'Erro de sintaxe', en: 'Syntax error' },
	'exercise.missingEntry': {
		'pt-BR': 'Não achei a função',
		en: "Couldn't find the function",
	},
	'exercise.console': { 'pt-BR': 'Console', en: 'Console' },
	'exercise.consoleEmpty': { 'pt-BR': 'Nada por aqui. Use console.log no seu código e rode de novo.', en: 'Nothing here. Use console.log in your code and run again.' },
	'exercise.tests': { 'pt-BR': 'Testes', en: 'Tests' },
	'exercise.testsEmpty': { 'pt-BR': 'Rode o código pra ver os testes aqui e a cena lá em cima.', en: 'Run your code to see the tests here and the scene up top.' },
	'exercise.shortcutRun': { 'pt-BR': '⌘/Ctrl + Enter roda', en: '⌘/Ctrl + Enter runs' },
	'exercise.shortcutSubmit': { 'pt-BR': '⌘/Ctrl + Shift + Enter envia', en: '⌘/Ctrl + Shift + Enter submits' },
	'exercise.tabEscape': { 'pt-BR': 'No editor, Esc e depois Tab saem dele.', en: 'In the editor, Esc then Tab moves focus out.' },
	'exercise.problem': { 'pt-BR': 'Problema', en: 'Problem' },
	'exercise.lesson': { 'pt-BR': 'Lição', en: 'Lesson' },
	'exercise.hints': { 'pt-BR': 'Dicas', en: 'Hints' },
	'exercise.code': { 'pt-BR': 'Código', en: 'Code' },
	'exercise.scene': { 'pt-BR': 'Cena', en: 'Scene' },
	'exercise.task': { 'pt-BR': 'O que fazer', en: 'Your task' },
	'exercise.examples': { 'pt-BR': 'Exemplos', en: 'Examples' },
	'exercise.openLesson': { 'pt-BR': 'Abrir a lição completa', en: 'Open the full lesson' },
	'exercise.of': { 'pt-BR': 'de', en: 'of' },
	'exercise.exercise': { 'pt-BR': 'Exercício', en: 'Exercise' },
	'exercise.soon': { 'pt-BR': 'Em breve', en: 'Coming soon' },
	'exercise.done': { 'pt-BR': 'Feito', en: 'Done' },
	'exercise.ladder': { 'pt-BR': 'Exercícios desta lição', en: "This lesson's exercises" },
	'exercise.resizePanels': { 'pt-BR': 'Redimensionar painéis', en: 'Resize panels' },
	'exercise.hideScene': { 'pt-BR': 'Esconder cena', en: 'Hide scene' },
	'exercise.showScene': { 'pt-BR': 'Mostrar cena', en: 'Show scene' },
	'exercise.replay': { 'pt-BR': 'Repetir cena', en: 'Replay scene' },
	'exercise.skip': { 'pt-BR': 'Pular cena', en: 'Skip scene' },
	'exercise.speed': { 'pt-BR': 'Velocidade da cena', en: 'Scene speed' },
	'exercise.otherLang': { 'pt-BR': 'English', en: 'Português' },
	'exercise.difficulty1': { 'pt-BR': 'Fácil', en: 'Easy' },
	'exercise.difficulty2': { 'pt-BR': 'Fácil', en: 'Easy' },
	'exercise.difficulty3': { 'pt-BR': 'Médio', en: 'Medium' },
	'exercise.difficulty4': { 'pt-BR': 'Médio', en: 'Medium' },
	'exercise.difficulty5': { 'pt-BR': 'Difícil', en: 'Hard' },

	'quiz.check': { 'pt-BR': 'Responder', en: 'Check' },
	'quiz.right': { 'pt-BR': 'Isso!', en: 'Yep!' },
	'quiz.wrong': { 'pt-BR': 'Quase.', en: 'Not quite.' },
	'quiz.retry': { 'pt-BR': 'Tentar de novo', en: 'Try again' },
} satisfies Record<string, Msg>;

export type UiKey = keyof typeof ui;

export function t(locale: Locale, key: UiKey, vars?: Record<string, string | number>): string {
	const text = ui[key][locale];
	return vars ? text.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? '')) : text;
}
