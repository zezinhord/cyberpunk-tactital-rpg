# Nova Arcádia 0.7.6 — Baixada + NPCs próprios

**Base:** CI #692 da candidata 0.7.5. **Diretriz:** skill `nova-arcadia-game-art-ui`.

## Capturas comparadas da v0.7.5
`baixada-1600x720.png`, `baixada-android-canvas-914x411.png`,
`distrito-aurea-914x411.png`, `distrito-prisma-914x411.png`,
`distrito-subsolo-914x411.png`, `distrito-setor-zero-914x411.png`,
`distrito-periferia-914x411.png`, `arena-comandos-fixos-1600x720.png`.

A Baixada possui arquitetura mais distinta, mas telhados e paredes repetiam adereços. Os cinco distritos tinham edifícios isométricos presos ao fundo estático: o personagem nunca passava atrás deles. Seus contatos tinham silhuetas geométricas provisórias.

## Implementações
1. Baixada Canvas 2D: parapeitos, emendas do teto, calhas, canos, reboco e pequenas varandas, sem nova colisão ou fonte remota. Marcador de localização ciano quando fachada de primeiro plano cobre o protagonista.
2. Distritos: fundo/piso fica em textura grande estática; seis edifícios viram imagens recortadas ao próprio volume com profundidade e alfa condicionado à presença do herói atrás da fachada. Reduz consumo versus uma textura 1560×940 por construção.
3. 12 spritesheets PNG 256×320, quatro direções e quatro passos, cada personagem com identidade própria: **Lia, Ramon, Duda, Iza, Tomas, Davi, Marta** (Baixada) e **Celina, Mara, Iuri, Kai, Dara** (contatos de distrito). Geração reproduzível em `tools/generate_character_sprites.py`. Cada distrito pré-carrega só seu guia.
4. Novos testes e capturas: `scripts/test-npc-sheets.mjs`, `scripts/test-baixada-art.mjs`, `scripts/test-visual-depth.mjs`, `qa/npc-matrix-v076.png` e PNGs dos distritos. O script de QA valida markers de arte e de guia.

## Preservação e limites
Baixada 39×34, cinco distritos, 35 objetivos, 11 classes, 6 origens, corpo selecionado, saves, colisão, rádio e progressão intactos. Não alterou `main`.
Os NPCs de apoio ainda são provisórios. Os 12 sprites novos são **procedurais**, não ilustrações manuais definitivas. Avaliação de perspectiva/oclusão depende da inspeção do Chromium; FPS/memória exigem teste físico em Galaxy A07 e Redmi Note 12S. Não homologar automaticamente.
