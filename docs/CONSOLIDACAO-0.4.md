# Consolidação 0.4 — Criação, origens e arena isométrica

## Implementado

- Tela inicial de criação do protagonista, com nome e seleção entre seis origens.
- Seis prólogos exclusivos, cada um associado ao local de início definido no registro da origem.
- Vantagens passivas e habilidades ativas com efeitos mecânicos no encontro demonstrativo.
- Salvamento do protagonista em `localStorage`, com retomada após reabrir o aplicativo.
- Campo 8 × 8 desenhado em perspectiva 2D isométrica; a busca de caminho e o deslocamento continuam na grade lógica ortogonal.
- Arena chamada **Limbo de Teste**, explicitamente provisória e fora do mapa narrativo definitivo.
- Workflow Android em `.github/workflows/main.yml`.
- Correção de `noUncheckedIndexedAccess` em `src/game/map.ts`.
- Declaração de importação CSS em `src/vite-env.d.ts`.

## Balanceamento inicial das origens

- Corporativo: +1 CA passiva; habilidade de +2 CA temporária.
- Baixada: +3 PV máximos; habilidade de +3 células de movimento no turno atual.
- Gangue: +1 no ataque; habilidade de +3 dano no próximo acerto.
- Militar: +1 CA e +1 no ataque; habilidade de +2 CA temporária.
- Pesquisador: +2 PV máximos; habilidade de +2 no próximo teste de ataque.
- Nômade: +2 PV máximos e +1 movimento por turno; habilidade de +3 células de movimento no turno atual.

Todos os valores acima são provisórios para validar a diferença funcional entre origens. Não são o balanceamento final do sistema.

## Testes executados nesta consolidação

- TypeScript estrito nos módulos de personagem, origem, persistência, mapa e combate: aprovado.
- TypeScript estrito do código React/Phaser com declarações temporárias de tipos de dependências para verificar sintaxe, nomes locais e regras de não utilização: aprovado.
- Teste de fumaça em Node: seis perfis, estatísticas passivas, uso único da habilidade e salvar/carregar/apagar personagem: aprovado.

## Limitação de verificação

A instalação das dependências não pôde ser concluída neste ambiente porque a resolução DNS de `registry.npmjs.org` falhou (`EAI_AGAIN`). Por isso, não foi possível executar `npm run build` com as dependências reais nem compilar o APK aqui. O workflow foi preparado para instalar as dependências e fazer essa validação no GitHub Actions. O sucesso do APK só poderá ser confirmado após uma execução real do workflow no repositório.
