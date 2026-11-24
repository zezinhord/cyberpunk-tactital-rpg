# Nova Arcádia 2.0 — Projeto Éden

## RC20 — APK único completo, sem Lite, DLC ou downloads opcionais

**Edição Android assinada e aprovada no emulador Android 15:** `2.0.0-rc.20` (versionCode `2000020`), identificador `com.cyberpunk.tacticalrpg.qa201`, tamanho **3.258.804.643 bytes** (~3,26 GB). Os **sete distritos e 3.808 ilustrações originais** estão todos incorporados ao mesmo APK. A preparação offline é automática e obrigatória, sem escolher entre edição leve e completa.

**[BAIXAR NOVA ARCÁDIA RC20 — APK ÚNICO COMPLETO DE 3,26 GB](https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/45376765554/artifacts/14911472594)**

**[RELATÓRIO DE INTEGRIDADE, ASSINATURA E ANDROID DA RC20](https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/45376765554/artifacts/14911188413)**

**[WORKFLOW GITHUB ACTIONS RC20 — BUILD E TESTES ANDROID 15 APROVADOS](https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/45376765554)**

### Ponto 5 — Narrativa, missões e cutscenes
- **21 desfechos cinematográficos** após vitórias reais da campanha, contemplando V-09, Circuito Fantasma, cinco distritos, Éden/Cisma e sete conselhos. Nunca concede XP, altera uma decisão ou inventa um final.
- A narrativa nos sete conselhos lê a **escolha política realmente salva** (assembleia, auditoria ou centralização) e descreve a repercussão correspondente. A câmera Phaser cinematográfica da RC19 foi preservada.
- Cada desfecho efetivamente assistido é recuperável no **Arquivo de Memórias**. Replay não concede recompensas.

### Ponto 6 — Progressão, equipamentos e economia
- **Calibração de armas, armaduras e implantes** em dois graus (`incomum` e `rara`): usa materiais reais, exige os níveis necessários e concede +1 ou +2 **ATQ, DEF ou EN** ao item calibrado. As modificações pertencem ao ID do equipamento, nunca transferem bônus para outra arma/armadura e são persistidas no inventário v1 compatível com backups anteriores.
- **Componentes recuperados após vitória real**, com raridades e recompensas por confronto. Recibos únicos impedem saques repetidos; derrotas, abandonos, replays e inventário cheio não entregam recompensas parciais.
- **As 11 classes, 35 itens e 25 receitas** anteriores permanecem presentes, além das árvores de progressão, cyberware e habilidades completas.

### Ponto 7 — Interface e acessibilidade Android
- Nova **barra de quatro comandos sempre acessíveis** em landscape de celular (ATAQUE, PODERES, ITEM e PASSAR TURNO), com seleção individual de hostis por lista e ações avançadas recolhíveis.
- Preferências gravadas no dispositivo para **texto ampliado, contraste alto e movimento reduzido**. Aplicação imediata, inclusive no enquadramento das câmeras narrativas, sem alterar salvamentos de personagens.
- Mapa de exploração preservado em Phaser completo, inclusive no perfil econômico de 30 FPS. Nenhum motor Lite volta a ser carregado.

### Evidências de integração e execução
- Código do APK fixado no commit `2a84e926a539cb28bc40163062d99bdd865e2f47` da branch `feature/nova-arcadia-v20-rc20-story-equipment-mobile`, PR #34 (sobre PR #33 da RC19).
- [Suíte de regressão RC20 aprovada](https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/45376550624): 21 cenas, escolhas salvas, calibrações efetivas, saque idempotente, acessibilidade, classes, IA, missões anteriores, TypeScript, build web e boot Android-sized.
- [APK integral QA201 aprovado no emulador](https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/45376765554): 3.258.804.643 bytes, sete ZIPs verificadas no mesmo APK, 3.808 artes originais, sem DLC ou download após instalação; `NA_OFFLINE_INSTALL_COMPLETE` (43 s, 7 distritos), `engine=phaser-full`, `edition=complete`, `originalSprites=true`, `hasLiteRenderer=false`, `ANDROID_SINGLE_APK_AUTO_FULL_GAME_IMMERSIVE_PASS`.
- Assinado com a mesma chave QA201 da RC19, compilado no workflow `.github/workflows/na-rc20-qa201-story-equipment-mobile-apk.yml` na branch `feature/nova-arcadia-3gb-final-assets`. A `main` **ainda não** contém todas as PRs encadeadas.

