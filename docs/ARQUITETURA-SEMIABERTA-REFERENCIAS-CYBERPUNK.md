# Nova Arcádia — Evolução do mundo semiaberto e referências cyberpunk

**Release:** 0.6.8-alpha.3 · Mercado dos Cabos · branch `feature/landscape-mobile-v1`
**Natureza:** pesquisa comparativa + mudanças reais implementadas. Não é licença nem adaptação oficial dos sistemas citados.

## 1. O que foi pesquisado (material externo)

**Cyberpunk RED**, publicado pela R. Talsorian Games, organiza os protagonistas por papéis profissionais, relações pessoais (*Lifepath*), tecnologia, contato social, urbanismo e conflitos de corporações. O catálogo de origem possui dez papéis principais; **as 11 classes aprovadas para Nova Arcádia não reproduzem exatamente essa lista**: o Street Kid constitui aqui uma classe adicional oficial do projeto. Usar somente ideias abstratas de especialização e conexões pessoais, não reproduzir regras, personagens, mapas, visuais e textos protegidos. Fontes: https://rtalsoriangames.com/cyberpunk/ e https://talsorianstore.com/collections/cyberpunk-red/products/cyberpunk-red-digital-edition

**Cities Without Number**, de Kevin Crawford, é referência para campanhas urbanas abertas, composição de bairros e pressão entre facções. A aplicação própria no projeto é o mapa com setores e consequências locais, não transcrição do sistema. Referência de leitura: https://cwn.quadrifons.com/ (SRD independente da editora); material de visão geral: https://ttrpgwiki.com/systems/cities-without-number

**The Sprawl** usa a ideia de pressões de corporações, missões e relógios de escalada. Nova Arcádia incorpora uma **interpretação original** de dois indicadores persistentes, Confiança da Comunidade e Atenção da Segurança (0–5), sem importar relógios, tabelas ou movimentos de terceiros. Visão do sistema: https://d2i9nzcontjuk6.cloudfront.net/systems/The_Sprawl/e/First_Edition/

**Shadowrun** destaca o contraste entre corporações e resistências urbanas, intrusão digital, intermediação e trabalhos clandestinos. Evitar transportar os elementos de fantasia e magia de Shadowrun para Nova Arcádia, cujo universo aprovado não os exige. Fonte do cenário: https://shadowrunsixthworld.com/the-sixth-world/

## 2. O que faz de Nova Arcádia um RPG semiaberto

**Estrutura jogável atual:** três setores dentro da MESMA cena da Baixada: (1) Baixada Central residencial/serviços; (2) Pátio do Reúso industrial; (3) Mercado dos Cabos comercial. O protagonista percorre ruas físicas conectadas, sem telas de carregamento entre esses três setores. A classe, a origem, o mapa e a missão possuem estados separados.

A proposta para os demais distritos — Áurea, Ferrugem, Subsolo, Setor Zero, Prisma e Periferia externa — é usar zonas carregadas separadamente no futuro, com persistência do inventário, decisões, facções e protagonistas. **Ainda não existe streaming por chunks nem transporte entre distritos.** A atual renderização estática otimiza o cenário com cache de camadas; uma cidade inteira em uma única cena não seria adequada a Android de entrada.

A liberdade vem de escolher a ordem de exploração, contatos e respostas. A história principal possui marcos definidos, mas cada setor pode produzir provas, custos e consequências independentes. O combate tático continua por turnos e entra em situações narrativas, como V-09.

## 3. Mercado dos Cabos — conteúdo implementado

- A grade passou de 33 × 20 para **33 × 30 células**, preservando os acessos antigos. São dez novas linhas caminháveis e seis novos edifícios comerciais/comunitários.
- Seis construções: Entreposto, Café da Via, Casa Comum, Rede Local, bancas de trocas e depósito da região leste.
- Ruas de conexão em x=6,12,18 e transversal y=26; objetos distribuídos sem ocupar células de edifícios, entradas ou NPCs.
- Pontos de interação: **Davi**, intermediário de acessos; **Marta**, articuladora comunitária; **Mural de Boletins**, arquivo local.
- Habitantes ambulantes: **Iza**, entregadora; **Tomás**, voluntário do entreposto. Total de cinco rotinas ambulantes no distrito incluindo Lia, Ramon e Duda.
- Indicador visual de setor baseado na posição salvada. O mapa da Central apresenta os três setores jogáveis, mantendo os outros como planejados.

## 4. Continuidade narrativa sem copiar lore

