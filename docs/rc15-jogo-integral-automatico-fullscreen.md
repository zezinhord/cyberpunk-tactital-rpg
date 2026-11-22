# Nova Arcádia 2.0 — RC15: preparação automática, tela cheia Android

## Decisão funcional

Na versão **Nova Arcádia 2.0**, os sete distritos são inseparáveis do jogo. O APK único contém fisicamente os sete arquivos originais, sem conteúdo opcional. **O jogador não escolhe instalar, remover ou adiar esses recursos.**

O fluxo na primeira abertura é:

1. Android abre o APK assinado QA201. A tela de carregamento apresenta **Preparando Nova Arcádia 2.0**.
2. O jogo verifica o catálogo dos 3.808 arquivos originais e exige que os sete ZIPs oficiais estejam no próprio APK. Sem os sete, a versão é recusada como incompleta; não há download remoto alternativo.
3. Recursos já instalados, íntegros e com recibos SHA-256 válidos são reutilizados e os salvamentos anteriores são preservados.
4. **A extração dos distritos faltantes inicia automaticamente, sem botão e sem confirmação.** As artes são preparadas localmente e verificadas via SHA-256 antes de ficarem disponíveis para o motor do jogo.
5. Só depois dos sete distritos instalados e validados é permitido entrar no menu principal, criar personagem, carregar save ou explorar.
6. Em caso de falha de armazenamento/arquivo, a única ação é reparar o problema e **Tentar novamente**. Nunca existe "continuar sem o conteúdo".
7. Para manter a experiência limpa, foi removida a aba "Arquivos do jogo" da interface principal; o jogo se encarrega da integridade e manutenção automaticamente.

## Barra de notificações: falha corrigida na cadeia de build

O build executava `scripts/enable-android-immersive.mjs`, que adicionava o modo imersivo à `MainActivity`. No entanto, a etapa seguinte `scripts/install-asset-pack-plugin.mjs` **sobrescrevia integralmente a MainActivity** para registrar a ponte de recursos. Isso apagava todo o código fullscreen.

A RC15 registra `NovaAssetPacks` **dentro da MainActivity existente**, sem substituir os callbacks. O Android recebe `FLAG_FULLSCREEN`, `WindowInsetsController.hide(statusBars|navigationBars)`, layout edge-to-edge, tema fullscreen na abertura e reaplicação nos callbacks `onResume`, `onPostResume` e `onWindowFocusChanged`. A rechecagem registra a visibilidade das barras no `logcat`.

**Limitação inerente ao Android:** as barras do sistema podem ser mostradas temporariamente por gestos do usuário, acessibilidade, permissões ou outras sobreposições do sistema. O jogo não pode bloquear permanentemente o gesto de abrir a bandeja do Android. Ao retornar ao jogo, o modo imersivo volta a ser solicitado.

## QA antes da publicação

- Preflight: testes TypeScript e da política de instalação; geração do projeto Capacitor; verificação de tema Android, plugin nativo e compilação Java `compileDebugJavaWithJavac`.
- Build: APK SHA256 assinado e verificável com mais de 3 bilhões de bytes, contendo os sete ZIPs autênticos sem downloads externos.
- Teste emulador Android 15: desativar Wi-Fi e dados **antes** de abrir, confirmar que a preparação inicia sozinha sem botão, extrair os sete distritos, chegar à tela inicial e confirmar a integridade.
- Teste imersivo: verificar logs Android `statusVisible=false` e `navigationVisible=false`, sair à HOME e retornar, confirmar barras ocultas novamente, e reiniciar após a preparação para verificar menu principal.
- Exige ainda testes físicos no Galaxy A07 / Redmi Note 12s com pouca RAM, espaço e gestos Android reais antes de designar edição estável.

A versão 2.0 é a campanha atual completa, não um aplicativo de entrada com pacotes de expansão. O termo "pacotes" só permanece no código nativo por compatibilidade com dados instalados em versões antigas; não representa produto ou conteúdo opcional.
