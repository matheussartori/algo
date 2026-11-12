# A história: curta, engraçada, a serviço do algoritmo

Modelo: Advent of Code (puzzles com história de poucas linhas, sem ambiguidade, sem conhecimento externo, uma resposta certa). As regras de estilo abaixo são inferência a partir do AoC + pesquisa sobre contexto em problemas de programação.

## Fórmula (2–4 frases, ≤ 60 palavras)

1. **Quem e o que quer** (o alvo em **negrito**).
2. **A restrição que força o algoritmo.** É a frase mais importante. Ela faz o aluno *deduzir* o algoritmo pela história.
   - linear: "não confia na própria vista, vai de árvore em árvore"; "a fila não tem ordem nenhuma".
   - binária: "as folhas estão numeradas em ordem" + "cada pulo cansa".
   - ordenação: "o caminhão só aceita caixas da mais leve pra mais pesada".
   - grafo: "as portas só abrem pra um lado".
3. **A tarefa em palavras do mundo** (ou deixe para o campo `task`).
4. Opcional: **uma piada seca** ou uma pequena reviravolta. Subestimação funciona melhor que exagero.

## Tom

- Seco, observador, levemente absurdo. O personagem é competente-mas-falho (vaidoso, preguiçoso, distraído, medroso).
- Nomes com trocadilho leve em pt-BR e equivalente em en (Barba-Rala / Stubble; Sapo Ribas / Ribbit). Não traduza o trocadilho literalmente: crie outro.
- Sem exclamação, sem "aventureiro!", sem "Você consegue!". Sem violência gráfica. Sem referência a marcas, filmes ou personagens existentes.
- Cada idioma é escrito direto, não traduzido (skill algo-writing).

## Exemplos

**Bom (linear, 55 palavras):**
> O Capitão Barba-Rala achou o mapa do avô. Nada de X, nada de passos: só o desenho de uma árvore com **5 galhos**. A ilha tem árvores pra todo lado, cada uma com um número diferente de galhos, e o capitão não confia na própria vista. Ele vai de árvore em árvore, contando.

Por que funciona: o alvo é claro; a restrição ("não confia na própria vista", "de árvore em árvore") *é* a busca linear; o defeito do capitão é a piada.

**Ruim:**
> Bem-vindo, jovem programador! Nesta emocionante aventura pelos sete mares, você vai ajudar o temido pirata a encontrar seu tesouro perdido usando o poderoso algoritmo de busca linear!

Por que falha: torcida, adjetivos vazios, nomeia o algoritmo (tira a dedução), não tem restrição, não tem personagem.

## Cena e história andam juntas

Escreva a história pensando no que o personagem **faz** em cada passo do algoritmo: andar até a árvore e cavar; pular para a folha do meio e ler o número; abrir a gaveta. Se não dá pra imaginar a ação visível de "olhar o elemento i", o tema é ruim para esse algoritmo.
