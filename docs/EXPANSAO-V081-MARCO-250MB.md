# Nova Arcádia 0.8.1-rc.1 — Expansão de conteúdo útil e marco de 250 MB

> **Estado:** candidato de testes Android, não versão pública final. PR #15 em rascunho. A branch `main` permanece intocada.
>
> **Base:** 0.8.0-rc.1, APK 127.280.436 bytes (121,38 MiB), workflow #792.

## Conteúdo integrado

### Espaços exploráveis (sete, independentes)

| Região | Interior original | Identidade visual | Personagem | Descobertas |
| --- | --- | --- | --- | ---: |
| Baixada | Casa Comum | mural de famílias, tecido reciclado, mobiliário comunitário | Marta | 3 |
| Ferrugem | Fundição Auxiliar | fornos, metal de reuso, tubulações | Ramon | 3 |
| Áurea | Arquivo Helix 08 | servidores, scanners, portas de auditoria | Celina | 3 |
| Subsolo | Abrigo do Vão | infiltrações, arcos de drenagem, refúgios | Mara | 3 |
| Setor Zero | Laboratório Lacrado | cápsulas de contenção e biossegurança | Iuri | 3 |
| Prisma | Bastidores Piratas | luzes de palco e transmissão independente | Kai | 3 |
| Periferia | Estação de Cisternas | captação de água, painéis solares, tanques | Dara | 3 |

Cada interior possui **19×14 tiles**, paredes e obstáculos sólidos, navegação por toque, entrada no mapa existente, retorno à região de origem, NPC local com diálogo, três objetos de descoberta com **item real + XP**, recibo por personagem, posição de sala restaurada após reiniciar o app e carregamento de uma cena Phaser por vez. O jogador não precisa baixar todos os interiores na RAM. Total: **21 novas recompensas contextuais** e 7 contatos de sala. A missão principal e as ruas preexistentes não foram modificadas para acomodar as novas áreas.

### NPCs e arte

- 17 NPCs nomeados com folhas direcionais de **4 direções × 12 quadros**, incluindo deslocamento, gesto, técnica, reação e queda. Os sprites da versão 0.8.0 são preservados como origem de paleta e identidade.
- 12 folhas completas dos seis pares origem/apresentação também permanecem no sistema.
- A Baixada Android continua em **Canvas 2D**, carrega apenas os sprites dos NPCs ativos e usa simulação espaçada para que os moradores circulem por rotas válidas com interpolação, paradas e animação direcional.
- Volumes arquitetônicos, profundidade, colisões e posição dos objetos foram preservados; interiores têm identidade autoral por região sem depender de um atlas gigante.

### Ambiências — 28 trilhas de ambiente, não novas músicas

| Estado da exploração | Faixas por distrito | Duração individual | Seleção |
| --- | ---: | ---: | --- |
| Rua / infraestrutura | 1 | 6 min | Exploração |
| Chuva tropical | 1 | 6 min | Alterna no exterior |
| Interior / máquinas | 1 | 6 min | Dentro de salas |
| Alerta / vigilância | 1 | 6 min | Combate |

São **28 gravações de design ambiental original** (7 distritos × 4 estados), com estruturas rítmicas de máquinas, ruído de infraestrutura, chuva e indicadores esparsos que diferem por local. Codificação **Ogg/Opus estéreo 128 kbps**. No runtime, apenas um ambiente é transmitido via `HTMLAudioElement`, além da música do rádio quando habilitada; o streaming é substituído na mudança de cena, pausa em segundo plano e obedece ao mixer de ambiência. As **56 músicas originais anteriores** são mantidas integralmente. Não há músicas de preenchimento ou arquivos não referenciados.

### Economia, progressão e salvamento

O inventário permanece com 35 itens e 25 receitas, 15 favores e três reputações de facção. Não foram removidos os 66 poderes de classe, progressão de 10 níveis, as origens ou as missões antigas. As 21 descobertas fornecem itens realmente presentes no inventário e XP, com recibos que não duplicam recompensas após reiniciar. Backups antigos são compatíveis porque as salas reutilizam a chave de região e os recibos do inventário, sem novas estruturas obrigatórias.

## Orçamento real do pacote Android

- APK de referência, 0.8.0-rc.1: **127.280.436 bytes**.
- Primeiro APK completo da expansão, CI #822: **291.113.461 bytes (291,11 MB decimais; 277,63 MiB)**.
- Ambiências integradas (novas): **162.573.740 bytes** no APK.
- Diferença em relação à referência: **163.833.025 bytes**, incluindo o novo áudio e recursos de jogo.
- Meta: **250.000.000 bytes**, superada em **41.113.461 bytes** no candidato #822.

A versão de fechamento 0.8.1-rc.1 precisa ser medida novamente após qualquer modificação final. O arquivo do APK, e não o ZIP do artifact, é a fonte do tamanho. O script `tools/audit_apk_content.py` falha a compilação se houver menos de 250 MB, áudio faltando, manifestos sem ligação ao jogo, NPCs sem poses ou arquivos ambientais duplicados.

## QA e critérios de publicação

- **Automatizado:** testes de criação/progressão, saves, favores, mapa, colisão, sete interiores (21 props), reconciliação de itens/XP, arquivos Ogg e metadados de 17 NPCs.
- **Chromium:** sete interiores fotografados, carregamento sem cache, retorno às regiões, UI de combate, clínica, favores e mapa original. Capturas são testes web, não testes Android físicos.
- **Build:** Capacitor/Gradle APK, assinatura debug, ZIP íntegro e auditoria de recursos dentro do próprio APK.
- **Ainda obrigatório antes de release pública:** instalar APK em Galaxy A07, Redmi Note 12S e pelo menos outro dispositivo intermediário, medir FPS durante chuva/áudio, troca de regiões, combate, fechamento/retorno e salvamento; checar microinterrupções de som, consumo de bateria e espaço em disco. Testar se a assinatura debug permite atualização por cima do APK anterior; exportar o personagem antes de tentar reinstalar.

## Pendências honestas

A meta em disco foi alcançada, mas isso **não implica que todas as prioridades de design estão completas**. Continuação prioritária: itens e armas visíveis no corpo do protagonista, sistema amplo de IA inimiga/chefes com estados diferenciados, cenários maiores com múltiplas rotas em todas as áreas, sprites com mais quadros específicos de classe, áudio de habilidades por classe, balanceamento de nível 10 e testes físicos de desempenho. Uma versão para publicação requer uma rodada de QA Android real.
