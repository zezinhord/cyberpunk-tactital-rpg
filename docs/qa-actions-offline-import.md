# Nova Arcádia 2.0 — entrega Android pelo GitHub Actions

## Por que existe a importação local?

O GitHub Actions conseguiu compilar e assinar o APK QA201, mas uma tentativa de criação de GitHub Release foi recusada com `HTTP 403: Resource not accessible by integration`. Esta funcionalidade oferece um caminho adicional para instalar os **mesmos ZIPs autenticados**, baixados como artefatos do Actions, sem alterar certificados, conceder acesso indiscriminado a arquivos ou inserir bytes artificiais na expansão.

## Instalação no Android (versão com importação local)

1. Abra a página da execução assinada no GitHub Actions (Android QA201).
2. Na seção **Artifacts**, faça download de `NovaArcadia-...-Android-QA201-APK`. O GitHub entrega um ZIP *externo* contendo `app-debug.apk`: extraia-o e instale o APK. Preserve backups JSON da versão anterior.
3. Para cada distrito, baixe o artefato `NovaArcadia-...-Pack-DISTRITO`. **Extraia apenas o ZIP externo**, até obter o arquivo interno `NA20-DISTRITO.zip`.
4. No jogo, abra **Configurações → Conteúdo extra → Importar ZIP local** na linha do distrito correspondente. O seletor nativo mostra os arquivos do dispositivo; selecione o `NA20-DISTRITO.zip` exato, **sem extrair suas imagens**.
5. O instalador verifica o número de bytes, o SHA-256 do arquivo inteiro, a quantidade de obras, os limites de tamanho e a segurança de cada caminho ZIP. Somente então os arquivos entram em uma pasta privada do aplicativo, com substituição atômica da versão anterior e disponibilidade offline.
6. Repita nos outros distritos quando desejar. O jogo base e as missões táticas continuam utilizáveis **sem** esses pacotes; os arquivos adicionais disponibilizam as ilustrações das operações.

**Importante:** a compilação QA201 com o seletor local deve passar por TypeScript, Vite, compilação nativa Java/Gradle e abertura/reabertura do Android antes de ser divulgada como instalável. Código numa branch não equivale a APK publicado.

## Regras de compatibilidade e qualidade

- O identificador Android da família de testes permanece `com.cyberpunk.tacticalrpg.qa201`. O upgrade in-place só é garantido com **a mesma chave de assinatura**.
- Não desinstalar APK antigo sem exportar o save; durante a atualização, usar instalação por cima (`adb install -r` ou o instalador Android sobre a mesma variante).
- Os 3 GB são **a soma verificada do APK e sete ZIPs de distrito**, não um APK único. Durante a extração, há ocupação temporária adicional. O processo recusa operações sem espaço suficiente e não remove recursos do jogador para liberar memória.
- O aplicativo não importa arte de origem desconhecida, arquivos incompatíveis ou ZIPs manipulados: o digest precisa ser igual ao catálogo embutido no próprio APK.
- Faltam testes em aparelhos físicos com menor RAM (Galaxy A07/Redmi Note 12s) para uma edição estável. Os testes no emulador 15/2GB não substituem essa etapa.

## Diagnóstico

- **Nenhuma opção de importar ZIP:** a build instalada ainda não possui a função `NovaAssetPacks.importLocal`; use a build Android QA201 publicada após a integração da funcionalidade.
- **SHA-256 diferente:** foi escolhido ZIP de outro marco/distrito ou download corrompido. Use o pacote que corresponde ao catálogo da versão instalada.
- **Armazenamento insuficiente:** libere espaço suficiente para o arquivo compactado, a extração privada e a margem de segurança; tente novamente.
- **Arquivo de arte não aparece:** confirme no mesmo menu se o distrito está instalado, e se a operação já foi desbloqueada pela narrativa.

As missões e seus registros de XP fazem parte do APK, permanecendo independentes da importação de imagens.