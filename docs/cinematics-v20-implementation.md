# Nova Arcádia 2.0 — auditoria e expansão cinematográfica integrada

**Data:** 23/11/2026.  
**Base:** `feature/nova-arcadia-v20-battlefield-redesign` (encadeada ao PR #26; essa base deriva de `feature/nova-arcadia-3gb-final-assets`, PR #22).  
**Branch:** `feature/nova-arcadia-v20-cinematics-rework`.

## Auditoria: infraestrutura cinematográfica existente

| Componente anterior | Diagnóstico | Ação nesta alteração |
|---|---|---|
| `src/components/OpeningCutscene.tsx` | 8 quadros, texto com efeito de máquina, pouca atuação/câmera, duração fixa sem timeline; única variação por origem concentrada em uma fala | Mantidos os 8 quadros canônicos; inseridos enquadramentos/tempos explícitos, 6 fundos de memória, controle de velocidade, autoplay e confirmação de pulo |
| `src/game/story/opening.ts` | História já incluía Áurea, Baixada, arquivos V-09 e Éden; marcadores de progresso corretos | Mantidas as pistas, sem revelações novas; tomadas da cidade totalizam 89 segundos de orçamento nominal |
| `src/components/NpcDialoguePanel.tsx` | Retratos e expressões existentes, mas todas as conversas tinham quase o mesmo enquadramento; o botão continuar podia encerrar uma página com escolha pendente | Três níveis de atuação em um único componente; escolha nunca avança sem callback oficial |
| `src/components/NarrativePortrait.tsx` | Busto SVG por personagem e expressão textual inferida; recursos visuais já aprovados | Reutilizados sem substituir arte. Câmera/entrada e reação ajustadas por CSS; dados de NPC preservados |
| `src/screens/ExplorationScreen.tsx` | Quest, favores, investigação, transporte, reputação e diálogos ligados a ações reais | Mantido o mesmo painel; 7 apresentações de chegada e 8 apresentações de contatos, sem recompensas paralelas |
| `src/App.tsx` | Abertura antes da origem, combate e retorno à exploração; conclusão salva no personagem | Marca abertura vista somente depois do save; 5 apresentações de batalhas no painel atual, sem reiniciar o estado de turnos |
| `src/audio/director.ts` | Trilha e efeitos locais com mixer próprio e fade | Reutiliza efeitos leves de terminal/arquivo/Éden por cena, sem novos arquivos de áudio redundantes |

## Trabalho efetivamente implementado

1. **Timeline única tipada** em `src/game/story/cinematic-engine.ts`: enquadramento, pan, zoom, duração, transição, foco, cue de som, condições por origem/classe/fatos oficiais, avanço controlado e pulo bloqueado quando existe decisão pendente. Limites de câmera restringem zoom a 1–1,16 e pan a ±12%/±10%.
2. **Abertura de 8 tomadas** de 11s / 10s / 9,5s / 11s / 11s / 13s / 10,5s / 13s (total nominal: 89s) mantendo o roteiro e o primeiro caso V-09. O tempo pode ser reduzido por controles de acessibilidade ou avanço manual. A memória do protagonista muda entre as seis origens: Anexo Helix, oficinas da Baixada, passagens do Subsolo, setor industrial de Ferrugem, laboratórios de Áurea e estradas da Periferia. Nome, classe e sprite masc/fem seguem o personagem salvo.
3. **Três escalas de diálogo:** simples, dramático e cinematográfico. Retratos reais do jogo com expressões discretas, alternância de plano/contraplano, texto configurável, histórico e escolhas exigindo o callback do sistema de missões.
4. **7 pequenas sequências de entrada** para Ferrugem, Áurea, Subsolo, Setor Zero, Prisma, Periferia e rede profunda de esgotos. Usam `DISTRICTS.intro` canônico. O mundo de exploração fica montado atrás do painel e o local continua salvo na chave original.
5. **8 primeiras apresentações de personagens**: Amara, Helena, Elias, Mara, Dorian, Nilo, Joana e Rosa. A introdução é adicionada antes do primeiro diálogo real e não substitui suas opções ou reescreve motivações.
6. **5 prólogos de confronto**: V-09, Éden/Prisma, Éden/Setor Zero, interceptação do Cisma e núcleo do Cisma. O combate é criado na mesma `TurnManager`; o prólogo somente suspende o início das ações do jogador na camada React. As 11 classes e multiclasse fornecem observações táticas reativas sem alterar resultados.
7. **Registro local de cenas** isolado por personagem em `cinema-history.v2` e remoção no delete de slot com rollback original. O replay da abertura continua acessível pelo menu inicial. O diário de outras cenas registra os IDs, mas ainda não oferece um player de replay completo de todos os eventos.
8. **Acessibilidade:** avanço manual, autoplay opcional, quatro velocidades de legenda, movimentos reduzidos, histórico de texto, confirmação antes de pular a abertura, eventos sem escolha irreversível em skip e limpeza de intervalos/timeouts no unmount.
9. **Ferramenta interna** só em `import.meta.env.DEV`: seleção de plano e origem em preview, reinício e inspeção dos parâmetros de câmera. Não altera o slot ou aparece na build final.
10. **Sem anexos opcionais:** nenhuma nova arquitetura de DLC ou pacote audiovisual baixado separadamente. Recursos CSS/SVG e mídia existente são reutilizados.

## Integração de missão e integridade narrativa

O fluxo `OpeningCutscene → completeOpening → IntroductionScreen → exploração` foi preservado. A variável canônica `openingSeen` só muda depois que `saveCharacter` retorna sucesso. O sistema cinematográfico **não atribui XP, items, ending, prova, honra, reputação nem estado de missão**. Escolhas continuam sendo persistidas exclusivamente por `selectAnswer`, `registerCityEvent`, `advanceEden`, `advanceCisma` e demais APIs originais.

Cenas adicionais resolvem lacunas claras: apresentar a arquitetura e o impacto social ao entrar em uma região; dar presença a um personagem no primeiro encontro; estabelecer o risco antes de uma batalha especial; reforçar o ritmo e a natureza institucional/gradualmente autônoma de Éden **apenas em eventos já desbloqueados**.

## Como validar

```sh
npm ci --no-audit --no-fund
npx tsc -b
node --experimental-strip-types scripts/test-cinematics-v20.mjs
node --experimental-strip-types scripts/test-opening.mjs
node --experimental-strip-types scripts/test-narrative-ui.mjs
node --experimental-strip-types scripts/test-patio-dialogues.mjs
node --experimental-strip-types scripts/test-save-slots.mjs
node --experimental-strip-types scripts/test-eden-echoes.mjs
node --experimental-strip-types scripts/test-cisma-operations.mjs
node --experimental-strip-types scripts/test-battlefield-redesign-v20.mjs
python -m pip install -r tools/requirements-characters.txt
npm run generate:characters
npm run generate:v20-art
npx vite build
```

Workflow: `.github/workflows/nova-arcadia-v20-cinematics-qa.yml`. O CI inclui regressão com as cenas antigas, escolhas, cenário de batalha, TypeScript e bundle web.

## Limitações restantes (não declarar como concluídas)

- A câmera cinematográfica da abertura usa a composição React/CSS leve; **não dirige ainda a câmera real Phaser da cena de exploração**. As cenas de conversa/batalha preservam o cenário já montado, mas a interface ainda é um painel sobreposto.
- O sistema não tem novos atlas de gestos de personagem, animações faciais desenhadas individualmente, voz gravada/track independente de dublagem ou cinematografia totalmente baseada em Phaser.
- Não há captura comparativa de gameplay nem inspeção visual em Android físico.
- Não foi gerado, instalado nem homologado um novo APK 3,26GB desta branch; qualquer release final deve considerar a cadeia de PRs #22 e #26 e os asset packs oficiais sem torná-los opcionais.
- Não há medições de 30/60 FPS nem validação de queda de memória em Galaxy A07/Redmi Note 12s.

A entrega é uma expansão funcional e regressiva da **mesma aplicação**, não uma afirmação de sistema cinematográfico definitivo 100% implementado.
