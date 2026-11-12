# Tenebria 3D: Ecos de Ruturam (protótipo Android)

Jogo 3D de fantasia sombria para Android inspirado no **RPG Tenebria Revisado 3.0 (Nano-Dungeon)**. O cenário usa os nomes Obscure, Hasam, Incarnas, Ruturam e Astral presentes no livro; a aventura introdutória, os modelos low-poly, a interface e o áudio são criados para este protótipo. Não inclui imagens nem o conteúdo integral do livro.

**Estado:** protótipo jogável; não é uma adaptação integral do sistema de mesa nem uma versão comercializada. Os testes de D20, Físico/Habilidade/Vigor/Mental e defesa 10 + Vigor + proteção foram simplificados; as progressões, classes, raças, magias e combate completos seguem como tarefas futuras.

## O que já existe

- Mundo 3D explorável em terceira pessoa (acampamento, árvores, ruínas, portal, trilha)
- Joystick virtual para mover, deslizar o dedo na direita para mover a câmera
- Botões **ATACAR**, **TÉCNICA**, **ESQUIVA**, **AÇÃO**, **CURAR**
- Classes **Espadachim Oriental** e **Guerreiro**
- Raças **Humano**, **Anão**, **Abominu** (mecânicas raciais **parciais**)
- Atributos F/H/V/M, rolagens D20, PV/Fadiga/Vontade, inimigos Incarnas
- Missão: falar com Hasam → derrotar três Incarnas → vencer o Guardião → selar a fenda
- Salvamento local, menu, pausa, efeitos sonoros originais
- Renderização **Compatibility/OpenGL**; geometrias procedurais simples, sem downloads externos
- Exportação **APK debug ARM64** no GitHub Actions com verificação de tamanho abaixo de 2 GB

## Como baixar o APK pelo celular

1. Abra a aba **Actions** deste repositório no navegador (e selecione o branch `tenebria-3d-android`, se necessário).
2. Selecione a execução **Tenebria 3D - APK Android** do branch `tenebria-3d-android`.
3. Quando a execução terminar com símbolo verde, em **Artifacts**, toque em `tenebria-3d-android-debug-apk`.
4. Extraia o arquivo `.zip` baixado e abra `Tenebria-Ecos-de-Ruturam.apk` no Android. Confirme a instalação de apps de fonte externa se o sistema solicitar.

Um APK de desenvolvimento é assinado com uma **chave de debug**, ideal para testes privados, **não** para distribuição pela Play Store.

## Controles

| Android (paisagem) | Computador |
|---|---|
| Arrastar joystick esquerdo | WASD / setas |
| Arrastar lado direito da tela | Segurar mouse direito e arrastar |
| ATACAR | J ou clique esquerdo |
| TÉCNICA | K |
| ESQUIVA | Espaço |
| AÇÃO | E |
| CURAR | H |
| Pausa II | Esc / P |

## Tecnologias e configuração

Godot 4.4.1; GDScript; renderer `gl_compatibility`; ARM64-v8a; Android SDK min 24; orientação horizontal. Cena principal `res://scenes/main.tscn`. Não requer conta, internet ou servidor durante o jogo.

## Limitações verificáveis

- O APK ainda deve ser compilado pelo CI e instalado em aparelho real para validar FPS/compatibilidade.
- Não há garantia de 60 FPS em qualquer Motorola: o perfil foi definido para hardware intermediário, não medido em dispositivo.
- A batalha usa D20 e danos simplificados; economia de ações, perícias, inventário completo, campanha extensa e todas as classes do livro **não** foram implementados.
- Ao retornar ao jogo salvo, inimigos comuns podem reaparecer; o avanço da missão continua salvo.
- Não publique o PDF do livro ou suas ilustrações sem autorização do titular.

## Referência da obra

**Tenebria Revisado 3.0** (PDF fornecido pelo usuário). Tópicos consultados: história de Obscure/Ruturam, raças, classes Espadachim Oriental/Guerreiro, atributos, combate e rolagens D20.
