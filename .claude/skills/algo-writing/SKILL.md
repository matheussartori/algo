---
name: algo-writing
description: Como escrever qualquer texto do algo (lições, explicações de conceito, legendas do player, dicas, quizzes, mensagens de interface) em pt-BR e en, com voz humana e didática que faz algoritmo ficar fácil. Use sempre que for criar ou revisar texto voltado ao aluno, inclusive histórias e enunciados de exercício (junto com a skill algo-exercise).
---

# Escrever para o algo

Duas metas, nesta ordem: **o aluno entende** e **parece que uma pessoa escreveu**. Quando as duas brigarem, ganha a primeira.

O leitor: alguém que já programa um pouco em JS/TS, estuda sozinho, lê no navegador, provavelmente cansado depois do trabalho ou da aula. Não é criança. Não precisa de torcida.

## As 12 regras

1. **Concreto antes do abstrato.** Abra com uma situação que a pessoa já viveu (chave perdida, lista telefônica, fila do mercado) ou com o próprio array rodando. O nome do algoritmo vem *depois* que a ideia apareceu. Nunca abra com definição.
2. **Uma ideia nova por parágrafo, por passo, por tela.** Se o parágrafo precisa de dois conceitos novos, são dois parágrafos.
3. **Diga o porquê, não só o quê.** O player já mostra o que mudou; a legenda explica por que mudou. "Meio é 12. Você quer 9. 9 é menor, então tudo de 12 pra frente sai."
4. **Números reais e exemplos pequenos.** Arrays de 5 a 10 elementos com valores de verdade. Custo com números: "1.000.000 de itens: busca linear olha até 1.000.000; binária, uns 20".
5. **Nomeie o erro comum antes que ele aconteça.** Uma ou duas notas por lição do tipo "aqui todo mundo tropeça": `low <= high` vs `low < high`, `mid + 1`, array não ordenado, índice vs valor. Mostre a entrada que quebra.
6. **Peça previsão antes de revelar.** "Qual índice ela olha agora?" funciona melhor que explicar. O site tem modo Prever e Quiz: use.
7. **Notação só quando precisar.** `O(log n)` aparece depois que o aluno viu 20 passos para um milhão. Explique `log n` como "quantas vezes dá pra cortar n pela metade".
8. **Frase curta é o padrão, mas varie.** Misture frases de 4 palavras com frases de 25. Fragmento é permitido. Ritmo uniforme é a marca mais forte de texto gerado.
9. **Verbo simples, voz ativa, segunda pessoa.** "Ela olha", "você corta", "o laço para". Nada de "é realizada a verificação".
10. **Uma analogia, curta, e depois largue.** Analogia longa vira algo que o leitor precisa decifrar.
11. **Prosa em vez de bullet.** Lista só para sequência real ou itens paralelos de verdade. Negrito só na primeira vez que um termo é definido. Títulos em caixa de frase. Sem emoji.
12. **Termine quando acabar.** Sem "Em resumo", sem "Conclusão", sem recapitular. A lição termina na prática ou num próximo passo concreto.

## Proibido (as marcas de IA)

Lista completa e exemplos em [`references/ai-tells.md`](references/ai-tells.md). O essencial:

- pt-BR: "vale ressaltar", "é importante destacar/notar", "vale destacar", "mergulhar", "jornada", "desvendar", "no mundo de", "na era", "em suma", "dessa forma" em todo parágrafo, "além disso" em série, cadeias de gerúndio ("permitindo… garantindo… facilitando"), "robusto", "poderoso", "fundamental", "crucial", "essencial", "eficiente" sem número.
- en: "delve", "crucial", "pivotal", "plays a key role", "it's important to note", "let's dive in", "in this lesson we'll explore", "serves as", "boasts", "seamless", "powerful", "landscape", "testament".
- Estruturas: "não é só X, é Y" / "não é X, mas Y"; trio de adjetivos; frase que termina em "…, destacando sua importância"; abertura bajuladora; fechamento com resumo; meta-comentário ("nesta seção veremos"); travessão no meio da frase (use vírgula, ponto ou parênteses); cabeçalho a cada dois parágrafos.

## Português e inglês

- Escreva **cada língua direto**, não traduza. A versão en pode ter outra piada, outra frase; precisa ensinar a mesma coisa.
- pt-BR falado, não acadêmico: "você", "a gente" quando couber, "pra", "tá" só em tom de conversa (dicas, mensagens de UI), nunca no enunciado técnico.
- Vocabulário do site: **array** (não vetor), **índice**, **laço** ou **loop** (o site usa "laço" em texto e `for` no código), **alvo**, **busca linear/binária**. Antes de introduzir termo novo, `grep` no `src/content/docs` pra ver como já foi dito.
- Números em pt-BR: `1.000`, `1.000.000`; em en: `1,000`.
- Copy da interface mora em `src/lib/i18n.ts`: frase curta, verbo no imperativo ou constatação ("Passou tudo.", "Esse não."), tom de colega.

## Estrutura de uma lição

Detalhes, tamanhos e exemplos em [`references/lesson-structure.md`](references/lesson-structure.md). Ordem padrão das páginas em `src/content/docs/**`:

1. **A ideia** (2–4 frases): situação concreta → o nome.
2. **Veja rodando**: `<AlgoPlayer>` com 6–10 elementos; uma frase dizendo onde olhar.
3. **Agora você prevê**: player em modo `predict`, de preferência num caso que pega o erro comum (alvo ausente, borda).
4. **A regra/invariante** numa frase: "se o alvo existe, ele está entre `low` e `high`".
5. **Código**: 10–15 linhas, mesmos nomes de variável do player.
6. **Onde todo mundo erra**: 1–3 armadilhas com a entrada que quebra.
7. **Custo**: tabela curta + a comparação com números.
8. **Onde você já usa**: APIs reais do JS.
9. **Teste sua memória**: 2–3 `<Quiz>` com explicação na resposta.
10. **Pratique**: `<Practice lesson="…" />`. Fim.

## Antes de entregar (checklist)

Rode mentalmente, e em voz alta para o pt-BR:

- [ ] A primeira frase é uma situação ou um array, não uma definição nem "Neste artigo".
- [ ] Cada parágrafo traz uma ideia só. Cortei toda frase que não ensina nada.
- [ ] Busquei no texto cada item de `references/ai-tells.md` (Ctrl+F de verdade, inclusive "—").
- [ ] Tem pelo menos um número concreto e um exemplo pequeno.
- [ ] Tem uma nota honesta de "aqui confunde".
- [ ] As frases não têm todas o mesmo tamanho.
- [ ] Nenhum resumo no final.
- [ ] pt-BR e en ensinam a mesma coisa, mas cada um soa nativo.
- [ ] Termos batem com o resto do site.
