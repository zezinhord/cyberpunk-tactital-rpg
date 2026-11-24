# Nova Arcádia 2.0 definitiva — checkpoint de produção de arte (21/11/2026)

## Escopo

Entregar o RPG Android com pelo menos 3.000.000.000 bytes reais, contabilizando APK funcional + sete pacotes de conteúdo. Preservar jogo existente, todos os avanços da RC5 e assinatura QA200. Não preencher com áudio ou imagens que não têm propósito no gameplay.

## Código implementado nesta branch

- tools/produce_district_archives.py: gera 28 ambientes, 12 arquivos gráficos originais por interior, 28 panoramas próprios (2048x180) e 84 artes de objetos. Total 448 artes distintas, incluindo 336 páginas gráficas consultáveis.
- tools/test_authored_archives.py: verifica dimensões, integridade, descrições, origem e hashes únicos.
- src/game/story/archive-progress.ts: registra até 336 consultas por protagonista e protege contra inputs maliciosos.
- src/components/DossierGallery.tsx: mostra páginas lidas, navegação e persistência local.
- src/game/character/backup.ts: exporta/importa o progresso do arquivo visual sem quebrar backups antigos.
- scripts/test-archive-progress-v20.mjs: cobre os 28 interiores, escrita em backup e validação.
- .github/workflows/na-original-content-production.yml: gera os sete ZIPs e publica artefato de auditoria por execução, sem alegar meta atingida.
- .github/workflows/na-asset-pack-bridge-qa.yml: gameplay, arte, save e compilação nativa.

## Métricas confirmadas em CI

A execução 44845665349 passou:
- 28 salas; 448 imagens originais; 336 pranchas.
- PNGs físicos: 30.508.887 bytes.
- Sete ZIPs autenticáveis: 30.578.953 bytes.
- Baseline APK RC4: 1.143.503.198 bytes.
- Total auditado: 1.174.082.151 bytes.
- Falta real até 3GB: 1.825.917.849 bytes.

Estes arquivos são legítimos e funcionais no leitor após instalação, mas não perfazem 3GB. Não ajustar o contador, repetir documentos, inflar pixels, introduzir ruído ou encher o APK com arquivos não usados.

## Próximos marcos obrigatórios

1. Produzir mais arte original com utilidade real: variantes de NPCs, sprites próprios por classe e origem, animações de combate, mapas acessíveis, campanhas adicionais, cinemáticas e objetos funcionais.
2. Preservar desempenho no Galaxy A07 e Redmi Note 12S; carregar por distrito e descartar recursos na saída, com qualidade adaptativa e limites de RAM.
3. Vincular cada recurso adicional a cena, evento, objeto ou cutscene real, por caminhos verificáveis no catálogo do game.
4. Rodar tools/build_3gb_asset_packs.py com tamanho obrigatório (sem flag test-only) e validar os sete SHA256, Android 15 2GB, versão, certificado e guarda de salvamento.
5. Publicar apenas quando pacote APK+sete ZIPs realmente atingir >=3.000.000.000 bytes, com estabilidade verificada e licença original/CC0 comprovável.

## Verificação

- Pull request oficial: https://github.com/zezinhord/cyberpunk-tactital-rpg/pull/22
- Arte produzida em CI: https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/44845665349
- Integração Android nativa: https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/44845665360

## Comunicação

Distinga código desenvolvido, pacotes efetivamente gerados, conteúdo instalado, versão definitiva publicada e QA físico. Compartilhe commits, tamanho real e status CI; não apresente uma fase como a fase final.
