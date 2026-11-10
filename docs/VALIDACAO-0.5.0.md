# Relatório de validação — v0.5.0

## Escopo verificado

- A versão foi comparada com o pacote v0.4.1. Os arquivos de combate (`TurnManager.ts`, `BattleScene.ts`, `map.ts`, `game/types.ts`), os arquivos de origem/salvamento e o workflow Android não foram alterados.
- O novo ponto de entrada após o prólogo é `ExplorationScreen`; a arena Limbo de Teste permanece acessível separadamente.
- A cena da Baixada usa uma grade lógica de 14 × 12 e projeção isométrica 2D.
- O progresso da missão é guardado em chave local própria por personagem, separada do registro do protagonista.

## Verificações executadas nesta preparação

- Transpilação sintática dos 19 arquivos TypeScript/TSX: sem erros de sintaxe.
- Verificação estrita auxiliar com declarações temporárias de React/Phaser: concluída sem erros. Essa checagem ajuda a encontrar inconsistências no código, mas **não substitui** os tipos oficiais dos pacotes.
- Teste de conectividade da grade lógica: as células adjacentes a Dra. Amara, terminal da clínica, Nilo e Joana são alcançáveis a partir do ponto inicial; todas as 137 células transitáveis estão conectadas.
- API de `Graphics.generateTexture` e `TextureManager.remove` conferida na documentação oficial do Phaser 4. A cena rasteriza as camadas estáticas em texturas para evitar redesenhar todos os vetores a cada quadro.

## Verificação ainda pendente

O ambiente desta preparação não conseguiu instalar as dependências npm. `npm run build` foi tentado, mas parou porque `react`, `vite`, `@capacitor/cli` e outros pacotes não estão instalados neste ambiente. Portanto:

- o build real com Vite e os tipos oficiais do Phaser/React ainda não foi validado aqui;
- o APK 0.5.0 ainda não foi compilado nem testado neste ambiente;
- a validação definitiva depende do GitHub Actions após o envio desta versão ao repositório.

Se o workflow apresentar erro, o log da execução deve ser usado para corrigir a versão antes de considerar o APK validado.
