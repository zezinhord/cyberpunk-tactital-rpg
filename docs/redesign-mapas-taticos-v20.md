# Nova Arcádia 2.0 — reformulação integrada dos campos táticos

Data: 23/11/2026 · Branch: `feature/nova-arcadia-v20-battlefield-redesign`
Base de integração: `feature/nova-arcadia-3gb-final-assets` (PR principal da versão 2.0: #22).

## Mudanças de gameplay efetivamente conectadas

- **20 mapas táticos de campanha no motor de turnos atual**, incluindo os sete cercos distritais já existentes (geometria anterior preservada) e 13 layouts novos vinculados aos IDs de missões existentes; `test` (Limbo) e `v09` conservam os seus cenários originais por compatibilidade.
- A grade do combate **continua 8×8**. O objetivo desta entrega é ampliar suas regras sem refatorar telas, salvamentos, classes ou habilidades fora do escopo validado.
- Terrenos `normal/rubble/water/hazard/ramp/metal/shadow`, com custo real de deslocamento; obstáculos físicos e ocupação verificados pelo mesmo Dijkstra limitado a 64 células usado por jogador e IA.
- Alturas discretas 0/1/2, custo de acesso nas rampas, restrição para degraus maiores que 1, proteção contra posições ilegais, bônus moderado de precisão de altitude, oclusão de linha de visão por plataformas superiores.
- **Baixas coberturas** bloqueiam passagem, mas não todo disparo; cobertura direcional parcial = +2 à defesa; blocos opacos interrompem a trajetória.
- Cinco obstáculos funcionais por cenário: barricada, contêiner, porta, gerador e tubulação; íntegro/danificado/desativado/destruído; toque contextual adjacente, gasto de ação principal, atualização dinâmica de colisão e tiro.
- Netrunner e Técnico desativam portas e geradores; o gerador interfere temporariamente na unidade hostil; tubulações destruídas expõem células de risco.
- IA avalia custo real de rota, vantagem de posição, cobertura, risco ambiental e valida novamente a ocupação antes de mover.
- Estados de cenário associados ao ID do personagem e encontro persistem em armazenamento local; apagar o slot remove os registros respectivos com a política de rollback existente.
- Interface mobile SVG mostra terreno, indicador de risco, elevação, objetos operáveis e integridade, enquanto preserva as sprites existentes e o controle de habilidades; largura da área do mapa aumentada na orientação horizontal.
- Não há tela de pacote extra, download facultativo, outro aplicativo, conteúdo fingido ou expansão artificial de bytes.

## Destino dos mapas no fluxo existente

| Campo de batalha | Encontro integrado |
|---|---|
| Mercado da Baixada, rotas laterais | `trial-1` |
| Complexo industrial de Ferrugem | `trial-2` |
| Laboratório Helix | `district-aurea` |
| Rede de esgotos | `district-subsolo` |
| Centro de distribuição corporativo | `trial-3` |
| Distrito Prisma | `district-prisma`, `eden-relay` e `cisma-intercept` |
| Instalação de Setor Zero | `district-setor-zero`, `eden-core`, `cisma-core` |
| Encontros de distritos e conselhos | Demais IDs de `district-*` e os sete `council-*` |

**Importante:** os nomes acima identificam variações de encontro, não cenas Phaser de mundo aberto. A transição acontece pela infraestrutura de batalha existente; **a sobreposição da grade diretamente sobre a cena explorável, sem trocar de renderizador, permanece pendente**. A saída do combate retorna ao mundo explorável e seus dados de localização atuais.

## Qualidade e limitação da entrega

Executar na branch:
```sh
npm ci --no-audit --no-fund
npx tsc -b
node --experimental-strip-types scripts/test-battlefield-redesign-v20.mjs
node --experimental-strip-types scripts/test-council-tactical-maps-v20.mjs
node --experimental-strip-types scripts/test-ai-tactical.mjs
node --experimental-strip-types scripts/test-ai-combat-resources.mjs
node --experimental-strip-types scripts/test-battlefield-navigation.mjs
node --experimental-strip-types scripts/test-tactics.mjs
node --experimental-strip-types scripts/test-abilities.mjs
node --experimental-strip-types scripts/test-save-slots.mjs
python -m pip install -r tools/requirements-characters.txt
npm run generate:characters
npm run generate:v20-art
npx vite build
```

O workflow `.github/workflows/nova-arcadia-v20-battlefield-qa.yml` reproduz os testes. A compilação TypeScript, o algoritmo tático e a suite de regressão passaram no CI em 23/11/2026 (executar novamente após cada atualização). Não confundir aprovação web com homologação Android.

### Ainda pendente

1. Combate sobre o mesmo mapa renderizado pelo Phaser durante exploração, com conversão exata de coordenadas entre os dois motores e transição sem substituição de cena.
2. Arte arquitetônica ilustrada inédita com inspeção visual manual, renderização de diferentes andares, passarelas extensas e animações definitivas.
3. Suporte a mapas táticos maiores que 8×8, múltiplos aliados/inimigos simultâneos, zoom/pan por toque e múltiplos objetivos ambientais por batalha.
4. Campanha oferecendo interações de cenário ao longo dos diferentes diálogos e decisões, com variações reais por classe além do hacker e Técnico.
5. Build Android assinada desta branch com o conjunto integral de recursos 3,26GB; teste de instalação e frames reais em Galaxy A07/Redmi Note 12s.
6. Capturas comparativas antes/depois e QA visual de sprites, sombras, oclusões e UI.

Não declarar o redesign total ou a versão Android final homologada enquanto essas etapas não passarem.
