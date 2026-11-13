# Tenebria: Ecos de Ruturam — Alpha 0.1.0 em desenvolvimento

Projeto Godot 4.4.1 para Android ARM64, com RPG 3D em terceira pessoa e combate por turnos, baseado nos nomes, universo e regras do livro TENEBRIA REVISADO 3.0 enviado pelo usuário.

**Status:** código e APK de depuração compiláveis, mas ainda NÃO se declara concluída a Alpha definida no GDD. A execução no Moto G34 5G e uma campanha completa precisam de validação manual.

## APK pelo celular

Abra a guia Actions: https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/workflows/alpha-ci.yml?query=branch%3Atenebria-alpha-010

Escolha a execução mais recente com sinal verde; no final, em Artifacts, baixe o arquivo "tenebria-alpha-010-android-arm64". Extraia o ZIP e instale o APK. A assinatura é **debug** (apenas para testes), não Play Store.

## Implementado na ramificação tenebria-alpha-010

- Exploração 3D em terceira pessoa, joystick de toque, câmera, ruínas, bosque, povoado da Vigília e cripta.
- Catálogo das 27 raças e 27 classes do livro, das quais **4 raças e 4 classes** estão liberadas inicialmente.
- Criador com atributos (8 pontos sem zeros), limites por raça, duas qualidades, nome e apresentação. A alteração visual da apresentação ainda não foi produzida.
- Motor de batalha por turnos separado do mundo, iniciativa D20, grid, movimentação, ataque físico, habilidades de quatro classes, guarda, consumíveis e IA inicial.
- Inimigos de quatro perfis digitais e um Guardião, grupo com Maera recrutável, experiência e nivelamento.
- Inventário, itens equipáveis com impacto na defesa e no dano, coleta de ervas, baús, comerciante e ataduras.
- Prólogo de Hasam, escolha com impacto na reputação, missão principal e três objetivos secundários.
- Salvamento local de personagem, missões, companheira, inventário, objetos coletados e oponentes derrotados.
- Testes automatizados do catálogo, regras de turno e inicialização; GitHub Actions compila APK ARM64.

Os visuais são **bloqueios 3D procedurais** e não modelos de arte final. Não foram reproduzidas as ilustrações do livro.

## Limitações técnicas abertas

Os efeitos completos das 27 raças, 27 classes, perícias, corrupção, especializações, progressão de habilidades e tabela de PV por classe ainda precisam ser adaptados. O valor provisório de PV = Físico + 12 **não é uma regra canônica de Tenebria**. O criador ainda não permite gastar individualmente os cinco pontos de habilidade iniciais do livro. A movimentação tática não implementa obstrução real por todos os objetos 3D; o visual e as animações do combate precisam de aprimoramento.

Nenhum resultado de FPS, memória ou estabilidade no Moto G34 5G foi medido. O pacote reduzido ocorre porque os modelos são procedurais; não se pretende preencher artificialmente 4–8 GB.

## Organização do repositório

- scripts/alpha_main.gd: orquestração de mundo, UI, missões e combate
- scripts/rules/catalog.gd: 27 raças, 27 classes, habilidades iniciais e equipamentos
- scripts/systems/turn_combat.gd: motor testável de combate por turnos
- scripts/main.gd, hero.gd, foe.gd: base 3D reaproveitada
- docs/rules_matrix.md: diferenças entre [LIVRO], [ADAPTAÇÃO] e [PENDENTE]
- tests/: casos de catálogo, combate e integração de cena
- .github/workflows/alpha-ci.yml: testes automatizados e APK

Uso narrativo experimental; antes de distribuição comercial é necessária a revisão dos direitos de adaptação do universo e marca do livro.
