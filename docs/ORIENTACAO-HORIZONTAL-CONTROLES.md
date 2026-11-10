# Nova Arcádia — Orientação horizontal e controles híbridos

**Marco técnico:** preparação da versão 0.7.0  
**Base:** v0.6.5 beta  
**Estado:** implementação inicial em branch separada, sujeita a validação visual e APK.

## Decisões preservadas

- Orientação horizontal obrigatória no aplicativo Android.
- Composição de referência 16:9, com adaptação a telas ultrawide sem esticar a arte.
- Exploração em tempo real com toque no cenário para caminhar e pathfinding.
- Interações contextuais por aproximação; não utilizar joystick virtual permanente.
- Combate tático por turnos com alvos e ações em painéis próprios.
- Área de toque mínima de 48 dp; botões primários de 56 dp.
- Ciano para aliados/protagonista, magenta para hostis, âmbar para elementos neutros/interativos e verde exclusivamente para manifestações do Projeto Éden.

## Organização da tela de exploração

A tela horizontal utiliza duas áreas funcionais: mundo jogável predominante à esquerda e painel lateral à direita para protagonista, missão, registro e ações secundárias. O centro do cenário permanece livre para leitura espacial e navegação.

A tela não deve depender de controles virtuais permanentes. O jogador toca no chão para caminhar e em pessoas, portas ou objetos para iniciar aproximação e interação. Uma futura camada contextual poderá apresentar ações específicas do alvo sem ocupar permanentemente o cenário.

## Orientação Android

O projeto Android é gerado durante o GitHub Actions. Após npx cap sync android, o script scripts/lock-android-landscape.mjs ajusta a MainActivity para android:screenOrientation="landscape". A folha de estilos também oferece uma mensagem de rotação quando a aplicação é aberta em modo retrato fora de um contêiner nativo que respeite o bloqueio.

## Regras de adaptação

- Não deformar sprites, tiles ou cenários para preencher proporções diferentes.
- A janela de exploração usa viewport 16:9 e escala FIT.
- Em celulares ultrawide, ampliar o campo de visão e preservar o painel lateral.
- Diálogos devem permanecer acessíveis em altura reduzida, com rolagem interna.
- Telas de criação, retomada e prólogo também precisam permanecer utilizáveis em horizontal.

## Validação necessária

1. Confirmar que o APK abre em horizontal e não permite rotação para retrato.
2. Conferir criação, retomada e prólogo em telas 16:9 e ultrawide.
3. Conferir Baixada, interiores, diálogos e painel de missão.
4. Confirmar que toque no chão continua calculando caminhos.
5. Confirmar que toque em NPCs, portas e terminais continua acionando aproximação e interação.
6. Confirmar que o Limbo de Teste permanece acessível e que o combate não sofreu regressão.
7. Testar fisicamente no aparelho Android; build bem-sucedido não substitui teste visual e de toque.
