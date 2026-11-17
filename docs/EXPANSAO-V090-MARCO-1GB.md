# Nova Arcádia v0.9.0-rc.1 — expansão efetiva para marco de 1 GB

Base: feature/nova-arcadia-1gb-systems-v082, commit 06fb8536ddf165f0b9841ef1e94b540278cc9dfd. Branch própria, não altera main nem o canal permanente de testes Android v080.

## Conteúdo integrado no código
- 21 ocorrências autorais, três por território, cada uma com duas decisões. 42 escolhas que mudam reputações das quatro facções, tensão regional, diálogos e XP idempotente. Uma ocorrência local liberada por vez, após V-09.
- Aba Cidade no HUD compacto. Não adiciona menus globais bloqueando o mapa.
- Persistência por personagem e backup v1, sem invalidar os saves anteriores.
- Diretor de áudio com quatro fases (aurora, turno, ocaso e vigília), quatro situações (rua, chuva, interior e alerta) e sete distritos: 112 peças autorais de seis minutos, com harmônicos, ritmos, microeventos e texturas diferenciadas. Total de 672 minutos de novas composições. Codec Ogg/Opus 168 kb/s. Um stream por vez.
- As 28 antigas ambiências continuam como fallback para erros ou aparelhos sem recursos expandidos.
- Catálogo manifest.json com hashes SHA-256, validação de duração e identidade de cada arquivo, testes contra duplicação, tamanho final medido dentro do APK.

## Compromissos técnicos
- O marco só é atingido se o APK real superar 1.000.000.000 bytes depois do build Android bem-sucedido. O arquivo ZIP artifact não representa tamanho do APK.
- O primeiro build v0.9 exige todos os testes existentes e as novas verificações; GH Actions publica um pre-release separado somente depois das validações.
- Assinatura debug. Não considerar versão pública estável sem testes Android físicos, incluindo Galaxy A07 e Redmi Note 12S, FPS, áudio, reconexão e migração.
- O volume de 1 GB será sobretudo áudio ambiental utilizado em runtime. Isto não substitui expansões futuras de NPCs, mapas, arte e especializações ainda desejáveis.
