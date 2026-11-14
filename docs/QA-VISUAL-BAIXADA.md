# QA visual automatizado — Baixada

O workflow Android agora tenta, **somente no push**, abrir a versão Vite no Chromium headless em landscape 1600x720. Sem adicionar dependências ao projeto, o script usa Node WebSocket + DevTools Protocol para realizar: menu inicial → Novo jogo → criação → prólogo → exploração. Captura uma imagem real da tela renderizada por React/Phaser, além das dimensões do canvas e exceções da página.

**Artefato opcional:** `Baixada-Visual-QA-1600x720` com `baixada-1600x720.png` e `baixada-metricas.json`. O teste só confirma que a página é renderizada; aprovação estética e colisões percebidas continuam exigindo inspeção do PNG e testes no Android.

O passo é `continue-on-error` para não impedir a geração da APK se o navegador do runner faltar ou se ocorrer uma falha de automação. Nesse caso, a ausência do artefato deve ser informada e investigada; não significa que a validação visual passou.

Esta captura não equivale à renderização Android/Capacitor: aparelho físico continua obrigatório para FPS, recortes, barras do sistema e gestos.
