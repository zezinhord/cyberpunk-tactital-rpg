# Relatório da Fase 1 — Identidade visual

Base: v0.4 consolidado. Esta fase não move nenhuma tela de lugar e não altera nenhuma lógica.

## Arquivos criados

| Arquivo | Para quê |
|---|---|
| `src/theme/tokens.ts` | Cores de função, base da interface, paletas dos distritos, medidas de toque e pilhas de fonte. Fonte única para o Phaser (a partir da Fase 3). |
| `src/ui/icons.tsx` | Emblemas SVG das seis origens, marcadores de função (círculo, triângulo, losango, hexágono), ícones de interface e a marca do Éden. Ainda não é usado por nenhuma tela (entra na Fase 2). |
| `src/assets/fonts/fonts.css` | `@font-face` das fontes locais. |
| `src/assets/fonts/IBMPlexMono-Regular.woff` | IBM Plex Mono oficial, 55 KB. |
| `src/assets/fonts/IBMPlexMono-OFL.txt` | Licença SIL OFL 1.1 da IBM Plex Mono. |
| `src/assets/fonts/LEIA-ME.md` | Situação das fontes e como integrar as pendentes. |
| `docs/DIRECAO-DE-ARTE.md` | Direção aprovada, com os seis ajustes incorporados. |
| `docs/RELATORIO-FASE-1.md` | Este relatório. |

## Arquivos modificados

| Arquivo | O que mudou |
|---|---|
| `src/styles.css` | Reescrito com tokens, tipografia, painéis chanfrados, marcadores de forma e áreas de toque. **Todos os nomes de classe da v0.4 foram mantidos**, então o `App.tsx` atual funciona sem alteração. |
| `index.html` | Título, descrição e `color-scheme`. O `theme-color` já era o mesmo tom. |
| `docs/NOTAS-DE-DESIGN.md` | Atualizado: aponta para `tokens.ts` e `styles.css`. |

Verificado por hash: os outros 29 arquivos da v0.4 estão idênticos, incluindo todo `src/game/`, `App.tsx`, `main.tsx`, `package.json`, o workflow do GitHub Actions e os arquivos de configuração.

## Funcionalidades preservadas

- Combate, economia de turno, IA da sentinela, mapa de teste, origens, vantagens, habilidade única e salvamento: nenhum arquivo dessas partes foi tocado.
- Teste automatizado do mesmo fluxo na v0.4 e na Fase 1 (criar protagonista Baixada, prólogo, jogo, recarregar e retomar): o JSON gravado em `cyberpunk-tactical-rpg.character.v1` é **idêntico** nas duas versões, e não houve erros de console.
- O canvas do jogo mantém as mesmas dimensões e o mesmo desenho (`.battlefield-canvas` inalterado). O visual do tabuleiro é da Fase 3.

## Alterações visuais realizadas

- **Cores:** cores de função aprovadas (ciano, magenta, âmbar, verde) e aliases antigos (`--cyan`, `--magenta`, `--amber`) preservados. Títulos deixam de ser ciano: ciano passa a significar aliado ou ação ativa.
- **Acessibilidade sem depender de cor:** cartões de unidade ganham círculo (aliado) ou triângulo (hostil) além do nome e do papel; o indicador de turno traz a mesma forma; cartão de origem selecionado ganha marca de seleção e borda mais grossa; blocos do Éden ganham hexágono e rótulo.
- **Toque:** botão de habilidade, ações secundárias e resumo do registro passaram a ter pelo menos 48 dp; botões principais, 56 dp.
- **Texto:** nenhum texto abaixo de 12 px. Auditoria nas quatro telas atuais: v0.4 tinha 49 elementos de texto menores que 12 px e 3 áreas de toque menores que 48 dp; a Fase 1 tem **zero** de cada. Contraste mínimo conferido sem falhas.
- **Forma:** unidades, comando de origem e mensagem de combate com cantos chanfrados; barra de vida segmentada; seta indicadora no registro recolhível; foco visível em âmbar.
- **Éden:** o bloco de registro do Éden passa a usar verde, fonte IBM Plex Mono e linhas de varredura.
- **Movimento:** `prefers-reduced-motion` desliga animações e transições.

## Instruções de integração

1. Extraia o ZIP e envie os arquivos para o repositório **preservando as pastas** (como em `docs/UPLOAD-GITHUB-MOBILE.md`), substituindo os de mesmo caminho: `index.html`, `src/styles.css` e `docs/NOTAS-DE-DESIGN.md`. Os demais são novos.
2. Execute o workflow do APK ou `npm run build`.
3. Para integrar Chakra Petch e Barlow Semi Condensed: siga `src/assets/fonts/LEIA-ME.md` ou envie-me os arquivos `.woff2`.

## Possíveis problemas de compatibilidade

- **Build real não executado:** o ambiente em que trabalhei não acessa o registro npm, então não rodei `npm run build` com as suas dependências. Verifiquei com o React real empacotado pelo esbuild (com um substituto do Phaser), com o TypeScript no modo estrito do projeto (`noUnusedLocals`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`) usando tipos mínimos do React, e abrindo o resultado no Chromium em tela de celular. Os tipos oficiais do React e o Vite só serão exercitados no seu GitHub Actions: se acusar erro, envie-me a mensagem.
- **Fontes pendentes:** Chakra Petch e Barlow Semi Condensed não estavam disponíveis para mim. O layout foi testado com fontes alternativas do sistema. Ao integrar Chakra Petch, que é mais larga que as condensadas do sistema, vale conferir quebras de linha em títulos e botões.
- **Plex Mono em WOFF:** usei `.woff` em vez de `.woff2` porque o ambiente não tinha compressor Brotli. O Android WebView aceita os dois. Só o contêiner mudou: nenhum glifo foi alterado.
- **`@import` no CSS:** `styles.css` importa `assets/fonts/fonts.css` na primeira linha, e o Vite resolve a URL da fonte relativa a esse arquivo.
- **Foco em elementos chanfrados:** nos botões com corte de canto, o contorno de foco é desenhado para dentro, para não ser cortado.
- **Interface do jogo ainda em caixa-alta:** os rótulos do HUD estão escritos em maiúsculas no `App.tsx`; mudam para frase na Fase 3, quando o HUD for extraído.
