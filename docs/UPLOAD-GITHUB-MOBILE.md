# Como atualizar o repositório pelo celular — v0.6.5 beta

1. Baixe `Cyberpunk-Tactical-RPG-v0.6.5-beta.zip` e extraia no celular.
2. Abra `github.com/zezinhord/cyberpunk-tactital-rpg` e confirme a branch `main`.
3. Envie os arquivos e pastas extraídos, preservando a estrutura (`src`, `docs`, `public` se houver e `.github`). Substitua os arquivos de mesmo caminho.
4. Faça o commit na branch `main` com a mensagem `Lança v0.6.5 beta — spritesheets, três interiores e Baixada expandida`.
5. Abra a aba **Actions** e entre na execução `Cyberpunk Tactical RPG - Android APK` iniciada pelo commit.
6. Aguarde o workflow concluir. Só considere o APK pronto quando a execução estiver verde e com `Artifacts` disponível.
7. Na parte inferior da execução, baixe `Cyberpunk-Tactical-RPG-APK` e extraia o APK do ZIP do artefato.

O workflow não foi duplicado. Ele define o versionCode Android como 65 e o versionName como 0.6.5-beta; mantenha apenas um workflow Android para evitar duas compilações concorrentes.

## O que enviar

Envie todo o conteúdo do pacote. Não envie o ZIP como um único arquivo e não envie `node_modules`, `dist` ou caches locais.
