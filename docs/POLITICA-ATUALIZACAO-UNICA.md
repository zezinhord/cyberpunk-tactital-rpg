# Política de atualização única — Nova Arcádia

**Em vigor desde 17/11/2026.** A partir desta decisão, existe exatamente **um canal Android recomendado para testes**.

## Fonte única

- Branch ativa: `feature/nova-arcadia-expansion-v080`. Não continuar desenvolvimento em versões históricas.
- Versão atual de referência: `0.8.1-rc.2`; próxima evolução deve incrementar `package.json` e `package-lock.json` antes de gerar o APK, bem como scripts/auditorias que contenham a versão.
- APK canônico: **`NovaArcadia-Android-atual.apk`**.
- URL permanente: `https://github.com/zezinhord/cyberpunk-tactital-rpg/releases/download/nova-arcadia-android-atual/NovaArcadia-Android-atual.apk`
- Página permanente: `https://github.com/zezinhord/cyberpunk-tactital-rpg/releases/tag/nova-arcadia-android-atual`.

## Fluxo obrigatório

1. Cada melhoria parte da branch ativa mais recente, preservando todas as mudanças acumuladas já aprovadas; não gerar APK a partir de branch histórica.
2. Validar o progresso de jogo, saves, habilidades, combates, derrota, mapas, assets e Android antes de promover um candidato.
3. Concluir o **workflow `.github/workflows/main.yml` na branch ativa** com todos os testes, versão Android real, integridade, assinatura e auditoria de recursos aprovados.
4. Somente o último job bem-sucedido atualiza a **mesma GitHub Release de canal atual**, substituindo `NovaArcadia-Android-atual.apk` em vez de criar duas opções. Assinatura esperada do canal: `cb8a4e8c5c17d326e7ad0a08bbb90cd50eaf2d4ecfda59bf300784361eb44eb6`.
5. Ao anunciar uma atualização, divulgar só o arquivo canônico, a versão e o workflow de origem. Não apresentar artefatos de branches históricas como a versão mais recente.
6. O workflow de upload não publica APK de PR ou de branch legada; não modifica a branch `main` automaticamente.
7. Salvamentos são prioridade: fazer backup JSON do personagem antes de instalar por cima. Nunca recomendar desinstalar antes de preservar o progresso.
8. Uma QA de Chromium e Android emulado **não equivale a teste real** nos celulares. Candidatos permanecem prévias de teste até avaliação física.

## Conteúdo acumulado em 0.8.1-rc.2

Sete novos interiores, 21 descobertas, 28 ambiências locais, sprites e movimentação de NPCs, 11 classes e 6 origens, progressão e missões, derrotas com evacuação para clínica e retentativa segura. Os 291 MB do APK são medidos e não podem ser obtidos com arquivos fictícios.

## Histórico

Commits e APKs anteriores podem continuar armazenados para auditoria e recuperação, mas não são uma opção recomendada ao jogador. A identidade do canal atual permanece a mesma entre futuras atualizações. Caso a chave de assinatura do canal mude, **bloquear a publicação**, em vez de oferecer ao jogador múltiplas variantes sem contexto.
