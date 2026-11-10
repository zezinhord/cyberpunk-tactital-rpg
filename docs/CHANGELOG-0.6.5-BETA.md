# Cyberpunk Tactical RPG — v0.6.5 beta

## Baixada expandida: personagens animados e interiores acessíveis

A v0.6.5 beta expande a primeira vertical slice da Baixada sem substituir a base de criação de protagonista, as seis origens, a missão inicial ou o Limbo de Teste.

### Personagens e animação

- Onze spritesheets PNG originais, cada um com 16 quadros em grade 4 × 4 (64 × 80 por quadro): seis protagonistas de origem e cinco NPCs.
- Quatro orientações isométricas por personagem.
- Animações de repouso e caminhada; a orientação muda de acordo com a direção real da grade.
- Protagonista escolhido pelo `OriginId`; NPCs com sprites próprios: Dra. Amara, Nilo, Joana, Saira e Téo.
- Movimentação com câmera que acompanha o protagonista. Os toques são convertidos para coordenadas do mundo antes de selecionar células e personagens.

### Baixada ampliada

- Grade de exploração ampliada de 14 × 12 para 20 × 16.
- Novas áreas visuais: Mercado da Ponte, Moradias do Canal, Ponto de Apoio e Praça da Caixa d'Água.
- Novos NPCs e pontos de interesse: Saira e Terminal Público do Canal; Téo atua na Galeria de Manutenção.
- Acessos sinalizados à clínica, à oficina e à Galeria de Manutenção do Canal.

### Interiores

- Clínica comunitária explorável, com Dra. Amara, terminal de registros, recepção, maca, armário e áreas de triagem.
- Oficina do Nilo explorável, com Nilo, bancada, prateleiras, ferramentas e peças.
- Galeria de Manutenção do Canal explorável, com Téo, canal de drenagem, passarela técnica, tubulações e quadro de manutenção.
- Entrada por portas no mapa externo e retorno por porta interna ou botão de segurança da interface.
- A missão “O nome que sumiu” mantém seu fluxo: falar com Amara, consultar o terminal e retornar à médica, agora dentro da clínica.

### Preservação

- As seis origens, introduções, vantagens e habilidade ativa permanecem.
- A missão continua salva localmente por personagem, usando a chave já adotada na v0.5.0.
- O Limbo de Teste e a lógica de combate por turnos permanecem separados e preservados.
- Não foram adicionadas dependências npm para execução. O código-fonte do gerador de sprites está em `tools/generate_character_sprites.py` e requer Pillow somente para regenerar os PNGs.

### Limitações conhecidas

- A animação de ataque ainda não está ligada ao combate; a animação de caminhada e repouso é usada na exploração.
- Os cenários continuam desenhados por código no Phaser, com spritesheets para personagens. Tilesets artísticos modulares, oclusão de fachadas, interiores adicionais, inventário, lojas funcionais, veículos e campanha completa permanecem pendentes.
- Os três interiores são espaços desenhados individualmente, não um sistema genérico de geração de interiores.
- O APK precisa ser compilado e testado pelo GitHub Actions. A preparação desta versão não conseguiu instalar dependências npm devido a falha de DNS no registro.
