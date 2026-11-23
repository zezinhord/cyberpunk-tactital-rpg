# Nova Arcádia 2.0 — arquitetura de IA integrada
Data: 23/11/2026 · Branch: `feature/nova-arcadia-3gb-final-assets` · PR #22

## 1. Escopo e auditabilidade

Esta atualização **não emprega LLM nem serviços de rede**. Toda decisão é verificável, reproduzível e executada no dispositivo. Os sistemas de gameplay existentes são as fontes autoritativas: `TurnManager`, `tactics.ts`, `map.ts`, `CitizenRoutine`, `reputation.ts`, `eden-echoes.ts` e `companions.ts`. A IA não escreve XP, inventário ou progresso de missões fora das respectivas APIs.

| Aspecto | Antes | Agora (código conectado) |
|---|---|---|
| Inimigo tático | Geometria, cobertura e ações a partir da posição real do jogador | Percepção explícita de linha de visão, ruído, último contato, busca, patrulha e recuo quando ferido; sem disparar contra coordenadas não vistas |
| Informação inimiga | Distância do jogador disponível diretamente ao planner | `EnemyMemory` com última posição realmente percebida; posição oculta não é consultada para rotas de busca |
| Reação visual | Predominantemente intenção de ataque | Intenção e indicação textual discreta de percepção/causa no HUD |
| Moradores móveis | `CitizenRoutine` caminhava por waypoints | Mesma rotina pode retornar para descansar ou fugir ao lar; processamento por distância a cada ~1,35s |
| Diálogos | Respostas autorais por origem, classe e missão | Acrescentadas verificações de atributos/classe principal/multiclasse, reconhecimento de contato e de ações registradas |
| Memória de NPCs | Pistas e escolhas nos sistemas de missão/reputação | Memória social separada compacta, validada, com backup e exclusão por personagem; não duplica recibos de gameplay |
| Facções | Reputação derivada de decisões | Atitudes por distrito visíveis na UI e em falas locais; resposta a confiança/desconfiança sem recompensas repetidas |
| Éden | Capítulos/epílogos autorais | Observador narrativo com 3 registros de voz, limitado aos capítulos realmente concluídos |
| Companheiros | Apoio remoto manual, duas vagas, um uso | Posturas manual/ofensiva/defensiva/suporte/manter posição; decisões condicionais usam a ação bônus original |

## 2. Tactical brain — `src/game/ai/tactical-brain.ts`

Estados: `patrol`, `suspicious`, `investigate`, `search`, `engaged`, `retreat`. Memória limitada a último local visto, última rodada de percepção, ruído temporário e contador de decisão. Distância máxima de percepção visual: 6 células, condicionada a linha de visão **verdadeira**. Ruído de movimento é mais fraco que o de armas de fogo; não transfere coordenadas exatas quando o som é captado em outro local. Memória visual expira depois de 3 rodadas.

O algoritmo reutiliza o pathfinding e cover system existentes, em no máximo 64 células de um tabuleiro 8×8, e calcula utilidade de recuo/cobertura apenas na **ação inimiga**, nunca a cada frame. Empates são desempatados por posição e custo para testes determinísticos. Recuo a <=32% de HP para perfis não agressivos, quando há caminho seguro. Outros perfis conservam a identidade tática de `enemyProfile` e `planEnemyTurn`.

Não foram adicionados pontos de Vida, dano ou vantagens invisíveis. Tiros só ocorrem após verificação de linha de visão atual e alcance reais. EMP, cooldown, ação e cobertura continuam nas APIs anteriores. A tomada de decisão não usa rede.

## 3. Cidadãos e memória

`npc-routines.ts` é mantido: novas condições opcionais retornam à origem durante repouso noturno (22h–5h) ou alerta local; a integração Android verifica colisão, bloqueios e caminhos. `BaixadaLiteWorld` atualiza moradores a cada 1.350ms e escalona os distantes a cada 2–3 ciclos. Não há worker nem processamento adicional a cada `requestAnimationFrame`.