**Atualização de dados:** exporte antes os backups JSON dos personagens. Instale a RC20 por cima da RC19/RC18 QA201, sem desinstalar, para preservar a área de dados. Reserve **8–10 GB livres** para a preparação. Versões QA100/QA200 têm outros identificadores e não transferem saves automaticamente. O artefato GitHub Actions pode exigir login, e expira em **24 de dezembro de 2026**.

**Limitações reais:** testes aprovados no emulador Android 15, não em aparelhos físicos. Faltam validação longa de FPS, RAM e estabilidade no Galaxy A07 e Redmi Note 12s, avaliações com jogadores e merge coordenado das PRs na `main`. Não confundir RC20 de avaliação com lançamento público final.

RPG tático cyberpunk tropical 2D isométrico para Android; React, TypeScript, Phaser 4, Vite e Capacitor 8.

## Recursos jogáveis preservados na edição 2.0 (base da campanha)

- **11 classes oficiais**: Solo, Netrunner, Técnico, Medtech, Rockerboy, Mídia, Corporativo, Policial, Nômade, Marginal da Rua e Fixador.
- **6 origens** com prólogos, diferenças narrativas e vantagem ativa/passiva de origem. Origem e classe são escolhas independentes.
- **Baixada semiaberta**, incluindo Canal Sul, Pátio do Reúso, Mercado dos Cabos, NPCs, interiores e investigação ligada ao Projeto Éden.
- **Operação Circuito Fantasma**: 19 objetivos em quatro capítulos, três confrontos em ondas (2 + 2 + 3) e recompensas em XP. Duração **projetada** entre 35 e 50 minutos, a conferir no Android; não há temporizador artificial.
- Combate isométrico em turnos com habilidade básica, habilidades comuns, habilidades específicas da classe, posicionamento, energia, recarga e curativo.
- Progressão até o nível 10, cinco atributos, duas técnicas avançadas por classe (22 no total) e três passivas gerais.
- **Até 8 slots locais de personagens**, inventário simples, equipamentos, Vida persistente, progressão e posição na exploração.
- Exportação/importação de backups JSON contendo personagem, inventário, aparência, posição, missões, história, Vida e progresso de Circuito Fantasma.
- Interface horizontal e controles adaptados a celular.

## Instalar Nova Arcádia 2.0 no Android — APK único RC20

1. Abra o [APK completo RC20](https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/45376765554/artifacts/14911472594). Não use versões anteriores, ZIPs de marcos antigos ou pacotes reduzidos.
2. Garanta espaço adicional para a instalação e a extração dos arquivos já incorporados (idealmente 8–10 GB livres).
3. Exporte backups dos personagens. Se já usa QA201 com a mesma assinatura, instale sobre o aplicativo, sem desinstalar.
4. Na primeira abertura, aguarde a preparação obrigatória e offline dos sete distritos. Não há escolha de versão, pacote secundário ou DLC.

**Resultado CI RC20:** [APK assinado, 3,26 GB, mundo Phaser completo, instalação offline e barras imersivas](https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/45376765554). A `main` ainda não representa a expansão completa.

## Salvamentos e atualizações

Os dados são salvos **localmente no dispositivo**. Não há sincronização entre celulares. Cada protagonista possui seu próprio slot; excluir um personagem apaga também seus dados de campanha.

**Antes de atualizar, reinstalar, limpar os dados do aplicativo ou trocar de celular:** abra **Carregar jogo → Exportar** em cada slot e guarde o arquivo JSON fora do aplicativo. Na nova instalação, use **Importar**. Nunca presuma que o Android preservará o armazenamento ao mudar o pacote ou o certificado da assinatura.

A restauração exige confirmação ao substituir um slot existente. Em caso de falha de escrita, o código tenta reverter as alterações para preservar os registros anteriores; isso não elimina a necessidade do backup externo.

## Correções de usabilidade na RC2

