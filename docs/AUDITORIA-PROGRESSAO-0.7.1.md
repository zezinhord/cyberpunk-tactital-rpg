# Auditoria e evolução — Nova Arcádia 0.7.1 (branch de validação)

> **Estado:** implementação entregue na branch de QA, não promovida a `main`. Aprovação do APK depende da suíte de CI e de teste real no Android.

## 1. Diagnóstico da versão de partida

Referência: `feature/landscape-mobile-v1`, commit `97e2c0bf712eea64551234cfa6427d2cbf8bec02` (15/11/2026).

| Recurso | Antes | Evidência |
| --- | --- | --- |
| Ganhar XP em missões | Parcial | `App.tsx` / `ExplorationScreen.tsx`, `grantTrialXp`, `grantV09Experience` e passos da campanha |
| Ganhar XP por inimigo | Parcial | Só vitórias de encounters de campanha; o motor não creditava cada baixa |
| Tabela de níveis | Funcional | `progression/tree.ts`: XP [0,30,75,135,210,300,405,525,660,810] |
| Level up automático | Funcional no núcleo | `gainExperience` recalculava `level` com XP total |
| Pontos separados | Funcional no núcleo | 2 pontos de atributo e 2 pontos de habilidade por nível; saldos derivados de compras |
| Compra de atributos | Parcial | Cinco atributos persistiam; sem bônus separados de origem/classe |
| Classes e técnicas | Parcial | 11 classes com 1 técnica inicial e 2 avançadas compráveis, sem 3 ramos distintos |
| Compra de graus de habilidade | Não implementado | Metadado `maxRank` sem compra/efeito real de graus |
| Combat real | Parcial | `TurnManager` e `classes/engine.ts` executavam técnicas mas sem graus; versão do manager podia ficar desatualizada |
| Salvamento | Parcial | Guardava nível, XP, atributos, IDs de habilidades e recibos, sem separação dos bônus nem graus |
| APK Android funcional | Não verificado | Depende de CI/instalação/execução em aparelhos |

## 2. Regras adotadas e rationale

- Preservar a curva de 10 níveis e pontos `+2 ATR / +2 HAB` por nível: são os valores do código de partida; evita alteração injustificada do pacing dos 19 objetivos (~49 min estimados).
- Cinco atributos preservados: Vigor, Precisão, Reflexos, Interface e Influência.
- Fórmula: `min(5, base + distribuídos + bônusOrigem + bônusClasse)`. Para os **personagens novos**, base inicial zero como no sistema anterior; bônus históricos de origem (HP, ataque, defesa, movimento, habilidade ativa) **continuam cumulativos**, não foram removidos.
- Os perfis de classe e origem adicionam **dois pontos** iniciais ao total, distribuídos conforme os papéis. Os números são balanceamento inicial experimental, não números históricos já aprovados:
  - Origens: corporativo Interface+1/Influência+1; Baixada Vigor+1/Influência+1; gangue Precisão+1/Reflexos+1; militar Vigor+1/Precisão+1; pesquisador Interface+2; nômade Vigor+1/Reflexos+1.
  - Classes: Solo Precisão+1/Reflexos+1; Netrunner Interface+2; Técnico Vigor+1/Interface+1; Medtech Interface+1/Influência+1; Rockerboy Influência+2; Mídia Interface+1/Influência+1; Corporativo Vigor+1/Influência+1; Policial Vigor+1/Precisão+1; Nômade Reflexos+2; Marginal Reflexos+1/Influência+1; Fixador Influência+2.
