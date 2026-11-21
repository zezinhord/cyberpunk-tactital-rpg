# Nova Arcádia 2.0 — instalação integral do jogo (RC13 QA201)

## Decisão definitiva do produto

Os sete distritos, os dossiês, as cutscenes, as pranchas táticas e a arte das operações Vigília, Refúgio e Nexo **fazem parte do jogo base**. Não são conteúdo extra, DLC, pacote premium ou módulo opcional. A RC13 troca o menu de baixar/remover extras por um **instalador obrigatório de Nova Arcádia completa** e por uma tela de integridade dos arquivos.

### Fluxo Android

1. Instalar o APK RC13 QA201 por cima da variante QA201 anterior, sem desinstalar. Saves, XP, equipamentos e missões continuam nos diretórios privados.
2. Ao abrir, antes de iniciar a campanha, o jogo verifica, via plugin Android, se os sete distritos estão presentes e se seus recibos correspondem ao catálogo de SHA-256 embutido.
3. Caso faltem dados, a tela `Instalação do jogo completo` indica o tamanho, espaço livre, progresso e sete regiões obrigatórias. **Um único toque** em `Instalar Nova Arcádia completa` provisiona sequencialmente os distritos faltantes.
4. O downloader usa apenas um release GitHub conhecido: `nova-arcadia-v200-final-3gb-assets`, publicado e auditado previamente, sem URLs fornecidas pelo usuário. O arquivo de cada distrito deve corresponder ao tamanho e SHA-256 publicado. A extração mantém limites de tamanho, lista de extensões permitidas e proteção contra caminhos que escapam da pasta privada.
5. Após todos os sete comprovados, a tela inicial aparece e a campanha pode ser usada **offline**. Não há botão de pular ou de remover distritos.
6. Se faltar conexão ou ocorrer falha, o jogador recebe erro recuperável e pode tentar novamente. A função secundária `Importar arquivo oficial sem internet` aceita arquivos ZIP de backup mediante validação idêntica, sem transformar a instalação em DLC.
7. O menu `Arquivos do jogo` apresenta o estado de integridade do conteúdo e permite revalidar/reparar a instalação, sem apagar progresso ou tratar distritos como opcionais.

### Contrato de integridade

- **7 distritos, 4 interiores por distrito, 544 imagens por distrito, 3.808 imagens originais distintas.**
- Exatos 9 tipos por distrito: 4 murais, 12 objetos, 48 dossiês, 64 cenas, 96 simulações, 80 rotas, 64 escoltas, 80 abrigos e 96 quadros da rede Nexo.
- Rejeitar catálogo desconhecido, incompleto, duplicado ou cujo tamanho do APK de referência + ZIPs não alcance 3.000.000.000 bytes.
- Instalação de um distrito exige comprovante privado assinado pelo digest SHA-256 do arquivo e tamanho de dados instalados compatível com o catálogo. Em reinicializações e upgrades, o plugin devolve URI privada do arquivo existente, evitando transferência repetida.
- Só há progresso de jogo após `hasInstalledEntireGame` retornar verdadeiro. O app web/PWA pode ser executado em ambiente de desenvolvimento sem o instalador nativo.

### Por que não existe um único APK de 3,26 GB?

A distribuição atual é por GitHub e Android sideload, não por Google Play Asset Delivery. O pacote publicado RC11 mede aproximadamente 3,26 GB no total: APK mais sete arquivos de recurso de vídeo/imagem. O GitHub possui limite por arquivo de release e a instalação de APKs desse tamanho não seria segura ou compatível em vários dispositivos. Por isso os arquivos continuam separados **apenas no transporte técnico**, mas são instalados como dados **obrigatórios de uma única aplicação**, sem escolha opcional por distrito.

Isso **não equivale a afirmar** que todos os bytes já estão dentro do APK. A primeira instalação necessita rede (aproximadamente 2,11 GB de dados), ou os arquivos oficiais previamente baixados. Recomenda-se Wi-Fi e espaço livre suficiente para arquivo compactado, cópia temporária, expansão e margem de segurança. Em aparelhos Android de pouca capacidade, a verificação bloqueia instalações sem espaço em vez de corromper o save.

Para uma futura distribuição Play Store, pode-se avaliar Android App Bundles com Play Asset Delivery para anexar conteúdo durante a instalação gerenciada pela loja. Não aplicar esse modelo ao sideload sem a infraestrutura apropriada.

### Verificação e entrega

- Testes lógicos: `scripts/test-integrated-game-install-v20.mjs`, 3.808 SHA-256 únicos, 7 distritos, 9 famílias, sem pular a instalação.
- Teste do WebView: `scripts/test-android-integrated-install.mjs`, confirma que o APK RC13 abre o instalador obrigatório sem entrar no menu prematuramente, inclusive após o reinício da Activity.
- Compilação: `.github/workflows/na-rc13-complete-game-release.yml`, assinatura QA201, verificações de conteúdo, TypeScript, Vite, Android Gradle e inicialização.
- Antes de chamar a versão de **estável**, realizar instalação integral física sob Wi-Fi/móvel, uso de armazenamento, resiliência após cancelamento, desempenho de exploração e batalha em Galaxy A07, Redmi Note 12s e outros dispositivos reais.

Os 3,26 GB não são inflados com áudio novo ou padding. Os ZIPs de arte são reutilizados byte-a-byte da publicação RC11 autenticada.