- **Missões sempre encontráveis:** o HUD da Baixada mostra o próximo passo, permite recolher o painel e dá acesso à **Operação Circuito Fantasma**; quem já concluiu "O nome que sumiu" recebe orientação para investigar o Pátio do Reúso.
- **Habilidades durante a luta:** toque em **HABILIDADES → ESCOLHER**, selecione uma técnica de classe, comum ou de origem e confirme em **Usar habilidade**. O painel informa custo, alcance e o motivo quando a habilidade não está pronta. Técnicas ofensivas são aplicadas automaticamente ao inimigo se estiver ao alcance; é necessário aproximar-se antes de lançar uma técnica distante demais.
- **Compatibilidade:** não foram alteradas as chaves de armazenamento dos saves nem reiniciada a campanha. Exporte o backup antes de atualizar.

## RC4 — Identidade visual da Baixada restaurada no Android

A RC3 eliminou o travamento da abertura, mas seus personagens viraram
**silhuetas genéricas** e os prédios perderam as texturas vetoriais, janelas,
placas e mobiliário, contrariando a direção de arte definida no projeto.
A RC4 corrige essa regressão **sem voltar ao Phaser no Android**:

- Restaurados os **12 spritesheets originais** das seis origens e duas apresentações;
  por sessão são decodificados somente os dois sprites do protagonista atual.
  Personagens do cenário usam as artes originais de Nilo, Joana, Saira e Téo;
  não são substituídos por bonecos geométricos.
- Fachadas e telhados recuperam as mesmas proporções isométricas, paletas,
  volumes, janelas e acabamentos que o mapa Phaser original: cobogós,
  portas de serviço, toldos, placas luminosas, canos, estruturas industriais
  e detalhes próprios de clínicas, casas, oficinas e mercados.
- Os **SVGs originais de barracas e palmeiras** voltam a ser usados;
  luminárias, caixotes, coletores e marcas de drenagem reaparecem nas células
  originais. Ordem de desenho por profundidade restabelecida.
- Piso industrial, residencial e comercial recupera a variação de cores
  e o contraste escuro da Baixada original, sem blocos lisos improvisados.
- Motor de Canvas 2D nativo, sem Phaser/WebGL na Baixada Android:
  uma superfície limitada a 1280×720, sprites carregados sob demanda e
  **desenho limitado a 30 FPS** durante a caminhada; personagem parado
  não força quadros contínuos.
- Testes de primeira abertura e visual em Chromium Android exigem
  **carregamento real das oito imagens** (2 sprites protagonistas, 4 NPCs,
  2 SVGs), pixels coloridos, personagem desenhado, armazenamento preservado
  e limite de memória do framebuffer. São capturadas screenshots do mapa.
- Os sete distritos, as 56 faixas de áudio e as regras de combate permanecem.
  O pacote continua com a meta de 100 MB de conteúdo real.

**A compatibilidade no Galaxy A07 e Redmi Note 12S ainda precisa ser
confirmada pelos testes físicos.** As capturas de QA comprovam a restauração
das artes no Chromium, não a ausência de fechamentos em todos os aparelhos.

## Hotfix 0.7.0 RC3 — Baixada nativa para Android com memória reduzida

A RC2 ainda exibia **“Carregando a Baixada”** e depois encerrava o aplicativo
em pelo menos um aparelho Android. A causa exata no hardware não foi comprovada
sem logcat, mas a abertura Phaser ainda exigia geração de textura estática
1960×1160, sprites e muitos gráficos antes da tela ser disponibilizada.

Na RC3, **Android usa uma implementação própria Canvas 2D sem inicializar
Phaser.Game na Baixada**. O motor antigo foi isolado em um módulo carregado
sob demanda apenas no desktop. A versão leve apresenta:

- Planta de 39×34 células, ruas, prédios, barracas, moradores e 16 pontos
  de missão/interação; usa as **mesmas células e regras de colisão e
  pathfinding** da implementação Phaser.
- Toque para caminhar ou interagir, teclas direcionais e redirecionamento
  durante movimento; movimento interpolado, ponto de destino visível;
  carregamento de cada região sob demanda.
- Salvamento regular de posição durante a caminhada e ao encerrar a cena,
  entrada na clínica, nos esgotos e no transporte; mantendo os dados
  dos personagens e das missões existentes.
- **Uma superfície Canvas no máximo 1280×720 pixels**, sem WebGL,
  spritesheets decodificadas na abertura nem a textura completa da cidade.
  A imagem é desenhada sob demanda, sem processar quadros continuamente
  quando o avatar está parado.
- Em caso excepcional de falha, um aviso com opção de reiniciar o mapa
  aparece; não há mais tela de carregamento por tempo indeterminado.
