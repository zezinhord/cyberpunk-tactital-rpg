# Fontes do projeto

| Família | Uso | Situação |
|---|---|---|
| IBM Plex Mono 400 | Registros do Éden | **Incluída** (`IBMPlexMono-Regular.woff`) |
| Chakra Petch 600 e 700 | Títulos, botões e números | **Pendente**, usa fonte alternativa |
| Barlow Semi Condensed 400 e 600 | Textos e interface | **Pendente**, usa fonte alternativa |

## IBM Plex Mono

Arquivo original: IBM Plex Mono Regular, versão 2.3, © 2017 IBM Corp., licença SIL Open Font License 1.1 (`IBMPlexMono-OFL.txt`). A única mudança foi o formato do contêiner (TTF para WOFF): nenhum glifo foi alterado nem removido.

## Como integrar as fontes pendentes

1. Obtenha os arquivos oficiais (Google Fonts, licença OFL) em formato `.woff2`.
2. Coloque-os nesta pasta com **exatamente** estes nomes:
   - `ChakraPetch-SemiBold.woff2`
   - `ChakraPetch-Bold.woff2`
   - `BarlowSemiCondensed-Regular.woff2`
   - `BarlowSemiCondensed-SemiBold.woff2`
3. Guarde também o arquivo de licença OFL de cada família ao lado das fontes.
4. Em `fonts.css`, remova os comentários dos blocos `@font-face` correspondentes.

Nenhuma outra mudança de código é necessária: `src/styles.css` já lista as famílias em `--display` e `--body`.
