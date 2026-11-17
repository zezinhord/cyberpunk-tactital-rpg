# Nova Arcádia 0.8.2-rc.1 — ciclo inicial de expansão 1 GB

Base: feature/nova-arcadia-expansion-v080 em 33bed2260a1f73b3f9735a97cf35eaae17018383. Desenvolvimento isolado; main e canal permanente não modificados.

## Implementado

- Consórcio Cívico como quarta facção: reputação derivada de missões, favores, mercado e distritos, distinta de Honra e confiança. Sem migração do save v1.
- Duas decisões exclusivas, possíveis após V-09 e duas provas: protocolo com metadados ou audiência comunitária. Alteram confiança, vigilância, diálogos e relações políticas.
- Requisição administrativa de dois reagentes biomédicos sob acesso por reputação; recibo idempotente de inventário.
- Exibição das quatro facções no HUD e diário, em grade compacta de quatro colunas sem alterar a identidade visual.
- Testes de bloqueio, bifurcação, reputações, recompensas e persistência.

## Limites

Esta etapa não entrega 1 GB. O APK histórico da 0.8.1 foi medido na build #822 em 291.113.461 bytes; a 0.8.2 deverá ter seu próprio tamanho medido. A validação Android física em Galaxy A07, Redmi Note 12S e terceiro aparelho segue pendente. Próximos incrementos incluem IA tática contextual, eventos urbanos, NPCs, áreas, arte, áudio sob demanda e especializações de classe. Sem arquivos de preenchimento, sem declarar QA físico executado.
