# A escada de 5

Cada lição tem exatamente 5 degraus. Um conceito novo por degrau; o primeiro é quase o exemplo da lição com outra roupa.

| Degrau | Dificuldade (UI) | O que acrescenta | Busca linear (ex.) | Busca binária (ex.) |
|---|---|---|---|---|
| 1 | Fácil | O algoritmo puro, com números | achar índice de um número | achar índice num array ordenado |
| 2 | Fácil | Outro tipo de dado ou outra saída | strings; retornar booleano | strings em ordem de dicionário |
| 3 | Médio | Comparar por um campo / regra | objetos, comparar `.name` | objetos ordenados por campo |
| 4 | Médio | Variante que muda a condição | último em vez do primeiro; contar | primeira posição ≥ alvo (lower bound) |
| 5 | Difícil | Combinar com outra ideia ou um invariante novo | dois alvos, janela | achar o "buraco" / ponto de virada |

Regras:

- O degrau 1 tem que ser resolvível por quem acabou de ler a lição, sem dica.
- Do 3 em diante, um teste extra pega o erro clássico daquela variante.
- Nunca dois degraus com o mesmo mundo/personagem. Um mundo pode reaparecer em **outra lição** (o elenco recorrente cria pertencimento), mas com outra situação.
- Slots vazios da escada aparecem como "Em breve" na lição e na barra da tela de resolver (`ladder()` em `src/exercises/index.ts`).
