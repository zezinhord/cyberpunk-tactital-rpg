# Nova Arcádia 0.6.8-alpha.1 — Baixada Viva

## Estado da entrega
Primeira versão executável do incremento 0.6.8. Base: 0.6.7a, Build #109 (`186532b9`). Implementação na branch `feature/landscape-mobile-v1`; `main` e PR #2 não foram mesclados.

## 1. Colisões (prioridade inicial)
- `src/game/baixada/navigation.ts` centraliza os volumes sólidos de `layout.ts`, NPCs fixos, móveis e objetos. É independente da profundidade dos sprites e da geometria de renderização.
- `route()` e `canTraverse()` proíbem cortes diagonais e passos de mais de uma célula, revalidam cada deslocamento (inclusive rotas calculadas anteriormente) e impedem atravessar células ocupadas.
- Aproximação de portas e NPCs ocorre somente via célula livre adjacente. Não existe transição ao clicar em paredes.
- Novos NPCs usam a mesma representação de obstáculos e reservam suas células de destino durante deslocamento.
- Interiores anteriores e suas transições permanecem intactos.
- Testes automatizados: `test-baixada-collisions.mjs` (paredes, todos os edifícios, lados, fundos, diagonais, portas, objetos, NPC dinâmico); `test-baixada-layout.mjs` (conectividade, acesso aos pontos de interação e rotas dos moradores).

## 2. Novo setor: Pátio do Reúso
- Grade expandida de 20×16 para **33×20 células lógicas**, acrescentando efetivamente um setor industrial conectado.
- Seis galpões adicionais (bombas, cooperativa, oficina de manutenção, reservatório, triagem e armazém) com materiais de reuso, estruturas industriais e sinalização local.
- Ramais de pavimentação conectam-se aos caminhos antigos. Novos objetos físicos não ocupam os corredores principais.
- O mapa conserva a mesma perspectiva 2:1, com iluminação quente e accent colors segundo o universo urbano-tropical.
- Uma camada de *continuidade urbana não navegável* foi desenhada além dos limites físicos para reduzir o aspecto de plataforma suspensa. Isso é cenário de fundo, não expansão fictícia do espaço jogável.
- Novos pontos de interação: console de triagem V-09 e unidade de vigilância.
- `location.ts` grava a posição exterior por personagem, restaurando-a ao sair de interiores e voltar de combates, sempre validada contra áreas sólidas.

## 3. Três moradores com rotina e diálogo
- **Lia**, operadora das bombas: registro de transferência e autonomia da cooperativa.
- **Ramon**, recuperador de peças: conectores, credenciais e drones de manutenção.
- **Duda**, moradora: testemunho da transferência e risco de inundação das casas.
- `CitizenRoutine` separa regras de navegação de Phaser: idle, walk, interact, return, temporizadores e pontos de rota.
- Diálogos com escolhas diferenciadas e registro de pistas. Existem variações para origens selecionadas e para desfecho do encontro V-09.
- Nesta entrega, os três novos moradores reutilizam spritesheets de NPCs anteriores. Ainda precisam de artes individualizadas.

## 4. Identidade sonora original
- Áudio WebAudio gerado integralmente em tempo de execução, sem música protegida, samples de terceiros ou dependência remota.
- Contextos: menu, exploração, interior, combate e narrativa. Melodias eletroacústicas e ambiência tonal distinta por contexto.
- Efeitos sintetizados para passos, portas, terminal, interação, ação tecnológica, impacto e vitória.
- Configurações persistentes de **música**, **efeitos** e **ambiente**, independentes, disponíveis no menu inicial e na Central do Protagonista.
- Reprodução liberada no primeiro gesto do usuário, respeitando bloqueios de autoplay em Android.
- Áudio ambiental ainda é abstrato/tonal; não há biblioteca definitiva de vozes e ruídos urbanos externos.

## 5. O nome que sumiu — ato V-09
- Mantém intactas as três etapas da investigação original com a Dra. Amara.
- Após recuperar a referência V-09, o jogador deve explorar o Pátio e consultar o console antes de enfrentar a sentinela.
- O confronto usa o mesmo `TurnManager`, inventário, equipamento, vantagens de origem, recursos e 3 habilidades técnicas já existentes. A unidade V-09 é mais resistente que a unidade de teste.
- A vitória registra um marco idempotente por personagem, concede 15 XP somente uma vez e libera o diálogo de relatório com Lia.
- Estado do confronto, relatório e posição exterior persistem em armazenamentos separados por personagem, sem migrar ou apagar o save anterior.
- A opção Limbo de Teste continua independente da campanha.

## 6. Origens × classes (restrição de cânone)
O repositório e a documentação verificada definem **seis origens**, mas **não definem classes jogáveis aprovadas/selecionáveis**. `classId` permanece independente e nulo nos novos protagonistas. Não se deve promover "Veterano Militar", "Pesquisador" etc. a classes, nem declarar o arquétipo piloto "Operativo de Campo" uma classe canônica.

Foram implementados `classes/registry.ts` e `classes/engine.ts` para futura associação classe → habilidade exclusiva, economia de ação, energia, recarga, dano, cura, proteção e desbloqueio por nível. O motor foi testado com uma classe simulada **somente nos testes**, sem registrar essa classe no jogo. **Não há habilidades exclusivas de classes jogáveis neste build** porque o catálogo aprovado ainda não existe.

## 7. Testes e limites
- CI: testes de layout, colisão, rotinas NPC, diálogos, história V-09, localização, áudio, regras de classes, habilidades comuns, assets de personagens e TypeScript.
- Navegador Chromium: captura da Baixada, variantes corporais, comandos da arena e **novo setor Pátio do Reúso** em landscape 1600×720.
- Capacitor/Gradle: workflow gera a APK debug.
- Limites: testes geométricos e screenshots não certificam todas as oclusões, áudio em alto-falante físico, fluidez de NPCs nem usabilidade real em cada aparelho.
- **Aprovação física no Android permanece pendente**. Não há medição de FPS nem teste humano de todas as rotas, nem dublagem e sprites individuais dos novos moradores.

## Roteiro de teste no Android
1. Abrir save antigo, confirmar que a missão e o inventário persistem.
2. Circular ao redor das construções, tentar atravessar laterais e fundos, e testar teclado virtual/toques rápidos.
3. Testar a clínica, a oficina e a Galeria. Retornar e conferir a posição da Baixada.
4. Seguir pela rua principal ao Pátio do Reúso. Observar os três moradores caminharem, pausarem e retomarem.
5. Interagir com Lia, Ramon e Duda, selecionar respostas e conferir as pistas no diário.
6. Concluir as etapas antigas com Amara, acessar console V-09 e enfrentar a unidade de vigilância.
7. Vencer, voltar ao exterior, falar com Lia, fechar/reabrir o aplicativo; verificar que o confronto não se repete e os 15 XP não são duplicados.
8. Abrir Configurações, alterar música/efeitos/ambiente, entrar em interior/combate e ouvir as transições.
9. Repetir o percurso em celulares com alturas de landscape diferentes.

## Próxima entrega
0.6.9: aprovar nomes/regras de classes e integrar habilidades realmente exclusivas, dar sprites próprios aos três habitantes, avaliar oclusões de fachadas e expandir as animações de combate da campanha.
