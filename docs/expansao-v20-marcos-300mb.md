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
