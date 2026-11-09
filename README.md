# Cyberpunk Tactical RPG — Protótipo consolidado

Protótipo mobile-first de RPG cyberpunk, construído com React, TypeScript, Phaser 4, Vite e Capacitor 8. Esta versão acrescenta criação e salvamento do protagonista, seis origens jogáveis em nível demonstrativo, seis introduções individuais, vantagens mecânicas e um campo tático 2D isométrico de teste.

## O que já funciona nesta versão

- Criação do protagonista com nome e escolha de uma das seis origens.
- Introdução narrativa exclusiva para cada origem, com local inicial, objetivo, contato e primeiro indício do Projeto Éden.
- Vantagens passivas aplicadas aos parâmetros do combate.
- Uma habilidade ativa própria de cada origem, utilizável uma vez por encontro.
- Salvamento local do personagem no dispositivo/navegador, com opção de continuar ou criar outro protagonista.
- Arena provisória chamada **Limbo de Teste**, em perspectiva 2D isométrica, com grade lógica 8 × 8, obstáculos, deslocamento e combate por turnos.
- Workflow do GitHub Actions para compilar e publicar o APK debug como artefato a cada push na branch `main`.

## Vantagens mecânicas provisórias

| Origem | Vantagem passiva | Habilidade de origem |
|---|---|---|
| Ex-funcionário corporativo | +1 Defesa (CA) | Credencial arquivada: +2 CA até a ação inimiga |
| Habitante da Baixada | +3 Vida máxima | Rotas locais: +3 células de movimento neste turno |
| Ex-integrante de gangue | +1 no ataque | Reconhecimento clandestino: +3 de dano no próximo acerto |
| Veterano militar | +1 Defesa e +1 no ataque | Protocolos operacionais: +2 CA até a ação inimiga |
| Pesquisador | +2 Vida máxima | Leitura de anomalias: +2 no próximo teste de ataque |
| Nômade urbano | +2 Vida máxima e +1 movimento por turno | Rotas não catalogadas: +3 células de movimento neste turno |

Os efeitos são implementações iniciais para testar a distinção entre as origens. Os valores podem ser revisados no balanceamento do sistema.

## Executar localmente

Requisitos: Node.js 22.12 ou superior e npm.

```bash
npm install
npm run dev
```

Para validar compilação e TypeScript:

```bash
npm run build
```

## APK pelo GitHub Actions

O workflow está em `.github/workflows/main.yml`. Ele executa automaticamente em novos commits na branch `main` e também pode ser iniciado manualmente pela aba **Actions**.

Passos realizados pelo workflow:

1. Instala Node.js 22 e Java 21.
2. Instala dependências com `npm install`.
3. Executa TypeScript e Vite com `npm run build`.
4. Cria o projeto Android via Capacitor caso `android/gradlew` não exista.
5. Executa `npx cap sync android` e `assembleDebug`.
6. Publica `app-debug.apk` no artefato `Cyberpunk-Tactical-RPG-APK`.

O APK antigo não é alterado. Cada execução bem-sucedida gera um novo artefato para download. A pasta `.github/workflows/` deve ser mantida no repositório. Se já houver um workflow Android antigo em `main.yml`, substitua-o pelo arquivo desta versão; evite deixar dois workflows compilando o mesmo APK em duplicidade.

## Salvamento

O personagem é salvo em `localStorage` com a chave `cyberpunk-tactical-rpg.character.v1`. O salvamento é local ao dispositivo/navegador; ainda não há sincronização entre aparelhos nem salvamento de posição, inimigos ou estado completo do combate.

## Arena de teste

**Limbo de Teste** é um mapa de validação sem vínculo definitivo com os distritos ou com a campanha. A movimentação permanece ortogonal na grade lógica, mas as células são projetadas em perspectiva isométrica para renderização. Arte de personagens, cenário detalhado, cobertura e linha de visão ainda serão refinados.

## Estrutura relevante

```text
.github/workflows/main.yml
src/
  App.tsx
  components/Battlefield.tsx
  game/
    BattleScene.ts
    TurnManager.ts
    map.ts
    character/
      gameplay.ts
      introductions.ts
      origins.ts
      storage.ts
      types.ts
```

## Limitações desta entrega

- Não inclui sincronização de save na nuvem.
- Não inclui classes, árvores de habilidades, inventário completo ou progressão de atributos.
- As vantagens mecânicas e os valores de combate ainda precisam de balanceamento.
- As seis introduções estão implementadas em texto e ainda não têm cenas cinemáticas animadas.
- O mapa Limbo é uma arena de teste; não é o mapa aberto de Nova Arcádia.
- A grade mantém movimentação ortogonal por regra, embora seja desenhada em perspectiva isométrica.
