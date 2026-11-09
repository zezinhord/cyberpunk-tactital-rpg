# Como atualizar o repositório pelo celular

1. Extraia `Cyberpunk-Tactical-RPG-v0.4.1.zip` no celular.
2. Abra o repositório `cyberpunk-tactital-rpg` no GitHub e confirme que está na branch `main`.
3. Envie os arquivos da pasta extraída para o repositório, preservando as pastas (`src`, `docs` e `.github`). Quando o GitHub perguntar, substitua os arquivos com o mesmo caminho.
4. **Muito importante:** substitua também `.github/workflows/main.yml`. É esse arquivo que atualiza o processo de geração do APK. Não deixe um segundo workflow compilando o mesmo artefato.
5. Faça o commit na branch `main`.
6. Abra **Actions**. O workflow `Cyberpunk Tactical RPG - Android APK` deve iniciar.
7. Quando a execução terminar com sucesso, abra a execução, localize **Artifacts** e baixe `Cyberpunk-Tactical-RPG-APK`.

O APK anterior não é alterado. Cada build cria um artefato novo.

## Arquivos que devem ser enviados

O pacote 0.4.1 contém a base 0.4 com a identidade visual da Fase 1 integrada, incluindo `package.json`, `index.html`, `src/`, `docs/` e `.github/workflows/main.yml`. Não envie `node_modules` ou `dist` (não fazem parte do pacote). Preserve arquivos particulares que existam no seu repositório e não estejam neste pacote.
