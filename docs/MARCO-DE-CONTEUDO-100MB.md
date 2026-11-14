# Nova Arcádia — marco de conteúdo para APK de até ~100 MB

## Regra de produção

**100 MB não é uma medida de qualidade.** A meta solicitada é interpretada como um
marco de quantidade de conteúdo autoral distribuído com o aplicativo (até aproximadamente
100.000.000 bytes), **nunca como autorização para anexar arquivos de preenchimento**.

O objetivo é usar o espaço para experiências jogáveis, mapas distintos, animações,
diálogos, ambientação sonora e variedade de inimigos. O número exato de bytes depende
de compressão, codificação Android e recursos realmente gerados. Em aparelhos com
pouca memória, os arquivos devem ser carregados por distrito e descarregados na saída,
mesmo que estejam incluídos no pacote de instalação.

O workflow **mede o APK real** com `stat -c %s android/app/build/outputs/apk/debug/app-debug.apk`.
O tamanho do ZIP do artifact do GitHub não é o tamanho da APK interna.

## Conteúdo já implementado

- 11 classes jogáveis e 6 origens;
- combate tático por turnos, habilidades, ondas e árvore de evolução;
- Baixada ampliada, Galeria de Drenagem Sul e Câmara de Recalque 04;
- prólogo cinematográfico em seis quadros;
- sequência de 19 objetivos da Operação Circuito Fantasma;
- Ferrugem, distrito industrial independente com nove objetivos, duas decisões finais, caminhos e NPCs interativos;
- inventário persistente e duas receitas de fabricação com bônus de ataque/proteção;
- slots independentes, backups, modo Economia 30 FPS e diagnósticos locais.

## Pendências de maior impacto (não confundir com conteúdo entregue)

1. Homologar **Galaxy A07 e Redmi Note 12S** sem encerramentos nem FPS instável.
2. Combates associados ao próprio mapa de exploração, com retorno exato ao local onde começou.
3. Retratos próprios dos NPCs e sprites variados para classes, facções, civis e inimigos;
   eliminar reutilização de personagens provisórios.
4. Expandir **Áurea, Ferrugem, Subsolo, Ferrugem exterior e Setor Zero** com objetivos que
   dependam das escolhas da comunidade. Evitar mapas vazios só para aumentar volume.
5. Produzir efeitos sonoros e trilhas originais comprimidas, com níveis de volume e
   respeito ao modo silencioso. Não incluir material de terceiros sem licença.
6. Testar tempo médio real de campanha, equilíbrio dos combates e legibilidade no toque.
7. Adicionar relatórios de falhas de Android obtidos **somente com consentimento**;
   os atuais dados locais de FPS não revelam a origem dos fechamentos.
8. Publicar instalador de produção com assinatura e ciclo de atualizações estáveis,
   somente após validação em aparelhos reais.

## Orçamento preliminar para conteúdo, NÃO tamanho já alcançado

| Família de recursos | Orçamento máximo de planejamento |
|---|---:|
| Mapas/tileset de distritos, interiores e efeitos 2D | 30 MB |
| Personagens, animações, portraits, inimigos e equipamentos | 22 MB |
| Trilhas e ambientação originais com compressão adequada | 21 MB |
| Dublagens curtas, sons de interface, armas e ambiente | 9 MB |
| Telas narrativas e ilustrações de eventos | 8 MB |
| Reserva para motor Android e empacotamento | 10 MB |
| **Orçamento de referência** | **100 MB** |

Os orçamentos são hipóteses de produção, não bytes encontrados no repositório.
Arte comprimida pode ocupar menos; não aumentar a resolução só para bater a cifra.
Se o jogo estiver completo com menos de 100 MB, isso será um resultado positivo.

## Critério de publicação

Cada incremento precisa ter ao menos um circuito jogável, testes de navegação,
compilação Android bem-sucedida, compatibilidade do backup e evidências de que
os novos recursos não elevaram o consumo de RAM indevidamente. **Não declarar o
jogo concluído pelo tamanho isolado da APK.**
