# Nova Arcádia 1.0.0-rc.1 — guia de teste Android (APK integral)

**Estado:** PR de integração em rascunho, pré-lançamento de QA; **não** é 1.0.0 estável.

## Download verificado

- **Release:** https://github.com/zezinhord/cyberpunk-tactital-rpg/releases/tag/nova-arcadia-v100-rc1-full-qa
- **APK direta:** https://github.com/zezinhord/cyberpunk-tactital-rpg/releases/download/nova-arcadia-v100-rc1-full-qa/NovaArcadia-1.0.0-rc.1-Full-1GB-QA.apk
- **Nome:** `NovaArcadia-1.0.0-rc.1-Full-1GB-QA.apk`
- **Tamanho real:** 1.143.067.327 bytes, equivalente a aproximadamente 1,14 GB decimais.
- **SHA-256:** `70f857587019e9d49a0ba3f8f20a982d503452bfb9df22fdb82cdcf7953feb18`
- **applicationId:** `com.cyberpunk.tacticalrpg.qa100`
- **Versão Android:** `1.0.0-rc.1` (`versionCode=1000001`).
- **Código do build:** `82ca799e80c4f7564df9dbed2f7d351ffee5b07e`.
- **Execução verificável:** https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/runs/44236725370

## Instalar pelo celular

1. Antes de qualquer mudança, **abra sua versão anterior** e exporte o arquivo JSON de backup do personagem. Guarde-o fora da pasta de dados do aplicativo (Downloads, armazenamento externo ou nuvem pessoal).
2. Use conexão estável e libere espaço suficiente para o arquivo baixado e o aplicativo instalado; por segurança, reserve mais de 3 GB livres.
3. Acesse a release, toque no arquivo **.apk** de aproximadamente 1,14 GB na seção Assets e aguarde o Android concluir o download. Um ZIP de artefato da CI **não** é a APK.
4. No gerenciador de downloads ou arquivos, abra o `.apk` e autorize a instalação do navegador/gerenciador, caso seja solicitado. Não desative proteções globais do Android para instalar outros arquivos.
5. O aplicativo de teste **Nova Arcádia Final QA** instala ao lado do aplicativo antigo, com dados separados. Não espere que os saves sejam copiados automaticamente.
6. Abra a nova versão, use a opção de **importar backup**, selecione o JSON previamente exportado e confira inventário, origem, classe, habilidades, missões, créditos, honra, XP e posição.
7. Conserve a instalação antiga e o JSON até ter jogado o save importado e comprovado que o novo APK está funcional.

## Teste físico mínimo do PDF de finalização

| Aparelho | Início a frio e loading | 30 min de jogo | Mapa/interiores | Combate, habilidades e saída | Save e importação | FPS/crashes |
|---|---|---|---|---|---|---|
| Galaxy A07 | Pendente | Pendente | Pendente | Pendente | Pendente | Pendente |
| Redmi Note 12S | Pendente | Pendente | Pendente | Pendente | Pendente | Pendente |
| Moto G34 5G | Pendente | Pendente | Pendente | Pendente | Pendente | Pendente |

Testar com personagem novo **e** backup antigo; mudança de distrito, esgoto, NPC, crafting, cura clínica, acesso à arena, vitória e derrota, desbloqueio de habilidade e retorno ao jogo após bloquear/desbloquear a tela. A campanha completa e suas três decisões finais devem ser percorridas antes de qualquer GO para `1.0.0` estável.

## Limites desta versão

- O fluxo Android passou na **CI remota**, incluindo TypeScript, 66 combinações, eventos, finais, backup, compilação Capacitor/Gradle, assinatura, versionamento e auditoria de assets reais.
- A biblioteca sonora original foi **reutilizada de um APK verificado por hash**; não houve preenchimento artificial de tamanho por novas faixas.
- O novo final adiciona três decisões políticas com repercussões e epílogos, porém ainda não completa o confronto de duas fases e as missões A–G do plano definitivo.
- Não existem medições físicas de FPS/memória nem cronometragem de 5–8 horas. A CI não é evidência de jogabilidade estável em Galaxy A07, Redmi Note 12S ou Moto G34 5G.
- A instalação em paralelo possui **identificador diferente** do pacote v0.9.1; para apagar a QA, exporte o backup novamente antes. Instalar uma APK de outra branch com a mesma identificação e assinatura distinta pode falhar.

## Problemas de download e coleta de erros

Se o download mostrar “dados inválidos” ou houver dois arquivos na tela, abra **a página Release**, expanda **Assets** e escolha o arquivo que termina exatamente em `.apk`, não um ZIP automático da CI. Confira o tamanho baixado; se for menor que 1.143.067.327 bytes, o download está incompleto. Não renomeie ZIP para APK.

Relatar: marca/modelo, versão Android, espaço livre, trecho da história, passos exatos, se é save novo/importado e captura da tela. Se a tela travar no loading ou o jogo fechar, preservar o backup e registrar o momento da falha sem reinstalar às cegas.
