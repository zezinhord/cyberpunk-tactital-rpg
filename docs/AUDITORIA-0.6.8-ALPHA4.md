# Auditoria de erros e estabilização — Nova Arcádia 0.6.8-alpha.4

**Base auditada:** 0.6.8-alpha.3 Mercado dos Cabos (`c1de31a5`)
**Branch corrigida:** `feature/landscape-mobile-v1`; `main` continua preservada.
**Natureza:** correções de bugs e testes, sem ampliar o mapa ou criar regras narrativas não aprovadas.

## Principais problemas encontrados e corrigidos

| Prioridade | Problema reproduzível no código | Correção | Verificação |
|---|---|---|---|
| Alta | `isInside()` aceitava valores fracionários e a camada física considerava certos destinos não inteiros livres | Exige coordenadas inteiras e dentro da grade, inclusive ao salvar posição | `test-baixada-collisions`, `test-world-location` |
| Alta | Ao tocar um NPC ambulante distante, o NPC podia voltar a caminhar antes do protagonista alcançar a posição, fazendo a interação desaparecer silenciosamente | Congelamento de rota somente durante aproximação e liberação após interação/abandono | Código da cena Phaser + regressão geral de NPCs; interação física pendente |
| Alta | Uma rota já planejada interrompia toda a caminhada ao encontrar NPC que entrasse no próximo passo | Tentativa limitada de recalcular rota livre desde a posição atual, mantendo a proibição de atravessar sólidos | `test-baixada-collisions` e testes de rotas; validação física pendente |
| Alta | O salvamento do prêmio de V-09 podia marcar a vitória antes de gravar +15 XP, causando perda ou duplicação após falha na gravação | XP e marcador idempotente de recompensa passam a compor um único save do protagonista; marco narrativo é reconciliado ao carregar | `test-story-v09`, `test-class-saves` |
| Média | Saves com nível fracionário ou negativo eram aceitos por validação apenas de tipo | Rejeição de nível e XP inválidos | `test-class-saves` |
| Média | Derrota e vitória no confronto V-09 exibiam textos do Limbo de Teste | Mensagens, registros, painel de inimigo e dicas contextualizados pelo encontro | Compilação + captura geral; textos de derrota requerem teste dirigido |
| Média | Falha da captura Chromium podia ser ocultada por `continue-on-error: true` e a build permanecer verde | Falha de QA visual agora reprova a build após tentativas de inicialização | Workflow GitHub Actions |
| Baixa | Log de teste de NPCs continuava indicando "3 rotinas" embora o mapa já tivesse cinco | Contagem calculada diretamente do catálogo | `test-npc-routines` |

## Sistemas preservados
- Setores Baixada Central, Pátio do Reúso e Mercado dos Cabos, com mesma planta, prédios, NPCs e pontos de missão.
- Onze classes jogáveis, habilidades de classe e seis origens narrativas separadas.
- Missão O Nome que Sumiu, V-09, nova investigação da feira, confiança comunitária e atenção da segurança.
- Salvamentos existentes: `questRewards` inexistente em saves anteriores é normalizado para `[]`. Vitórias V-09 antigas são consideradas recompensadas para não duplicar 15 XP.
- APK landscape e fluxo de build pelo Capacitor + GitHub Actions.

## Testes executados pelo workflow
Testes de colisões e portas; layout e conectividade dos três setores; estados e rotas dos NPCs; diálogo e persistência; variantes 66× origem/classe; efeitos das onze habilidades; prêmio V-09 idempotente; áudio; geração de sprites; TypeScript e Vite; screenshot/QA de navegação Chromium; Gradle `assembleDebug`.

**Observação:** aprovação de testes geométricos e de screenshot não equivale a testes completos no aparelho físico. NPC móvel pode interagir com animações, latência e toques de modo distinto no Android real.

## Pontos pendentes encontrados na auditoria

1. **Teste real de Android:** navegação com toques repetidos, congelamento de NPC, 60/30 FPS, áudio e fluxo V-09 em celulares físicos ainda precisam ser exercitados.
2. **Reprodutibilidade de dependências:** o repositório tem `package.json` sem `package-lock.json`. `npm install` pode resolver diferentes versões transitivas no futuro. Não alterado nesta correção para evitar atualizar dependências sem revisão de compatibilidade e sem artefato de lock validado.
3. **Um único slot de protagonista:** Novo Jogo avisa que o salvamento principal será substituído. Não existe interface de múltiplos slots ou backup/exportação; preservar o armazenamento antes de reinstalar, limpar dados ou substituir jogo.
4. **Persistência ampliada de combate:** Vida/dano residual não é carregado entre combates; a arena reutiliza os atributos/equipamento, mas o histórico médico ainda não integra a exploração. É limitação de design a resolver, não teste aprovado.
5. **Desempenho gráfico:** ainda não há profiling real em Android de entrada, e os sprites de alguns NPCs são reutilizados. O jogo está visualmente verificável em Chromium, mas não otimizado com métricas de GPU/energia.
6. **Profundidade narrativa das origens:** os prólogos individuais existem; as áreas iniciais distintas e consequências prolongadas por origem ainda exigem implementação.

## Roteiro manual proposto no aparelho
- Com o personagem salvo, deslocar-se por um caminho longo e deixar um NPC entrar na rota. Verificar desvio seguro e ausência de teleporte.
- Tocar em Lia/Iza/Tomás quando se movimentam, observar que param até a conversa abrir.
- Entrar e sair de clínica/oficina/galeria, caminhar até Pátio e Mercado; retornar sem perder posição.
- Concluir V-09 e fechar o app imediatamente após a vitória; reiniciar, verificar **somente +15 XP** e encontro não repetível.
- Testar derrota em V-09 para confirmar que a missão continua disponível, sem vitória falsa.
- Alterar apresentação corporal e classes nos casos suportados e verificar controles landscape.

**Regra de aprovação:** o workflow deve ter testes, QA navegador e Gradle bem-sucedidos. QA Android físico permanece uma etapa explicitamente separada.
