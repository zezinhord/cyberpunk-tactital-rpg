# Cyberpunk Tactical RPG

Protótipo inicial de um RPG tático cyberpunk para Android. Esta primeira entrega estabelece a fundação técnica e um pequeno combate demonstrativo; personagens, nomes, valores e regras ainda são provisórios.

## Tecnologias

- React + TypeScript: interface e lógica de aplicação.
- Phaser 4: renderização do campo tático 2D.
- Capacitor 8: empacotamento da aplicação Web como projeto Android.
- Vite: ambiente de desenvolvimento e build.

O núcleo de combate está separado da cena gráfica. A interface envia intenções; o `TurnManager` valida movimento, alcance, ações e turnos. A comunicação de estado usa um barramento de eventos tipado.

## Requisitos

- Node.js 22.12 ou superior.
- npm.
- Para gerar APK: Android Studio e Android SDK instalados.

## Executar no navegador

```bash
npm install
npm run dev
```

Abra o endereço indicado pelo Vite. No campo tático, toque/clique em uma célula verde para movimentar o operativo. O movimento usa caminho ortogonal e consome até 6 células por turno. O ataque corpo a corpo fica disponível quando o inimigo está adjacente. Ao encerrar o turno, a sentinela executa uma ação simples de IA.

## Gerar o projeto Android

A primeira configuração Android é feita uma única vez:

```bash
npm install
npm run build
npm run android:add
npm run cap:sync
npm run cap:open
```

No Android Studio, selecione **Build > Build Bundle(s) / APK(s) > Build APK(s)**. Para gerar pelo terminal, com o projeto Android já criado:

```bash
cd android
./gradlew assembleDebug
```

O APK de depuração costuma ficar em `android/app/build/outputs/apk/debug/app-debug.apk`.

## Estrutura

```text
src/
  components/   Componentes React
  game/         Regras, mapa, eventos e cena Phaser
  App.tsx       Interface principal
  main.tsx      Ponto de entrada
  styles.css    Interface adaptável para celular
capacitor.config.ts
```

## Escopo desta versão

- Campo tático 8x8 com obstáculos.
- Movimentação ortogonal com busca de caminho.
- Orçamento de movimento de 6 células.
- Ataque corpo a corpo com resolução d20 demonstrativa.
- Economia de turno preparada com ação principal, ação bônus e movimento.
- Encerramento de turno e resposta simples da unidade inimiga.
- Interface em português, dimensionada para telas móveis.

Ainda não estão implementados: salvamento persistente, inventário, criação de personagem, campanha, mapas procedurais, cobertura, linha de visão, árvore de habilidades e integração com LLM. Esses sistemas serão adicionados em etapas, mantendo a separação entre apresentação, Rule Engine e serviços externos.

## Observação

Os dados de combate e o cenário desta demonstração são placeholders para validar o fluxo. Não representam ainda o conjunto definitivo de regras ou lore do jogo.
