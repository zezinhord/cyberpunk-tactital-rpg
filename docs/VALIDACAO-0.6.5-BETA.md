# Relatório de validação — v0.6.5 beta

## Escopo preparado

- Base funcional da v0.5.0 mantida.
- Onze spritesheets originais: seis protagonistas por origem e cinco NPCs.
- Animações de idle e caminhada em quatro direções isométricas.
- Baixada expandida para grade 20 × 16.
- Três cenas internas: clínica comunitária, oficina do Nilo e Galeria de Manutenção do Canal.
- A missão existente foi conectada aos novos acessos internos.
- Arena Limbo e regras de combate mantidas como sistema separado.

## Verificações executadas nesta preparação

- Transpilação sintática de 22 arquivos TypeScript/TSX: sem erros de sintaxe.
- As 11 imagens PNG foram verificadas como spritesheets 256 × 320, RGBA, com 16 quadros cada (64 × 80 por quadro).
- Busca de caminho por grade: os 7 pontos interativos externos (Nilo, Joana, Saira, portas da clínica, oficina e galeria, Terminal do Canal) têm aproximação alcançável a partir do ponto inicial; as 252 células transitáveis do mapa externo (após bloquear NPCs, portas e terminal) pertencem ao mesmo componente conectado.
- Busca de caminho interna: Amara, terminal e saída da clínica; Nilo e saída da oficina; Téo, quadro de manutenção e saída da Galeria do Canal são alcançáveis a partir dos pontos iniciais de cada interior. Os pontos ocupados por atores e o mobiliário estrutural são tratados como obstáculos de navegação.
- API de posição de ponteiro no mundo (`positionToCamera`) e câmera que acompanha o personagem (`startFollow`) conferidas na documentação oficial do Phaser 4.
- Nenhuma dependência foi adicionada a `package.json`.

## Verificação ainda pendente

`npm install` foi tentado, mas falhou por indisponibilidade de DNS para `registry.npmjs.org` (`EAI_AGAIN`). Por isso, não foi possível executar o build completo real com Vite e os tipos oficiais do Phaser/React neste ambiente, nem compilar o APK localmente.

O build definitivo deve ser confirmado pelo GitHub Actions após o envio desta versão ao repositório. Se o workflow apontar erros, a versão não deve ser considerada validada até que os logs sejam corrigidos e a execução termine com sucesso.

## Teste manual recomendado no aparelho

1. Criar ou continuar um protagonista de cada origem e conferir a roupa/sprite correspondente.
2. Caminhar em quatro direções e observar a mudança de orientação e o ciclo de caminhada.
3. Abrir a clínica, conversar com Amara, consultar o terminal e concluir a missão retornando à médica.
4. Sair, entrar na oficina e conversar com Nilo.
5. Acessar a Galeria do Canal, conversar com Téo e consultar o quadro de manutenção.
6. Caminhar até o Mercado da Ponte, conversar com Saira e consultar o Terminal Público do Canal.
7. Abrir o Limbo de Teste e confirmar que a arena tática ainda inicia normalmente.
8. Fechar e reabrir o aplicativo para conferir a persistência da missão e do protagonista.
