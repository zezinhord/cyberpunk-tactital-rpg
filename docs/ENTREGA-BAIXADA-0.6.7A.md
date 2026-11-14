# Entrega 0.6.7a — primeira reorganização da Baixada

## Diagnóstico fundamentado no repositório anterior
A cena mantinha nove edifícios, banca, seis palmeiras, quatro postes, cinco lixeiras e sete caixas decorativas (32 elementos de cenário, além dos sete atores/portas/terminais). A renderização anterior colocava todos os edifícios em um único Graphics convertido em textura de profundidade fixa 10. O protagonista usava profundidade \u0060y + 120\u0060, portanto nunca podia ficar parcialmente atrás de uma fachada da mesma cena. Identificadas coincidências: palmeira em (12,6), mesma célula de Joana; caixa em (3,8), mesmo acesso à oficina; além de inúmeros rótulos com profundidade 500/900 sobre a cena.

## Alterações integradas
- Fonte única de verdade em \u0060src/game/baixada/layout.ts\u0060 para edifícios, props, atores, células sólidas e vias.
- Sete volumes principais, com fachadas e materialidade diferenciadas: tijolo/reboco, cobogós, toldos, azulejos comunitários, fachada comercial, canal e reservatórios.
- 12 props com função ambiental e sem compartilhamento de célula com atores ou edifícios: uma banca de feira, três palmeiras, dois postes, três lixeiras e três caixas. As localizações foram deliberadamente escolhidas como bordas ou pontos de serviço, não como preenchimento de vazios.
- Posicionamento e interação originais de Nilo, Joana, Saira, Clínica, Oficina, Galeria e Terminal do Canal foram preservados.
- Edifícios renderizados como Graphics distintos, ordenados pelo \u0060Y\u0060 do canto frontal da base; NPCs, jogador e props usam profundidade por ponto de contato com o chão.
- Placas apenas em prédios significativos; nomes dos NPCs e entradas surgem em distância curta, em vez de permanecerem todos visíveis.
- Elementos decorativos sólidos participam do mesmo teste de caminhada e do algoritmo de aproximação. As ruas não têm objetos sobre as células de interação.
- Câmera com zoom isotrópico ajustado à largura/altura do viewport, sem deformar sprites; sombra de contato acompanha os pés ao caminhar.
- Piso e drenagem permanecem pré-renderizados; volumes e props recebem profundidade independente.

## Verificação automatizada
\u0060scripts/test-baixada-layout.mjs\u0060 é executado no workflow Android antes de \u0060npm run build\u0060. Confere células dentro do mapa, ausência de colisões cruzadas, nenhum ator inacessível, conectividade de todas as células livres e nenhuma duplicação de props. Resultado calculado: 250 células caminháveis conectadas; sete pontos de interação acessíveis.

## Limitações e aprovação
- A arquitetura da Baixada foi reorganizada, **não** substituída por tileset final de produção. Persistem edificações vetoriais procedurais e sprites de protagonistas anteriores, sem seis pares corporais definitivos.
- O teste automático não verifica oclusões por pixel, FPS, recortes de tela ou colisões percebidas pelo jogador. A comparação visual offline de coordenadas é apenas prévia técnica, **não uma captura da renderização Phaser**.
- O CI compila o APK; somente um teste no Android real pode aprovar estética, camadas e desempenho.
- O combate do Limbo, o menu, o inventário, a missão e os interiores não foram reescritos neste incremento.

## Próxima entrega
Testar a APK em aparelhos landscape com recortes, filmar a Baixada e comparar capturas reais. Corrigir eventuais oclusões remanescentes. Só então expandir as seis origens e seus estados de animação utilizando os mesmos recursos de renderização e colisão.
