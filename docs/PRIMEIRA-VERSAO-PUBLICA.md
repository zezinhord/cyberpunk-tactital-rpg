# Nova Arcádia 0.6.9-rc.6 — Preparação da primeira prévia pública

**Estado:** candidata em validação; **não publicada**.  
**Branch de homologação:** `feature/landscape-mobile-v1`.  
**Política:** não alterar a `main` nem criar uma Release pública sem confirmar os critérios abaixo.

## Critérios bloqueantes (todos devem ser cumpridos)

- [ ] O workflow de `push` na branch candidata terminou com **sucesso**, inclusive captura Chromium, Gradle `assembleDebug`, verificação de assinatura e upload de APK.
- [ ] Instalação limpa do APK num aparelho Android real e abertura até o menu inicial, sem travamento ou tela preta.
- [ ] Atualização por cima do APK anterior **quando a assinatura e o applicationId forem idênticos**, sem perder saves. Se não forem, exportar antes, instalar e importar depois; nunca prometer atualização direta.
- [ ] Criar personagem com origem e classe diferentes, verificar visual, habilidade inicial e dados ao reabrir.
- [ ] Testar pelo menos duas classes de estilos distintos (uma ofensiva e outra de suporte) em combate. A rotina automatizada já verifica as 11 árvores, mas toque, layout e fluidez requerem aparelho real.
- [ ] Abrir a Central do Personagem; nenhuma habilidade ou botão essencial pode sumir em tela pequena.
- [ ] Jogar **Circuito Fantasma integralmente**, 19 etapas e 3 confrontos (2 + 2 + 3 ondas), confirmando que cada objetivo é alcançável, avança e concede XP apenas uma vez.
- [ ] Encerrar o app no meio da campanha e retornar: objetivo, posição, inventário, personagem e pontos de evolução continuam coerentes.
- [ ] Subir nível, comprar atributo e técnica com pré-requisito, combater novamente e reabrir o app mantendo as compras.
- [ ] Perder um confronto e se recuperar (clínica/curativo) sem bloqueio permanente nem recompensa de vitória indevida.
- [ ] Testar importação e exportação de backup: outro slot, mesmo slot com confirmação, progresso da campanha, Vida e localização.
- [ ] Conferir áudio, modo imersivo, rotação horizontal, toque, legibilidade e retorno ao app depois de bloquear a tela.
- [ ] Nenhuma falha crítica: crash, softlock, duplicação de XP, perda de personagem, personagem visualmente trocado, textura ausente, botão impossível de tocar, travamento constante.

Se algum item falhar, **bloquear publicação**, documentar passos de reprodução e corrigir na branch.

## Correções RC2 a retestar no aparelho

- [ ] Em personagem com missão inicial já concluída, o HUD orienta ao **Pátio do Reúso** sem reiniciar salvamento.
- [ ] Na Baixada, painel "Próximo passo" abre e fecha, não impede a movimentação no mapa e mostra a Operação Circuito Fantasma.
- [ ] Na arena, botão **HABILIDADES** está visível e abre o seletor sem cortes no Android horizontal.
- [ ] Selecionar uma técnica, ver custo e alcance, executar efeito real; observar energia, recarga e motivo da indisponibilidade.
- [ ] Após comprar uma habilidade na árvore, ela aparece no seletor do próximo combate, mantendo classe e aparência.

## Prólogo cinematográfico da RC3

- [ ] Criar um personagem novo e conferir abertura em seis quadros, com texto progressivo e identidade correta.
- [ ] Testar os botões Revelar texto, Próxima cena e Pular apresentação em 914×411.
- [ ] Fechar o aplicativo durante o prólogo e continuar: cutscene reaparece sem perder o slot.
- [ ] Completar ou pular a cutscene e entrar no prólogo individual da origem.
- [ ] Em Configurações, rever a apresentação com personagem existente sem reiniciar missão, experiência ou inventário.
- [ ] Com a opção Reduzir movimento habilitada, o texto deve aparecer imediatamente.
- [ ] Reinstalar somente depois de exportar um backup. Confirmar que o save legado não reinicia o prólogo.

**Fronteira de escopo:** prólogo e dois mapas subterrâneos estão implementados na RC4. A revisão integral dos sprites, o balanceamento final de inimigos e testes de desempenho em diferentes aparelhos permanecem pendentes.

