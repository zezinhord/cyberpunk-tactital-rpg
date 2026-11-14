# Vertical slice de interface — v0.8

## Alterações executadas
- Tela inicial Nova Arcádia: Continuar, Novo jogo (com confirmação de substituição), Carregar Jogo (slot local), Configurações e Créditos.
- Configuração funcional: reduzir animações decorativas, salva localmente.
- HUD: exploração em Phaser utiliza toda a área de jogo. Nome da área e identidade do protagonista aparecem de maneira compacta.
- Objetivo atual: painel opcional acessível por botão; Diário completo permanece na Central do Protagonista.
- Acesso à Central: botão compacto no cabeçalho. Limbo de Teste permanece acessível por Configurações no menu do personagem.
- Para preservar a imersão, a antiga coluna lateral permanente da exploração deixa de reservar espaço ao cenário.
- Código e documentação do modo imersivo Android integrados à geração via GitHub Actions.

## Proteção de dados
O save antigo (personagem e missão) não é alterado. Um único slot local é exibido; múltiplos slots não são prometidos. Novo Jogo exige confirmação; o registro antigo permanece salvo durante a criação e só é substituído depois que o novo protagonista é criado e salvo.

## Verificação esperada no aparelho
1. Instalar APK e abrir: menu inicial paisagem, barras do sistema ocultas.
2. Confirmar que Continuar carrega exatamente o personagem salvo.
3. Entrar na Baixada, observar cenário ocupando a largura da tela, sem painel fixo.
4. Expandir e recolher objetivo; abrir e fechar a Central do Protagonista.
5. Entrar na clínica, oficina e galeria, conversar com NPCs, retornar à Baixada.
6. Abrir a arena pelo menu do personagem; realizar combate e retornar.
7. Equipar arma/colete e verificar bônus no combate, curar-se sem reiniciar a arena, fechar e reabrir o app.
8. Usar gestos das bordas para acessar notificações e retornar.

## Pendências de produção
- Estética vetorial final de cenários, sprites e iluminação.
- HUD de recursos de exploração: pontos de Vida/Energia do mundo aberto exigem estado unificado de personagem/combate, ainda não implementado; não exibir barras fictícias.
- Inventário geral avançado, sistema de loot, crafting e loja.
- Missões ramificadas, classes e progressão.
- Mapa interativo de distritos e combate integrado à exploração.
- Validação de recortes e proporções em dispositivos Android físicos.

Apenas a compilação e a inspeção de código não substituem QA no aparelho.
