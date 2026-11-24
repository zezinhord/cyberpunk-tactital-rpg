# Nova Arcádia 2.0 RC9 — Plano de aceitação Android e progressão

**Escopo:** Operação Vigília (28 mapas 8×8; 112 grupos civis; 84 sentinelas móveis), sua progressão e a regressão de todo o conteúdo anterior. Esta ficha distingue testes automatizados de testes físicos ainda necessários.

## Critérios automatizados da RC9

- `npx tsc -b`, `npx vite build` e Gradle `assembleDebug` sem erros.
- `node --experimental-strip-types scripts/test-vigil-escorts-v20.mjs`: 28 operações resolvidas, quatro resgates por operação, 364 deslocamentos, avanço furtivo, corrida de duas casas, guardas efetivamente móveis, decisões de atraso, XP único e backup JSON válido.
- `node --experimental-strip-types scripts/test-field-simulations-v20.mjs` e `test-perimeter-routes-v20.mjs`: preservar as 168 decisões e 140 postos anteriores.
- `python tools/test_vigil_escorts.py --source resourcepacks/source --full`: todas as 448 imagens diferentes, verificadas, originais e indexadas nos 28 locais.
- Os sete ZIPs devem conter exatamente **368 recursos por distrito**, com **64 imagens de resgate**, 80 de patrulha, 96 de simulação, 64 cinematográficas, 48 documentos, 12 objetos e 4 murais. Cada imagem e ZIP recebe SHA-256.
- O APK assinado deve preservar o ID `com.cyberpunk.tacticalrpg.qa201` e a chave anterior, com versionCode **2000009**, e passar no Android 15 com 2 GB de RAM.
- O marco de 2.374.082.151 bytes só pode ser anunciado após somar o **APK RC9 assinado** aos **sete ZIPs publicados**.

## Checklist manual para testar no celular

1. **Atualização:** exportar backup do protagonista antes de instalar a RC9 sobre a RC8 QA201. Verificar que o personagem, equipamentos, habilidades, missões e salvamentos anteriores continuam presentes. Não desinstalar a RC8.
2. **Conteúdo extra:** abrir Configurações → Conteúdo extra e instalar ao menos um pacote distrital; conferir se o download decompõe sem tela preta ou reinícios. Repetir com download interrompido e retomado.
3. **Desbloqueio:** concluir as fases de A Cidade Responde e Operação Limiar em um interior. Verificar se a entrada avisa **NOVA MISSÃO: OPERAÇÃO VIGÍLIA — RESGATE**.
4. **Navegação:** tentar mover para uma parede, duas casas sem corrida e duas casas com corrida, em linha reta e sem obstáculo intermediário. Só a última ação válida pode funcionar.
5. **Tática:** comparar Normal, Furtivo e Corrida. Conferir energia limitada, alerta dos vigias, distração eletrônica temporária e reposicionamento da patrulha.
6. **Resgate:** alcançar um grupo, ativar Socorrer, confirmar que o mesmo grupo não pode ser resgatado duas vezes; completar quatro grupos e chegar ao ponto de extração.
7. **Persistência:** sair do aplicativo durante um resgate, encerrá-lo e reabrir. Confirmar o turno e os grupos já resgatados. Repetir após exportação/importação do backup.
8. **Recompensas:** concluir com e sem incidentes; conferir o XP variável e tentar entrar novamente. Não deve existir segunda recompensa.
9. **Desempenho:** registrar FPS e travamentos durante exploração, combate e troca de imagens na Vigília em Galaxy A07 e Redmi Note 12s. Especialmente verificar memória, aquecimento e tela de loading.
10. **Regressão:** passar pelo hospital, regeneração, habilidades no combate, saída da arena, diálogos, painel de missões, interiores e os sete confrontos distritais antigos.

**Importante:** a compilação e o teste de boot do emulador não equivalem à execução desses dez testes físicos. Reportar qualquer falha indicando celular, Android, versão do APK, distrito, interior, etapa e captura do erro.