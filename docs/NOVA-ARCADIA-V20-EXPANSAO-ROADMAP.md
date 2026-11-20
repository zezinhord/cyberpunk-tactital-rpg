# NOVA ARCÁDIA 2.0 — O CISMA DE ÉDEN

## Status de produção em 20/11/2026

**Base preservada:** 1.0.0-rc.2 em `feature/nova-arcadia-finalization-v100-rc`.
**Desenvolvimento:** `feature/nova-arcadia-cisma-eden-v20-foundation`.
**APK experimental verificável:** `2.0.0-rc.1`, pacote isolado `com.cyberpunk.tacticalrpg.qa200`.
**Aviso obrigatório:** não há 3 GB de novo conteúdo pronto; nem 60 novas missões, 25 mapas ou campanha de 30h concluídos. Este é o *primeiro slice* funcional da 2.0, mantendo a biblioteca original de aproximadamente 1,14 GB. Não é release estável.

### Evidências

- CI de jogabilidade + TypeScript: https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/44759374939 — sucesso.
- Compilação Android integral, verificação de assinatura, integridade dos recursos, Android 15 com 2 GB, entrada da WebView e segundo boot: https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/44759375253 — sucesso.
- Download da APK isolada: https://github.com/zezinhord/cyberpunk-tactital-rpg/releases/download/nova-arcadia-v200-rc1-cisma-qa/NovaArcadia-2.0.0-rc.1-Cisma-1GB-QA.apk
- Tamanho: **1.143.076.540 bytes**; SHA-256: `8cbd431da4be8d8e050894b05665d74ced3a074b019ff4b28dce389e9e7adf22`.
- PackageID: `com.cyberpunk.tacticalrpg.qa200` (distinto da QA100); importa backups JSON legados, sem sincronização automática.
- A versão QA200 não substitui a RC2. Para não perder saves, **não desinstalar** apps anteriores antes de exportar JSON, importar e verificar.

## O que foi realmente implementado neste primeiro slice

1. **Capítulo pós-Éden jogável**, somente após concluir o final anterior. O botão "Iniciar expansão 2.0 · O Cisma de Éden" aparece no painel principal.
2. Oito etapas sequenciais em locais físicos **já implementados**: clínica da Baixada, Terminal do Canal Sul, livro de turnos de Ferrugem, antena de Prisma, comunidade do Subsolo, auditoria de Áurea, quarentena do Setor Zero e Mural do Mercado dos Cabos. O jogador não avança sem interagir no ator certo.
3. Três decisões diferentes (**auditoria pública**, **refúgio comunitário** e **pacto de supervisão**); escolhas persistentes, epílogo em texto e consequências específicas para os sete distritos (21 descrições), inclusive vigilância/pressão ambiental.
4. Onze métodos de investigação associados às classes originais e alterações de exposição 0–5; memória narrativa específica para cada uma das seis origens na primeira etapa.
5. Relações com Helix, Movimento Livre, Consórcio Cívico e Mercado Cinzento recalculadas a partir do final gravado, não por contador livre. XP único por etapa usando recibos já existentes; backup e exclusão de slot contemplam a chave `cisma`.
6. Teste unitário de três finais × oito etapas, onze classes, seis origens, 7 regiões, recusa de ações inválidas, ausência de armazenamento, backup adulterado, sobreposição de versões antigas, e manutenção de saves de outros slots.
7. **Nenhuma geração artificial de faixas, imagens repetidas, vídeos vazios ou arquivos de preenchimento.**

## Diretrizes narrativas

- A pergunta central passa de "quem governa o Éden?" para "quem tem o direito de contestar uma decisão da rede?".
- **Não reduzir Éden a vilão unidimensional.** A Helix é fonte de contratos e pressões, mas os fatos encontrados exigem avaliação e não provam sozinhos quem introduziu a contingência.
- O código-fonte atual não estabelece a existência de três inteligências separadas: as mensagens conflitantes são um problema a investigar, não uma revelação já encerrada.
- A história 2.0 respeita qualquer um dos três destinos preexistentes de Éden; as três resoluções da 2.0 são deliberações diferentes, criando combinações futuras.
- Personagens mantidos: Amara, Marta, Mara, Rosa, Kai, Celina, Dara, Iuri, Nilo, Lia, Joana, Téo, Davi, Dorian Kade, Helena Voss e Elias Renner.
- A bíblia narrativa detalhada acompanha a entrega em PDF; seus **atos II–IV estão planejados**, não implementados.

## Planejamento da expansão principal — marcos verificáveis

### M0 — Estabilidade e compatibilidade (P0)

- Rodar 30+ minutos com telemetria local opcional e sem dados pessoais no Galaxy A07, Redmi Note 12S e Moto G34 5G.
- Medir cold-start, FPS 1% low, RAM, GC, ANR/crash, espaço de instalação e retorno da suspensão.
- Verificar casos de backup antigo, troca de slots, rollback, Android System WebView e retomada depois do combate.
- Nenhum pacote novo acima de 1 GB sem uma demonstração física estável.

