# Nova Arcádia 2.0 — Estado de produção da versão final 3GB

**Data:** 20 de novembro de 2026. **Branch:** `feature/nova-arcadia-cisma-eden-v20-foundation`.

## Entregue (atualizável sobre a RC3 QA200)

- 31 etapas de campanha do Cisma de Éden, com três operações táticas de duas, duas e três ondas.
- 35 interiores exploráveis com caminhos, colisão, NPCs e 105 interações com recompensas únicas.
- 28 contratos secundários completos com aceite no NPC, três provas físicas cada e entrega final — 84 evidências investigáveis.
- 8 cyberwares auxiliares instaláveis, com custo em materiais reais, slots, requisitos de nível e carga neural.
- 4 companheiros recrutáveis (até 2 apoios táticos remotos por equipe), bônus aplicados no motor de combate.
- 3 operações com escolha de abordagem frontal ou infiltrada, consequência real na primeira onda e persistência antirrepetição.
- 11 classes jogáveis com três ramos cada, preservando identidades e salvamentos.
- 28 murais próprios com **temas iconográficos distintos por sala**, mais 84 imagens ilustrativas de objetos interativos: 112 novos PNGs desenhados por script, todos referenciados pelo jogo e carregados no máximo quatro por cena. O código preserva a arte anterior em caso de falha de carregamento.
- Geração reprodutível e testes SHA-256, PNG, dimensões, arquivos únicos, navegação dos 35 interiores, contratos, backups, e abertura Android 2GB antes de cada prerelease.

## Meta exigida pelo jogador — não cumprida

O produto final solicitado precisa ter **3.000.000.000 bytes ou mais de conteúdo efetivo, não enchimento**. A RC3 instalada tinha **1.143.100.968 bytes**; é necessário acrescentar aproximadamente **1.856.899.032 bytes de recursos úteis**. A nova rodada de ilustrações gera só **370.255 bytes** de PNGs — qualidade e variedade funcional, não uma substituição fictícia dos 1,86GB restantes. O tamanho do APK RC4 é auditado pela release antes de ser divulgado.

Não usar arquivos aleatórios de padding, silêncio, áudios repetidos, imagens duplicadas, frames órfãos, vídeo sem exibição, ou texturas com ruído artificial. Recursos só entram na contagem se associados a local, objeto, animação, cena narrativa ou mecânica e se forem realmente carregáveis pela versão Android.

## Arquitetura de entrega necessária para um produto maior que 3 GB

**GitHub Releases** limita arquivos individuais a menos de 2 GiB; total de uma release pode exceder esse valor. Fonte: https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases

**Google Play** permite Asset Delivery com módulos e packs de instalação e downloads sob demanda; tamanho combinado de módulos e packs install-time chega a 4 GB e downloads fast-follow/on-demand totalizam até 30 GB nas regras atuais. Fonte: https://support.google.com/googleplay/android-developer/answer/9859372

Para GitHub/sideload é necessário **APK mais pacotes segmentados** com manifestos, verificações SHA-256, retomada/controle de versão e instalação offline autorizada pelo jogador. Uma APK de 3 GB única no GitHub não cumpre o limite da plataforma e imporia riscos de espaço a celulares de entrada. Para Google Play, a estratégia pode ser AAB + Play Asset Delivery. **Nenhum pipeline de pacotes adicionais está homologado na RC4, portanto não alegar que o produto já possui essa arquitetura.**

## Bloqueadores para o rótulo de versão definitiva

1. Produção de aproximadamente 1,86GB adicionais de arte, mapas, sequências e animações originais — **tudo utilizado**.
2. Distribuição segmentada com verificação de integridade, retomada, controle de versão, instalação offline após baixar e mensagens claras sobre espaço livre.
3. Revisão visual das 28 salas em aparelhos reais e melhoria de oclusão/perspectiva, NPCs com silhuetas próprias e animações direcionais completas.
4. Furtividade por linha de visão e ruído no mapa; atualmente as três decisões são pré-confronto, com efeito tático real.
5. Companheiros como unidades próprias no tabuleiro, se forem parte do escopo final (hoje prestam apoio remoto).
6. Testar manualmente as 31 etapas e 28 contratos, três finais, backup/rollback e desempenho em aparelhos Android reais.
7. **Gate obrigatório:** confirmar o tamanho total de pacotes usados em runtime e ensaiar instalação limpa e upgrade sobre a RC3; não marcar como final só por build e boot de emulador.

Não promover esta branch a `main` nem chamar RC4 de `2.0.0` estável até cumprir os bloqueadores.
