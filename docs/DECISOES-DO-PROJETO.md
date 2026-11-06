# Decisões e estado do projeto

Este documento separa a fundação técnica já adotada das escolhas de game design ainda provisórias.

## Fundação técnica adotada para o protótipo

- Aplicativo Android empacotado com Capacitor.
- Interface em React e TypeScript.
- Campo tático 2D renderizado pelo Phaser.
- Vite como ferramenta de desenvolvimento e compilação Web.
- Núcleo de regras separado da camada visual.
- Eventos tipados para comunicar mudanças de estado.
- Estrutura preparada para funcionamento local; ainda não há persistência implementada.

## Regras demonstrativas, ainda provisórias

- Grade de 8 x 8 células.
- Movimento ortogonal, sem diagonais.
- Orçamento de 6 células por turno.
- Ação principal, ação bônus e movimento aparecem na economia do turno.
- Ataque corpo a corpo demonstrativo usando d20.
- Um operativo contra uma unidade drone.
- IA inimiga simples: aproximação e ataque corpo a corpo.

Esses valores existem para tornar o protótipo jogável. Não são regras finais da campanha.

## Sistemas previstos, ainda não implementados

- Criação de personagem, atributos, perícias e progressão.
- Inventário, equipamentos e implantes.
- Cobertura, linha de visão e ataques à distância.
- Geração procedural de mapas e missões.
- Persistência local via SQLite.
- Narrativa com LLM usando saídas estruturadas e validação pelo Rule Engine.

## Princípio de arquitetura

A interface apresenta o estado e recolhe intenções do jogador. O `TurnManager` valida as regras e altera o estado do jogo. A cena Phaser apenas representa o tabuleiro e encaminha toques para o núcleo. Serviços externos, inclusive LLMs, não devem decidir diretamente dano, inventário, posições ou resultados de combate.
