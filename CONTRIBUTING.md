# Contributing to algo

Thanks for helping. Issues and pull requests can be written in English or Portuguese.

## Ways to help

- **Fix content.** Typos, wrong explanations and confusing steps. Open a "Content error" issue or send a PR straight away.
- **Translate.** Every page exists in `src/content/docs/` (pt-BR) and `src/content/docs/en/` (English). The two must stay in sync.
- **Add a topic.** An algorithm, an exercise or both. Open a feature issue first so we can agree on the scope.
- **Report bugs** in the player, the editor, the runner or the landing.

## Setup

```sh
npm install
npm run dev
```

Node 22+ is required (see `.nvmrc`).

## Before you open a PR

```sh
npm run check   # types
npm test        # algorithms, exercises, runner
npm run build   # the static build must pass
```

CI runs the same three commands.

## Guidelines

- **Algorithms** are written once as a generator (`steps`) plus a plain version (`run`). Tests compare the two, so keep the trace honest and the line numbers right.
- **Exercises** need a starter that fails and a solution that passes. Hints go in both languages.
- **Every new or changed page needs both languages.** If you can only write one, say so in the PR and someone will help with the other.
- **Styling** goes through the tokens in `src/styles/tokens.css`. Do not hard-code colours or fonts.
- **Motion** must have a `prefers-reduced-motion` fallback, and the page must work without WebGPU.
- Keep PRs small and focused. One topic or one fix per PR is easiest to review.

## Commit messages

Short, imperative and in English, for example `Add bubble sort player` or `Fix off-by-one in binary search hint`.

## License

By contributing, you agree that your code is released under the [MIT License](LICENSE) and your content (text, exercises, images) under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
