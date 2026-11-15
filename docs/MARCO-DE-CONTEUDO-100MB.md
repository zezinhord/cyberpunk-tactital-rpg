# Nova Arcádia — marco de conteúdo original de pelo menos 100 MB

## Marco da RC 0.7.0

A geração determinística de áudio fornece **56 temas originais**, cada um com 108 segundos,
Ogg/Opus estéreo 128 kbps, separados por 7 distritos e 8 situações. A produção do pacote
resultou em **97.563.256 bytes de música original** (medido no GitHub Actions antes de
empacotar). O jogo oferece um rádio para reproduzir **todas** as composições; portanto
não há arquivos inseridos apenas para aumentar o tamanho do APK.

A Baixada, Ferrugem e os cinco novos distritos oferecem mapas isométricos próprios,
35 missões adicionais, 5 interceptações Helix, escolhas finais, XP e saves isolados.
O APK é medido após o Gradle; o job de publicação falha caso tenha menos de
**100.000.000 bytes**. O limite superior do orçamento é 115 MB para impedir bloat.
Memória RAM durante jogo é controlada por mapa e por reprodução individual de áudio.

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

## Estimativas históricas de produção (substituídas pelo orçamento medido acima)

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

### Testes de campo pendentes

A meta de distribuição só estará concluída ao verificar o APK; a qualidade de
FPS, os fechamentos espontâneos e o equilíbrio narrativo ainda dependem de
Galaxy A07, Redmi Note 12S e outros aparelhos Android reais.
