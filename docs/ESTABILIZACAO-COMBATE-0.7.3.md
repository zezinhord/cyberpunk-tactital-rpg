# Nova Arcádia 0.7.3 — Auditoria e estabilização tática (candidata QA)

**Base de trabalho:** `feature/music-director-v072`, commit `b5d674a2`, workflow #676 aprovado. Branch de desenvolvimento `feature/stability-tactical-combat-v073`. A branch `main` e os saves existentes permanecem intactos.

## Falhas comprovadas antes das alterações
1. `src/game/TurnManager.ts`: ataque básico era sempre corpo a corpo, mesmo ao equipar pistolas; IA hostil avançava até ficar adjacente, repetindo o mesmo comportamento.
2. `src/game/map.ts`: paredes bloqueavam caminhada, mas não havia cálculo de linha de visão nem proteção tática.
3. `src/game/BattleScene.ts`: ataque básico não oferecia prévia de alcance, cobertura e intenção hostil; animação dos deslocamentos ignorava o percurso e encurtava vários passos para um único tween.
4. `src/components/BaixadaLiteWorld.tsx`: avatar já interpolava, mas câmera seguia posição instantaneamente e não havia pausa da caminhada quando aplicativo ficava em segundo plano.
5. `src/App.tsx` e `src/screens/ExplorationScreen.tsx`: a arena e o componente de interiores importavam Phaser mesmo no início da Baixada. Este acoplamento adicionava custo desnecessário ao primeiro carregamento.
6. `src/audio/director.ts`: áudio procedural/gravado não tinha suspensão integrada ao ciclo de visibilidade da aplicação.

## Alterações
- `src/game/map.ts` aplica supercover em grade 8×8 e cobertura parcial (+2 Defesa) quando o tiro é visível, mas o alvo se protege junto a um obstáculo. A obstrução total impede disparos, não apenas reduz acerto.
- `src/game/tactics.ts` fornece perfis de IA e seleção de rota até uma célula que permita atacar; Helix e Caçador priorizam posições protegidas quando disponíveis. Cada ação ocorre no mesmo TurnManager, respeitando bloqueio por EMP.
- `src/game/TurnManager.ts`: pistolas equipadas atacam a 4 ou 5 células; personagem desarmado mantém alcance de 1. O ataque informa alcance, defesa, cobertura, chance do d20 e consome a ação principal somente quando permitido. Manutenção da regra histórica de acerto d20 para preservar testes legados.
- `src/game/classes/engine.ts`: projéteis de dano respeitam paredes; intrusão de rede Netrunner e bloqueios eletrônicos não exigem linha visual.
- `src/game/BattleScene.ts`: HUD tático, proteção visual de alvos e animação por cada célula do caminho confirmado, preservando sprites autorais.
- `src/game/baixada/motion.ts` e `src/components/BaixadaLiteWorld.tsx`: tempo real, câmera amortecida, redirecionamento de rota sem teletransporte e pausa/retomada quando aplicativo muda de visibilidade. Renderização de economia limitada.
- `src/components/SceneRecovery.tsx`: captura falhas de renderização/chunk em Phaser, mantém interface e oferece reinicialização sem apagar dados. Diagnóstico **local** resumido; não há transmissão remota de informação.
- Phaser passa a ser lazy em Arena e InteriorWorld; versão Android usa Canvas 2D na arena, Baixada continua preservando a restauração de arte original da RC4.
- Áudio agora é suspenso ao minimizar e retomado ao voltar. Não se alteram licenças ou faixas CC0 do pacote anterior.
- Mantidas 11 classes, 6 origens, 66 técnicas registradas, 7 distritos, progressão, campanha, equipamentos, rádio e chaves de save.

## Testes
- `scripts/test-tactics.mjs`: paredes, cantos, cobertura parcial/total, limites de ataque, pistolas, cálculo de defesa, Netrunner sem linha visual, efeitos reais, IA e posicionamento Helix.
- `scripts/test-movement.mjs`: interpolação constante, limites de tempo e convergência de câmera com 30/60 FPS.
- A suíte anterior de evolução, saves, classes, combate por ondas, visual Chromium 1600×720/914×411, cold boot Android simulado, Gradle, assinatura e APK continua no workflow.

## Limites e riscos atuais
1. Motor controla **apenas um inimigo hostil simultâneo por onda**; cooperação real entre múltiplos inimigos e seleção de múltiplos alvos requer etapa de engenharia separada.
2. O sistema de cobertura pertence ao tabuleiro 8×8 atual; gerar cenários táticos a partir da posição de origem na cidade ainda não está integrado.
3. O jogo ainda não executa veículos controláveis, furtividade sistêmica, fogo de supressão persistente, loja/economia completa nem equipamento ilustrado em todos os frames. Não apresentar essas funções como prontas.
4. O progresso temporário do combate não possui save de turno a turno; o save persistente de HP/XP/slot e campanha continua.
5. **Galaxy A07 e Redmi Note 12S ainda exigem verificação física** com logs e sessões longas, incluindo FPS, memória, temperatura, áudio e retomada após bloqueio de tela.
6. Uma build CI bem-sucedida não comprova tempo de gameplay de 60 minutos, equilíbrio da IA em todas as classes ou estabilidade real nos aparelhos.

## Critério de publicação
Aguardar workflow final bem-sucedido, artifact APK assinado, teste completo de campanha e **60 minutos de jogo no Android real sem falhas bloqueantes**. Fazer exportação JSON de cada slot antes de instalar ou substituir qualquer build experimental. Não há limite máximo de tamanho do APK.
