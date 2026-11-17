# Nova Arcádia 0.9.0-rc.2 — visualização e saída da arena

Causa provável: em alguns WebViews Android a cena Phaser.CANVAS não apresentava CanvasRenderingContext2D em renderer.context e a verificação conservadora bloqueava drawBoard antes de posicionar as unidades. Imagem enviada: tabuleiro e avatares invisíveis; somente HUD e comandos visíveis. O botão de retorno ficava na parte inferior e não era evidente após encerrar.

Correção:
- Tabuleiro tático 8x8 em SVG nativo do navegador, 64 células, mesmo mapa e pontos de bloqueio, seleção por toque e teclado, regiões ciano e terminal âmbar.
- Os spritesheets originais dos seis antecedentes e duas apresentações são referenciados por URLs Vite; sentinela mantém asset SVG. O componente não inicia Phaser e não disputa contextos Canvas com Android.
- TurnManager preservado sem alterações. Ataques, IA, alcance, cobertura, técnicas e condições de vitória/derrota permanecem intactos.
- Saída de alto contraste na barra superior sempre disponível; saída adicional junto aos comandos, vitória modal com CTA "Continuar explorando" e opção de consultar relatório. Abandonar confronto ativo não registra vitória nem libera missão.
- VersionCode 90002, package 0.9.0-rc.2, prerelease QA isolado da 0.9.0-rc.1. Salvos antigos não migrados nem alterados.
- Teste automático rápido executado antes da geração de áudio. Testes físicos no Galaxy A07, Redmi Note 12S e aparelho do jogador ainda necessários para confirmar estabilidade.

O hotfix não substitui o avanço artístico 2D de personagens em campo: este mantém um frame isométrico de cada spritesheet própria como representação SVG, sem animação intermediária ainda; isso é uma troca deliberada para não arriscar Canvas quebrado.
