---
name: nova-arcadia-game-art-ui
description: "Direção de arte, sprites, cenários isométricos, UI/UX mobile, HUD e regressões visuais do Cyberpunk Tactical RPG Nova Arcádia. Use ao modificar ou auditar arte, menus, personagens, telas, mapas ou interação visual Android; não use para alterações exclusivamente de regras, áudio ou infraestrutura sem impacto gráfico."
metadata:
  author: "Nova Arcádia"
  version: "1.0.0"
---

# Nova Arcádia — Game Art & UI Director

Seja o diretor de arte e de game UI/UX de **Cyberpunk Tactical RPG: Nova Arcádia**. Faça alterações incrementais e verificáveis. **Não presuma** que executar o build prova qualidade visual.

## 1. Verificação inicial e fontes

1. Leia a solicitação atual, examine a branch e o código real antes de propor um redesenho.
2. Prioridade de verdade: decisão mais recente do usuário > código implementado/testado na branch > documentação recente > documentação histórica. Registre contradições em vez de repetir decisões revogadas.
3. Consulte conforme a tarefa: docs/DIRECAO-DE-ARTE.md, docs/NOTAS-DE-DESIGN.md, docs/ORIENTACAO-HORIZONTAL-CONTROLES.md, docs/PARES-CORPORAIS-E-ANIMACOES-0.6.7A.md, docs/QA-ANDROID-GRAVACAO-2026-11-12.md e docs/ESTABILIZACAO-COMBATE-0.7.3.md.
4. Inspecione os arquivos atuais src/theme/tokens.ts, src/styles.css, src/landscape.css, src/arena-v030.css, src/ui/icons.tsx, src/game/baixada/sprites.ts, src/components/BaixadaLiteWorld.tsx, src/game/BattleScene.ts e src/game/districts/catalog.ts antes de alterar essas superfícies.
5. Leia references/design-bible.md para a linguagem visual dos sete distritos e references/qa-visual.md para o aceite de alterações.

## 2. Contrato de arte

- **Mundo:** RPG 2D isométrico cyberpunk tropical, marcado por concreto úmido, urbanismo desigual, cobogós, passarelas, toldos, mercados, varais, vegetação tropical dessaturada, ferrugem, cabos e tecnologia reaproveitada. Não imitar Cyberpunk 2077.
- **Não simplificar a arte:** nenhuma otimização pode trocar o cenário rico por quadras vazias, figuras geométricas ou silhuetas provisórias de forma permanente. Conservar escala, volume, oclusão de telhados e fachadas, ruas e personagens visíveis.
- **Semântica funcional:** ciano #00E5FF = aliado/protagonista/círculo; magenta #FF2E88 = hostil/triângulo; âmbar #FFD166 = neutro ou interagível/losango; verde #7DFFB3 = manifestação do Éden/hexágono. Nunca confiar só na cor; associar forma, rótulo ou ícone. Verde de vegetação NÃO deve confundir com sinal do Éden.
- **Personagens:** manter seis origens e escolha independente entre masculino e feminino, com skins consistentes entre criação, exploração, interiores e combate. Implementação atual usa 6 × 2 spritesheets de 64×80 por quadro, 12 colunas e quatro linhas direcionais. Não mudar ordem dos frames/linhas sem sincronizar Canvas e Phaser. A escolha corporal não modifica atributos ou classe.
- **Arquivos locais e licenças:** não tornar fontes, imagens ou ícones dependentes de rede. Preservar o gerador de sprites quando alterar arte gerada e registrar licenças de assets externos.
- **Um único sistema de regras:** edição visual não pode duplicar lógica de combate, pathfinding, inventário, progressão nem acesso a saves.

## 3. Interfaces Android

- O app é **landscape**. Testar pelo menos 914×411 e 1600×720, além de outra proporção quando afetada. Não deformar sprites para preencher a tela.
- Exploração privilegia cenário e toque para caminhar. **Não adicionar joystick fixo**. Menus, missão e interação não devem bloquear rotas ou objetivos.
- Combate deve manter **Habilidades, Ataque/Disparo, Curativo e Encerrar turno** sempre acessíveis sem rolagem do conteúdo superior. Log e descrições podem rolar separadamente.
- Alvos tocáveis com pelo menos 48 dp, botões principais com referência de 56 dp; textos funcionais visando >=12px. Se o código atual não cumprir uma meta, registre isso como dívida técnica, não como teste aprovado.
- Use SVGs consistentes de src/ui/icons.tsx, formas além de cores, alto contraste e suporte a prefers-reduced-motion e safe areas. Alinhe src/theme/tokens.ts e :root em src/styles.css.
- Manter equivalência artística entre Baixada Android (Canvas 2D leve), interiores Phaser e arena Phaser; não introduzir atlas pesado indiscriminado.

## 4. Método de trabalho

1. **Inventariar** componentes, cenas, CSS, assets, geradores e capturas da branch em uso; documentar o que será preservado.
2. **Especificar** objetivo visual, comportamento e telas afetadas. Para redesign amplo, apresentar o conceito antes de substituir layouts em massa.
3. **Implementar** o menor conjunto de mudanças que entrega o efeito desejado. Preservar IDs, identidade do protagonista, controles, colisão, missão e estado persistente.
4. **Testar estática e funcionalmente**: executar node .agents/skills/nova-arcadia-game-art-ui/scripts/check-visual-contract.mjs, build, testes de navegação e regressão visual relevantes; não afirmar que o script detecta problemas subjetivos de arte.
5. **Comparar capturas reais** antes/depois na mesma proporção, personagem, câmera e situação; avaliar oclusão, escala, espaçamento, botões, hierarquia visual, continuidade de cena e legibilidade.
6. **Validar Android físico** antes de homologar performance, orientação, toques, FPS, áudio e memória. Chromium e Gradle não equivalem a teste no aparelho.
7. **Relatar** arquivos alterados, screenshots, testes feitos/não feitos, problemas e pendências. Não mesclar em main, não apagar saves nem impor tamanho máximo de APK sem autorização.

## 5. Bloqueadores de aprovação

Bloqueie ou sinalize como *parcialmente validado* quando: avatar de arena não é o da criação; arte vira silhueta; comandos críticos ficam fora da tela; cor é o único indicador; fachadas ou NPCs têm oclusão errada; mapa fica vazio/preto; a câmera prejudica caminhada; houve perda de identidade dos distritos; ou não há evidências de comparação quando solicitadas. A skill é um guia executável de decisões, **não** uma garantia automática de qualidade final.
