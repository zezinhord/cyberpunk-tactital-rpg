# TENEBRIA • ECOS DE RUTURAM — EDIÇÃO ISOMÉTRICA

RPG tático 2D isométrico offline para Android ARM64, desenvolvido em Godot 4.4.1. O livro TENEBRIA REVISADO 3.0 é referência para universo e regras.

**Estado:** versão de desenvolvimento e testes. O objetivo de **4 GB** é um orçamento de conteúdo útil, não uma meta artificial de tamanho: a arte procedural produz um pacote substancialmente menor. Não foram adicionados arquivos sem função para inflar a instalação.

## Instalar no celular

Acesse a execução mais recente em:
https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/workflows/iso-ci.yml?query=branch%3Atenebria-isometrico-020

Quando os testes estiverem verdes, baixe **tenebria-isometrico-android-debug** em Artifacts, extraia o ZIP e instale **Tenebria-Isometrico-Android.apk**.

É uma versão debug. Este app usa o mesmo identificador Android da versão 3D, porém o formato de saves foi alterado. O save 3D antigo não é migrado automaticamente.

## Conteúdo já programado

- Seis regiões conectadas: Vigília das Cinzas, Bosque das Viúvas, Pântano de Ferro, Cripta do Pacto, Fortaleza dos Sem-Rosto e Limiar de Ruturam.
- Mapas isométricos procedurais, ambientação sombria, casas, árvores, criptas, rios, santuários, caminhos e baús; toque para caminhar e pathfinding BFS.
- 27 raças e 27 classes **catalogadas**; 6 raças/6 classes iniciais **selecionáveis** e 18 habilidades digitais distribuídas entre elas.
- Criação do protagonista com oito pontos de atributos, limites raciais, duas qualidades e compra de 5 pontos iniciais de habilidades.
- Sistema tático de combate por turnos, movimento em grade, iniciativa D20, acerto contra defesa, técnicas de classe, guarda, atadura, condições de queimadura/sangramento/fraqueza, IA e segunda fase dos chefes.
- 12 perfis de inimigos, dois chefes, encontros em grupo e recompensas.
- 37 itens, receitas de criação, compra, inventário, equipagem com efeitos, coleta e saques que não reaparecem após salvar.
- 14 registros de missão, arco com prólogo, recuperação da Chave Velada e duas possibilidades de conclusão, NPCs com decisões e reputação.
- Três companheiros recrutáveis: Maera, Doran e Ilyra, controláveis em combate.
- Códice com doze textos originais, corrupção introdutória, progressão de 10 XP por nível, salvamento offline com cópia de segurança.

## Controles

Na exploração: toque no chão para caminhar, controles direcionais na esquerda, **INTERAGIR**, **MOCHILA**, **MISSÕES**, **FICHA**, **MAPA**, **OFICINA**, **SALVAR**, **PAUSA**. Via teclado opcional: WASD, E, I, J e Esc.

No combate: **ATACAR**, **TÉCNICAS**, **MOVER**, **GUARDA**, **ATADURA**, **ALVO**, **FIM DO TURNO**. Ataques verificam distância, atributos, recursos e turno.

## Arquitetura

- iso/content.gd — regiões, missões, itens, habilidades, inimigos e NPCs
- iso/world.gd — arte procedural isométrica, personagens, props e caminhos
- iso/battle.gd — motor de combate independente da interface
- iso/save.gd — persistência local atômica, versionada e com backup
- iso/game.gd — integração, HUD, criação, diálogos, exploração, escolhas, crafting e progressão
- iso/tests — testes de regras e de integração
- scenes/iso_main.tscn — cena principal
- scripts/rules/catalog.gd — catálogo do livro preservado
- docs/isometric_rules.md — matriz de fidelidade
- .github/workflows/iso-ci.yml — CI Android e publicação do APK

## Limitações e dívida técnica

O objetivo é um produto extenso, mas a construção atual não é um jogo comercial completo. As ilustrações e animações são procedurais e não substituem arte final. As 27 raças/classes precisam de suas habilidades e corpos próprios; outras 21 classes e raças permanecem bloqueadas. A IA não possui linha de visão nem obstáculos complexos, os efeitos raciais são parciais, os diálogos não têm dublagem, e a tabela de corrupção não foi integralmente implementada.

É obrigatório validar bateria, memória, FPS e controles no Moto G34 5G real. Um pipeline bem-sucedido não comprova 30 FPS no aparelho. Direitos de publicação e comercialização do universo exigem autorização apropriada.
