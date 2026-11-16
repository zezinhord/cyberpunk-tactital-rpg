# Nova Arcádia no iPhone — primeiro pacote iOS

## O que está implementado

A branch `feature/ios-unsigned-ipa-v077` compila o MESMO jogo da candidata v0.7.7 (cutscene de oito cenas, diálogos visuais, Baixada, mapas, missões e áudio offline) para **iOS**, usando Capacitor 8, macOS e Xcode no GitHub Actions. Nenhuma parte do projeto Android é apagada e a `main` não é modificada.

O workflow `.github/workflows/ios-ipa.yml` monta o projeto iOS temporariamente, sincroniza o bundle de produção, limita o app a **landscape** e produz `NovaArcadia-iPhone-v077-SEM-ASSINATURA.ipa`.

## Aviso de instalação: assinatura Apple

**IPA sem assinatura não é instalável diretamente tocando no arquivo no iPhone.** Para instalar em um iPhone normal é necessário assinar o binário e obter um provisioning profile apropriado. Alternativas:
- Apple Developer + **TestFlight** (via App Store Connect) para distribuir aos testadores;
- certificado e perfil de desenvolvimento/ad hoc vinculados ao dispositivo, instalados por Xcode/Apple Configurator;
- ferramentas de assinatura e instalação local operadas pelo próprio usuário (não garantem compatibilidade e não são o caminho de publicação).

Um IPA não assinado é um **artefato de engenharia para assinatura posterior**, não uma versão pública instalável.

## Como obter o arquivo

Abra [GitHub Actions](https://github.com/zezinhord/cyberpunk-tactital-rpg/actions), escolha **Build Nova Arcadia iPhone IPA (unsigned)**, abra a execução verde da branch iOS e baixe **NovaArcadia-iPhone-IPA-UNSIGNED** em *Artifacts*. Extraia o ZIP para localizar o `.ipa`.

## Compatibilidade e limites

- Construído com SDK de dispositivo iOS e `@capacitor/ios` 8; requer o iOS mínimo da versão instalada do Capacitor.
- Sem simulação de interface no iPhone real, sem certificado de assinatura configurado e sem validação de FPS/memória em hardware.
- O `WKWebView` iOS pode diferir do `WebView` Android na reprodução de Ogg/Opus e no armazenamento: **áudio e saves precisam ser testados no aparelho**.
- Salvamentos Android são locais, não migram automaticamente para iPhone; use os backups JSON já previstos no jogo.
- Antes de divulgar, avaliar tamanho da IPA, bugs de toque e configurações de áudio no Safari/WKWebView.

Se houver conta Apple Developer e certificado/perfil, a próxima etapa é configurar assinatura e distribuição TestFlight. Nunca disponibilize `p12`, senhas ou certificados em commits públicos.