### M1 — Vertical slice visual do distrito

- Redesenhar **uma** zona da Baixada com identidade local, fios, passarelas, desníveis, oclusão, props com colisão própria, interiores leves e ruas contínuas.
- Substituir sprites provisórios de NPCs principais por directional sprites próprios.
- Critérios: toque/rota sempre correspondem, média de FPS aceitável em aparelhos de entrada, menus com controles essenciais dentro do viewport, sem perda da paleta aprovada (ciano aliado, magenta inimigo, âmbar interação, verde exclusivo do Éden).

### M2 — Profundidade sistêmica

- Cobertura parcial/total, linha de visão, terreno de elevação, supressão, inimigos com papéis distintos; IA e efeitos devem ser simulados pelo TurnManager e não apenas pelo renderer.
- Cyberware organizado por slots/custos/limites e inventário serializável.
- Furtividade com visão e ruído, pelo menos três rotas de resolução sem combate em uma mesma missão.
- Evolução efetiva das onze classes com duas especializações **balanceadas**, apenas após análise do registro de habilidades atual. Não criar placeholders que exibam poder sem aplicá-lo.
- Quatro companheiros recrutáveis: validar escalabilidade de 1–2 acompanhantes no mesmo tabuleiro antes de expandir.

### M3 — Missões e mundo vivo

- Expandir os sete distritos por **cenas carregadas separadamente**. Meta de planejamento: 25–35 setores/mapas; não exigir uma única cena gigante.
- Missões principais e secundárias liberadas por descoberta ou NPC, não todas no HUD.
- Meta de planejamento: 60+ missões e contratos reais, com scripts, objetivos, consequências e recompensas verificáveis.
- Agentes e serviços mudam segundo decisões, não somente texto. Eventos regionais persistentes com reversão/compatibilidade no backup.

### M4 — Atos II–IV do Cisma

- **Ato II — Guerra Invisível**: divergências corporativas, fornecimento, disputa da infraestrutura e contratos sem desligar serviços essenciais.
- **Ato III — Coração do Éden**: contestações, infiltração, missões complexas e confronto de duas fases **realmente tático** com mecânicas distintas, não duas telas iguais.
- **Ato IV — Depois da escolha**: caminhos distintos por facção, consequências sociais visíveis, nove combinações dos finais 1.0 e do Cisma 2.0, pós-jogo e créditos.
- Meta de 20–30 h somente **após cronometragem de sessões reais**. Dados de missão e cinematics devem existir no jogo, não apenas na bíblia.

### M5 — Distribuição de recursos e tamanho

O alvo de aproximadamente **3 GB** descreve o **produto final**, não uma obrigação de inflar APK. O incremento estimado de ~1,86 GB é orçamento preliminar:

| Categoria | Novo tamanho alvo comprimido | Critério de utilização |
|---|---:|---|
| Cenários e distritos | 520 MB | texturas, tilesets, props e interiores realmente carregados |
| Sprites e animações | 370 MB | quadros direcionais únicos, NPCs, inimigos e VFX |
| Cenas narrativas 2D | 290 MB | arquivos de cinematics com lógica de exibição |
| Inimigos/efeitos táticos | 270 MB | atlas e animações com gatilho real |
| Mapas de operações | 200 MB | áreas jogáveis com objetivos e colisão |
| Retratos e interface | 150 MB | arte original acessada pelas falas |
| Novos SFX | até 60 MB | apenas novos eventos necessários |
| **Total adicional planejado** | **1.860 MB** | auditável por manifesto de uso |

**Condição de aceite:** arquivo de origem, função real de uso, ID de recurso e hash. Recursos órfãos ou duplicados não contam. Analisar compressão e memória de descompressão (não basta medir tamanho em disco). Evitar repetir o excesso de áudio.

Arquitetura desejada: shell Android mais leve com packs opcionais/de instalação (GitHub/Google Play demandam estratégias diferentes), verificações SHA-256, download retomável, manifesto local de recursos e carregamento sob demanda; somente prometer offline depois de pack completo instalado.

### M6 — Homologação final

- CI de gameplay, Android Gradle, APK ou AAB assinado, teste instrumentado de boot real, captura do combate e conclusão dos caminhos finais.
- Ensaios em Android de entrada, atualização por cima com assinatura persistente, backup, 30+ minutos sem ANR, cenários de pouco espaço.
- Não renomear release para "2.0 estável" antes de cumprir os gates.

## Contratos de compatibilidade

- Preservar o pacote QA100 (`com.cyberpunk.tacticalrpg.qa100`) e histórico de releases; não fazer merge direto em `main`.
- O QA200 usa um novo pacote e seu próprio certificado persistente de teste.
- Não apagar dados do usuário no início, não alterar silenciosamente uma decisão antiga.
- Backups JSON v1 continuam aceitos. O campo `cisma` é adicional, opcional e validado; importação sem ele limpa estado órfão do slot substituído.
- O progresso v2 é desbloqueado pela conclusão anterior do Éden e depende de interações verdadeiras nas cenas.
