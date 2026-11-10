# Plano de desenvolvimento — Vertical Slice da Baixada

## Objetivo

Construir uma primeira fatia jogável que represente o futuro RPG: exploração isométrica em tempo real, protagonista selecionável, NPCs reconhecíveis, espaços internos, interação e missão narrativa. A Baixada deve ser um fragmento coerente de Nova Arcádia, não uma arena descartável.

## Entregas

### v0.5.0 — Fundação da exploração

- Baixada exterior inicial, movimentação por grade e câmera.
- Primeiros NPCs, objetos interativos e missão "O nome que sumiu".
- O Limbo de Teste permaneceu como arena tática separada.

### v0.6.5 beta — Personagens animados e interiores

- Mapa exterior ampliado para 20 × 16 células lógicas, com vias, edifícios e áreas identificadas.
- Onze spritesheets: seis protagonistas por origem e cinco NPCs. Quadros 64 × 80, quatro orientações por personagem, ciclos de repouso e caminhada.
- Câmera acompanha o protagonista; toque no chão calcula caminho; toque em NPC/objeto/porta aproxima e interage.
- Células de edifícios, atores e objetos relevantes bloqueiam a navegação automática.
- Três espaços interiores: Clínica Comunitária, Oficina do Nilo e Galeria de Manutenção do Canal.
- A missão principal inicial mantém o fluxo de conversar com Amara, investigar o registro da clínica e retornar à médica. O terminal da Galeria oferece pista complementar depois da descoberta de V-09.
- Limbo de Teste continua separado e preservado.

## Como testar a vertical slice

1. Criar ou retomar um protagonista de cada origem e observar os diferentes sprites.
2. Caminhar em quatro direções e conferir orientação, animação e colisão com prédios/atores.
3. Abrir a Clínica, falar com Amara, examinar o terminal e retornar para concluir a missão.
4. Abrir a Oficina e conversar com Nilo.
5. Descer à Galeria do Canal, conversar com Téo e consultar o quadro de manutenção.
6. Conversar com Saira e consultar o Terminal Público na área externa.
7. Abrir o Limbo e confirmar que o combate por turnos segue funcionando.
8. Fechar e reabrir o aplicativo e verificar o personagem e o progresso da missão.

## Limites conhecidos da beta

- Os spritesheets são provisórios e têm ciclos de repouso/caminhada; corrida, ataque, dano e interações cinematográficas ainda não foram adicionados.
- Os cenários são desenhados proceduralmente pelo Phaser. Ainda faltam tilesets modulares, objetos com colisão total, oclusão de fachadas e iluminação dinâmica mais rica.
- Os interiores são três cenas específicas, não um sistema genérico de construção de edifícios.
- A missão é um fluxo específico da Baixada, não um sistema geral de missões.
- O combate ainda não entra automaticamente a partir de um encontro no mapa.
- Inventário, equipamentos, economia, loja funcional, veículos, outros distritos e campanha principal permanecem pendentes.
- Build real e APK dependem da execução do GitHub Actions após integração no repositório.

## Próximos marcos recomendados

1. Completar ciclos de animação (corrida, interação, ataque, dano) e revisar escala dos sprites em diferentes celulares.
2. Criar objetos modulares reutilizáveis, colisão por objeto e oclusão para fachadas.
3. Expandir a Baixada em mais subáreas conectadas, mantendo a mesma linguagem visual e continuidade espacial.
4. Generalizar diálogos, objetivos e estados de missão a partir de dados.
5. Integrar encontros táticos à exploração e retornar o personagem ao local correto após o combate.
6. Desenvolver inventário, equipamentos, economia e progressão com dados persistentes.