A campanha principal anterior — **O nome que sumiu**, Dra. Amara Solis, ocorrência **V-09**, Galeria do Canal e Pátio do Reúso — permanece. O Mercado dos Cabos acrescenta um segundo eixo de investigação: **o algoritmo das faltas**. Moradores relatam que válvulas, água e componentes médicos são redirecionados sem justificativa. Registros locais divergentes mencionam uma assinatura de triagem **E.D.N.** e uma autorização associada a uma terceirizada da **Helix**, mas **essa informação não prova autoria ou intenção do Projeto Éden**. O mistério deve ser investigado, não resolvido por exposição direta.

O objetivo narrativo é mostrar a tensão entre infraestrutura automatizada, ausência de transparência e solidariedade comunitária: uma decisão supostamente técnica determina quem recebe água e tratamento. Personagens não são apenas vendedores de missões: os moradores produzem registros, contestam informações e respondem ao que o protagonista faz.

**Onze soluções próprias de classe nesta primeira camada de exploração:**
| Classe | Ação disponível no mercado | Consequência de jogo |
|---|---|---|
| Solo | Escoltar distribuição | Confiança +2; Atenção +1 |
| Netrunner | Comparar assinaturas digitais | Descobre E.D.N.; Atenção +1 |
| Técnico | Reparar regulador | Revela aviso; Confiança +2 |
| Tecnólogo Médico | Atender feridos | Evidência médica; Confiança +2 |
| Garoto Roqueiro | Mobilizar assembleia | Testemunhos; Confiança +2; Atenção +1 |
| Mídia | Confrontar duas fontes | Prova de adulteração; Atenção +1 |
| Corporativo | Auditar manifesto | Vínculo de terceirizada da Helix; Atenção +2 |
| Policial | Verificar cadeia de custódia | Falta de protocolo; Confiança +1; Atenção +1 |
| Nômade | Reconstruir rota de caminhões | Identifica rota alternativa; Confiança +1 |
| Marginal da Rua | Consultar rede de becos | Identifica comércio de credenciais; Confiança +1 |
| Fixador | Negociar reciprocidade | Acesso a manifesto; Confiança +2 |

As opções são filtradas pela classe atual e registradas uma vez por personagem. **Não se pode acumular recursos por repetição do mesmo diálogo.** Cada ação produz uma pista persistente, e escolhas afetam o estado social.

**Dilema ramificado:** após Lia receber o relatório da V-09, e com pelo menos duas pistas da feira reunidas, o Mural oferece uma decisão exclusiva: publicar os registros (aumenta Confiança +2 e Atenção +2) ou protegê-los em arquivos comunitários (Confiança +1 e Atenção −1). A escolha elimina a alternativa oposta, muda os diálogos e o objetivo ativo. Não há implementação de patrulhas adicionais reagindo à Atenção nesta entrega — a consequência é persistência, fala e registro, não novo inimigo artificial.

## 5. Arquitetura e validação

- `src/game/baixada/layout.ts`: setores, coordenadas, edifícios, NPCs, ruas e colisores estáticos; `navigation.ts`: navegação compartilhada.
- `src/game/baixada/BaixadaScene.ts`: render, jogadores e rotinas ambulantes, profundidade independente de colisão.
- `src/game/story/market.ts`: todas as ações de classe, consequência, diálogo condicionado e serialização.
- `src/screens/ExplorationScreen.tsx`: ligação entre narrativa, escolhas, missão, classe, setor e armazenamento.
- `src/components/BaixadaWorld.tsx`: comunica mudança de setor apenas quando necessário.
- Testes CI: `test-semiopen-world.mjs` (ruas/rotas/setores), `test-market-story.mjs` (classes, pistas, confiança, atenção, decisões exclusivas), testes anteriores de colisão/NPC/combate e compilação TypeScript/Android.
- Captura de navegador do Mercado em 1600 × 720, além das capturas anteriores do Pátio, da arena e da criação.

**Pendente no dispositivo físico:** fluidez em Android, legibilidade de construções e habitantes, navegação longa até o novo setor e atenção a oclusões de edificações. Cargas de novas regiões, facções com turnos próprios, rotas de veículos, mercado de itens completo, hack de terminal com minijogo e perseguições são evolução futura, não features prontas.

## 6. Próximas decisões de design

1. Consolidar a forma do mapa com teste Android (escala, percurso, obstruções).
2. Fechar o conceito de relações entre Helix, Movimento Livre, Consórcio Cívico e Mercado Cinzento: esses nomes existem no projeto, mas motivações e cronologia ainda exigem decisão de escrita.
3. Integrar ramificações reais do dossiê E.D.N. ao próximo capítulo, com respostas de diferentes facções e personagens.
4. Projetar novas áreas como cenas/zonas, e não ampliar indefinidamente a mesma textura.
5. Incrementar IA local dos habitantes sem criar simulação excessiva para o hardware alvo.
