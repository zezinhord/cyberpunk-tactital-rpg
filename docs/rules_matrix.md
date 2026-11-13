# Matriz de fidelidade de regras — Tenebria Revisado 3.0

Este documento distingue: **[LIVRO]** regra textual de Tenebria, **[ADAPTAÇÃO]** interpretação digital aplicada, **[PENDENTE]** implementação futura não aprovada. Páginas citadas são as páginas *do PDF* (incluindo capa), não a numeração impressa.

| Domínio | Livro | Estado digital |
|---|---|---|
| Cosmologia | p. 6–12: Tenebram, Perpétuos, Entidades, Obscure, Ruturam, Morcânia e Astral | [LIVRO] nomes e contexto; [ADAPTAÇÃO] arco da Vigília/Hasam é original, não canônico |
| Raças | p. 14 e p. 17–69: 27 raças, limites F/H/V/M e deslocamentos específicos | [LIVRO] 27 entradas do catálogo em catalog.gd; **4 selecionáveis** com apresentação 3D procedural; [PENDENTE] todas as capacidades e qualidades raciais |
| Classes | p. 73–155: 27 classes em Obscure | [LIVRO] nomes catalogados; 4 selecionáveis; [PENDENTE] 23 outras e árvores completas |
| Atributos | p. 14 e 71: 8 pontos; sem valor 0; limites raciais | [LIVRO] valid_attributes() impede distribuição inválida |
| Qualidades | p. 14 e 157–163: 2 qualidades na criação | [LIVRO] Corajoso (+2 Vontade), Corpulento (+1 Fadiga), Item Herdado (+1 arma), Erudito (vantagem contextual); [PENDENTE] testes narrativos detalhados |
| Habilidades iniciais | p. 73: 5 pontos para habilidades de classe | [PENDENTE] catálogo por habilidade e compra inicial de 5 pontos; a Alpha libera uma habilidade inicial por classe, ainda sem compra integral |
| Iniciativa | p. 179: 1D20 + Iniciativa (Habilidade + Mental) | [LIVRO] aplicada por rodada no TurnCombat |
| Turnos | p. 179: livre, movimento e ataque; movimento cessa após ataque | [ADAPTAÇÃO] grid tático de 7x6; um movimento + uma ação por turno; sem deslocar após ação |
| Ataque | p. 179: corpo a corpo D20 + Físico, distância D20 + Habilidade contra Defesa | [LIVRO] com 1 natural falha, 20 natural acerto; [ADAPTAÇÃO] dano da arma e posições em grid |
| Defesa | p. 179: 10 + Vigor + armadura + escudo | [LIVRO] aplicada na calculadora; [ADAPTAÇÃO] dados digitais de equipamento são provisórios |
| Recursos | p. 71: Fadiga = Físico + Vigor; Vontade = Mental + Habilidade | [LIVRO] aplicados na ficha; [ADAPTAÇÃO] gastos simplificados |
| Espadachim Oriental | p. 97–98: Espada Ancestral energiza por 1D4 rodadas, vantagem e ignora redução | [ADAPTAÇÃO] vantagem no golpe de ativação e efeito temporário; **ignorar redução pendente** |
| Guerreiro | p. 109: Golpe Decisivo com vantagem e +1D4, custo 2 Fadiga | [LIVRO] implementado no motor |
| Bárbaro | p. 81: Ataque Massivo +1D4, custo 2 Fadiga | [LIVRO] implementado |
| Mago | p. 124: Esfera de Pyros, 2D4 + Mental, área 2m, custo 3 Vontade | [ADAPTAÇÃO] dano em alvo e adjacentes, dano tipo fogo ainda sem resistências específicas |
| Evolução | p. 182: 10 XP por nível; PV adicional Físico + PVS da classe | [ADAPTAÇÃO] 10 XP implementado, **PVS por classe ainda pendente**, PV provisório F+12 |
| Inimigos | p. 211–213 e bestiário: Incarnas, guardas/variantes | [ADAPTAÇÃO] Errante, Ferrão, Corrompido, Arauto e Guardião são perfis digitais de teste; atributos exatos e IA avançada pendentes |
| Exploração | p. 5–6: exploração, interação e combate | [ADAPTAÇÃO] povoado, bosque, cripta exterior, baús, ervas, aliados, diálogos |
| Corrupção | p. 207–210: regras específicas | [PENDENTE] número/efeitos ainda não integrados, evitar mecânica genérica |
| Salvamento | Sem equivalente no livro | [ADAPTAÇÃO] ConfigFile local com dados de personagem e missões; migração/atomicidade ainda em validação |
| Companheiros | Regras de grupo da introdução | [ADAPTAÇÃO] Maera como aliada Mago com turnos controláveis; personagem e enredo são originais |

## Dívida técnica prioritária
1. Substituir os PV provisórios por tabela exata PVS por classe.
2. Permitir distribuir os cinco pontos em várias habilidades iniciais.
3. Aplicar integralmente as quatro raças em mecânica, aparência e equipamento.
4. Salvar posição/estado individual de inimigos, baús e NPCs, evitando respawn indevido.
5. Testar movimentação de combate com obstáculos físicos, alcance vertical e linha de visão.
6. Validar na GPU Adreno/Moto G34 5G e coletar FPS e memória.
7. Revisar direitos de adaptação/publicação comercial com os titulares do livro.
