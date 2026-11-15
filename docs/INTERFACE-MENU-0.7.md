# Interface do protagonista — Nova Arcádia

**Entrega inicial da v0.7 — branch `feature/landscape-mobile-v1`.**

## Objetivo

Substituir o antigo atalho “Personagem / menu”, que retornava à tela de retomada, por uma central de gerenciamento do protagonista em tela própria. A navegação não deve permanecer como um painel lateral permanente durante a exploração.

## Estrutura implementada

A HUD de exploração mantém o nome do distrito, identificação do protagonista, condições ambientais e missão atual. O botão “Arquivo / Personagem” abre a central em tela integral, com navegação independente.

Seções da central:

1. **Personagem:** nome, origem, classe registrada, nível, experiência, missão atual, vantagem de origem, habilidade de origem e atributos.
2. **Inventário:** espaço visual criado; sistema de coleta, armazenamento e uso de itens ainda não implementado.
3. **Equipamentos:** lista o conteúdo do campo de equipamentos quando houver dados; catálogo e troca de equipamentos ainda não implementados.
4. **Habilidades:** apresenta as vantagens e a habilidade de origem já registradas. A habilidade ativa continua vinculada à arena tática de teste.
5. **Mapa:** identifica a Baixada como área jogável atual e distingue os demais distritos planejados. Não há mapa interativo nem deslocamento entre distritos nesta entrega.
6. **Diário:** apresenta a missão “O nome que sumiu”, as etapas e pistas que já são salvas localmente.
7. **Configurações:** mostra informações técnicas atuais. Áudio, idioma, acessibilidade e qualidade gráfica ainda não possuem controles funcionais.

## Preservação

- A movimentação continua sendo feita pelo toque no cenário.
- Diálogos, interações, interiores e progresso da missão permanecem no componente de exploração existente.
- O Limbo de Teste e seu combate por turnos não são reescritos nesta etapa.
- A ficha do personagem continua usando o armazenamento local já existente.
- A branch `main` não recebe alterações; o trabalho segue na branch de desenvolvimento.

## Direção visual

A central utiliza a linguagem escura e urbano-tropical já presente no projeto, com painéis em camadas, acentos âmbar e ciano e tipografia existente. As cores funcionais permanecem reservadas: ciano para aliados, magenta para hostis, âmbar para elementos neutros/interativos e verde exclusivamente para o Éden.

## Limites desta entrega

Esta é uma primeira implementação de navegação e apresentação de dados existentes. Não cria, por si só, inventário funcional, economia, sistema de equipamentos, árvores de habilidades, mapa interativo ou novas opções de configuração.

## Validação pendente

A compilação automatizada do Android e o teste no aparelho devem confirmar:
- leitura dos textos e dimensões das áreas de toque em landscape;
- abertura, navegação e fechamento da central;
- rolagem de seções em telas de alturas diferentes;
- preservação das interações e do progresso da missão após fechar o menu;
- ausência de regressões no retorno aos interiores e no Limbo de Teste.
