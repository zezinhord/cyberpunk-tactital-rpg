# Nova Arcádia 0.6.9-rc.1 — Preparação da primeira prévia pública

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
