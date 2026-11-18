# Nova Arcádia — auditoria M0 e integração de finalização 1.0.0-rc

**Referência:** *Nova Arcádia — Plano definitivo de finalização*, 18/11/2026, 24 páginas.
**Base congelada:** `feature/nova-arcadia-gameplay-depth-v091`, commit `87aac85850ab3f8ca6272e72a03680436d7f9321` (v0.9.1-rc.1).
**Integração isolada:** `feature/nova-arcadia-finalization-v100-rc`. Não houve merge na `main` nem substituição da APK anteriormente distribuída.

> **Critério de verdade:** `tsc`, compilação Android e simulações em Node não substituem homologação física nem playthrough da campanha de 5–8 horas. A nova APK 1.0.0-rc.1 recupera mídia original de uma APK 0.9.1 verificada e foi recompilada e assinada na própria integração.

## Inventário e verificações do código

| Conteúdo | Base observada / evidência | Situação nesta integração |
|---|---|---|
| 11 classes oficiais | `src/game/classes/registry.ts` e `scripts/test-class-abilities.mjs` | IDs e poderes preservados; 66 combinações de classe × origem cobertas pelo teste `test-class-saves.mjs`. Não certifica 66 playthroughs. |
| 6 origens | `src/game/character/origins.ts`, criação e `test-class-saves.mjs` | Preservadas; identidade em cenas e epílogos ainda pede QA visual físico. |
| 7 distritos | Baixada, Ferrugem, Áurea, Subsolo, Setor Zero, Prisma e Periferia | Estruturas preservadas; `scripts/test-districts.mjs` testa cinco mapas regionais. Percurso completo em celular pendente. |
| 21 ocorrências urbanas | `src/game/story/urban-chronicles.ts`, `scripts/test-urban-chronicles.mjs` | Persistência, decisões e repercussões em testes unitários; as ocorrências não equivalem a 21 missões longas. |
| 15 favores | `src/game/story/favors.ts` | Catálogo preservado; integração de todos os contratos requer teste in-game. |
| 35 itens e fabricação | `src/game/inventory.ts`, `src/game/crafting.ts` | Equipamentos, itens, recibos e crafting preservados; economia real por ato ainda não medida. |
| Combate e IA | `src/game/TurnManager.ts`, `src/components/Battlefield.tsx`, `src/game/tactics.ts` | SVG, cobertura, Vigilância e arquétipos existentes preservados; `test-tactics.mjs` e regressões. |
| Arco pós-V-09 | `src/game/story/eden-echoes.ts` | 10 etapas e dois confrontos existentes; 3 opções políticas finais agora integradas na UI, com epílogos e retornos. O clímax multietapa proposto no documento ainda NÃO foi implementado. |
| Áudio | `src/audio/director.ts`, geradores em `tools/` | Biblioteca original mantida; recuperação de áudio por hash da APK 0.9.1, sem síntese artificial adicional. |
| Salvos e backup | `src/game/character/backup.ts`, `slots.ts`, `eden-echoes.ts` | Corrigida limpeza de dados Éden e restauração integral de arquivos antigos, com teste de rollback. |

## Matriz de rastreabilidade por sistema

