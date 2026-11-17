# Nova Arcádia 0.8.0-rc.1 — auditoria, ampliação e limites

> Branch de desenvolvimento: `feature/nova-arcadia-expansion-v080`. Base `feature/progressive-quests-favors-v079` em `b14583e6...`; PR #15 é rascunho. A `main` não é modificada.

## Ponto de partida comprovado

- APK 0.7.9 workflow #731: **127.269.264 bytes** (**121,37 MiB**).
- Dentro do APK: aproximadamente **114,95 MiB de áudio**, **8,35 MiB de DEX Android**, **2,10 MiB de código web**, **1,76 MiB de gráficos**. Tamanhos são de componentes descompactados; não se somam diretamente ao tamanho ZIP final.
- 11 classes oficiais, 6 origens, 5 atributos, nível máximo 10, **3 ramos por classe e 66 técnicas funcionais existentes**. Bônus de origem e classe no nível 1, progressão e custos foram preservados.
- Baixada + Ferrugem + cinco distritos regionais; Operação Circuito Fantasma (19 passos), cinco capítulos regionais (35 passos), clínica e esgoto.
- 6 favores, Honra, três reputações políticas, inventário de 8 itens e 2 receitas, salvamento por personagem, backups locais e 56 músicas oficiais. Carregamento incremental de cenas e dois perfis gráficos existentes.

## Código acrescentado nesta etapa

| Área | Acrescentado | Integração |
|---|---:|---|
| Itens | +27 (**35** no total) | Alcance e ataque de armas; defesa, Vida, movimento e energia de armaduras/implantes; curativos e baterias no combate |
| Fabricação | +23 (**25** no total) | Receitas consomem componentes reais, mantêm proteção contra consumir equipamento ativo e usam o inventário versionado |
| Comércio | +9 ofertas | Catálogo de Nilo dividido em categorias de diálogo na tela horizontal; compra debitada e recibo salvo |
| Favores | +9 (**15** no total) | Surgem a partir de NPCs e condições de investigação; tarefas regionais; XP, créditos, Honra e itens com reconciliação |
| Campanha | **Ecos da Cidade**: 10 objetivos, 2 batalhas de ondas, 2 resultados | Continua após Circuito Fantasma e V-09, leva às áreas já existentes, afeta relações com Helix / Movimento Livre / Mercado Cinzento |
| Mundo | +1 cache na Baixada, +1 em Ferrugem, +5 regionais | Sete terminais/arquivos acessíveis, materiais e 12 XP cada, recibos contra coleta repetida |
| Distritos regionais | 28×20 → 30×22 tiles | Novas rotas periféricas e arquivo em cada distrito, com teste de acesso e de colisão |
| Direção artística | Mural da Casa Comum e totem de memórias | Arte original codificada em Canvas 2D, sem renderizador pesado ou cor verde fora do Éden |
| QA | Testes de Ecos da Cidade e arquivos regionais | Validação do bloqueio e sequência de missão, itens, saves e recompensas por evento |

## Preservação e estabilidade

- As árvores de classes, curva de XP, bônus iniciais, 56 músicas, combates antigos, clínicas, passagens subterrâneas e ciclo de salvamento existentes não são substituídos.
- O inventário continua `version: 1`; registros legados recebem `implant:null` e contagem zero nos novos itens. Backups novos incluem o capítulo Éden; arquivos antigos continuam aceitos.
- Recompensas únicas usam recibos; se o aplicativo fecha entre gravar o recibo e registrar XP, a reconciliação restaura XP a partir da conquista persistida.
- Novo mapa / fonte/arte usa o pipeline atual. Não foram adicionados arquivos de preenchimento.

## Critério de liberação e pendências

A versão **não está pronta para publicação** até CI completa verde e instalação real em Galaxy A07, Redmi Note 12S e outros aparelhos. A QA precisa incluir criação de personagem, batalha, consumível, item equipado, missão Éden, regressão dos saves, FPS e retomada do Android.

**Marco 250 MB:** o tamanho real do novo APK deve ser retirado do artefato do workflow e informado sem arredondamentos artificiais. A expansão atual aumenta significativamente gameplay e sistemas; atingir 250 MB de recursos genuínos ainda requer criação e integração de atlas direcionais definitivos, interiores diferenciados, NPCs de rotina, ambiências e SFX originais, com memória e qualidade de renderização controladas. Jamais adicionar silêncio, duplicatas ou imagens não utilizadas apenas para preencher bytes.

## Próximas prioridades artísticas e técnicas

1. Refinar capturas Android 914×411: oclusão dos prédios, orientação dos sprites, identidade de interiores e legibilidade dos comandos de combate.
2. Prosseguir com atlas animados próprios para NPCs importantes, mantendo perfis econômicos e cenas carregadas sob demanda.
3. Consolidar a IA inimiga por papéis e os dois encontros Éden com efeitos de estado visuais testados em dispositivo.
4. Registrar novas ambiências de ruas, chuva, indústria, terminais e portas como recursos comprimidos e realmente acionados por gameplay.
5. Medir novos bytes e perfil de memória por etapa; não confundir tamanho em disco com variedade jogável.