- Teste de integração Android valida que o motor nativo abriu, que o
  canvas não está preto e que a movimentação altera o save real.
  O visual Canvas é simplificado para priorizar o carregamento em aparelhos
  com memória restrita.

**Importante:** resultado em Chromium com user-agent Android não substitui
teste físico no Galaxy A07/Redmi Note 12S; não afirmar estabilidade comprovada
antes do usuário testar o novo APK.

## Hotfix 0.7.0 RC2 — Cenário vazio no Android

A RC2 responde à falha reportada na Baixada: **HUD visível e mapa totalmente escuro**.
O projeto foi atualizado para usar, no modo Economia do Android, o **renderer Canvas 2D**
antes de tentar WebGL. A escolha preserva a possibilidade de 30 FPS e evita depender
da inicialização bem-sucedida do contexto gráfico WebGL em dispositivos problemáticos.

O carregamento do mapa agora verifica dois aspectos: a cena foi totalmente criada
(piso, atores e câmera) e existem **pixels reais, não apenas uma tag canvas com tamanho**.
Se a imagem não aparecer, o jogo tenta o renderer alternativo e mostra botão
**Reiniciar cenário no modo alternativo**, sem deletar nem reinicializar personagens.
No Android, **o painel de missões começa recolhido**, deixando a cena livre.

O pipeline incluiu teste visual simulado de Android/WebView com perfil Economia:
reabre save, exige renderer Canvas, confirma pixels de várias cores no mapa,
valida o HUD recolhido e publica o screenshot. Não substitui teste em hardware
Android, sobretudo no Galaxy A07 / Redmi Note 12S. O APK mantém meta ≥100 MB.

## RC 0.7.0 — Marco de 100 MB de conteúdo original

**O APK precisa atingir pelo menos 100.000.000 bytes REAIS** no pipeline de publicação.
A compilação mede o pacote pronto e bloqueia a entrega se a meta não for alcançada,
sem arquivos de preenchimento. A trilha original gerada tem **97.563.256 bytes**
em Ogg/Opus, medida antes do empacotamento. O motor Android e as cenas complementam
o tamanho final, que deve ser conferido no workflow da versão entregue.

- **Sete distritos exploráveis:** Baixada, Ferrugem, Áurea, Subsolo, Setor Zero, Prisma e Periferia.
  A Baixada possui ruas, Mercado, Pátio e os dois níveis subterrâneos; as cinco
  novas regiões possuem mapas isométricos próprios com edifícios, NPCs, terminais,
  rotas seguras e transporte a partir do Pátio Sul.
- **35 novos objetivos narrativos:** cinco capítulos de sete etapas, com investigações
  únicas para cada região, duas escolhas finais por capítulo e consequências na
  confiança comunitária ou alerta da rede.
- **5 novos combates de segurança Helix:** ondas táticas no repetidor de cada distrito;
  as provas e o XP só são liberados após vitória.
- **Rádio de Nova Arcádia:** **56 músicas originais** (7 distritos × 8 contextos),
  cada faixa com cerca de 108 segundos, cerca de 100 minutos de material.
  A música local é reproduzida sob demanda, **uma faixa por vez**, com modo automático
  para a cena e sintonia manual nas configurações; controles existentes de volume
  continuam disponíveis. Sem baixar áudio pela internet.
- **Saves e continuação:** áreas visitadas, passos dos capítulos, decisões finais e
  posição no mapa são salvos por protagonista e integrados à exportação/importação.
  Saves RC6 continuam compatíveis. Não desinstale antes de exportar o backup.
- **Compatibilidade Android:** perfil econômico de 30 FPS preservado por padrão,
  texturas dos mapas geradas apenas ao abrir cada área; os 100 MB são tamanho
  de instalação, **não 100 MB carregados ao mesmo tempo na memória RAM**.

**Validação:** 35 passos e 10 desfechos testados por regras; screenshots reais dos
mapas em Chromium, validação do pacote de áudio e build Android no GitHub Actions.
O teste físico no Galaxy A07 e Redmi Note 12S continua necessário.
O projeto não é considerado finalizado em gameplay apenas por atingir 100 MB.

## RC6 — Ferrugem, fabricação e continuidade

