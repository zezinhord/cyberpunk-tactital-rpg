# Nova Arcádia 2.0 — progresso da expansão em marcos de 300 MB

Referência de produção: 21 de novembro de 2026. Branch: `feature/nova-arcadia-3gb-final-assets`. PR #22.

## Auditoria de bytes publicados/testados

- Linha de base validada: **1.174.082.151 bytes** — APK RC4 auditado de **1.143.503.198 bytes** mais sete pacotes de arte ZIP (**30.578.953 bytes**), conforme workflow `na-original-content-production.yml`.
- Próximo marco: **1.474.082.151 bytes**. Incremento ainda necessário: **300.000.000 bytes**.
- Meta final: **3.000.000.000 bytes**. Faltam **1.825.917.849 bytes** pela medição de referência.
- O último conjunto de mudanças de código NÃO é contado em bytes até que exista novo APK compilado, assinado e auditado. Sprites de produção, fontes, arte intermediária e arquivos de teste não entram no contador.
- Metas consecutivas (bytes): 1.474.082.151; 1.774.082.151; 2.074.082.151; 2.374.082.151; 2.674.082.151; 3.000.000.000.
- `tools/na_milestones.py` calcula os marcos verificáveis, exigindo APK assinado e pacotes auditados. O código impede divulgar 3 GB como versão final antes da homologação.

## Conteúdo integrado e testes da rodada

**Operação Retomada:** 7 cadeias pós-conselho, uma por distrito, acessíveis depois de concluir suas quatro investigações, quatro pareceres, decisão e defesa tática. Inclui 21 serviços em máquinas físicas de 21 interiores reais da cidade. Cada serviço exige um dos 21 quebra-cabeças técnicos originais, com 63 alternativas de intervenção, explicação e dica de tentativa, sem custo por erro. Três serviços completados desbloqueiam três escolhas finais de política pública: 21 alternativas de gestão, com relações entre facções, ajustes de combate regional e benefícios de apoio posteriores.

- `src/game/story/recovery-network.ts`: estado separado por protagonista, validação estrita, critérios de desbloqueio, recuperação, XP único, 21 tarefas e 21 consequências.
- `src/game/story/recovery-calibrations.ts`: 21 minijogos de decisão técnica baseados no material específico de cada sala.
- `src/screens/ExplorationScreen.tsx`: desafios iniciados ao interagir com máquinas no mapa; contato local exibe gestão e opções; diário aponta próximo endereço.
- `src/App.tsx`: conciliação de XP para evitar duplicação em crashes/importação e bônus táticos obtidos por conclusão das obras.
- `src/game/story/reputation.ts`: repercussão de escolhas nas quatro facções.
- `src/game/character/backup.ts`: exportação/importação segura do progresso de reconstrução, sem invalidar saves antigos.
- `scripts/test-recovery-network-v20.mjs`: testes de 21 reparos, 21 políticas, estado, XP, reputação e salvamento.
- `scripts/test-recovery-calibrations-v20.mjs`: testes das 63 alternativas, dicas e integração ao sistema físico de interação.
- `.github/workflows/na-asset-pack-bridge-qa.yml`: executa QA de missões e TypeScript, empacota a versão web real com Vite, verifica 16 atlas de inimigos e valida o downloader Android nativo. O teste usa `npx vite build`, sem disparar o prebuild de áudio pesado.

## Condições ainda não satisfeitas

A compilação de teste do pacote web, o plugin Android e os testes unitários **não equivalem** a uma edição 3 GB para baixar. O último APK assinado (RC4/RC5) não incorpora automaticamente a Operação Retomada. O marco 300 MB precisa de novos ativos originais, de uso real e preferencialmente gráficos/ambientais ou conteúdo jogável, pacote nativo seguro e teste de instalação completa. Não produzir ruído, duplicatas, áudio inflado nem assets sem uso apenas para alcançar o número.

O estado real da branch e os logs de Actions devem ser consultados antes de declarar uma etapa concluída. Os relatórios das próximas execuções devem declarar os bytes **medidos**, os arquivos integrados, o resultado dos testes e o próximo requisito de 300 MB.


## Marco 2 — +300 MB adicionais (entrega publicada em 21/11/2026)

**Estado: APROVADO E PUBLICADO (QA Android; não é a edição definitiva de 3 GB).**
Release: https://github.com/zezinhord/cyberpunk-tactital-rpg/releases/tag/nova-arcadia-v200-milestone-1774
GitHub Actions: https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/44897634372

