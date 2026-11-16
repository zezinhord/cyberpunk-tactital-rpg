# Nova Arcádia 0.7.5 — Cinco distritos com identidade visual própria

**Base técnica:** `feature/visual-audit-camera-ui-v074`, CI #691 aprovado.
**Skill:** `.agents/skills/nova-arcadia-game-art-ui/SKILL.md`.

## Implementação
- `src/game/districts/art.ts`: um módulo isométrico leve e determinístico; cinco variantes visuais com 15 motivos próprios. O fundo de cada mapa continua gerado uma vez em **uma única textura estática** de 1560×940; nenhum download, sprite remoto, shader nem novo atlas.
- **Áurea:** torres com fachada de vidro, jardins suspensos, painéis Helix, passarelas distantes e terminais corporativos.
- **Prisma:** fachadas de entretenimento, equalizadores, toldos de mercado, pontos de luz e silhuetas noturnas.
- **Subsolo:** galerias, tubos de manutenção, portas em arco, monitores industriais e iluminação âmbar.
- **Setor Zero:** laboratórios lacrados, antenas, avisos de quarentena e interferência verde **associada explicitamente ao Éden**.
- **Periferia:** casas escalonadas com chapas, painéis solares, reservatórios e varais, numa paleta tropical gasta.
- NPCs e interagíveis ganham roupas, painéis e acessórios por distrito, sem alterar sua localização ou hitboxes. **São detalhes vetoriais provisórios, não spritesheets definitivos.**

## Sistemas preservados
- Seis origens e as duas apresentações do protagonista mantêm os spritesheets existentes.
- `catalog.ts` mantém a malha, os 35 objetivos, os nós e a lógica de colisão sem modificação.
- Baixada/Ferrugem/interiores não são reescritos; progressão, saves, rádio, origem e regras de combate intactos.
- Desempenho: textura estática e apenas 7 objetos Graphics de interação por cena, como antes. A arte mais elaborada tem custo inicial adicional na geração da textura; medir no Android.

## QA
- `scripts/test-district-art.mjs`: confirma cinco estilos diferentes, 15 motivos exclusivos e acessibilidade dos 35 nós a partir do início.
- `scripts/test-districts.mjs` e a suíte anterior ficam no workflow.
- `scripts/capture-baixada-visual.mjs` captura os cinco distritos em 914×411: `qa/distrito-*-914x411.png`; a inspeção visual humana é obrigatória antes de homologar.

## Limites
- Não representa os conceitos ilustrados literalmente nem contém assets pintados à mão.
- Geometria de edifícios estática não substitui sprites de NPC animados; a aparência ainda precisa de avaliação comparativa no aparelho.
- FPS, redução de memória, qualidade final do relevo, contraste e oclusão não estão validados fisicamente.
- Nenhum merge na main ou publicação de APK sem autorização.