| Sistema | Arquivo-fonte | Status antes → nesta branch | Principal risco | Teste automatizado | Teste físico | Decisão |
|---|---|---|---|---|---|---|
| Login local/personagem (slots) | `character/storage.ts`, `character/slots.ts` | Funcional com lacuna → exclusão de Éden corrigida | P0, dados residuais | `test-save-slots.mjs` | Pendente | Corrigir/preservar |
| Backup v1 e importação | `character/backup.ts` | Parcial → ausências restauram estado vazio com rollback | P0, mistura de campanhas | `test-save-slots.mjs` | Pendente | Corrigir |
| Fatos Éden | `story/eden-echoes.ts` | 2 opções → 3 opções, validadas em v1 | P1, persistência/epílogo | `test-eden-echoes.mjs`, `test-eden-governance.mjs` | Pendente | Expandir |
| Epílogo regional | `story/eden-epilogues.ts`, `ExplorationScreen.tsx` | Ausente → resumo modular, 3 impactos por final | P1, profundidade ainda insuficiente | `test-eden-governance.mjs` | Pendente | Expandir |
| Interação e HUD | `screens/ExplorationScreen.tsx`, `eden-epilogue.css` | Parcial → seletor de final, volta ao mapa e créditos | P1, legibilidade landscape | TypeScript + QA visual existente | Pendente | Corrigir |
| Reputação e honra | `story/reputation.ts` | Funcional → 3 respostas políticas distintas | P1, consequências invisíveis | `test-eden-echoes.mjs`, `test-eden-governance.mjs` | Pendente | Expandir |
| IA e tabuleiro | `game/TurnManager.ts`, `components/Battlefield.tsx` | Preservado, sem troca de renderer | P0, saída do combate/bugs WebView | `test-tactics.mjs`, `test-combat-defeat.mjs` | Pendente | Preservar/testar |
| Mapa e colisões | `game/districts/*`, `game/baixada/*` | Preservado | P0, barreiras/oclusão | `test-districts.mjs` | Pendente | Corrigir após captura |
| Classes e habilidades | `game/classes/*`, `game/progression/*` | Preservado | P1, seleção/técnicas ausentes | `test-class-abilities.mjs`, `test-class-saves.mjs` | Pendente | Testar |
| Inventário e crafting | `game/inventory.ts`, `game/crafting.ts` | Preservado | P1, custos e duplicações | `test-crafting.mjs` | Pendente | Testar |
| Recursos gráficos | `game/baixada/sprites.ts`, `game/districts/art.ts` | Preservado | P1, arte provisória/oclusão | Contrato `check-visual-contract.mjs` | Pendente | Refino visual |
| Android/assinatura | `capacitor.config.ts`, `.github/workflows/finalization-android-qa.yml` | APK 1.0.0-rc.1 integral compilada, auditada e assinada na CI | P0, instalação e upgrade físicos pendentes | Android QA #44236725370 | Obrigatório | Manter QA separado |

## Os dez maiores riscos (em ordem de bloqueio)

1. **P0:** ausência de instalação e playthrough físicos recentes (Galaxy A07, Redmi Note 12S, Moto G34 5G); regressões de memória, loading e WebView não descartadas.
2. **P0:** campanha completa e roteiro de missão até os créditos não foram percorridos manualmente; testes unitários não garantem ausência de softlock.
3. **P0:** atualização de versões/assinatura Android pode gerar incompatibilidade de instalação; exigidos backup e teste de assinatura antes do APK público.
4. **P0:** operações de estado ainda usam vários registros de armazenamento separados; rollback é verificado para importação, não para toda transação de gameplay.
5. **P1:** as missões finais A–G e o confronto de duas fases reais descritos no PDF não estão integrados; o epílogo novo NÃO equivale a esse clímax.
6. **P1:** três finais existem como decisões, reputações, itens e consequências regionais visíveis, mas ainda precisam de ramificações jogáveis maiores e efeitos sistêmicos adicionais.
7. **P1:** o jogador pode enfrentar caminhos narrativos/rotas bloqueadas em algumas combinações de classe e origem; 66 testes de schema não substituem jornadas.
8. **P1:** estética da Baixada, animações, profundidade, cutscenes e seleção de técnica podem regredir no Android horizontal.
9. **P1:** a distribuição >1 GB anterior é dominada por áudio; tempo de build, memória em execução e downloads continuam a exigir auditoria por asset e dispositivo.
10. **P1:** falta medição real de economia, balanceamento e tempo por ato; não há prova da meta de 5–8 horas.

## Mapa de dependências e decisões

```text
Personagem/origem/classe ─┬─> combate/atributos/árvores ──> progresso/XP/recibos
                          └─> exploração/diálogos ─────────> evidências/fatos
Fatos + facções + ocorrências ──> final de Éden ──> impactos distritais + epílogo
Regras e gameplay ──> storage/backup v1 ──> CI ──> APK QA ──> testes Android
```