### Tamanho REAL da distribuição assinada

- APK 2.0.0-rc.7, assinatura QA201 preservada: **1.144.051.895 bytes**.
- Sete ZIPs de distritos (manifests SHA-256 verificados): **725.019.777 bytes**.
- Total efetivo de APK + conteúdo complementar: **1.869.071.672 bytes** (1.869,07 MB).
- Marco anterior (APK RC6 + sete ZIPs): **1.475.365.848 bytes**.
- Aumento comprovado entre entregas: **393.705.824 bytes** (+393,71 MB).
- Próximo marco sequencial: **2.074.082.151 bytes**. Faltam **205.010.479 bytes**.
- Meta final 3 GB: faltam **1.130.928.328 bytes**.
- Estes números usam os arquivos efetivamente assinados e publicados, não art tools nem soma hipotética de mídia comprimida.

### Conteúdo jogável efetivamente novo

- **A Cidade Responde:** 28 simulações de campo, seis fases por interior, com **168 checkpoints de decisão**.
- **42 questões táticas autorais** (seis por distrito, aplicadas nos quatro locais daquela região), três abordagens, pistas para respostas incorretas e decisões verificadas.
- **672 novas pranchas isométricas** de 2880×1620 pixels; **393.537.520 bytes** de imagens WebP originais de operações e rotas, todas associadas às seis fases jogáveis.
- Os sete ZIPs preservam os **448 quadros da expansão anterior**, **336 dossiês**, 28 murais e 84 ilustrações de objetos; total **1.568 arquivos únicos**.
- Recompensas únicas de 96 XP por conclusão de simulação (28 possíveis), salvas por protagonista e conciliadas depois de falhas/importações.
- Simulações disponíveis no **arquivo visual de cada interior**, desbloqueadas após a gestão do distrito ter sido definida na campanha Operação Retomada.
- API Java mantém SHA-256, validação de paths, instalação temporária privada e carregamento sob demanda de um quadro por vez.

### Testes obrigatórios concluídos

- Geração e auditoria de 672/672 ilustrações sem imagens repetidas, tamanho seguro e pertinência a cada interior.
- Testes de segurança de ZIP, manifest, URL, assinatura e bloqueio de publicação antecipada.
- Testes de missões, 168 decisões, XP único, salvamento e backup.
- Vite produção, TypeScript, Gradle Android e assinatura compatível com o APK QA201 existente.
- Inicialização e reinicialização confirmadas no emulador Android 15 com configuração de 2 GB.

**Instalação:** o APK RC7 substitui a instalação QA201 (mesmo ID e chave), sem excluir salvamentos locais. Quem utiliza QA200 ou outra variante precisa preservar o backup, pois seu package ID é diferente. Abra *Configurações → Conteúdo extra* e baixe novamente os sete ZIPs, pois as assinaturas SHA dos pacotes foram atualizadas. Os extras ficam offline depois da transferência; mantenha espaço livre adicional durante extração. Os testes físicos no Galaxy A07 e Redmi Note 12s continuam recomendados.

## Marco 3 — Operação Limiar (publicado em 21/11/2026)

**STATUS: homologado no Android 15 / 2GB e distribuído (não definitivo).**

- Release oficial: https://github.com/zezinhord/cyberpunk-tactital-rpg/releases/tag/nova-arcadia-v200-milestone-2074
- Build e instalação: https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/44903444904 — sucesso em todas as etapas.
- Auditoria das ilustrações originais: https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/44902142389 — sucesso.
- APK assinado QA201, versão 2.0.0-rc.8: **1.144.096.471 bytes**.
- Sete ZIPs autenticados: **1.053.830.005 bytes**.
- Tamanho realmente publicado (APK + 7 packs): **2.197.926.476 bytes** (2.197,93 MB).
- Aumento sobre a release QA201 RC7: **328.854.804 bytes** (328,85 MB).
- Próxima meta sequencial: **2.374.082.151 bytes**; faltam **176.155.675 bytes**.
- Restante para 3.000.000.000 bytes: **802.073.524 bytes**.
- Fração da meta final: **73,26%**.

### Mecânica integrada: Operação Limiar

