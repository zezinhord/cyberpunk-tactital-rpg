# Brief de design — primeira interface

## Responsabilidade da camada visual

A direção de arte e a evolução visual podem ser trabalhadas no Claude. A interface atual é apenas uma referência funcional, não o design final.

## Objetivo

Criar uma interface cyberpunk tática para Android, com leitura rápida em sessões curtas. A tela deve priorizar o campo de batalha, a leitura do turno e os comandos essenciais.

## Requisitos de experiência móvel

- Layout mobile-first, compatível com orientação vertical.
- Controles de toque com área mínima confortável de aproximadamente 48 dp.
- Ações principais próximas à região inferior da tela, sem esconder o tabuleiro.
- Contraste suficiente para texto, unidades, células alcançáveis e obstáculos.
- Não depender de fontes, imagens ou arquivos remotos para iniciar o jogo offline.
- Sinais visuais claros para turno ativo, movimento restante, ação principal, ação bônus e estado das unidades.

## Limites de implementação

- Componentes React e `src/styles.css` são a superfície visual principal.
- `src/game/` contém regras, mapa e lógica; mudanças visuais não devem duplicar essas regras.
- A camada de design pode propor ícones, paleta, tipografia e composição. Assets novos devem ser armazenados localmente no projeto.
- Não alterar os valores de combate ou as regras sem decisão explícita do diretor do projeto.
