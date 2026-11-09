# Direção de arte e plano de integração visual — Nova Arcádia

Base: **v0.4 consolidado**. Direção artística **aprovada**. A Fase 1 foi integrada à versão 0.4.1. A Fase 2 ainda NÃO está autorizada; as Fases 2, 3 e 4 dependem de aprovação explícita do responsável pelo projeto.

## 1. Escopo e restrições

A camada de design entrega identidade visual, interface, personagens e animações, integrados por fases, sem substituir o projeto.

- Não cria mapas. O **Limbo de Teste** existente (`map.ts`, grade 8 × 8) é mantido; só recebe tratamento visual.
- Não altera regras de combate, atributos, origens, vantagens ou habilidades (`TurnManager.ts`, `map.ts`, `game/types.ts`, `character/*`).
- Não substitui o salvamento (`character/storage.ts`, chave `cyberpunk-tactical-rpg.character.v1`).
- Não transforma o jogo em 3D: continua 2D isométrico.
- Não adiciona dependências. Phaser 4, React, TypeScript, Vite e Capacitor ficam como estão. O APK continua sendo gerado pelo GitHub Actions; cada fase precisa passar em `npm run build`.

## 2. Direção artística

**Tese:** a cidade fala em ciano e magenta; o Éden fala em verde. Cyberpunk de clima tropical: concreto úmido, gambiarra, cabos emaranhados e letreiros pintados à mão. Isométrico 2D, desenho vetorial.

**Cores de função** (valem em qualquer distrito):

| Função | Cor | Forma | Rótulo |
|---|---|---|---|
| Aliado / protagonista | `#00E5FF` | círculo | "Aliado" |
| Hostil | `#FF2E88` | triângulo | "Hostil" |
| Neutro / interativo | `#FFD166` | losango | "Neutro" |
| Éden | `#7DFFB3` | hexágono | "Éden" |

O verde identifica o Éden. **Não significa segurança nem confiança**: o Éden pode usá-lo também em ameaça, manipulação ou conflito.

**Acessibilidade:** a cor nunca é o único indicador. Todo elemento por função leva também forma e texto. Nenhum texto abaixo de 12 px. Botões principais com 56 dp e qualquer área tocável com pelo menos 48 dp. Movimento reduzido é respeitado.

**Base da interface:** fundo `#0B0D17`, painel `#161A2B`, tabuleiro `#0F1322`, linhas `#2A3156`, texto `#E6F1FF`, secundário `#8FA3C7`.

**Paletas por distrito** (só pintam cenário, painéis e emblemas):

| Distrito | Sombra | Superfície | Luz | Apoio |
|---|---|---|---|---|
| Áurea | `#0E1118` | `#2E394D` | `#7FE7FF` | `#E8D8A8` |
| Baixada | `#150F14` | `#3A2530` | `#FF8A3D` | `#FF2E88` |
| Subsolo | `#0C1211` | `#26332F` | `#E8D44D` | `#FF4D4D` |
| Ferrugem | `#120F0D` | `#3E2A20` | `#E0572B` | `#FFC233` |
| Limite urbano (provisório) | `#0F1219` | `#2A2E45` | `#FF8F6B` | `#00E5FF` |
| Limbo de Teste | `#0D1220` | `#19243A` | `#00E5FF` | `#FF2E88` |

**Personagens:** silhueta + luz de contorno + um sinal de identidade, em desenho vetorial animado por partes.

**Tipografia** (arquivos locais; alternativas do sistema enquanto faltarem): Chakra Petch (títulos e números), Barlow Semi Condensed (textos), IBM Plex Mono (registros do Éden). Situação em `src/assets/fonts/LEIA-ME.md`.

**Interface:** painéis com canto chanfrado, bottom sheet na base, textos em frase.

**Movimento:** passo 140 ms; ataque 90 ms com flash e número de dano; dano 80 ms; habilidade de origem 600 ms; anel de interação a cada 1,6 s; varredura de luz de 300 ms na troca de turno.

## 3. Os dez elementos

| # | Elemento | Situação no 0.4 | Entrega | Fase |
|---|---|---|---|---|
| 1 | Tela inicial e menu | Sem tela de título | `TitleScreen`: Continuar, Novo protagonista, Menu do personagem e Sobre, sobre as funções de salvamento existentes | 2 |
| 2 | Criação do protagonista | Nome + origem | Novo visual; mesmos campos e a mesma validação | 2 |
| 3 | Seis origens | Cartões com símbolos de texto | Emblemas SVG, cor do distrito, forma + texto; dados de `getAllOrigins()` | 2 |
| 4 | Introduções | Texto | Cena visual por distrito, revelação gradual; textos de `introductions.ts` intactos | 2 |
| 5 | Exploração | Sem sistema | Apresentação preparada para o sistema real, em estado vazio, sem dados fictícios | 4 |
| 6 | Mapa e Limbo | Limbo 8 × 8 | Só tratamento visual do Limbo existente | 3 |
| 7 | Combate | HUD em `App.tsx`, cena em `BattleScene.ts` | `CombatHud`; cena nova; câmera com zoom/arraste; **caminho, alcance e destino visíveis antes de confirmar o movimento** | 3 |
| 8 | Personagens, inimigos, NPCs | Silhuetas provisórias | Arte vetorial apenas visual, sem regras novas | 3 |
| 9 | Inventário, equipamentos, atributos | Sem sistema | Telas preparadas para receber o sistema real; estados vazios, sem dados fictícios | 4 |
| 10 | Diálogos e registros do Éden | Textos em `origins.ts` e `introductions.ts` | `DialogueBox` e `EdenRecord` preparados; usam só textos existentes | 4 |

## 4. Arquivos por fase

**Fase 1 · Identidade (integrada na 0.4.1):** modifica `src/styles.css` e `index.html`; cria `src/theme/tokens.ts`, `src/ui/icons.tsx` e `src/assets/fonts/`.

**Fase 2 · Fluxo inicial (não autorizada):** cria `src/screens/TitleScreen.tsx`, `CreationScreen.tsx`, `ResumeScreen.tsx`, `IntroductionScreen.tsx`, `screens.css` e `src/ui/DistrictScene.tsx`; modifica `src/App.tsx` e `src/styles.css`.

**Fase 3 · Combate e personagens (não autorizada):** cria `src/render/characters.ts`, `effects.ts`, `camera.ts` e `src/components/CombatHud.tsx`; modifica `src/game/BattleScene.ts` (só desenho e entrada de toque) e `src/components/Battlefield.tsx`.

**Fase 4 · Sistemas (só apresentação; não autorizada):** cria em `src/screens/` `ExplorationHud.tsx`, `InventoryScreen.tsx`, `CharacterSheet.tsx`, `DialogueBox.tsx` e `EdenRecord.tsx`.

**Nunca tocados:** `TurnManager.ts`, `map.ts`, `game/types.ts`, `character/*`, `EventBus.ts`, `package.json`, `.github/workflows/main.yml`.

## 5. Mudanças de arquitetura e justificativa

1. Extrair telas do `App.tsx` para `src/screens/`, sem mudar a lógica: o arquivo já concentra quatro telas e receberia mais seis.
2. Câmera e seleção de célula na `BattleScene` (Fase 3): a altura do losango fica abaixo de 48 dp. A célula entregue a `movePlayerTo(x, y)` continua sendo uma célula da grade lógica.
3. `src/theme/tokens.ts`: elimina a duplicação de cores entre CSS e Phaser.
