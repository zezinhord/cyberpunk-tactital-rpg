# Nova Arcádia RC14 — APK único, 3 GB reais, sem conteúdo para baixar depois

## Corrige o problema observado pelo jogador

A RC13 tinha um **APK de 1,144 GB**, e os demais **2,114 GB eram transferidos na primeira execução**. Embora esses conteúdos fossem obrigatórios e vinculados à campanha, não estavam presentes no download inicial.

A RC14 é diferente. O APK **contém fisicamente os sete ZIPs oficiais com 3.808 arquivos artísticos únicos** em `assets/na-game/`. Eles são parte da instalação do próprio Android, assinada junto com o aplicativo. Na primeira abertura, o plugin extrai cada arquivo do APK para o armazenamento privado, verifica seu tamanho e SHA-256 oficial e disponibiliza os recursos para exploração, missões e cutscenes. Nenhum distrito é escolhido ou baixado como DLC. O processo é inteiramente offline.

## Segurança e compatibilidade

- O APK RC14 é produzido usando o mesmo certificado QA201 das versões anteriores para permitir atualizar sem perder salvamentos; versionCode `2000014`.
- A compilação verifica cada ZIP embutido no APK, byte a byte contra o manifesto RC11/RC13. Rejeita arquivos ausentes e assinaturas erradas.
- A rotina nativa de extração bloqueia `../`, entradas repetidas, sobre-expansão ZIP e escrita fora do diretório privado. A atualização usa instalação atômica com preservação da versão anterior.
- Os recursos originais não são reconstruídos ou inflados artificialmente para alcançar 3 GB. Não há recursos fictícios.
- O GitHub Releases limita um asset a 2 GiB; por isso um APK único de 3,26 GB não pode ficar no mesmo tipo de link de release da RC13. A RC14 usa **um artefato único do GitHub Actions**, com `skip-archive: true`, disponível para download individual na página da execução.
- O Android precisa de espaço extra para armazenar o APK instalado e extrair os arquivos de arte. Não basta ter apenas 3,26 GB livres. Reserve vários gigabytes de margem; alguns dispositivos mais modestos poderão ter problemas de instalação. Antes de declararmos versão final, é obrigatório confirmar a instalação e os FPS em aparelhos físicos.

## QA automatizada exigida

1. Build Vite/TypeScript, testes de campanha, classes e narrativas.
2. Conferência de todo o material original e assinaturas SHA-256 dos 7 arquivos.
3. APK compilado pelo Gradle com tamanho **>=3.000.000.000 bytes**, sete arquivos incorporados em `assets/na-game/`, mesma chave de assinatura QA201.
4. Instalar o arquivo em um emulador Android 15. Desligar Wi-Fi e rede móvel. Abrir, selecionar **Preparar o jogo completo — sem baixar mais nada**, verificar até os sete distritos terminarem. Confirmar o menu inicial e reinicialização.
5. Somente após esse teste, publicar o APK integral como artefato único. O antigo RC13 permanece disponível caso este caminho de instalação se mostre incompatível.

Workflow: `.github/workflows/na-rc14-single-apk-owner-build.yml` (branch que possui a chave original, compilando a fonte `feature/nova-arcadia-single-download-apk`).
