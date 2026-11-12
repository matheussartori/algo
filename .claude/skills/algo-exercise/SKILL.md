---
name: algo-exercise
description: Cria ou revisa exercícios do algo, com história curta e gamificada, tema sempre novo, testes, dicas e a cena em que um personagem encena o código do aluno. Use ao criar a escada de 5 exercícios de uma lição, ao escrever enunciado/história/dicas ou ao ligar um exercício a uma cena (island, pond…). O texto segue a skill algo-writing.
---

# Construir exercícios do algo

Cada lição tem **5 exercícios**, do mais fácil ao mais difícil. Cada um é uma micro-aventura: uma história de 2 a 4 frases, uma tarefa clara e uma cena em que um personagem **faz exatamente o que o código do aluno fez**. Errou, o personagem se frustra e volta. Acertou, comemora.

Antes de escrever texto, carregue a skill **algo-writing**. Ela vale para história, enunciado e dicas.

## Princípios (o que a pesquisa diz)

- **A mecânica é o algoritmo.** O teste do "brócolis com chocolate": se trocar o personagem por um "Correto ✓" não perde nada, a história é só enfeite. A cena precisa mostrar algo que a lista de testes não mostra: quantos passos, onde parou, onde errou.
- **História vende engajamento, não acerto.** Estudos com problemas contextualizados mostram efeito neutro no desempenho e algum ganho de motivação, com custo de carga de leitura. Por isso: curta (≤ 60 palavras), e a especificação técnica fica **separada** da história.
- **Falha divertida e rápida.** Rodar → ver → editar em menos de 1 s de atrito. Animação de falha de 1–1,5 s, pulável, e cancelada por um novo Rodar. Nada punitivo, nada de vida/energia.
- **Humor do personagem, nunca do aluno.** O capitão é confiante demais, o mapa é ruim, o sapo é preguiçoso. Nunca "você errou, burro". Sem exclamação de torcida ("Mandou bem, dev!"): adulto lê como condescendência.
- **Competência, autonomia, pertencimento** (autodeterminação): a escada sobe a dificuldade aos poucos; o aluno pode pular, escolher TS/JS, esconder a cena; o elenco de cada mundo se repete dentro da lição.
- **Recompensa leve.** Marcar "Feito" e oferecer o próximo. Sem XP, ranking ou streak.

## Fluxo

1. **Leia o estado atual**: `src/exercises/*.ts`, `src/exercises/types.ts`, e o registro de temas em [`references/themes.md`](references/themes.md). Veja que temas, personagens e cenários já foram usados **no site inteiro**.
2. **Planeje a escada de 5** (formato em [`references/ladder.md`](references/ladder.md)): o que cada degrau acrescenta. Um conceito novo por degrau.
3. **Escolha os temas**: 5 temas diferentes entre si e diferentes de tudo no registro. Varie **ator** (pessoa, bicho, robô, fantasma…), **cenário** (mar, espaço, cozinha, subsolo…) e **tom** (aconchegante, tenso, bobo). A metáfora tem que ser literal: array ordenado ↔ coisa que naturalmente está em ordem (folhas numeradas, andares, datas).
4. **Escreva a história** com a fórmula de [`references/story.md`](references/story.md).
5. **Escreva tarefa, exemplos, testes, dicas e recap** (campos de `ExerciseDef`).
6. **Ligue a cena**: escolha um `scene` existente ou crie um mundo novo seguindo [`references/scene.md`](references/scene.md).
7. **Registre** os temas usados em `references/themes.md`, acrescente o exercício ao `sidebar` em `astro.config.mjs` e rode `npm test` e `npx astro check`.

## Campos de um exercício (`ExerciseDef`)

| Campo | Regra |
|---|---|
| `id` | `<algoritmo>/<slug-do-tema>`, estável (é URL e chave do localStorage). |
| `lesson`, `order` | Slug da lição sem locale; 1–5. |
| `title` | 2–5 palavras, nome próprio do mundo ("O mapa do Barba-Rala"), pt-BR e en. |
| `story` | 2–4 frases, ≤ 60 palavras. O valor-alvo em **negrito**. Teste de CI barra > 70. |
| `task` | Assinatura em `code`, o que cada parâmetro é, o que retornar, o caso de borda (`-1`). Sem piada aqui, só clareza. Pode fechar com uma consequência no mundo ("e o capitão volta pro navio"). |
| `examples` | 2–3 chamadas com resultado; uma delas é o caso de borda, com `note`. |
| `recap` | 2–3 frases resumindo a lição, para a aba "Lição". |
| `goal` | O que o personagem quer, em 3–6 palavras, mostrado na cena ("Carta para a folha 42"). |
| `entry`, `starter`, `solution` | Nomes de função e parâmetros **do mundo** (`findTreasureTree(trees, branches)`), não `arr`/`target`. Starter compila e falha; sem comentário dentro (o mesmo starter serve pt-BR e en). |
| `tests` | 3 visíveis (caso típico, borda que acerta, não encontrado) + 2–4 extras (vazio, repetidos, grande, limite de leituras). **Todos com `name`** no idioma do mundo ("ilha sem árvores"). O primeiro teste visível é o que a cena mostra parada: 6–10 elementos. |
| `hints` | 3 degraus: empurrão (pergunta), conceito (o que usar), quase-resposta (pseudocódigo). Nunca a resposta inteira; ela está em "Ver solução", liberada depois do primeiro Rodar. |

Busca binária e afins: use `maxReads: binarySearchBudget(n)` num teste grande para recusar varredura linear, e diga isso na `task` em linguagem do mundo ("o Ribas aguenta uns 20 pulos").

## Checklist final

- [ ] História ≤ 60 palavras, situação → restrição que força o algoritmo → (opcional) piada seca.
- [ ] Tema não aparece em `references/themes.md`; os 5 da escada variam ator, cenário e tom.
- [ ] Trocar o personagem por "✓" perderia informação (a cena mostra o caminho do código).
- [ ] Cada classe de erro comum tem um teste e uma reação visível na cena (`references/scene.md`).
- [ ] `name` em todos os testes, nos dois idiomas.
- [ ] `npm test` e `npx astro check` passam.
- [ ] Registro de temas atualizado.
