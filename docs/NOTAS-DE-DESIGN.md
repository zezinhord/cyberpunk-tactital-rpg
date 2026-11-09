# Notas de design

A direção completa está em `DIRECAO-DE-ARTE.md`. Este arquivo resume onde cada decisão vive no código.

- **Cores e medidas:** `src/theme/tokens.ts` (canvas/Phaser) e `:root` em `src/styles.css` (DOM). Os dois precisam mostrar os mesmos valores.
- **Cores de função:** ciano = aliado, magenta = hostil, âmbar = neutro/interativo, verde = Éden. Sempre acompanhadas de forma (círculo, triângulo, losango, hexágono) e rótulo.
- **Ícones:** `src/ui/icons.tsx` (SVG; sem símbolos de texto, que podem falhar em alguns Androids).
- **Fontes:** `src/assets/fonts/` (ver `LEIA-ME.md`). Pilhas de fonte em `--display`, `--body` e `--mono`.
- **Toque:** botões principais 56 dp; qualquer área tocável com pelo menos 48 dp; texto nunca abaixo de 12 px.
- **Movimento:** `prefers-reduced-motion` desliga animações e transições.
