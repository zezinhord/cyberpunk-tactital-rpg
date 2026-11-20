# Nova Arcádia 1.0.0-rc.2 — hotfix de inicialização Android

**Origem:** relato do usuário em 20/11/2026: a versão 1.0.0-rc.1 não abre no celular.
**Diagnóstico:** as APKS QA100 rc.1 e rc.2 conseguem abrir em um emulador Android 15 (API 35) com 2 GB de RAM. A falha do aparelho relatado ainda não foi reproduzida nem explicada sem captura/logs próprios; não anunciar resolução universal.

## Alterações de runtime preservando 1,14 GB e saves

1. `src/App.tsx` carrega `ExplorationScreen` sob demanda via React.lazy/Suspense. O jogo não precisa importar/custear módulos de distrito e sprites ao exibir o menu principal.
2. `src/main.tsx` protege a árvore React com ErrorBoundary de inicialização; se ocorrer uma exceção no render, apresenta a mensagem e um reinício sem limpar o armazenamento.
3. `index.html` oferece estado inicial visível e uma opção de reinício se nenhum componente React aparecer; detecta erros JS não tratados, sem apagar saves.
4. A `main`, o pacote QA de 0.9.1, os 56 temas musicais, 28 ambiências e 112 gravações expandidas **não foram modificados nem reduzidos**.

## Evidências automáticas

- Teste da antiga rc1 (APK 1.143.067.327 bytes, SHA-256 `70f857587019e9d49a0ba3f8f20a982d503452bfb9df22fdb82cdcf7953feb18`) em Android 15 emulado com 2 GB: abriu, carregou a WebView e reiniciou sem exceções JS. CI: https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/44737200388
- Teste do novo código Android-UA em Chromium (914×411): criou personagem, pulou abertura, entrou na Baixada, carregou 15 imagens, desenhou 28 cores, caminhou e salvou posição. CI: https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/44737626739
- APK rc2 compilada e auditada após conferir certificado Android QA100 anterior. CI: https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/44740100414 — **success**.
- A CI Android agora bloqueia publicação se falharem assinatura, assets, instalação, inicialização da WebView ou segundo cold boot. O runner precisa de permissões de hardware KVM; falhas anteriores de inicialização do emulador eram de infraestrutura de testes, não crashes do jogo.

## APK final de QA

- **Página da release:** https://github.com/zezinhord/cyberpunk-tactital-rpg/releases/tag/nova-arcadia-v100-rc2-boot-qa
- **Arquivo APK direto:** https://github.com/zezinhord/cyberpunk-tactital-rpg/releases/download/nova-arcadia-v100-rc2-boot-qa/NovaArcadia-1.0.0-rc.2-Full-1GB-BOOT-QA.apk
- **Tamanho:** 1.143.070.724 bytes.
- **SHA-256:** `b4b5702da1b838488ebb4c668be0a680a7334aa55929cde6123a31518c7964cc`
- **Versão:** `1.0.0-rc.2`, versionCode `1000002`.
- **Pacote:** `com.cyberpunk.tacticalrpg.qa100` — igual à RC1.
- **Certificado QA100 esperado:** `3759bf917ed1423fde28272602b5cb4aa34447c0e60d65f2ce66946bb4916dc0` — CI exigiu correspondência antes da publicação.
- **Código do APK:** `21221c964eb013056cd8622e448020c4754faea6`.

## Procedimento no celular

- **Se já possui QA 1.0.0-rc.1:** baixe a rc2 acima e **instale por cima sem desinstalar**. Como `applicationId` e assinatura são iguais e `versionCode` aumentou, o Android deve preservar o armazenamento da QA1.0. Faça backup quando possível.
- **Se ainda está na 0.9.1 QA ou outro canal:** as instalações têm IDs diferentes; instale a RC2 separadamente e exporte/importe o backup JSON.
- Não limpar dados, não desinstalar a antiga antes do backup. Reservar espaço (recomendação 3 GB livres) e usar o APK completo, não o ZIP de artefatos.
- Se o problema continuar, registrar modelo, Android, espaço livre, vídeo/captura mostrando se há erro de instalação, tela preta, carregamento contínuo ou fechamento automático. Se possível, extrair `adb logcat` do processo Android.

**Status:** pré-lançamento experimental; não equivale a homologação em Galaxy A07, Redmi Note 12S e Moto G34 5G nem conclusão integral da campanha.
