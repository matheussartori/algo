# A cena: o personagem encena o código

Arquivos: `src/game/engine.ts` (contrato + roteiro), `src/game/scenes/*.ts` (renderizadores), `src/components/solve/Stage.tsx` (painel).

## Como funciona

1. O runner (`src/lib/runner/core.ts`) envolve o 1º argumento (array) num Proxy e grava **cada índice lido, em ordem** (`TestResult.trace`, até 400).
2. A cena encena o **primeiro teste que falhou**, ou o primeiro teste se tudo passou.
3. `toBeats()` transforma `{trace, returned, expected, pass, failed}` num roteiro de batidas. O `createDirector()` toca as batidas numa `Scene`. Rodar de novo cancela a anterior.
4. Toda cena implementa o mesmo contrato `Scene` (`moveTo`, `inspect`, `found`, `nothing`, `outOfBounds`, `celebrate`, `frustrated`, `confused`, `idle`, `setSpeed`, `destroy`). Um **mundo** (`SceneKind`: `island`, `pond`…) é uma cena reaproveitada por vários exercícios.
5. `scenes/strip.ts` é o fallback universal (array de células + ponteiro). Ele carrega a mesma informação; os mundos ilustrados só acrescentam.
6. Os mundos ilustrados usam o estilo **Flash cutout**: um rig de ossos em Canvas 2D sobre `src/game/cutout/kit.ts`. O `Stage` do kit cuida do canvas, do resize, da câmera (com `band` e `minView`), do loop e das batidas. As peças são `Path2D` com `cel()`, que aplica uma sombra chapada e o contorno. As poses viram keyframes (`K`, `sample`) e as molas cuidam do movimento secundário. Os modelos são `island.ts` (pirata) e `pond.ts` (sapo).
7. Se o array foi cortado para caber na tela (`slots` < `total`), as leituras além do que aparece acontecem fora de cena; só uma leitura além de `total` vira `outOfBounds`.

## Cada erro tem uma cara

| O que o código fez | Batidas | O que o aluno vê |
|---|---|---|
| Acertou | visitas → `found` → `celebrate` | Personagem acha e comemora |
| Retornou índice errado | visitas → vai até o índice retornado → `nothing` → `frustrated` → volta pra casa | Cava no lugar errado, nada, decepção |
| Retornou -1 cedo demais | visitas (curtas) → `frustrated` → volta | Desiste com o alvo ainda na frente |
| Não parou no primeiro | visitas passam do alvo | Passa direto pelo tesouro |
| Leu fora do array (`i <= length`) | `outOfBounds` | Anda além da última posição (cai na água, bate na cerca) |
| Erro de execução, timeout, sintaxe | `confused` → volta | Interrogação, coça a cabeça |
| Leu demais (binária linear) | muitas visitas, corte no meio | Personagem cansado; teste diz "leu N, limite M" |

## Tempo (orçamento por batida, velocidade 1×)

- andar: 250–350 ms por posição · olhar/cavar: 300–500 ms · achar: ~900 ms · frustração: 1–1,5 s.
- Playback típico: 3–8 s; teto ~10 s. `MAX_VISITS = 24`: corridas longas mostram as primeiras e as últimas visitas.
- Controles: 1×/2×, Pular cena (estado final na hora), Repetir. Novo Rodar cancela.

## Acessibilidade

- `prefers-reduced-motion`: sem deslocamento, batidas curtas (≤ 80 ms), mesma informação.
- Linha narrada em `aria-live` (`Stage.tsx`, função `narrate`): "Posição 2: 9.", "O código disse 7, mas não é ali."
- Idle em loop precisa ser discreto; se durar mais de 5 s com movimento grande, ofereça pausa (WCAG 2.2.2).

## Criar um mundo novo

1. Acrescente o nome em `SceneKind` (`src/exercises/types.ts`).
2. Crie `src/game/scenes/<mundo>.ts` exportando `create<Mundo>Scene(host, setup): Scene`. Leia `slots`, `target` e `total` do `setup`; mostre o valor de cada posição de forma legível (rótulo ou desenho contável).
3. Copie a estrutura de `pond.ts`: paleta própria, `EMO` e `BASE`, a geometria criada na primeira chamada (o SSR não tem `Path2D`), as batidas e depois o desenho. Antes de desenhar, pesquise referências e anote paleta, peso de linha e timing. As regras que valem para todos os mundos:
   - contorno escuro tingido com a cor do mundo, nunca preto;
   - um único tom de sombra por material;
   - fundo dessaturado e mais claro perto do horizonte, e o personagem como a coisa mais saturada da cena;
   - antecipação antes de cada ação e squash/stretch nas aterrissagens;
   - piscar em intervalo aleatório (2–6 s);
   - poeira ou respingo a cada contato com o chão ou a água.
4. Estados mínimos do personagem: parado (respira/pisca), andando (com direção), olhando/agindo, decepcionado, comemorando, confuso. Opcional: cansado.
5. Registre o mundo no `Stage.tsx` (mapa `SceneKind → fábrica`), mantendo o strip como fallback quando o mundo falhar ao iniciar (sem WebGL/WebGPU, erro de asset).
6. A paleta da cena fica dentro do mundo, e a cena tem cor própria nos dois temas. As cores de UI em volta vêm dos tokens (`src/styles/tokens.css`).