A RC6 acrescenta um segundo distrito explorável (**Ferrugem**, 26×19 células, seis complexos industriais e nove pontos interativos) ligado à Baixada pelo terminal do Pátio Sul. O transporte é liberado após a recuperação do manifesto V-09 no esgoto (ou após uma missão V-09 concluída em salvamentos compatíveis).

- **Ecos de Ferrugem:** capítulo com **9 objetivos ordenados** e duas decisões finais — publicação do dossiê ou proteção das testemunhas. A escolha influencia os indicadores existentes de confiança comunitária ou alerta da rede.
- **Navegação e objetivos:** Ferrugem usa o mesmo toque para caminhar, diagonais seguras, câmera responsiva, marcador do próximo objetivo e botão de retorno à Baixada.
- **Fabricação funcional:** foram adicionados liga reaproveitada, célula de indução, colete ferroviário reforçado (+2 de proteção) e pistola de indução (+2 de ataque). Materiais recuperados em Ferrugem, combinados com conectores, podem ser transformados pelo inventário em equipamentos com efeitos reais no combate.
- **Continuidade após interrupção:** sair do jogo dentro da clínica, esgoto ou Ferrugem registra a região para retomar na mesma área. Saves anteriores sem essa chave continuam iniciando na superfície. O backup JSON agora inclui os marcos de Ferrugem e a última área ativa.
- **Regressão automatizada:** testes de navegação e bloqueio físico da nova planta, progresso do capítulo, escolhas finais, saves por personagem, fabricação, compatibilidade com saves antigos e teste visual com abertura/saída da nova cena em Android horizontal.

**Tamanho real do APK de desenvolvimento anterior ao bump RC6:** 6.244.395 bytes (cerca de 6,24 MB), medido no workflow #552, não estimado pelo ZIP. O novo build mede novamente o APK. **A meta solicitada de 100 MB ainda não foi alcançada** e não serão usados arquivos de preenchimento que agravem o consumo de memória no Galaxy A07 ou Redmi Note 12S. Planejamento: [marco de conteúdo até 100 MB](docs/MARCO-DE-CONTEUDO-100MB.md). O motor e o combate ainda serão ampliados em iterações futuras.

## Estabilização Android e caminhada · RC5

**Feedback do teste fechado anterior:** caminhada desconfortável em geral; relato de fechamentos no Galaxy A07 e queda de FPS no Redmi Note 12S. Causa do encerramento nativo ainda não confirmada sem logs do Android.

- **Movimentação:** rotas em oito direções com verificação de obstáculos nas diagonais, deslocamento contínuo e linear, câmera mais responsiva e novos toques que redirecionam a rota ao terminar a célula atual. O destino é marcado no chão; passos sonoros menos frequentes.
- **Economia de memória:** somente as duas apresentações da origem atual são carregadas; os NPCs são limitados aos que a cena utiliza. Piso e drenagem da Baixada agora são gravados em um único atlas, evitando manter uma segunda textura grande.
- **Estabilidade e FPS:** o Android inicia em perfil Economia com limite de 30 FPS e antialiasing de WebGL desligado. Em Personagem → Configurações, o jogador pode selecionar Economia ou Balanceado (até 60 FPS) e reabrir o app para aplicar. O perfil não altera atributos, salvos nem dificuldade.
- **Diagnóstico local:** registra periodicamente último FPS e FPS mínimo por cena. Em Personagem → Configurações o último registro é exibido; não há envio automático de telemetria.
- **Salvamentos:** todas as chaves e slots existentes são mantidos. O patch atualiza apenas renderização e navegação.

**Validação pendente:** testar por pelo menos 15–20 minutos nos aparelhos reais, verificando exploração, troca de cenas, combate e retorno após bloquear a tela. Ainda não é possível afirmar que o fechamento no Galaxy A07 foi eliminado.

## Expansão jogável do Pátio Sul · RC4