São 28 novas patrulhas exploráveis, uma por cada interior de investigação, desbloqueadas após concluir as seis etapas de A Cidade Responde. A exploração utiliza **mapas clicáveis reais de 8×8**, com **28 layouts independentes**, paredes bloqueantes, áreas de vigilância, risco, ferramentas de proteção e pressão de alarme. A patrulha exige movimentar o personagem ortogonalmente, alcançar cinco equipamentos em sequência e resolver as intervenções por decisões contextuais; ao atingir alerta crítico, a equipe recua ao posto seguro sem apagar as provas.

**140 postos de intervenção**, com 35 desafios técnicos regionais específicos, aplicados aos quatro interiores de cada distrito. Conclusão gera **138 XP por interior uma única vez**, reconciliados com o salvamento em caso de reinício/crash. Integrado a importação/exportação JSON de backup sem invalidar personagens antigos.

### Arte efetivamente jogável, sem enchimento por áudio

**560 mapas originais** de patrulha a 2880×1620, com paredes, zonas de risco e postos correspondentes aos dados de gameplay; **328.722.348 bytes** de imagens novas WebP, sem duplicação. Os pacotes contêm **2.128 artes** no total (28 murais, 84 objetos, 336 dossiês, 448 cinemáticas, 672 quadros de simulação e 560 plantas da Operação Limiar), usadas nas 28 salas. Um quadro de cada vez é carregado no Android.

### Homologação

Validações de roteiros, mapa, deslocamento, bloqueios, 140 escolhas, SHA-256 de cada asset e de cada ZIP, proteção contra URLs arbitrárias, TypeScript, Vite, Gradle, identidade de assinatura QA201, APK, teste de abertura e de reinicialização em emulador Android 15 configurado com 2 GB de RAM: **todas aprovadas**. A atualização usa a mesma identificação Android e chave de assinatura QA201 para upgrade sobre RC7. Testes físicos em Galaxy A07 e Redmi Note 12s seguem recomendados: emulador não valida todas as GPUs nem o desempenho em campo.

A edição final de 3 GB ainda não foi lançada; o status desta entrega é **QA RC8 — marco 3**.

## Marco 4 — Operação Vigília (21/11/2026, compilado e PUBLICADO)

**Status: RC9 QA201, APK assinado, 7 ZIPs publicados, Android 15/2GB boot e reboot OK.** Não é a edição final de 3GB.

- Release oficial: https://github.com/zezinhord/cyberpunk-tactital-rpg/releases/tag/nova-arcadia-v200-milestone-2374
- CI integral (aprovação Android e upload): https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/44906610853
- Produção e auditoria artística: https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/44905000269
- APK assinado **2.0.0-rc.9** (versionCode `2000009`, package ID `com.cyberpunk.tacticalrpg.qa201`): **1.144.128.571 bytes**.
- Sete pacotes ZIP de distritos, autenticação SHA-256: **1.327.246.303 bytes**.
- Total PUBLICADO = APK RC9 + os sete pacotes ZIP: **2.471.374.874 bytes**, ou **2.471,37 MB** em unidades decimais.
- Crescimento REAL em relação à RC8 publicada (2.197.926.476 bytes): **273.448.398 bytes**, +273,45 MB.
- Quarto marco obrigatório de 2.374.082.151 bytes: **atingido com 97.292.723 bytes de folga**.
- Próximo marco (+300MB sobre a meta sequencial): **2.674.082.151 bytes**; faltam **202.707.277 bytes**.
- Meta final 3.000.000.000 bytes: faltam **528.625.126 bytes**; progresso **82,38%**.

### 28 novas missões jogáveis: Operação Vigília

Cada interior recebe uma missão de evacuação com **quatro grupos civis** (112 grupos ao todo), corredor físico em 8×8 casas, bloqueios reais, três sentinelas móveis por missão, calor de vigilância, energia, alerta, três posturas (normal, furtivo e corrida por duas casas), distração eletrônica, recuperação de energia, recuo no alerta crítico e registro dos incidentes. O resgate conclui após alcançar os quatro grupos e a saída; XP entre 108 e 168 por sala, contabilizado apenas uma vez e guardado em backup JSON por personagem. Disponível após a **Operação Limiar** na aba **Vigília** do arquivo do interior.

O jogo abre as missões **sem exigir os ZIPs visuais adicionais**; os pacotes são opcionais para ver as ilustrações. O botão do arquivo no interior aponta para a nova missão quando desbloqueada. Os ZIPs oferecem **448 ilustrações isométricas autorais novas**, 16 por sala, todas relacionadas à rota, aos resgatados e à equipe hostil. Arquivos originais adicionais comprovados: **273.347.786 bytes** em 448 WebPs 2880×1620, com validação individual de hash e dimensões. Total dos sete pacotes: **2.576 arquivos originais**, preservando os 2.128 anteriores e os recursos sonoros existentes no APK (sem enchimento por áudio).

