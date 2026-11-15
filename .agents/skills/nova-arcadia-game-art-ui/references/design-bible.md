# Nova Arcádia — Bíblia visual

**Fontes autoritativas:** src/theme/tokens.ts, src/game/districts/catalog.ts, src/game/baixada/lite-city-art.ts, src/components/BaixadaLiteWorld.tsx, src/game/baixada/sprites.ts. Os documentos mais antigos são históricos e não prevalecem sobre a versão em uso.

## Marca e semântica
| Papel | Cor de função | Símbolo |
|--|--|--|
| Aliado/protagonista | #00E5FF | círculo |
| Hostil | #FF2E88 | triângulo |
| Neutro/interação | #FFD166 | losango |
| Projeto Éden | #7DFFB3 | hexágono |

Cores funcionais nunca dependem do distrito. Paletas ambientais podem ter acentos semelhantes desde que não pareçam marcadores funcionais. Verde da vegetação deve ser oliva, dessaturado ou natural, sem confundir com interface do Éden.

## Sete regiões
- **Baixada:** popular e tropical; habitações desgastadas, cobogós, feira, fios, varais, mercado, drenagem, palmeiras dessaturadas.
- **Ferrugem:** polo industrial; oxidação, sucata, máquinas, dutos, galpões e sinalização de risco.
- **Áurea:** torres corporativas e Helix; concreto polido, vidro, sensores e vigilância.
- **Subsolo:** túneis clandestinos, abrigos, comércio cinzento, luz indireta e condutos.
- **Setor Zero:** área interditada e memórias apagadas; barreiras, sistemas autônomos e isolamento.
- **Prisma:** entretenimento, cultura, painéis de divulgação e transmissões piratas.
- **Periferia:** caravanas, jardins comunitários, rotas livres e materiais reutilizados.

Objetos listados são direcionamentos artísticos; **não** assuma que todos já existem. Verificar código e colisão antes de introduzir props.

## Materialidade e legibilidade
Concreto molhado, metal gasto, telhas, toldos, madeira reparada e iluminação mista. Fachadas/telhados não devem flutuar. Variedade de altura, profundidade e oclusão deve ser coerente com a malha. Evitar superposição excessiva, neons indiscriminados ou repetição mecânica de prédios idênticos.

## Personagens e tipografia
Seis origens × duas apresentações; quadros 64×80, 12 colunas e 4 direções nos protagonistas. Mantenha estado e frame alinhados entre Canvas/Phaser. Fontes: Chakra Petch (display), Barlow Semi Condensed (corpo) e IBM Plex Mono (dados), com fallback local. Não acrescentar fontes binárias de terceiros sem licença; não publicar arquivos de fonte em entregas de chat.

## Performance
Assets originais e gerados localmente; evitar decodificar todas as skins em cada cena ou refazer render sem alteração. Ganho de FPS requer medição Android. Nunca substituir a linguagem visual por blocos para demonstrar desempenho.
