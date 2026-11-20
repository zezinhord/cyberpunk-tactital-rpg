# Nova Arcádia 2.0.0-rc.3 — sistemas reais, conteúdo e limites

**Estado:** QA experimental. **Base:** 2.0.0-rc.2 aprovada em aparelhos pelo proprietário do projeto. `main` e RC2 não modificadas. **Pacote Android:** `com.cyberpunk.tacticalrpg.qa200`, assinatura persistente, versãoCode 2000003.

## Implementado nesta entrega

- **Cyberware:** oito módulos auxiliares com cinco slots anatômicos, até três instalados, capacidade neural por nível, custos reais (materiais coletados), bônus de combate e furtividade; instalado ou removido somente na clínica/oficina; salvamento atômico junto ao inventário v1, sem alterar o slot legado de implantes.
- **Companheiros:** Nilo, Mara, Joana e Téo recrutados nos seus locais de atuação. Dois podem prestar apoio remoto em combate (não aparecem como novas unidades no tabuleiro). Um apoio distinto por parceiro por confronto: energia, interrupção hostil, cura ou mira. Bônus passivos de armadura, vida, energia e ataque; equipe salva por personagem.
- **Infiltração:** escolha anterior ao combate em cada uma das três operações do Cisma, com cálculo determinístico por classe, nível, cyberware, aliados e exposição. Sucesso enfraquece e bloqueia a primeira ação inimiga; falha aumenta a ameaça inicial; assalto frontal mantém o estado padrão. Não permite reroll por recarregar o app; só uma abordagem persistente por encontro.
- **28 contratos paralelos completos** nos 28 interiores novos (35 interiores no total). Cada contrato tem diálogo de aceite com NPC local, três evidências físicas obrigatórias em objetos do mapa, retorno ao NPC, dossiê com texto próprio e experiência única. Total **84 pistas físicas** nos 28 contratos, além dos objetos e mapas anteriores.
- **Compatibilidade com slots e backups:** equipes, abordagens, contratos e inventário com cyberware exportados/importados, validadores contra IDs falsificados, limpeza apenas ao excluir slot, experiência reconciliável após interrupção. Consumo de suprimentos não reinicializa o combate.
- **Continuações preservadas:** 31 etapas novas dos Atos I–IV, 3 confrontos táticos do Cisma com 2/2/3 ondas, 3 deliberações no Ato I + 3 resoluções finais combináveis, consequências de reputação e área nos sete distritos; 11 classes com três linhas de especialização existentes (33 linhas).

## Aceites automatizados

- `npx tsc -b`;
- `scripts/test-cyberware-v20.mjs`;
- `scripts/test-companions-v20.mjs`;
- `scripts/test-stealth-v20.mjs`;
- `scripts/test-inner-contracts-v20.mjs`;
- `scripts/test-save-slots.mjs`, incluindo cópias legadas, rollback, dados inválidos e exclusão;
- Toda a CI anterior (classes, navegação, colisões, 35 interiores, campanha e confrontos).
- QA Android: biblioteca de mídia original restaurada e autenticada, build Vite/Capacitor/Gradle, assinatura QA200 idêntica, Android 15/2 GB com instalação, abertura e reabertura obrigatórias antes de publicar release.

## O que permanece em aberto

**Não corresponde à versão final prometida de 3 GB.** Os 28 interiores usam rendering isométrico procedural da engine. O pacote conserva ~1,14 GB de áudio/arte original; adicionar missões e sistemas em TypeScript não aumenta muito o APK. Falta produção de grande volume de **arte original utilizada** (sprites finais, cenas ilustradas, variedade de cenários e animações, interfaces); pipeline modular de pacotes de recursos; testes em tempo real de duração de campanha e balanceamento; performance e memória em diferentes aparelhos; personagens acompanhantes como unidades táticas com locomoção própria (atualmente suporte remoto); infiltração no mapa aberto com linhas de visão e ruído (atualmente se aplica a três operações). As classes já possuem três caminhos, mas habilidades definitivas e balanceamento de longo prazo merecem revisão.

**Não inflar o APK** com trilhas repetidas, arquivos não referenciados, cenas falsas ou bytes aleatórios. Entregar 3 GB significa criar conteúdo acessível e validado pelo jogo, preferindo atualização por asset packs em vez de um APK monolítico que arrisque regressão de memória.

**Documentação:** https://github.com/zezinhord/cyberpunk-tactital-rpg/pull/21. A instalação da RC3 deve manter `com.cyberpunk.tacticalrpg.qa200` e o mesmo certificado SHA256 `43afabd6de5f33ebeb5958eb0d300d64e1012ddc9bcd98c1d302ae3101ce4404`.