- **Baixada ampliada:** planta 39×34 células, novas estruturas da Subestação Sul e vias de serviço. Entradas de esgoto acessíveis no mapa e por botão contextual de proximidade.
- **Galeria de Drenagem Sul (nível -01):** água bloqueando a passagem, passarelas, terminal de rastros V-09, comando de bomba e comporta com desbloqueio real.
- **Câmara de Recalque 04 (nível -02):** novo mapa com passarelas, manifesto V-09, evidência opcional, repetidor clandestino, retorno à galeria e saída de emergência para a superfície.
- **Missão principal reestruturada:** a clínica encaminha às escadas do Pátio Sul; a investigação só avança ao console e à sentinela do Pátio após a recuperação do manifesto, salvo personagens antigos que já venceram V-09.
- **Checkpoint por personagem:** cada marco do esgoto é salvo de forma independente e incluído nos backups JSON. A rota da Operação Circuito Fantasma original continua disponível.
- **Controles:** toque para caminhar, toque no terminal ou use o botão de acesso quando estiver junto à escada; no esgoto, o objetivo compacto abre o registro completo.

**Roteiro de teste:** clínica → escada do Pátio Sul → rastros → bomba → comporta → manifesto → saída da Câmara → console do Pátio → sentinela V-09. Não confundir mapas visualmente apresentados com conteúdo de missões completamente balanceado: o teste físico ainda é necessário.

## Abertura cinematográfica · RC3

Após criar o primeiro personagem, o jogador assiste a uma **cutscene estática em seis quadros**, com textos surgindo progressivamente. O prólogo apresenta a cidade, o Projeto Éden, a desigualdade entre distritos, os registros apagados e o gancho V-09. A quinta cena inclui nome e história de origem do protagonista.

**Controles:** Revelar texto, Próxima cena e Pular apresentação. Em **Menu inicial → Configurações → Rever apresentação** é possível assistir novamente sem reiniciar o personagem. O modo de movimento reduzido elimina a digitação animada. Os cenários usam apenas CSS e não exigem downloads ou outro motor gráfico.

**Salvamentos anteriores:** saves anteriores à RC3 continuam acessíveis e não são obrigados a repetir o prólogo. Personagens novos recebem o marcador opcional `openingSeen`; concluir ou pular a apresentação preserva atributos, inventário e missões. Mesmo que o app feche durante a cutscene, a apresentação retorna ao continuar.

**Teste fechado:** use a [ficha de avaliação de 8 perguntas, notas de 0 a 5](docs/AVALIACAO-TESTADORES.md). Recomenda-se testar em diferentes aparelhos e registrar vídeos curtos de bugs. A missão V-09 agora usa **duas áreas subterrâneas navegáveis**, com checkpoints persistentes. A revisão integral dos sprites e a homologação em múltiplos aparelhos permanecem pendentes.

## Comandos

- Toque no cenário para caminhar; toque em NPCs, terminais e portas para se aproximar e interagir.
- Na arena, toque em células alcançáveis, use as habilidades da classe, ataque e encerre o turno.
- A **Central do Personagem** permite visualizar classe, inventário e árvore de evolução.
- O **Limbo de Teste** é separado da campanha.

## Desenvolvimento e validação

Requisitos: Node.js **22.12+**, npm, Python 3, Pillow e FFmpeg com codificador libopus (o pré-build regenera sprites e compõe a trilha original local de 56 faixas).

```bash
python -m pip install -r tools/requirements-characters.txt
npm ci
npm run build
```

Para iniciar a versão web: `npm run dev`.

Os testes automatizados estão em `scripts/test-*.mjs` e são executados no [GitHub Actions](https://github.com/zezinhord/cyberpunk-tactital-rpg/actions). A captura em Chromium verifica telas, classe, aparência, movimentos visuais e alguns efeitos reais; **não substitui o teste físico de ponta a ponta**.

## Limitações conhecidas da prévia

- Sete distritos possuem cenas e histórias jogáveis, mas fora da Baixada os mapas são menores e ainda exigem maior variedade de NPCs, veículos e missões secundárias.
- O combate usa uma arena própria, com confrontos simplificados. Não equivale ainda ao combate integrado ao cenário de exploração.
- IA, arte, animações, inventário, lojas e economia continuam em evolução.
- A campanha de 35–50 minutos ainda não foi cronometrada com usuários reais.
- Alguns NPCs reutilizam sprites provisórios.
- Não há salvamento em nuvem nem garantia de compatibilidade com todos os aparelhos Android.

**Controle de qualidade e critérios de publicação:** [docs/PRIMEIRA-VERSAO-PUBLICA.md](docs/PRIMEIRA-VERSAO-PUBLICA.md).

Arquivos históricos da versão 0.6.5 beta permanecem em `docs/` para consulta, mas não descrevem toda a funcionalidade atual.
