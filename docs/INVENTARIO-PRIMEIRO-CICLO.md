# Inventário funcional — primeira integração

## O que é funcional
- Catálogo tipado e quantidade por item.
- Inventário inicial limitado, persistido por ID do protagonista, independente do save v1 antigo.
- Equipar e remover arma/colete, com bônus reais de ataque e Defesa no Limbo de Teste.
- Dois curativos de campo iniciais; cada uso durante o próprio turno consome uma ação bônus, recupera até 5 de Vida e reduz a quantidade salva.
- Recurso simples de material, sem receita de fabricação ainda. O conector reutilizável agora é recebido ao conversar com Nilo, apenas uma vez por personagem, como recompensa contextual registrada no inventário.
- Inventário acessível pela Central do Protagonista, sem ocupar a exploração.
- Campo de teste mantém regras e controle de turnos, agora com suporte aos modificadores de itens.

## Limites
Esta etapa não implementa loja, economia, raridade, saque do chão, crafting ou inventários múltiplos. As armas não substituem as animações ou o alcance corpo a corpo do protótipo. Bônus só são aplicados quando o combate do Limbo é iniciado após equipar o item na exploração.

## Testes necessários
- Criar personagem e verificar itens iniciais.
- Equipar e desequipar arma/colete, entrar no Limbo, conferir bônus de ataque e CA.
- Sofrer dano, usar curativo no turno do jogador, verificar aumento de HP e consumo da ação bônus e quantidade.
- Reiniciar aplicativo e verificar equipamento e quantidades persistidos.
- Criar outro protagonista (após confirmação), verificar um inventário independente.