[Questionário da prévia fechada — 8 perguntas (0–5)](AVALIACAO-TESTADORES.md)

## Homologação da RC6 — Ferrugem e fabricação

- [ ] Recuperar o manifesto V-09 no esgoto ou usar personagem compatível que já concluiu a investigação e atravessar o terminal no Pátio Sul.
- [ ] Confirmar o carregamento da planta Ferrugem, a câmera, os edifícios, o marcador do objetivo e os terminais de interação em tela horizontal.
- [ ] Concluir os nove objetivos de Ferrugem sem precisar repetir etapas ou receber o mesmo XP duas vezes.
- [ ] Escolher publicar o dossiê com um save e proteger testemunhas com outro; verificar consequências diferentes na confiança ou no alerta do Mercado.
- [ ] Recuperar liga metálica e célula, fabricar um colete e uma pistola na Central → Inventário e equipar ambos; conferir +2 de proteção e +2 de ataque no combate.
- [ ] Fechar o app enquanto estiver em Ferrugem e retomar na mesma área sem perder missão nem personagem.
- [ ] Entrar e sair das duas áreas subterrâneas e da clínica após forçar o fechamento do aplicativo.
- [ ] Exportar o slot e importar noutro aparelho; verificar se o capítulo Ferrugem, o inventário fabricado e a última área foram preservados.
- [ ] Testar no Galaxy A07 e Redmi Note 12S com perfil Economia (30 FPS), medindo variação de FPS, memória e fechamento inesperado.
- [ ] Conferir a medida efetiva do APK nos logs do workflow. **Não anunciar 100 MB sem medir 100.000.000 bytes reais.**

Critério: os novos mapas, decisões e equipamentos precisam passar no Android real antes de liberar o grupo de testes para mais pessoas. O cumprimento da meta de tamanho **não** substitui fluidez e estabilidade.

## Regressão de caminhada e desempenho — RC5

**Aparelhos relatados:** Galaxy A07 (encerramento inesperado) e Redmi Note 12S (queda de FPS). A variante de RAM, a versão do Android e a etapa do fechamento precisam ser registradas antes de atribuir uma causa.

- [ ] No Galaxy A07, iniciar em Economia, entrar na Baixada, caminhar por 5 minutos e alternar clínica/esgoto/superfície pelo menos 10 vezes.
- [ ] No Redmi Note 12S, usar Economia durante 15 minutos; registrar FPS mostrado no menu no começo e após 10 minutos.
- [ ] Redirecionar um caminho longo com outro toque durante o movimento; confirmar que o personagem não ignora o novo destino.
- [ ] Testar diagonais junto a paredes e NPCs: não atravessar cantos, água nem itens sólidos.
- [ ] Confirmar que não há interrupção brusca do movimento a cada célula, e o marcador aparece no destino tocado.
- [ ] Jogar uma missão com combate e retornar à exploração, validando skin, classe e habilidades.
- [ ] Reabrir o APK depois de um fechamento ou interrupção; confirmar que o último save continua válido.
- [ ] Registrar último FPS/mínimo em Personagem → Configurações e a configuração Economia/Balanceado usada.
- [ ] Testar Balanceado apenas depois de o modo Economia estar estável; registrar se houve melhora ou piora.
- [ ] Se o APK fechar sozinho, pedir o relatório de erro do Android ou um logcat; sem isso o motivo não está confirmado.

**Critérios para ampliar o teste:** nenhum encerramento inesperado durante 20 minutos em cada aparelho, movimentação responsiva e FPS consistente com a configuração usada. São metas de homologação, não resultados já alcançados.

## Homologação de esgoto e expansão da RC4

- [ ] Confirmar que a Baixada abriu em 39×34 células e as ruas do leste são caminháveis sem travar a câmera.
- [ ] Na missão V-09 depois da clínica, objetivo conduz à escada de esgoto no Pátio Sul.
- [ ] Acessar a **Galeria de Drenagem Sul** pelo mapa e pelo botão de proximidade; validar mapa, câmera, paredes, água e toque nos objetos.
- [ ] Examinar rastros V-09; bomba não pode ativar antes da pista, comporta não pode abrir antes da bomba.
- [ ] Abrir comporta e explorar a **Câmara de Recalque 04**, sem perda de classe, aparência ou itens.
- [ ] Recuperar manifesto e opcionalmente contêiner; sair pelo acesso de superfície da Câmara ou retornar pela galeria.
- [ ] Console do Pátio e sentinela exigem manifesto para novos personagens, mas saves antigos que já venceram V-09 não ficam bloqueados.
- [ ] Fechar o app após cada marco, reabrir e verificar progresso. Exportar JSON, restaurar e conferir checkpoints da galeria e da câmara.
- [ ] Registrar temperatura, queda de frames, toques inconsistentes e perda de progresso no Android real.
- [ ] Submeter as oito perguntas do questionário aos avaliadores, separando pontuação de bugs bloqueantes.