- Fonte de verdade do encerramento: `EDEN_KEY + character.id`. `EdenProgress` guarda `ending` e histórico; epílogo é **derivado**, não novo save redundante.
- Mecanismos de idempotência: `questRewards` do protagonista e `rewardReceipts` do inventário. Verificar a mesma decisão duas vezes não deve recompensar novamente.
- Dados de `EdenProgress` versão 1 com `publicar` e `resguardar` são preservados; o novo identificador `autonomia` é aceito pelo validador v1.
- Importação sobrescrita remove campos que o backup antigo não contém, revertendo mudanças em caso de falha de gravação.
- `main`, branch de mídia 1 GB, APK e histórico públicos permanecem intocados.

## Marcos de entrega: progresso comprovado / pendente

| Marco do PDF | Situação | Critério restante |
|---|---|---|
| M0 — congelar base e auditar | **Parcial** | Capturas reais, APK/FPS/RAM e inventário completo de funções runtime. |
| M1 — núcleo sem P0 | **Parcial** | Save corrigido em dois pontos; teste integral de todas as rotas, carga, cura e combate em Android. |
| M2 — conclusão narrativa | **Parcial** | Três decisões, epílogo e créditos integrados; faltam missões A–G e clímax de duas fases. |
| M3 — 11 classes/6 origens e conteúdo RPG | **Parcial** | Regressões automáticas; checar identidade de todas as classes e rotas em jogo. |
| M4 — arte, UX e acessibilidade | **Parcial** | Novo painel de epílogo; revisão artística ampla e dispositivos menores pendentes. |
| M5 — homologação Android | **Parcial** | APK assinada e auditada na CI; migração de saves, 30 min em aparelho e FPS/memória pendentes. |
| M6 — publicação 1.0.0 | **Estável bloqueado; QA RC publicada** | Playthrough completo, dispositivos e decisão de GO pendentes. |

## Medições que NÃO podem ser declaradas como concluídas

- Espaço instalado e consumo temporário de armazenamento em Android real (APK e assinatura na CI verificados).
- FPS, picos de memória, cold boot e taxa de crash em dispositivos físicos.
- Duração de 5–8 horas e três rotas finais jogadas do começo aos créditos.
- Validação visual de sprites, corpo/identidade e cenas com captura de 914×411 e outro tamanho de tela.

**Decisão editorial:** manter o código em branch de pré-finalização e PR em rascunho, com tag **prerelease QA** isolada, sem tag estável e sem alterar a `main`. Três finais no modelo de regras ainda não homologam 1.0.0 estável.


## APK 1.0.0-rc.1 — resultado da CI Android
- **Workflow:** https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/44236725370 — conclusão `success`.
- **Release de QA:** https://github.com/zezinhord/cyberpunk-tactital-rpg/releases/tag/nova-arcadia-v100-rc1-full-qa
- **Arquivo:** `NovaArcadia-1.0.0-rc.1-Full-1GB-QA.apk` — **1.143.067.327 bytes**.
- **SHA-256:** `70f857587019e9d49a0ba3f8f20a982d503452bfb9df22fdb82cdcf7953feb18`.
- **App ID separado:** `com.cyberpunk.tacticalrpg.qa100`; VersionName `1.0.0-rc.1`; VersionCode `1000001`.
- **Commit de código/compilação:** `82ca799e80c4f7564df9dbed2f7d351ffee5b07e`.
- **Verificado na CI:** código TypeScript, 66 combinações, saves, derrota, crafting, web build, Gradle, versão, assinatura via `apksigner` e auditoria de conteúdo.
- **Mídia:** APK anterior validada pelo SHA-256 antes de extrair somente 56 trilhas, 28 ambiências e 112 ambientes expandidos efetivamente referenciados.
- **Próximo gate:** Android real, FPS/RAM, migração e playthrough. Consulte `docs/QA-ANDROID-100-RC1.md`.