### Homologação e limitações

- Todos os 28 resgates simulados com 112 grupos libertados, 364 movimentos, guardas dinâmicos, resgate único, corrida sem atravessar paredes, backup e reconciliação de XP.
- TypeScript, Vite, Gradle, assinatura QA201 e in-place upgrade RC8→RC9 mantidos.
- Instalação, abertura e **reinicialização** em emulador Android 15 configurado com 2GB de RAM: PASS; WebView carregou a interface (first-frame ~3047ms inicial, ~4597ms no reinício).
- Testes físicos dos Galaxy A07, Redmi Note 12s e demais celulares não foram executados; consultar `docs/qa-rc9-vigilia.md`.
- O instalador RC9 possui **~1,14 GB**; **2,47 GB** é a soma do APK com os sete pacotes opcionais baixados via Configurações → Conteúdo extra. Não se trata de um único APK de 2,47 GB. Não desinstalar a QA201 antes de fazer backup e testar o upgrade.

## Marco 5 — Operação Refúgio (implementação em validação, NÃO publicado)

**Branch:** `feature/nova-arcadia-3gb-final-assets`; PR #22. O quinto marco **não** substitui a distribuição RC9 enquanto a CI não concluir geração física dos arquivos, verificação SHA-256 de sete pacotes, compilação Android com a chave QA201, instalação, boot/reboot no Android 15/2GB e publicação da pré-release.

### Conteúdo de código já implementado

- 28 novas missões interativas de proteção civil, uma por interior após concluir a Vigília; 140 postos de intervenção e 35 briefs distritais específicos com três políticas públicas possíveis cada.
- Percurso em grades reais de 8×8, colisões e zonas de perigo; planejamento de menor risco pelo algoritmo Dijkstra; três posturas, gastos e reposição de suprimentos, moral, segurança e gestão civil.
- Abas Refúgio integradas no arquivo de interior, desbloqueio cronológico, registro de resultados e recompensas únicas de até 185 XP por interior; save JSON retrocompatível e reconciliação de XP depois de crash/import.
- Corrigida a busca de quadros das missões Vigília: usa agora `evac` em vez de requisitar `route`, impedindo exibição de ilustrações de patrulha durante o resgate.
- Teste `scripts/test-shelter-network-v20.mjs`: 28 cenários, 140 decisões, 308 movimentos e rejeição de repetição/exploits; workflow do bridge Android valida TypeScript, arte amostral, jogabilidade e conteúdo anterior.

### Produção artística e distribuição

- `tools/produce_shelter_network.py`: produtor original de 560 vistas 2880×1620 (28 interiores × 5 postos × 4 ângulos), com plantas, barreiras, risco, pessoas e objetos físicos específicos.
- `tools/test_shelter_network.py`: auditoria de 560 obras não duplicadas, dimensões, licença, associação ao mapa e contagem física de bytes. `tools/build_3gb_asset_packs.py` exige 448 assets por distrito e 80 quadros Refúgio por ZIP (3136 obras originais em 7 ZIPs), preservando todos os quadros anteriores.
- Novo gate auditado: **2.674.082.151 bytes** de distribuição APK + sete ZIPs. Produção de imagens por si só **não** comprova atingir o marco: usar tamanho realmente auditado pelo workflow e APK assinado.
- Workflow de release `.github/workflows/na-milestone-2674-release.yml`: produz o conteúdo, confere hashes, executa testes, restaura mídia original do APK base com SHA esperado, assina como RC10 **pela mesma chave QA201**, roda boot/reboot no emulador Android 15 com 2GB e só então publica a release `nova-arcadia-v200-milestone-2674` com APK e sete ZIPs.
- Release de referência ainda estável: `nova-arcadia-v200-milestone-2374`, RC9 = 2.471.374.874 bytes distribuídos. **Não** contar os 560 novos quadros no total até auditoria e publicação real.

### Verificação em GitHub

- Teste de regressão TypeScript e missões: https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/44939424315
- Arte autoral dos sete distritos: https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/44939541072
- QA nativa/refúgio: https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/44939548320
- Release Android RC10: https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/44939655687


