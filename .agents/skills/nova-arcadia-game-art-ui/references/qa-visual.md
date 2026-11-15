# Nova Arcádia — Checklist de QA visual

## Pré-condições
Registrar branch, commit, tela, distrito, origem, apresentação, estado de missão e resolução. Comparar capturas de antes e depois da **mesma tela/situação**. Não apresentar concept art como screenshot de execução.

## Matriz mínima
| Superfície | 914×411 | 1600×720 | Android físico |
|--|--|--|--|
| Menu/criação | obrigatório | obrigatório | pré-publicação |
| Baixada/andares/NPCs | obrigatório | obrigatório | pré-publicação |
| Interiores + distrito externo | obrigatório | obrigatório | pré-publicação |
| Arena/habilidades/turnos | obrigatório | obrigatório | pré-publicação |
| Inventário/progressão/diálogos | obrigatório | obrigatório | pré-publicação |
| Troca corporal e retorno ao jogo | obrigatório | obrigatório | pré-publicação |

## Critérios
- Personagem preserva visual, origem e escala em todas as cenas; nenhuma tela ficou sem sprites/textura.
- Paisagem tem profundidade, oclusão correta, rotas legíveis, edifícios proporcionais e identidade de distrito.
- Cores de papéis, formas e rótulos estão corretos; verde funcional exclusivo do Éden.
- HUD mostra alvo, vida/energia, habilidades, cobertura/alcance e turno. Botões críticos nunca exigem rolagem superior.
- Controles >=48dp e ação primária com referência 56dp. Textos funcionais não truncados em altura 411.
- Testar movimento, colisões, troca de cena, retorno do segundo plano, saves e ausência de tela preta.
- No aparelho físico, coletar FPS, memória e estabilidade; nunca inventar resultados. Modo Economia tem meta em torno de 30 FPS, mas isso exige medição.

## Verificações (ambiente com Node, build e Chromium)
```bash
node .agents/skills/nova-arcadia-game-art-ui/scripts/check-visual-contract.mjs
npm run build
node scripts/test-android-cold-boot.mjs
node scripts/capture-baixada-visual.mjs
```
O checker é puramente estático. Os scripts com Chromium precisam de build/preview e navegador instalado.

## Modelo de relatório
```text
Tela e distrito:
Branch / commit:
Arquivos alterados:
O que foi preservado:
Capturas antes/depois (caminhos, resoluções):
Identidade do protagonista conferida:
Botões / fontes medidos:
Oclusão / escala:
Testes automatizados e resultados:
Android físico (dispositivo, duração, FPS, memória):
Itens não verificados:
Status: APROVADO / PARCIAL / BLOQUEADO
```