`ai/world-memory.ts`: `version=1`; máximo 48 fatos por personagem, oito por NPC; deduplicação por ID de evento, limites de tamanho e bloqueio de HTML/controles. Chave `cyberpunk-tactical-rpg.ai-world-memory.v1.<characterId>`. `backup.ts` inclui campo allowlisted `aiMemory`; falhas de importação usam rollback. `slots.ts` remove exclusivamente dados do slot apagado. Saves antigos sem campo são válidos.

`ai/contextual-dialogue.ts` oferece opções de análise técnica (Interface/classe/pesquisador), medicina (Medtech/Vigor) e confiança (Influência). São falas autorais com limites de conhecimento de Lia, Ramon e Duda. Essas opções **não** alteram inventário/XP/missões por conta própria. Só as escolhas oficiais geram recibos. O Mercado lembra encontros e colaboração confirmada.

## 4. Éden e facções

`ai/eden-observer.ts` usa apenas `EdenProgress.history`, `started`, `step`, `ending` e o resultado de `calculateReputation`. Voz institucional -> analítica -> questionadora, conforme as etapas existentes. Nenhuma revelação antes da campanha iniciada. O arquivo de memórias da Baixada apresenta as transmissões contextuais já autorizadas.

`ai/faction-reactivity.ts` é leitura derivada, sem segunda carteira de reputação; informa atitude e vigilância social local sem gerar patrulha impossível, bloqueio de missões ou eventos aleatórios que impeçam a campanha. O HUD mostra uma única linha contextual.

## 5. Companheiros

`ai/companion-brain.ts` lê a postura escolhida no menu da equipe. O contato ativa `TurnManager.useCompanionSupport` somente se sua habilidade for útil. Joana não usa um curativo com Vida completa; Nilo não desperdiça EN; Mara respeita JAM já ativo; Téo não duplica bônus de acerto. Ações seguem a restrição original de **uma carga por aliado por combate** e **ação bônus única por turno**. A postura padrão em saves legados é `manual`.

## 6. Testes e limites

Unitários e integração: `scripts/test-ai-tactical.mjs` e `scripts/test-ai-world.mjs`, executados nos workflows Android junto aos testes legados de tática, missões, salvamentos, 11 classes, multiclasse e distritos.

**Pendências não concluídas, explicitamente fora do escopo implementado nesta rodada:**
- IA de **esquadrão simultâneo**: o tabuleiro atual instancia somente um inimigo por onda. Cooperação real entre vários agentes, busca por prioridades múltiplas, granadas de área, reforços e rendição exigem adicionar novas entidades à economia de turnos, sem fingir que já existem.
- Planejamento por Behavior Trees compartilhadas não foi adicionado: FSM + utilidade + planner de rotas já atendem a primeira vertical slice; árvores complexas deverão surgir quando ações de esquadrão/múltiplas entidades tiverem contrato de estado.
- NPCs distantes em todos os sete distritos, companheiros como unidades físicas independentes e longas conversas procedurais completas ainda não estão concluídos.
- FPS, consumo térmico, latência de input e testes físicos no Galaxy A07 e Redmi Note 12s **não podem ser certificados pelo emulador**.
- A APK de referência de 3,26 GB preparou os sete distritos offline, mas a verificação anterior de barras do sistema em tela cheia falhou; uma nova build só será declarada válida após passar esse teste.

## 7. Critérios de continuidade

Antes de expandir: verificar que `npm run build`, testes de IA e CI Android estão verdes; medir 30 FPS em Android de entrada; confirmar saves anteriores. Para a próxima iteração, expandir `GameState.units` e objetivos de combate de forma compatível, incluir limites explícitos de munição/granadas, regras de rendição, percepção de cada agente, coordenação e feedback de suspeita com testes integrados.