## Marco 6 — Operação Nexo e entrega 3GB (desenvolvimento RC11, auditoria final em execução)

**Status explícito:** código implementado; QA integrada do núcleo Nexo aprovada; **não declarar release final nem tamanho de 3GB até existir nova distribuição assinada, testada e publicada**.

### Base de produção autenticada

- Produção de 3.136 ilustrações originais de 28 interiores (incluindo 560 quadros Refúgio): workflow https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/44939541072, aprovado.
- Sete ZIPs auditados: **1.683.900.379 bytes** de imagens. Linha de base de referência APK RC4 + os sete ZIPs: **2.827.403.577 bytes**, ainda **172.596.423 bytes abaixo** de 3.000.000.000.
- **Essa medição é de produção original**, não substitui o tamanho do APK RC11 assinado nem prova, sozinha, que a release final está disponível.

### Operação Nexo — implementação integrada

- 28 novas incursões táticas, uma por interior, disponibilizadas depois de concluir a Operação Refúgio; a lógica funciona sem baixar ZIPs.
- 168 relés de rede fisicamente localizados (seis por interior) em mapas 8×8: 42 acontecimentos distritais inéditos e 126 alternativas específicas, com três políticas de destino para Éden (transparência civil, supervisão humana ou rede descentralizada).
- Sentinelas móveis, detectores por célula, rastreio, energia, deslocamento furtivo/normal/investida, bloqueador eletrônico, recarga, contra-invasão com recuo ao último relé sincronizado, rota segura calculada por Dijkstra e decisões sem teletransporte.
- Progresso e XP único por protagonista, backup JSON com validação estrita, reconciliação após falhas; nova aba **Nexo · Éden 8×8** no arquivo do interior; botão do mapa e painel de missões orientam a sequência Vigília → Refúgio → Nexo.
- `scripts/test-nexus-eden-v20.mjs`: 28 missões, 168 relés, testes de colisão, percurso, recompensas, estados de save, exploits. Teste integrado confirmado em https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/44941221300: 364 movimentos, 112 recargas, 6.440 XP únicos simulados no conjunto (não representa uma sessão individual).

### Recursos visuais e instalador

- Novo produtor `tools/produce_nexus_eden.py`: 672 pinturas autorais em 2880×1620 (seis relés × quatro vistas × 28 interiores), com plantas, guardas, scanners e equipamento. Prova amostral: 24 quadros originais do observatório da Baixada somaram 15.929.612 bytes, com auditoria individual sem duplicatas.
- Pacotes finais exigem 544 artes autênticas por distrito, **3.808 em sete ZIPs**. Verificador `tools/build_3gb_asset_packs.py` exige todos os nove tipos de arte, SHA-256 único por arquivo, verificações de diretório, dimensões e tamanho físico de bytes; sem bytes de enchimento.
- Corrigido `native/NovaAssetPacks.java`: instalador e leitor aceitam as famílias `shelters` e `nexus` mantendo SHA-256 e verificação contra ZIP traversal.
- `tools/restore_verified_art_sources.py` aproveita 3.136 obras previamente auditadas sem re-renderizar/copiar recursos extras no pacote final. Novos arquivos Nexo são produzidos de forma independente, adicionados aos manifestos, e todos os ZIPs são reconstruídos e auditados integralmente.
- O artefato final é modular: APK Android QA201 e sete ZIPs opcionais por distrito. **A meta de 3GB é o tamanho total distribuído, não um APK individual de 3GB.**

### Compilação e distribuição

- RC10/Marco 5: https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/44941304180. Correção do hash SHA-256 da mídia original e reutilização segura dos ZIPs auditados. Verificar estado antes de divulgar release.
- RC11/edição 3GB: https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/44941452423. Só publica `nova-arcadia-v200-final-3gb-assets` se geração das 672 artes, revalidação dos 3.808 arquivos, sete SHA dos ZIPs, soma **>=3.000.000.000 bytes efetivamente distribuídos**, TypeScript e testes de história, Gradle, chave QA201 preservada, assinatura, instalação, boot e reboot Android 15/2GB tiverem êxito.
- Teste físico no Galaxy A07, Redmi Note 12s e outros aparelhos permanece necessário para homologação de performance real.

### Próxima verificação

Conferir o **estado atual** das execuções e releases. Não indicar link de instalação RC10/RC11 inexistente ou URL de ZIP presumido. Somente releases com APK e sete ZIPs efetivamente disponíveis e auditoria publicada são entregas.
