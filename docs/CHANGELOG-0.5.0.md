# Cyberpunk Tactical RPG — v0.5.0

## Primeiro recorte jogável da Baixada

A experiência após o prólogo passa a abrir a exploração da Baixada, substituindo o Limbo de Teste como tela principal. O combate tático continua acessível como arena separada de validação.

### Implementado

- Cena isométrica maior, com ruas, calçadas, fachadas, telhados, janelas, letreiros, cabos, postes, palmeiras, caixas, oficina, mercado e clínica comunitária.
- Protagonista e NPCs representados por personagens humanoides vetoriais, com cabeça, cabelo, tronco, braços, pernas, roupas, acessórios e paletas individuais.
- Movimentação por toque no chão, clique ou teclas WASD/setas, com busca de caminho em grade e bloqueio das edificações.
- Interação por aproximação com Dra. Amara Solis, terminal da clínica, Nilo e Joana.
- Primeira missão com três etapas: conversar com Amara, examinar o terminal e retornar à médica.
- Progresso da missão salvo localmente, separado do salvamento do protagonista.
- Interface de exploração, objetivo atual, registro da missão e diálogos. A mensagem de Éden usa uma camada visual verde separada.
- A arena tática anterior permanece disponível pelo botão “Arena tática de teste”.

### Limites conhecidos desta entrega

- Os personagens são sprites vetoriais desenhados em tempo de execução; ainda não são spritesheets artísticos finais.
- A movimentação possui deslocamento interpolado, mas os ciclos completos de caminhada/ataque/idle ainda precisam de arte e animação dedicadas.
- A Baixada é uma primeira área delimitada, não uma cidade aberta completa. Não há ainda transição para interiores, veículos, inventário funcional, economia, combate integrado à missão ou campanha completa.
- Os diálogos e etapas desta missão são conteúdo inicial, sujeito à revisão narrativa.
- O tamanho final do APK depende dos recursos e da compilação Android; esta versão não tem meta de armazenamento artificial.

## Validação

Consulte `docs/VALIDACAO-0.5.0.md` para as verificações executadas e os testes ainda pendentes no GitHub Actions.

## Preservação

A lógica de combate da v0.4.1 permanece em `TurnManager.ts`, `BattleScene.ts`, `map.ts` e `game/types.ts`. A cena de exploração foi adicionada como sistema separado. O workflow Android foi preservado.
