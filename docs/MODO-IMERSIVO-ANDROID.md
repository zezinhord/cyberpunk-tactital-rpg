# Modo imersivo Android — Nova Arcádia

## Implementação

O projeto Android é gerado do zero em cada GitHub Actions. Após Capacitor, o fluxo aplica dois scripts:

1. lock-android-landscape.mjs: mantém a MainActivity em paisagem.
2. enable-android-immersive.mjs: modifica apenas a MainActivity gerada para ocultar barras do sistema.

Em Android 11+ usa WindowInsetsController.hide(WindowInsets.Type.systemBars()) e BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE; em Android 10 ou anterior usa IMMERSIVE_STICKY com layout fullscreen. Gestos de borda continuam disponíveis.

O modo é reaplicado em onCreate, onResume e após retorno do foco. Em API 28+, o recorte é tratado como short edges; API 30+ usa setDecorFitsSystemWindows(false). O frontend usa viewport-fit=cover e CSS env(safe-area-inset-*).

## Verificação necessária no aparelho

- Abrir APK e verificar status e navegação ocultos.
- Deslizar das bordas para revelar controles temporários.
- Abrir notificações e retornar, recuperar foco e conferir layout.
- Testar paisagem com recorte físico nas duas orientações.
- Verificar diálogos, menu e botões em tamanhos variados.

Gradle compilado não substitui validação real. Fabricantes e modos de navegação podem ter diferenças.

Referência: https://developer.android.com/develop/ui/views/layout/immersive
