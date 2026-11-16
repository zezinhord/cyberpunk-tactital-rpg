# Nova Arcádia 0.7.7 — Implementação cinematográfica

**Compromisso:** modificações aprovadas são implementadas, não apenas propostas.

## Entregas
- Oito quadros em `src/game/story/opening.ts`: Áurea/Baixada, movimento de fundo, chuva e drone, prontuário, interferência Éden e final de V-09.
- `OpeningCutscene.tsx` mantém pular, digitação gradual, redução de movimento, seis origens e adiciona modo automático opcional. Aparência do protagonista usa os próprios sprites da origem e apresentação selecionadas.
- `NarrativePortrait.tsx` mostra bustos vetoriais locais dos personagens, com estilos de cabelo/roupas próprios e mudança de expressão; Éden e terminais têm artes não humanas.
- `NpcDialoguePanel.tsx` mostra busto, emoções, fala digitada, histórico, respostas, continuar/revelar/fechar. `ExplorationScreen.tsx` preserva todos os gatilhos de pistas, comércio, missão e decisões.
- `dialogue-cinematic.css` limita o painel à altura landscape e usa rolagem interna para falas e respostas. Botões de escolha >=48px; sem rede.
- QA em `test-opening.mjs`, `test-narrative-ui.mjs` e capturas Chromium.

## Limites
Os bustos são ilustrações SVG leves e originais em código, **não pinturas de retrato definitivas**. Cenas são CSS em camadas, sem dublagem. QA Chromium não substitui teste físico em Galaxy A07/Redmi Note 12S. Não fazer merge em main sem aprovação.
