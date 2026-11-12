# Estrutura e didática de uma lição

Base: efeito do exemplo resolvido e reversão por expertise (Sweller), *concreteness fading* (concreto → figura → abstrato), princípios de Mayer (coerência, sinalização, redundância, segmentação), prever-antes-de-ver (Pan & Carpenter 2023; Distill), prática de recuperação (Roediger & Karpicke: 61% vs 40% de retenção após uma semana), catálogo de explicações confusas da Julia Evans, Red Blob Games, CS50 (lista telefônica), Grokking Algorithms.

## Por que essa ordem

| Seção | Tamanho | O que a pesquisa diz |
|---|---|---|
| A ideia | 2–4 frases | Começar pela abstração é a armadilha nº 1 (3Blue1Brown, Evans). Situação concreta primeiro, nome depois. |
| Veja rodando | 1 frase + player | Palavra + imagem > só palavra (Mayer). A legenda diz *por quê*; o player já mostra *o quê*. Não repita na legenda o que está na tela. |
| Agora você prevê | 1 frase + player predict | Prever antes de ver supera explicar-e-praticar para iniciantes. Escolha o caso que pega o equívoco comum. |
| A regra | 1 frase | Uma invariante em palavras simples segura o aluno quando o código ficar confuso. |
| Código | 10–15 linhas | Depois da ideia e da animação, com os mesmos nomes de variável do player. Variante nova: mostre só as linhas que mudam. |
| Onde todo mundo erra | 1–3 itens | Nomeie o equívoco e marque o caminho errado como errado *antes* de mostrá-lo (Evans). Cada item com a entrada que quebra. |
| Custo | tabela + 1 frase com números | Big O em operações, não segundos. Âncora numérica. Diga o que Big O ignora (constantes, máquina). |
| Onde você já usa | 2–4 frases | APIs reais (`indexOf`, `includes`, `find`, `Set`). |
| Teste sua memória | 2–3 quizzes | Recuperação com feedback. A explicação da resposta ensina; nunca só "Correto!". |
| Pratique | `<Practice>` | Escada de 5 exercícios, do fácil ao difícil. A lição termina aqui. |

## Legendas do player (passo a passo)

- Uma ou duas frases. Comece pelo estado ("Meio é 12."), depois a decisão ("9 é menor, então…").
- Use os nomes das variáveis em `code`: `low`, `mid`, `high`, `i`.
- Não descreva cor nem forma ("a célula fica vermelha"): o aluno está vendo.

## Equívocos conhecidos (use em "Onde todo mundo erra" e nos quizzes)

**Busca linear**
- Retornar dentro do laço *sem* `return -1` depois → `undefined` quando não acha.
- Esquecer de parar no primeiro (continua e retorna o último).
- `<=` em `i <= arr.length` → lê `arr[arr.length]` (`undefined`).
- Array vazio.

**Busca binária**
- Condição do laço: `low <= high` vs `low < high`, e combinar com `high = mid - 1` vs `high = mid`. Ensine pela invariante ("a resposta, se existir, está em `low..high`").
- `low = mid` (sem +1) → laço infinito quando `low` e `high` são vizinhos.
- `(low + high) / 2` sem `Math.floor` → índice fracionário (em JS esse é o bug real; overflow de inteiro é nota de rodapé, JS é exato até 2^53).
- Usar em array não ordenado: mostre `[7, 2, 9, 1]` errando.
- Confundir índice com valor (`mid` é posição).
- Curiosidade verdadeira e útil: a primeira busca binária publicada é de 1946; a primeira correta para todo `n`, de 1962 (Bentley).

## Big O sem fórmula

- "Conte passos, não segundos."
- Linear: "o dobro de itens, o dobro de passos". Binária: "o dobro de itens, **um** passo a mais".
- Tabela de âncora: 10 → 4 passos; 1.000 → 10; 1.000.000 → 20.

## Tom

- Primeira e segunda pessoa, direto. Uma reação curta é bem-vinda ("Só isso.").
- Admita limite onde existe ("funciona aqui porque o array está ordenado; sem isso, não").
- Nunca condescendente: nada de "simples", "fácil", "óbvio", "basta". O que é fácil pra quem escreve não é pra quem lê.
