# Direção de arte e estado de implementação — Nova Arcádia

**Versão de referência: 0.6.5 beta.** Direção aprovada: RPG 2D isométrico de estética tropical cyberpunk, com identidade própria. A cidade deve transmitir um futuro vivido e desigual: concreto úmido, vegetação tropical adaptada, comércio informal, infraestrutura reaproveitada, cabos expostos, letreiros artesanais e tecnologia avançada coexistindo com improviso cotidiano.

## 1. Princípios visuais aprovados

- A cidade não deve imitar a estética de Cyberpunk 2077. Sua linguagem visual combina clima tropical, materiais gastos, arquitetura comunitária e tecnologia de alta densidade.
- O mundo permanece 2D isométrico. Profundidade, oclusão, escala e leitura de circulação precisam ser construídas para telas Android.
- A cor nunca é o único indicador funcional; forma e rótulo acompanham os marcadores.
- **Ciano** identifica aliado/protagonista; **magenta**, hostil; **âmbar**, neutro ou elemento interativo; **verde**, exclusivamente sinais e intrusões do Éden. Verde não significa segurança ou confiança.
- HUD de exploração compacta, mantendo o cenário livre. O gerenciamento do protagonista abre em uma central própria de tela integral, com seções para personagem, inventário, equipamentos, habilidades, mapa, diário e configurações. Alvos de toque de no mínimo 48 dp; botões principais de 56 dp.
- Textos funcionais nunca abaixo de 12 px. `prefers-reduced-motion` deve ser respeitado na interface DOM.

## 2. Situação da Baixada na v0.6.5 beta

- Mapa exterior de 20 × 16 células lógicas, com ruas, vias de passagem, moradias, clínica, oficina, Mercado da Ponte, Moradias do Canal, Ponto de Apoio e Praça da Caixa d'Água.
- Câmera acompanha o protagonista; toque no chão move pelo caminho calculado. Toque em NPCs, portas e terminais encaminha a aproximação e interação.
- Células de edificações, atores e objetos interativos relevantes não podem ser atravessadas pelo caminho automático.
- Três interiores jogáveis feitos individualmente: Clínica Comunitária, Oficina do Nilo e Galeria de Manutenção do Canal.
- A missão "O nome que sumiu" passa pela Dra. Amara, pelo terminal da clínica e pelo retorno à médica. O terminal da galeria fornece uma pista adicional depois da descoberta do identificador V-09.
- O Limbo de Teste segue separado como arena de combate por turnos.

## 3. Personagens e animação

A v0.6.5 beta contém onze spritesheets PNG originais, cada um em grade 4 × 4 (quadro de 64 × 80 px): seis protagonistas, diferenciados pela origem, e cinco NPCs (Amara, Nilo, Joana, Saira e Téo). Cada linha corresponde a uma orientação isométrica. Há ciclos de repouso e caminhada; NPCs possuem animação de repouso e leve movimento ambiental.

Esses sprites são arte provisória funcional da beta, não arte final de produção. Permanecem pendentes animações de corrida, ataque, interação, dano, expressões, variação de roupas/equipamentos e revisão de legibilidade em diferentes densidades de tela.

## 4. Situação dos sistemas

| Sistema | Estado na 0.6.5 beta | Lacunas principais |
|---|---|---|
| Criação e seis origens | Implementadas e preservadas | Personalização visual além da seleção de origem |
| Prólogos | Seis introduções individuais | Cenas ilustradas e escolhas com consequências ampliadas |
| Exploração | Baixada exterior e três interiores | Colisões de todos os objetos, oclusão de fachadas, subáreas adicionais e outros distritos |
| Personagens | Seis protagonistas e cinco NPCs em spritesheets | Corrida, ataque, interação e arte final |
| Missão inicial | Um fluxo com três etapas e salvamento local | Sistema geral de missões, escolhas, recompensas e consequências |
| Combate | Arena tática de teste preservada | Integração de encontros ao mapa e retorno ao ponto de exploração |
| Inventário e equipamentos | Ainda não implementados como sistemas gerais | Itens, equipamentos, consumíveis e interface |
| Mundo persistente | Protagonista e missão localmente persistidos | Posição, estado dos NPCs, mundo e sincronização entre dispositivos |
| Éden | Registros e intrusões narrativas pontuais | Comunicação evolutiva e respostas condicionadas ao progresso |

## 5. Direção para próximas expansões

A evolução deve ampliar uma área já jogável e evitar arenas isoladas. Próximos incrementos recomendados: aprimorar arte e animação dos personagens, criar objetos modulares e oclusão, expandir a Baixada em subáreas conectadas, generalizar diálogos e missões e integrar encontros táticos à exploração. Inventário, economia e progressão devem ser implementados como sistemas reais, não apenas telas decorativas.

O orçamento de armazenamento é uma meta de produto (preferência de 500–800 MB, com teto desejado de 800 MB), não uma quantidade a ser preenchida artificialmente. Priorizar compressão, reutilização de assets e carregamento por região.

## 6. Preservação de sistemas

A v0.6.5 beta preserva as regras do Limbo de Teste e a estrutura de origens. A expansão da Baixada acrescenta cenas de exploração, sprites, interiores e interações, sem reescrever o combate tático. O workflow Android permanece único em `.github/workflows/main.yml`.
