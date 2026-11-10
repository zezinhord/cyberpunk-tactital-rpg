# Cyberpunk Tactical RPG — Nova Arcádia

**Versão atual: 0.6.5 beta**

RPG 2D isométrico mobile-first, ambientado na cidade de Nova Arcádia. Construído com React, TypeScript, Phaser 4, Vite e Capacitor 8. A proposta combina exploração em tempo real e combate tático por turnos.

## O que já funciona na 0.6.5 beta

- Criação do protagonista e seleção entre seis origens, cada uma com introdução narrativa própria.
- Vantagens passivas e habilidade ativa de origem preservadas no sistema demonstrativo de combate.
- Salvamento local do protagonista e progresso da missão inicial por personagem.
- **Baixada expandida:** ruas, prédios, clínica, oficina, Mercado da Ponte, Moradias do Canal, Ponto de Apoio e Praça da Caixa d'Água.
- Câmera que acompanha o protagonista e navegação por toque ou teclado.
- **Onze spritesheets originais:** seis visuais de protagonista (um por origem) e cinco NPCs.
- Animações de repouso e caminhada em quatro orientações isométricas.
- NPCs com identidade visual: Dra. Amara Solis, Nilo, Joana, Saira e Téo.
- **Três interiores jogáveis:** clínica comunitária, oficina do Nilo e Galeria de Manutenção do Canal, com portas de entrada e saída.
- Missão inicial **O nome que sumiu**: conversar com Amara, investigar o terminal e retornar à médica.
- Terminal público do Canal e diálogos secundários de Saira e Téo. Téo agora pode ser encontrado na Galeria do Canal.
- **Limbo de Teste** continua como arena separada para validar o combate por turnos.
- GitHub Actions para compilar o APK Android debug.

## Controles

- Toque no chão para caminhar até o ponto selecionado.
- Toque em NPCs, terminais e portas para se aproximar e interagir.
- No computador, WASD ou setas também movimentam o protagonista.
- Dentro dos interiores, use a porta marcada **SAÍDA** ou o botão de retorno para voltar à rua.

## Executar localmente

Requisitos: Node.js 22.12 ou superior e npm.

```bash
npm install
npm run dev
```

Para validar TypeScript e compilar a versão web:

```bash
npm run build
```

## Gerar o APK

O workflow `.github/workflows/main.yml` inicia em cada push na branch `main` e pode ser executado manualmente pela aba **Actions**.

Ele instala Node.js 22 e Java 21, instala dependências, executa `npm run build`, sincroniza o Capacitor e compila `assembleDebug`. O artefato publicado chama-se `Cyberpunk-Tactical-RPG-APK`.

Consulte `docs/UPLOAD-GITHUB-MOBILE.md` para as instruções de atualização a partir do celular. O gerador-fonte dos sprites provisórios está em `tools/generate_character_sprites.py` (Pillow é necessário apenas para regenerar as imagens).

## Salvamento

O protagonista é salvo localmente em `localStorage` com a chave `cyberpunk-tactical-rpg.character.v1`. O progresso da missão da Baixada usa uma chave separada por personagem. Ainda não existe sincronização em nuvem nem salvamento completo de posição, inventário ou estado do mundo.

## Escopo e limitações da beta

A 0.6.5 beta entrega uma primeira área maior e três interiores, mas não é a campanha completa. As animações de ataque ainda não estão integradas, e o combate continua no Limbo de Teste. Inventário/equipamentos completos, economia, lojas funcionais, veículos, sistema geral de missões, oclusão avançada, tilesets artísticos modulares, outros distritos e campanha principal permanecem em desenvolvimento.

O tamanho do APK dependerá dos próximos recursos artísticos e de áudio. Não existe preenchimento artificial de armazenamento para atingir uma meta de megabytes.

## Documentos desta versão

- `docs/CHANGELOG-0.6.5-BETA.md` — mudanças implementadas.
- `docs/VALIDACAO-0.6.5-BETA.md` — verificações e testes pendentes.
- `docs/PLANO-VERTICAL-SLICE-BAIXADA.md` — evolução da primeira área jogável.
- `docs/DIRECAO-DE-ARTE.md` — princípios visuais e escopo aprovado.
