# Módulo 0.3.0 — Personagens e Habilidades (Limbo de Teste)

## Escopo e compatibilidade

Esta denominação é a versão do **módulo experimental**, não uma redução da versão geral do aplicativo. O projeto React/Phaser/Capacitor e a branch de desenvolvimento existentes foram preservados. Não houve mudança de motor de jogo nem inclusão de dependências.

A Bíblia Visual da Nova Arcádia orienta sprites vetoriais estilizados 2D (128 × 192 px, ancoragem próxima aos pés), contornos legíveis em celulares, perspectiva isométrica e política de cor funcional. Verde permanece exclusivo da IA Éden; as habilidades deste protótipo não são oficialmente canônicas.

## Área jogável de teste

O Limbo continua separado da Baixada, acessível pela Central do Protagonista. Dois sprites vetoriais próprios (Operativo de Campo em apresentação masculina e feminina) usam a **mesma ficha**, HP, ataque, defesa, inventário e habilidades. A opção é lembrada localmente por personagem, sem modificações no save geral. A sentinela também recebeu sprite vetorial.

O Phaser usa imagem vetorial rasterizada pelo loader e efeitos/tweens para espera (oscilação), deslocamento pelo grid, ataque, impacto, dano e ativação tecnológica. Os sprites se movem sobre o grid 8 × 8 existente. Não há rig esquelético nem animação quadro a quadro completa nesta entrega.

## Habilidades técnicas funcionais

| Poder | Custo | Efeito | Recarga | Condição |
|---|---:|---|---:|---|
| Pulso Eletromagnético | 3 energia | 5 dano garantido; bloqueia 1 ação da sentinela | 2 turnos completos | inimigo a até 3 células |
| Barreira de Energia | 3 energia | +3 Defesa por 2 ações inimigas | 3 turnos completos | sem barreira ativa |
| Protocolo de Regeneração | 4 energia | recupera até 7 Vida | 3 turnos completos | protagonista ferido |

O Operativo inicia com 10/10 energia. Recupera 2 ao iniciar cada turno, limitados ao máximo. As três técnicas consomem a ação principal. A ficha de definição permite novos tipos, alcance, duração, área, desbloqueio por arquétipo/nível, visual e evolução futura (os ranks ainda não foram implementados). A IA continua reagindo no turno hostil, exceto quando bloqueada pelo EMP.

O terminal âmbar no grid (0,6) recupera até 3 energia **uma única vez por tentativa**, quando acionado de uma célula adjacente e desde que haja energia faltando. Serve para validar interação contextual com objeto.

## Verificação de desempenho e funcionamento

O workflow executa `node --experimental-strip-types scripts/test-abilities.mjs`, `npm run build`, geração do Android com Capacitor e `gradlew assembleDebug`. Testes determinísticos cobrem dano, energia, bloqueio, proteção e expiração, cura, indisponibilidade e alcance. A validação de compilação não equivale à inspeção de FPS ou de animação em aparelho real.

## Roteiro de QA no Android

1. Abrir o menu inicial; continuar um personagem e acessar a Baixada.
2. Pela Central do Protagonista, em Configurações, escolher Limbo de Teste.
3. Alternar apresentações masculina e feminina **sem reiniciar combate**; confirmar aparência do sprite e mesmos valores numéricos.
4. Mover tocando no grid, conferir oscilação de espera e movimento.
5. Aproximar-se da sentinela e usar ataque básico; confirmar HP caindo e feedback.
6. Usar EMP a até 3 células, conferir 5 dano, energia -3, recarga e perda de ação hostil.
7. Usar barreira, encerrar turnos, conferir CA +3 e expiração após duas ações hostis.
8. Sofrer dano; usar regeneração, conferir +7 Vida limitado ao máximo, custo -4 e recarga.
9. Usar o terminal âmbar (0,6) para recuperar energia uma vez.
10. Reiniciar a arena, voltar à Baixada e conferir funcionamento das outras telas.
11. Verificar interface landscape em aparelhos com recortes e alturas diferentes.

## Limitações ainda abertas

- Artes são do **arquétipo piloto Operativo de Campo**, ainda não das seis origens nem de cada classe futura; a Baixada usa os sprites existentes.
- Animações usam tweens 2D e feedback visual; não são spritesheets completos de corrida/combate por direção.
- Não foram integrados os poderes propostos de Investida Cibernética, Sobrecarga Neural ou Interferência Éden.
- O Limbo segue uma simulação separada, não um encontro de campanha. A escolha de corpo ainda é feita no Limbo, não na criação definitiva do protagonista.
- Ainda é necessária validação visual, de gesto, desempenho e da experiência no Android físico antes de considerar a arte aprovada.
