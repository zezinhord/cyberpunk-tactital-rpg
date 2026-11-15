# Direção musical — Nova Arcádia 0.7.2 (trilhas CC0)

A versão anterior incluía 56 trilhas locais, mas todas foram sintetizadas a partir da mesma função matemática, com mudança de frequência/andamento. Adicionar mais faixas do mesmo gerador ampliaria espaço sem melhorar variedade.

## Direitos
- **NCS (NoCopyrightSounds)** permite determinadas utilizações gratuitas em vídeos; para **incorporar ao jogo**, exige contato via licença comercial: https://ncs.io/usage-policy . Nenhuma faixa NCS é distribuída pelo projeto.
- O catálogo `music/cc0-sources.json` descreve músicas marcadas **CC0 1.0** nas páginas originais do OpenGameArt. Cada arquivo importado recebe SHA-256 no catálogo local e crédito em `public/assets/music/CREDITS.md`, gerado no build.
- Fontes consultadas: https://opengameart.org/content/t-t-free-cyberpunk-pack-2 ; https://opengameart.org/content/funky-house ; https://opengameart.org/content/tropical-loop ; https://opengameart.org/content/bossa-nova ; https://opengameart.org/content/tropical-fantasy ; https://opengameart.org/content/pondering-the-cosmos ; https://opengameart.org/content/feel-good-island-loop .
- Licença: https://creativecommons.org/publicdomain/zero/1.0/

## Gêneros por distrito

| Área | Identidade |
| --- | --- |
| Baixada | Funky house, percussão tropical, bossa eletrônica, synthwave comunitário |
| Ferrugem | Industrial, dark techno, drones metálicos |
| Áurea | Synth minimalista, ambient corporativo, textura sintética |
| Subsolo | Bass pesado, texturas claustrofóbicas e loops industriais |
| Setor Zero | Suspense, dark ambient, ritmos irregulares |
| Prisma | House, club, dance alternativo, neon |
| Periferia | Ritmos tropicais, chillwave e eletrônica aberta |

## Implementação
- `tools/import_cc0_music.py` importa e transcodifica os arquivos durante a build no GitHub. **Sem internet no jogo**, sem downloads em tempo de execução, e sem alegar inclusão de faixas não importadas.
- Catálogo JSON local declara faixas realmente presentes. Erro de licença, áudio inválido ou menos de 8 faixas válidas **falha a build**. O conteúdo procedural existente permanece como alternativa offline.
- `src/audio/curated.ts` faz seleção sem repetir as últimas quatro URLs, de acordo com distrito, humor e estilo (misto, cyberpunk, tropical, original). O rádio permite pular faixa.
- A reprodução usa HTMLAudioElement com `preload=none`, uma música por vez, Opus a 80 kbps e fade-in curto para baixo uso de RAM em aparelhos Android fracos.

## QA
- Executar `python tools/import_cc0_music.py --check` e `node --experimental-strip-types scripts/test-cc0-radio.mjs`.
- No workflow GitHub Actions, confirmar a etapa de **importação** e revisar `CC0_TRACK_COUNT` e o APK gerado.
- Instalar em Galaxy A07 e Redmi Note 12S, testar troca automática, trocar estilo durante combate, volume silencioso, 30 min de exploração e restaurar após reinício.
- Limitação: temas comerciais NCS são **apenas referências musicais**, não estão incluídos. A direção musical brasileira completa exigiria gravações ou composições autorais específicas, além das faixas CC0 encontradas.
