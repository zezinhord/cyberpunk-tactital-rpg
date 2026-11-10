# Piloto visual da Baixada — primeira entrega

**Base:** v0.6.5 beta  
**Branch:** feature/landscape-mobile-v1  
**Escopo:** dois objetos ambientais vetoriais integrados à cena exterior.

## Direção adotada

A Baixada mantém o cyberpunk tropical vivido e desigual: materiais reaproveitados, madeira envelhecida, concreto gasto, telhas e toldos, iluminação quente, vegetação tropical em verdes dessaturados e tecnologia improvisada. Os assets usam desenho vetorial estilizado com contorno escuro e volumes legíveis em escala móvel, para dialogar com o cenário procedural existente no Phaser.

As cores funcionais permanecem reservadas aos sistemas de jogo: ciano para aliados, magenta para hostis, âmbar para interações e verde apenas para intrusões do Projeto Éden. A vegetação não usa o verde do Éden.

## Assets entregues

| Arquivo | ViewBox | Uso |
|---|---:|---|
| `public/assets/baixada/market-stall.svg` | 200 × 180 | Banca do Mercado da Ponte, com toldo listrado, balcão, caixotes, frutas e luminárias |
| `public/assets/baixada/palm-tree.svg` | 112 × 190 | Palmeira tropical estilizada com folhas verde-oliva e tronco castanho |

Os dois SVGs têm fundo transparente e são carregados pelo pipeline nativo do Phaser com `this.load.svg`. O asset da banca é desenhado na posição da banca existente; as palmeiras substituem a versão geométrica anterior nos seis pontos já previstos do mapa.

## Integração

A cena `BaixadaScene` carrega os assets no método `preload` e instancia os objetos na camada de profundidade do mundo. A base de apoio fica próxima ao centro do respectivo ladrilho, e os personagens continuam sendo desenhados à frente quando ocupam posições mais próximas da câmera.

Não foram alteradas as células de colisão, o pathfinding, os NPCs, os interiores, as falas ou a progressão da missão. Os assets são visuais e não bloqueiam circulação.

## Limites desta entrega

- É um piloto de dois elementos, não um tileset completo nem a arte final de todos os prédios.
- A escala e o posicionamento precisam de conferência visual no APK, especialmente em aparelhos com proporções ultrawide.
- A próxima leva deve incluir fachadas modulares, caixas d'água, cabos, postes, sinalização, vegetação secundária e objetos de rua, mantendo o mesmo traço e perspectiva.
- Não foram adicionados joystick permanente nem companheiros controláveis. A exploração continua por toque no cenário e interações contextuais, com protagonista solo.

