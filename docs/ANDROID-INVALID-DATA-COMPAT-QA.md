# Nova Arcádia Android — APK integral acima de 1 GB sem colisão de assinatura

## Evidência confirmada
Build #865 SHA-256 certificado cb8a4e8c5c17d326e7ad0a08bbb90cd50eaf2d4ecfda59bf300784361eb44eb6.
Build #868 SHA-256 certificado d21edda496e673346f40ebfb745e1eaf2da82ca6a3a3f72cd5bbac7e780dfa96.
Builds #873 e #879 SHA-256 certificado 1c431697610870e632690553a1497f2fb8ff94a641eb68e92043b46a712835eb.
Esses APKs compartilham o pacote com.cyberpunk.tacticalrpg e não podem
atualizar instalações assinadas por certificados distintos.

## Entrega completa
O APK original de 1,14 GB segue disponível. A variante FULL-1GB-QA utiliza
com.cyberpunk.tacticalrpg.qa para que o Android a instale ao lado do app antigo,
sem exigir exclusão dos dados anteriores. Nenhum recurso é cortado.
Ela mantém:
- 112 ambientes de seis minutos usados pelo diretor de áudio;
- 28 ambiências originais e 56 composições de rádio originais;
- 7 distritos, campanhas, classes, técnicas e progressão;
- 12 spritesheets de protagonista, 17 ou mais NPCs e arena SVG.
O CI audita integridade SHA-256, 112 arquivos referenciados e mais de
1.000.000.000 bytes **dentro do novo APK**, não no ZIP de artifact.
O canal 0.9 tem certificado travado para evitar rotação silenciosa.

## Salvamentos e instalação
Os dados do app principal e do app QA são separados pelo Android.
Não desinstalar o original antes de exportar seus saves. A importação entre
os aplicativos requer backup JSON manual quando disponível.
A versão Lite de 291 MB foi apenas uma tentativa diagnóstica histórica; não
deve substituir a entrega integral solicitada.
Teste físico Android ainda necessário.
