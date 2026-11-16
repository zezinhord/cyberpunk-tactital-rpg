# Nova Arcádia v0.7.9 — Missões progressivas e favores

## Diretriz de design

**Antes:** o painel de missão mostrava, de uma vez, investigação, esgoto, cinco distritos, Ferrugem e a operação de 19 objetivos. O painel era grande em 914×411, ocupava a visão do mundo e antecipava missões ainda não conhecidas.

**Agora:** o HUD compacto exibe **um objetivo ativo**; o botão expande um painel de duas abas, **Principal** e **Favores**. O diário completo está dentro do Menu do Personagem, com capítulos exibidos apenas quando desbloqueados. A Operação Circuito Fantasma só pode ser iniciada após concluir os três passos da clínica. As missões de outros distritos continuam vinculadas ao acesso e à progressão existentes.

### Rede de favores jogáveis

| Favor | Contato e condição de descoberta | Tarefa que deve ser realizada | Recompensa ao entregar |
| --- | --- | --- | --- |
| Arquivo de primeiros socorros | Amara, depois da primeira conversa da clínica | Consultar o terminal da clínica e retornar a Amara | 18 XP, 60 créditos, 1 Honra, 2 curativos |
| Peças para o Canal | Nilo, após o primeiro passo da clínica | Inspecionar o terminal do Canal Sul e retornar a Nilo | 24 XP, 80 créditos, 1 Honra, 2 conectores |
| Água para a Casa Comum | Marta, após o segundo passo da investigação | Consultar o mural da feira e retornar a Marta | 28 XP, 95 créditos, 2 Honra, 2 ligas |
| Entrega fora da rede | Iza, após concluir a clínica | Confirmar rota com Tomás e retornar a Iza | 30 XP, 120 créditos, 1 Honra, 2 células |
| Reforço da cooperativa | Ramon, após concluir a clínica | Consultar console do Pátio e retornar a Ramon | 38 XP, 140 créditos, 1 Honra, colete reforçado |
| Corredor protegido | Davi, após derrotar V-09 **e acumular ao menos 2 Honra** | Conversar com Marta e voltar a Davi | 46 XP, 200 créditos, 2 Honra, pistola de indução |

- Aceite no **Quadro de Favores** ou falando com o contato do favor. Máximo de três favores simultâneos, para não sobrecarregar a navegação.
- Progresso depende de interação real com a pessoa/terminal pertinente. A entrega final exige voltar ao contato original, não basta tocar no quadro.
- XP sobe níveis pelo sistema oficial existente (árvore de habilidades e atributos); armaduras e armas chegam ao inventário e podem ser equipadas; materiais são utilizáveis nas receitas já implementadas.
- **Créditos são gastáveis** na oficina de Nilo: curativo (30), liga reaproveitada (45), conector (55), colete (240). A Honra afeta o acesso ao contrato tardio de Davi e sua reação narrativa.
- Os recibos de favores e compras impedem XP ou itens em duplicidade, mesmo após retomar aplicativo interrompido. A reconciliação de recompensas é executada ao entrar na exploração.
- Dados dos favores, saldo, Honra, compras e recibos são locais **por slot**, exportados/importados no JSON do personagem com validação estrita; excluir um slot remove seus próprios favores sem atingir os outros.

## Compatibilidade e limites

Mantidos: a clínica, a cura no cenário, as 11 classes, seis origens, os capítulos já existentes, itens, combate tático, salvamentos anteriores e HUD Android horizontal. Nenhuma missão secundária altera arbitrariamente a história principal ou concede itens antes da entrega.

A integração da interface visual é validada por testes TypeScript, testes unitários das recompensas e de backup, captura Chromium 914×411 com aceitação de favor e fluxo legado de campanha. **Teste físico** no Galaxy A07 / Redmi Note 12S ainda é necessário antes de merge e publicação.

> Este documento descreve código já incluído na branch de implementação `feature/progressive-quests-favors-v079`; a aprovação final depende de CI verde.
