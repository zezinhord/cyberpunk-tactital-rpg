# Nova Arcádia 2.0.0-rc.2 — expansão implementada nesta rodada

**Branch:** `feature/nova-arcadia-cisma-eden-v20-foundation`
**Estado:** QA experimental, não versão final; não confundir contagem de conteúdo com tamanho em GB.

## Conteúdo de gameplay realmente integrado

1. **O Cisma de Éden, Ato I** — oito marcos investigativos, dependência do desfecho Éden 1.0, três escolhas sobre contestação da rede, onze métodos por classe e contexto de seis origens.
2. **Atos II–IV** — 23 marcos sequenciais nos sete distritos, envolvendo Rosa, Celina, Mara, Kai, Dara, Iuri, Marta, Amara e operadores locais. Requerem deslocamento e interação com NPC/terminal real no mapa.
3. **Confrontos inéditos no TurnManager**:
   - `cisma-intercept`, Prisma, 2 ondas: supressão + sabotagem.
   - `cisma-containment`, Setor Zero, 2 ondas: escolta + caçador.
   - `cisma-core`, Setor Zero, 3 ondas: supressão + sabotagem + atirador de precisão.
   - A fase de contenção e a fase de núcleo são **batalhas distintas**, intercaladas por investigação no terminal; a missão só progride depois de vencer TODAS as ondas.
4. **Três novos desfechos pós-clímax** (`assembleia`, `mediacao`, `ruptura`) que mantêm o precedente do primeiro arco (`auditoria`, `refugio`, `pacto`), preservando as nove combinações possíveis. Consequências de facção e quadro Cidade atualizados.
5. **35 interiores exploráveis** = 7 existentes + **28 novos** (quatro por distrito). Cada área tem mapa isométrico próprio carregado isoladamente, contato local, três objetos acionáveis, novos textos de contexto e recompensas reais com recibos de uso único: **105 pontos de coleta/arquivo no total**.
6. **Seleção de interiores** no ponto físico de entrada do distrito (5 áreas por região); ampliação da Baixada desbloqueada após V-09. Sem pré-carregar todas as cenas no boot.
7. **Compatibilidade de saves:** expansão do Ato I isolada dos Atos II–IV, backups JSON com campos opcionais `cisma` e `operations`, importação retrocompatível, validação, rollback, exclusão por slot e XP reconciliável sem repetição.

## Validação implementada

- `scripts/test-cisma-v20.mjs`: 8 etapas, 3 primeiras resoluções, 11 classes, 6 origens, 7 distritos.
- `scripts/test-cisma-operations.mjs`: 23 etapas, 3 encontros, 3 finais, restauração, passos ilegais.
- `scripts/test-tactics.mjs`: waves, perfis táticos das fases, supressão e sabotagem.
- `scripts/test-indoor-expansion.mjs`: caminho e colisões dos 35 interiores, todas as três interações de cada um, 105 recibos, entrada/saída.
- `scripts/test-save-slots.mjs`: importação e limpeza de novos campos, recuperação de backup antigo, persistência por personagem.
- Fluxo de Android: Typescript, mídia original 1.0 conservada, Gradle, certificado QA200 preservado, APK completa, emulador Android 15 / 2 GB, abertura e reabertura.

## Limites — não induzir o jogador a erro

- **O conjunto NÃO representa 3 GB de novos recursos.** Os 28 interiores usam arte gerada pelo renderer existente, não 28 pinturas finais nem 2GB de texturas. O objetivo de 3GB de assets originais permanece incompleto.
- Ainda não foram entregues duas especializações definitivas para todas as onze classes, sistema de companions, furtividade integral, novas cinemáticas artesanais de alta resolução, 60 missões totalmente distintas ou 20–30 horas de campanha **medidas**.
- Testes de backend e emulador não equivalem a homologação em Galaxy A07, Redmi Note 12S ou Moto G34; não prometer FPS/RAM ou ausência de crashes nesses aparelhos.
- O tamanho de APK só pode ser afirmado depois da publicação e verificação do asset em GitHub.
- QR/backup: pacote Android `com.cyberpunk.tacticalrpg.qa200` continua separado de `com.cyberpunk.tacticalrpg.qa100`; a atualização de rc1 para rc2 da família QA200 conserva o mesmo certificado, ID e versionCode crescente.
- A branch segue em PR *draft*; não trocar `main` nem substituir a versão QA100.

**Critério de implementação:** recursos precisam de função real na engine, não contam arquivos inflados, silenciosos, repetidos ou sem referência.