- Os atributos somam em combate: Vigor +3 HP por rank; Precisão +1 ataque; Reflexos +1 defesa e +1 movimento por 2 ranks; Interface +2 energia; Influência interfere em escolhas da Feira.
- Os bônus iniciais são snapshots separados no save e não se reaplicam ao carregar. Em saves legados, snapshots ausentes são reconstruídos uma vez, sem apagar nome, XP, missões, equipamento ou escolhas anteriores.
- A XP recebida por evento é concedida junto a seu **ID de recompensa no personagem salvo**; não se pode ganhar múltiplas recompensas pelo mesmo ID. Cada baixa de onda rende 8 XP, **somente a primeira vez que o encontro e sua onda forem derrotados por personagem**. Eventos de missão mantêm seus valores anteriores.
- Cada classe tem três especializações e seis nós jogáveis (raízes já existentes + novos nós), com compras, grau, nível requerido, ID de pré-requisito e interpretação por `classes/engine.ts`.
- Técnicas iniciais: rank 1 gratuito. Novos ranks usam 1 HAB por compra até `maxRank`, e exigem `minimumLevel + rankAtual`. Graus elevados alteram o cálculo dos efeitos em combate (+2 dano/cura ou +1 em modificadores por grau adicional).
- O registro de XP/atributo/habilidades é local por slot. Tentativas de gastar sem pontos, ultrapassar nível ou limite, comprar por outra classe e quebrar pré-requisitos são recusadas; a migração remove compras inválidas sem reescrever os outros sistemas de campanha.

## 3. Identidade das três especializações

| Classe | Ramo I | Ramo II | Ramo III |
| --- | --- | --- | --- |
| Solo | Armamento | Reflexos | Combate Próximo |
| Netrunner | Invasão | Sabotagem | Controle de Rede |
| Técnico | Engenharia | Dispositivos | Modificações |
| Tecnólogo Médico | Cura | Implantes | Suporte |
| Garoto Roqueiro | Inspiração | Influência | Desestabilização |
| Mídia | Investigação | Exposição | Informação |
| Corporativo | Recursos | Negociação | Estratégia |
| Policial | Supressão | Proteção | Controle Tático |
| Nômade | Sobrevivência | Mobilidade | Comboio |
| Marginal da Rua | Furtividade | Improvisação | Combate Urbano |
| Fixador | Contatos | Contrabando | Suporte Operacional |

Cada nova técnica usa os mesmos tipos de efeitos tipados do combate existente, sem inventar uma segunda economia de turnos. A UI usa nós conectados, mostra graus, custos, requisitos e consequências.

## 4. Testes automatizados

- `scripts/test-progression.mjs`: verifica os cinco atributos, 11 classes, 33 ramos, 66 técnicas, origem diferente, XP idempotente de missão/baixas, upgrade que modifica combate, limites, salvamento e migração legada.
- `scripts/test-combat-waves.mjs`: combate por ondas em 3 missões de teste e 5 distritos; registra uma baixa por onda.
- Além disso, o workflow de Android executa os testes de habilidades, classes, slots, história, layout e desempenho, a compilação TypeScript, Vite, teste de boot e Gradle. **Somente informar como aprovados após confirmação dos logs.**

## 5. Limitações verificáveis

- Técnicas adicionadas aos três ramos funcionam no combate existente contra o alvo/operativo; **não há ainda veículos controláveis, exploração furtiva completa ou interfaces físicas específicas por classe**. O ramo Comboio do Nômade executa manobras em combate, não direção de veículos; não apresentar isso como sistema de veículos implementado.
- A simulação automatizada não prova instalação/uso em todos os Android, especialmente Galaxy A07 e Redmi Note 12S. Teste de toque, aquecimento, memória e FPS real seguem pendentes.
- A UI de árvore tem requisitos legíveis e áreas de toque de 48px; a verificação visual manual depende de execução em Android horizontal.
- Dados locais dependem do armazenamento WebView. Recomenda-se exportar backup dos personagens antes de instalar esta build experimental.

## 6. Arquivos alterados

`src/game/classes/branches.ts`, `src/game/classes/registry.ts`, `src/game/classes/engine.ts`, `src/game/progression/tree.ts`, `src/game/character/types.ts`, `src/game/character/storage.ts`, `src/game/types.ts`, `src/game/TurnManager.ts`, `src/App.tsx`, `src/components/ProgressionTree.tsx`, `src/progression.css`, `scripts/test-progression.mjs`, `scripts/test-combat-waves.mjs`, `.github/workflows/main.yml`.

**Observação:** Esta branch acrescenta apenas lógica e UI da progressão. Não modifica assets, sprites, mapas, roteiro, nem a identidade artística do jogo.
