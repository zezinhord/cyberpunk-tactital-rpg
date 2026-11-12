# Nova Arcádia — seis origens e apresentação corporal na exploração

## Construção e integração
O repositório já definia seis origens: `corporativo`, `baixada`, `gangue`, `militar`, `pesquisador` e `nomade`. Nenhuma origem foi inventada nesta entrega.

O gerador existente em `tools/generate_character_sprites.py` foi ampliado. Ele preserva os spritesheets anteriores e produz **12 PNGs adicionais**, um para cada par origem/apresentação masculina ou feminina. Os assets são gerados de forma reproduzível durante o `npm run build` e incluídos na APK, sem exigir que arquivos binários derivados sejam versionados no Git. Necessário Python + Pillow para compilação local.

Cada sheet tem 768 × 320 pixels (12 quadros de 64 × 80 em 4 linhas direcionais). Cada direção possui quatro poses de caminhada, duas de ataque, duas de habilidade, duas de dano e duas de incapacitação. A animação de espera reutiliza dois quadros do ciclo de caminhada. **Trata-se de arte procedural de produção inicial, não hand-drawn definitivo.**

O controlador `ActorAnimationController` centraliza estados, direção e troca de textura. Na Baixada e nos interiores, a troca corporal aplica outra textura à instância existente do sprite **sem recriar a cena**, preservando posição e interação. O jogador pode escolher na criação do personagem ou trocar na Central do Protagonista, e a apresentação fica guardada no armazenamento local por personagem; a arena compartilha essa seleção.

**Nenhum atributo, classe, origem ou habilidade depende da escolha corporal.** As seis origens são diferenciadas por roupas e equipamentos: traje sintético e datapad, moletom/bolsa de sinais, braço cibernético, placas táticas, jaleco/scanner e poncho/respirador.

## Revisão de renderização da Baixada
A captura Phaser de 1600×720 da entrega anterior revelou um defeito: janelas flutuavam acima dos telhados. Foi corrigido o sinal do deslocamento vertical: as janelas agora partem da linha do telhado e descem ao longo das fachadas, respeitando a altura do volume. O cenário e a câmera preservam a revisão de circulação e colisões da entrega 0.6.7a.

## Verificações automáticas e limites
- Script Node verifica a existência, assinatura PNG, dimensões e hashes distintos dos 12 sheets.
- O workflow mantém testes de rotas e habilidades, TypeScript/Vite e geração de APK Android.
- O Chromium realiza capturas reais da Baixada e da apresentação feminina, após troca no menu, verificando que o canvas Phaser não foi recriado.
- O atlas de QA `qa/character-matrix.png` apresenta as 12 alternativas, incluindo poses frontal e diagonal.
- Corrida ainda não possui mecânica; por isso nenhum ciclo de corrida é prometido. Ataques, habilidades, dano e incapacitação foram preparados no controlador, mas na exploração aberta não estão conectados a combate — seu uso futuro dependerá da integração dos encontros táticos à campanha.
- Qualidade final das silhuetas, fluidez, desempenho, escala e oclusão **continuam sujeitos ao teste no Android real**; aprovação automática da compilação não valida essas questões.