## Roteiro de homologação — 30 a 60 minutos

1. **Primeira inicialização (5 min):** novo personagem, nome, seis origens, onze classes, prólogo, Baixada e menu.
2. **Exploração (10 min):** caminhar por toque, câmera, clínica, oficina, galeria, Pátio e Mercado; interagir com NPCs e terminais.
3. **Campanha (35–50 min projetados):** iniciar Circuito Fantasma, completar cada etapa, anotar tempo real e investigar se algum ator/terminal não é alcançável.
4. **Combate (incluído na campanha):** mover, usar poder de classe, habilidade de origem, energia, ataques, curativo e múltiplas ondas; confirmar vitória/derrota e retorno à Baixada.
5. **Persistência (10 min):** equipamento, XP, árvore de evolução, fechar/abrir, alternar slots, backup e restauração.

*A duração de campanha é uma estimativa de design, não um tempo comprovado.* Testes automatizados não simulam termodinâmica, economia de RAM, desempenho de toque ou permissões de todos os modelos de Android.

## Matriz mínima de aparelhos

| Condição | Verificar | Resultado |
|---|---|---|
| Android real na horizontal, tela aproximada de 914×411 dp/px | HUD, comandos fixos, leitura, toque | Pendente |
| Outro tamanho de tela / densidade diferente | Sem cortes, transbordamento ou botões inacessíveis | Pendente |
| Dispositivo com RAM e GPU modestas | Sem fechamentos por memória, quedas graves de quadros | Pendente |
| Voltar do segundo plano após alguns minutos | Estado de UI e salvamento recuperáveis | Pendente |
| Instalação anterior com saves | Migração e arquivo de backup externo | Pendente |

## Conteúdo e limitações a comunicar ao público

O pacote é uma **prévia jogável de um projeto independente**, não um RPG completo nem uma versão para loja de aplicativos. Inclui o início da narrativa, um distrito semiaberto, combates em arena própria e uma campanha guiada de testes. Sistemas avançados de economia, múltiplos distritos, veículos e boa parte da narrativa permanecem incompletos. Alguns recursos visuais e NPCs são provisórios.

Não afirmar que há 30–50 minutos garantidos até medir em sessão real. A estimativa deriva da soma das durações planejadas.

Os saves são locais; desinstalação, limpeza de armazenamento ou mudança de certificado podem apagar ou tornar inacessíveis os dados. Recomendar **Exportar backup** antes de qualquer atualização. A versão atual gera **APK debug assinado**, próprio para distribuição de teste direta, **não** publicação automática na Google Play.

## Fluxo seguro de primeira publicação

1. Preservar esta branch e verificar os workflows de `push` e de PR no commit exato da candidata.
2. Baixar o APK **do workflow de `push`** bem-sucedido, não do de `pull_request` (que não empacota o APK).
3. Instalar e completar a matriz de testes num Android real. Registrar erros com vídeo curto, modelo e passos exatos.
4. Corrigir bloqueios, rodar os testes novamente e congelar o commit aprovado.
5. Só então criar uma **GitHub Release** intitulada `Nova Arcádia 0.6.9 — Prévia Pública 1`, anexar APK, notas, limitações e procedimento de backup. Evitar depender de artefatos temporários do Actions.
6. Migrar para assinatura Android de produção e fluxo de publicação compatível com a Google Play **antes** de prometer distribuição pela loja. Conservar a mesma chave em atualizações futuras.

## Auditoria do pacote

Confirmar no GitHub Actions final: testes de habilidades, classes, saves, backup com rollback, mapa, campanha, ondas, TypeScript, build Vite, captura Chromium, orientação horizontal, modo imersivo, Gradle e certificado. A aprovação do CI é necessária, mas **não suficiente**.

**Decisão de lançamento:** PENDENTE de validação Android e aceite do responsável pelo projeto.
