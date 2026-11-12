# algo

Algoritmos e estruturas de dados, passo a passo, em TypeScript e JavaScript.
Cada tópico combina explicação, visualização interativa (com modo **Prever**), exercícios com testes rodando no navegador e perguntas de revisão.

## Rodando

```sh
npm install
npm run dev      # http://localhost:4321
npm test         # Vitest: algoritmos, exercícios e runner
npm run check    # astro check (tipos)
npm run build
```

## Arquitetura

| Pasta | O que tem |
| --- | --- |
| `src/algorithms/` | Cada algoritmo escrito **uma vez** como generator (`steps`) que emite `Step`s. O player, o destaque de linha e o modo Prever leem dele. `run` é a versão simples, usada nos testes para conferir o trace. |
| `src/exercises/` | Definição dos exercícios: starter e solução em TS (a versão JS é derivada), testes visíveis/ocultos, dicas em pt-BR e en. `maxReads` limita leituras no array para exigir O(log n). |
| `src/lib/runner/` | Executor: `core.ts` (puro, transpila TS com sucrase e roda os testes), `worker.ts` e `client.ts` (Web Worker novo por execução, timeout de 3s). |
| `src/components/` | Wrappers `.astro` usados no MDX (`AlgoPlayer`, `Exercise`, `Quiz`) e as ilhas React. |
| `src/content/docs/` | Conteúdo. Raiz = pt-BR, `en/` = inglês. |

### Adicionando um algoritmo

1. Crie `src/algorithms/<tema>/<nome>.ts` exportando um `AlgorithmDef` e registre em `src/algorithms/index.ts`.
2. Use no MDX: `<AlgoPlayer algo="<id>" input={{ ... }} />` (acrescente `predict` para começar no modo Prever).
3. `npm test` valida que as linhas existem e que o trace bate com `run`.

### Adicionando um exercício

1. Adicione um `ExerciseDef` em `src/exercises/` (o teste garante que a solução passa e o starter não).
2. Crie a página em `src/content/docs/.../<slug>.mdx` (e a versão em `en/`) com `<Exercise id="<id>" />`.

### Segurança

O código do aluno roda num Web Worker: sem acesso ao DOM, e um loop infinito é encerrado. **Não é um sandbox para código de terceiros.** Se um dia for possível compartilhar código entre usuários, rode-o num `<iframe sandbox>` de outra origem ou com QuickJS.
