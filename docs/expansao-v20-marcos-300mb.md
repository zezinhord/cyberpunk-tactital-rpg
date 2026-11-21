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
