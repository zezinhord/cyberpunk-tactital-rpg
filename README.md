# Nova Arcádia — Projeto Éden

**Candidata à primeira prévia pública: 0.6.9-rc.1 (Android, em validação).**

RPG 2D isométrico de exploração semiaberta e combate tático por turnos, ambientado em uma cidade cyberpunk tropical. Projeto independente com React, TypeScript, Phaser 4, Vite e Capacitor 8.

> **Aviso:** esta versão é uma **release candidate**, não uma versão estável aprovada em aparelhos reais. A publicação deve ocorrer somente depois do checklist em [docs/PRIMEIRA-VERSAO-PUBLICA.md](docs/PRIMEIRA-VERSAO-PUBLICA.md). A branch `main` segue preservada.

## Conteúdo jogável desta candidata

- **11 classes oficiais**: Solo, Netrunner, Técnico, Medtech, Rockerboy, Mídia, Corporativo, Policial, Nômade, Marginal da Rua e Fixador.
- **6 origens** com prólogos, diferenças narrativas e vantagem ativa/passiva de origem. Origem e classe são escolhas independentes.
- **Baixada semiaberta**, incluindo Canal Sul, Pátio do Reúso, Mercado dos Cabos, NPCs, interiores e investigação ligada ao Projeto Éden.
- **Operação Circuito Fantasma**: 19 objetivos em quatro capítulos, três confrontos em ondas (2 + 2 + 3) e recompensas em XP. Duração **projetada** entre 35 e 50 minutos, a conferir no Android; não há temporizador artificial.
- Combate isométrico em turnos com habilidade básica, habilidades comuns, habilidades específicas da classe, posicionamento, energia, recarga e curativo.
- Progressão até o nível 10, cinco atributos, duas técnicas avançadas por classe (22 no total) e três passivas gerais.
- **Até 8 slots locais de personagens**, inventário simples, equipamentos, Vida persistente, progressão e posição na exploração.
- Exportação/importação de backups JSON contendo personagem, inventário, aparência, posição, missões, história, Vida e progresso de Circuito Fantasma.
- Interface horizontal e controles adaptados a celular.

## Instalar em Android para testes

1. Abra o workflow **Build Cyberpunk Tactical RPG APK** na aba [Actions](https://github.com/zezinhord/cyberpunk-tactital-rpg/actions/workflows/main.yml).
2. Escolha uma execução **bem-sucedida de `push`** na branch `feature/landscape-mobile-v1`. Execuções de `pull_request` verificam código, mas **não produzem o APK**.
3. Em **Artifacts**, baixe `Cyberpunk-Tactical-RPG-APK`, extraia o ZIP e abra o arquivo `.apk`.
4. Autorize a instalação desse APK no Android apenas se confiar na origem. Não é necessário Android Studio para testar.

**Distribuição pública:** para disponibilizar permanentemente ao público, anexe o APK final a uma [GitHub Release](https://github.com/zezinhord/cyberpunk-tactital-rpg/releases). Os artefatos de Actions têm retenção limitada. Este pipeline produz **APK debug assinado para instalação direta**, e **não** um Android App Bundle de produção pronto para Google Play. Não compartilhe como versão estável sem executar os testes físicos.

## Salvamentos e atualizações

Os dados são salvos **localmente no dispositivo**. Não há sincronização entre celulares. Cada protagonista possui seu próprio slot; excluir um personagem apaga também seus dados de campanha.

**Antes de atualizar, reinstalar, limpar os dados do aplicativo ou trocar de celular:** abra **Carregar jogo → Exportar** em cada slot e guarde o arquivo JSON fora do aplicativo. Na nova instalação, use **Importar**. Nunca presuma que o Android preservará o armazenamento ao mudar o pacote ou o certificado da assinatura.

A restauração exige confirmação ao substituir um slot existente. Em caso de falha de escrita, o código tenta reverter as alterações para preservar os registros anteriores; isso não elimina a necessidade do backup externo.

## Comandos

- Toque no cenário para caminhar; toque em NPCs, terminais e portas para se aproximar e interagir.
- Na arena, toque em células alcançáveis, use as habilidades da classe, ataque e encerre o turno.
- A **Central do Personagem** permite visualizar classe, inventário e árvore de evolução.
- O **Limbo de Teste** é separado da campanha.

## Desenvolvimento e validação

Requisitos: Node.js **22.12+**, npm, Python 3 e Pillow (o comando de build regenera os sprites durante o pré-build).

```bash
python -m pip install -r tools/requirements-characters.txt
npm ci
npm run build
```

Para iniciar a versão web: `npm run dev`.

Os testes automatizados estão em `scripts/test-*.mjs` e são executados no [GitHub Actions](https://github.com/zezinhord/cyberpunk-tactital-rpg/actions). A captura em Chromium verifica telas, classe, aparência, movimentos visuais e alguns efeitos reais; **não substitui o teste físico de ponta a ponta**.

## Limitações conhecidas da prévia

- Um distrito semiaberto jogável; os outros distritos, os veículos e a campanha maior ainda não estão completos.
- O combate usa uma arena própria, com confrontos simplificados. Não equivale ainda ao combate integrado ao cenário de exploração.
- IA, arte, animações, inventário, lojas e economia continuam em evolução.
- A campanha de 35–50 minutos ainda não foi cronometrada com usuários reais.
- Alguns NPCs reutilizam sprites provisórios.
- Não há salvamento em nuvem nem garantia de compatibilidade com todos os aparelhos Android.

**Controle de qualidade e critérios de publicação:** [docs/PRIMEIRA-VERSAO-PUBLICA.md](docs/PRIMEIRA-VERSAO-PUBLICA.md).

Arquivos históricos da versão 0.6.5 beta permanecem em `docs/` para consulta, mas não descrevem toda a funcionalidade atual.
