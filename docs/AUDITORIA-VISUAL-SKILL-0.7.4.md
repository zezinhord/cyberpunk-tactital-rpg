# Auditoria de design Nova Arcádia — 0.7.4 (primeira passagem)

**Fonte da análise:** árvore de código da branch `feature/nova-arcadia-game-art-ui-skill-v1`, baseada na candidata 0.7.3, e arquivos da skill `.agents/skills/nova-arcadia-game-art-ui`. A comparação visual em execução não foi inspecionada ao redigir esta primeira passagem.

## Achados verificáveis no código

| Prioridade | Local | Evidência | Consequência | Decisão |
|---|---|---|---|---|
| Alta | `src/components/BaixadaLiteWorld.tsx` | `paint()` projeta mundo com `cameraPosition`, mas `pointer()` invertia a projeção com `renderPosition` | Toques podem atingir tiles/NPCs diferentes dos exibidos enquanto a câmera segue o herói com atraso | Corrigido na branch, com teste de regressão |
| Alta | `src/game/districts/catalog.ts`, `DistrictScene.ts` | Cinco regiões partilham apenas três padrões de blocos (`ringA/B/C`), com fachadas primitivas geradas por retângulos | Risco alto de aparência genérica e pouca identidade regional; não é prova de defeito visual sem screenshot | Redesign modular **a projetar**, sem substituir artes nesta etapa |
| Média | `src/arena-v030.css` | Leitura de alcance/cobertura/intenção em 9–10px em height <=480, e resumo de habilidades em 10px | Texto crítico ilegível em Android de baixa altura | Aumentado para 12px, requer verificar layout em 914×411 |
| Média | `src/game/baixada/lite-art-assets.ts` | Lia, Ramon, Duda, Iza e Tomas reaproveitam spritesheets de protagonistas; alguns NPCs também compartilham texturas | Silhuetas pouco distintas, confusão de personagens | Priorizar novos NPCs originais por etapas, com novo atlas leve |
| Média | `src/theme/tokens.ts` e `src/game/districts/catalog.ts` | Catálogo de tokens ambientais inclui `limite_urbano`, mas não `setor-zero`, `prisma`, `periferia` | Fontes de cor divergentes; onde `getDistrictPalette` for usado poderá haver fallback de Limbo | Verificar usos e normalizar em mudança futura; sem alterar cores desta entrega |
| Média | `src/arena-v030.css` | Vários metadados, rótulos e descriptions em 9–11px | Dívida de legibilidade em todo o HUD | Registrar e refatorar por tela após screenshots |
| Baixa | `docs/BRIEF-DE-DESIGN.md`, `docs/DECISOES-DO-PROJETO.md` | Documentos históricos ainda indicam portrait e combate corpo a corpo como configuração inicial | Diretrizes antigas podem incentivar regressão | Priorizar decisões de landscape/código e skill atual |

## O que foi preservado
- Arte tropical da Baixada (`drawCityBuilding`, `drawCityProp`, `drawLiteSprite`); sprites por origem e apresentação; sistema de regras, saves, colisões, missão e áudio.
- Cores e formas funcionais ciano aliado, magenta hostil, âmbar neutro, verde do Éden; nenhuma mudança de tokens.
- Tela horizontal sem joystick fixo e controles principais fixos na arena.

## Alterações desta branch
1. Sincronizar inversão de toque e posicionamento de marcadores com a câmera efetivamente usada para desenhar.
2. Elevar legibilidade do resumo de táticas e do botão de habilidades a 12px sem redesenhar a arena.
3. Integrar o checker da skill e o teste de geometria do toque à CI desta branch.

## Aceite / limites
- A automação deverá validar contrato de cores, fontes CSS, 12 sprites, assets, testes existentes, boot em Chromium e screenshots em landscape 1600×720/914×411.
- **Nenhuma melhoria estética foi aprovada subjetivamente.** É obrigatório examinar screenshots produzidos e testar fisicamente em dispositivos Android (Galaxy A07, Redmi Note 12S ou equivalentes).
- Não afirmar FPS ou estabilidade física apenas com testes em runner. Não mesclar `main` nem publicar APK automaticamente.
- PR em rascunho. Trabalho maior de cenários/NPCs deverá ser realizado em outra PR após revisão visual.
