# Nova Arcádia Android — instalação segura em dispositivos com “Dados inválidos”

## Diagnóstico
Certificados reais da APK, verificados com apksigner:
- Workflow #865: cb8a4e8c5c17d326e7ad0a08bbb90cd50eaf2d4ecfda59bf300784361eb44eb6
- Workflow #868: d21edda496e673346f40ebfb745e1eaf2da82ca6a3a3f72cd5bbac7e780dfa96
- Workflow #873 e #879: 1c431697610870e632690553a1497f2fb8ff94a641eb68e92043b46a712835eb

Todos usam com.cyberpunk.tacticalrpg; Android proíbe updates por certificado diferente.
Hash SHA-256 publicado do APK 0.9.0-rc.2 completo:
b347876690916e37480b9d9a562aaaa0b3ea957b25e668a837ead8bce9d6af45.
A cópia local pode estar incompleta apesar de release íntegra.

## Correção técnica
O certificado QA versão 0.9 está pinado e a publicação passa a falhar se uma
chave nova surgir por perda de cache.
Para testar o jogo sem apagar o aplicativo anterior, o CI também entrega
Nova Arcádia Android Compat, com ID com.cyberpunk.tacticalrpg.qa.
O projeto Android gerado conserva namespace e classe MainActivity originais,
mas publica um applicationId próprio, com app_name Nova Arcádia QA.

A variante Compat inclui exploração, combate tático SVG, 12 modelos de
protagonista, 17 NPCs, 56 trilhas originais, 28 ambiências e progressão.
Os 112 Ogg adicionais do APK de 1GB são excluídos do instalador
experimental. O AudioDirector mantém fallback para áudio anterior.

Importante: os dados do app QA são separados dos dados do app original.
Não é possível migrá-los automaticamente com armazenamento privado do Android.
Exporte um backup JSON pelo menu e importe no app novo quando viável.
**Não desinstale o original para instalar a variante.**
Nenhum teste físico foi realizado ainda. Se a variante menor também falhar,
verificar integridade do download, Android e espaço de armazenamento.
