# Nova Arcádia 0.6.8-alpha.5 — Salvamentos seguros e estabilização Android

**Branch:** `feature/landscape-mobile-v1` (sem merge com `main`).
**Escopo:** estabilização do protótipo aprovado, sem ampliar mapa nem alterar classes/origens.

## Funcionalidades entregues

### 1. Oito slots separados
- `src/game/character/slot-core.ts` mantém `CHARACTER_SAVE_KEY` original e um índice de até oito protagonistas.
- `src/game/character/storage.ts` salva cada personagem na sua própria chave; `slots.ts` permite listar, alternar e remover.
- Salvamentos 0.6.8 anteriores, que só tinham a chave única, são migrados ao abrir a listagem.
- Os dados de cada personagem continuam segregados por ID: itens, apresentação corporal, coordenadas, missão, V-09, Mercado dos Cabos e Vida.
- `Novo jogo` não apaga automaticamente o anterior; exclusão exige confirmação.
- Excluir um slot elimina seus dados auxiliares e não modifica os outros protagonistas.

### 2. Backups portáveis JSON
- A tela inicial > **Carregar jogo** mostra os slots e ações **Jogar**, **Exportar**, **Excluir** e **Restaurar backup JSON**.
- `backup.ts` serializa somente sete categorias conhecidas: `inventory`, `appearance`, `location`, `mission`, `v09`, `market`, `health`, mais o protagonista.
- Exportação tenta primeiro o compartilhamento nativo de arquivo (quando disponível) e usa download de arquivo como alternativa.
- Importação valida versão, identidade, formato, tamanho de até 1 MB e chaves autorizadas. Se o personagem já existir, a substituição exige confirmação.
- Exportar um slot que não está ativo **não altera o personagem ativo**.
- O formato não executa código e não copia chaves arbitrárias para o armazenamento.

### 3. Vida persistente
- `src/game/combat/health.ts` grava a Vida por protagonista, sem mudar o formato antigo do save.
- `TurnManager` recebe `currentHp` ao iniciar cada combate; ferimentos continuam entre a arena, V-09 e a exploração.
- Curativos afetam o valor persistente de Vida; a exploração mostra o medidor.
- Em derrota, a Vida é estabilizada em 1 PV para evitar que o protagonista fique sem condições de circular.
- Dentro da clínica, a opção **Receber tratamento** restaura a Vida máxima e informa a quantidade recuperada.
- Esta fase **não implementa doenças, ferimentos localizados, exaustão, custo médico nem consumo de medicamentos na clínica**.

### 4. Dependências reproduzíveis
- `package-lock.json` foi gerado no runner com acesso ao registro npm, armazenado na branch de desenvolvimento.
- O workflow agora usa `npm ci --no-audit --no-fund`, que não recalcula a árvore de dependências.

### 5. Assinatura da APK
- O workflow gera uma chave debug RSA de desenvolvimento caso nenhuma esteja no cache da branch, e a guarda via `actions/cache@v4`.
- `scripts/force-android-signing.mjs` obriga o Gradle a assinar com essa chave, em vez de depender do keystore debug implícito.
- `apksigner verify --verbose --print-certs` valida o APK real gerado, e o workflow **rejeita mudanças na impressão digital** fixada em `config/android-debug-cert.sha256`.
- O pull request executa testes, **mas não distribui uma segunda APK** com outra assinatura, evitando a confusão de artefatos de certificados distintos.
- Certificado de desenvolvimento fixado para a branch:
  `283d438f9cf84c550a6df840887b23e2535a402b1961362541c8c892a86ca93e`
- **Atenção:** a chave privada continua em cache do GitHub Actions, que pode ser descartado. Se o cache for perdido, o novo APK será bloqueado pela verificação de fingerprint; não existem garantias de recuperação da chave. A assinatura realmente permanente requer guardar o keystore com segurança fora do cache (p. ex., GitHub Actions Secrets) e configurar o job para recuperá-lo. **Não salvar a chave privada em repositório público.**
- **APKs anteriores com outro certificado não são atualizadas automaticamente pela versão alpha.5.** Não desinstale a anterior sem preservar os dados; o aplicativo antigo pode não possuir exportação de backup. Não há migração automática garantida do armazenamento desse pacote quando a assinatura muda.

## Testes

### Automatizados
- `scripts/test-save-slots.mjs`: isolamento, importação/exportação, migração do save único, conflitos, exclusão, validação e limite de oito slots, saúde/curativo.
- `scripts/test-class-saves.mjs`: as 66 combinações origem-classe, sem lotar o novo armazenamento.
- Demais suítes: colisões, ruas, NPCs, diálogos, 11 habilidades, V-09, áudio, assets e TypeScript/Vite.

### Chromium real
- Captura landscape 1600×720 dos setores e arena preservada.
- Teste mobile 914×411 dos slots com botões de toque >=44px.
- Verifica que Vida 6 PV na exploração entra no combate com 6 PV, sobe para 11 PV com curativo e continua em 11 PV ao retornar.
- Emulador de navegador não é um dispositivo Android real.

### Android
- Capacitor/Gradle `assembleDebug`, `apksigner verify`, certificado SHA-256.
- **Ainda não executado em telefone físico**: seleção de arquivo com navegador de documentos, compartilhamento nativo, atualização por assinatura, reinício do app durante combate e desempenho térmico/FPS.

## Roteiro recomendado de QA físico
1. **Antes de instalar:** confirme se o Android aceita atualização sem desinstalar. Se pedir remoção, avalie a perda do save antigo e não prossiga sem aceitá-la.
2. Após instalar a alpha.5, crie dois protagonistas com origens/classes diferentes.
3. Em Carregar jogo, alterne os personagens; confirme inventário, localização e missões independentes.
4. Exporte o backup JSON de um deles e confirme que o arquivo realmente foi salvo/compartilhado pelo Android.
5. Exclua apenas o outro personagem e confirme que o primeiro continua disponível.
6. Restaure o backup exportado e confirme que a Vida, as pistas do mercado e o equipamento são recuperados.
7. Fique ferido na arena, retorne à Baixada, entre novamente e verifique a Vida. Use um curativo; visite a clínica.
8. Confirme que os controles cabem em 914×411 e que o jogo continua estável em landscape.
9. Nas próximas builds **assinadas com o mesmo certificado da alpha.5**, atualize diretamente e verifique o save.

## Limitações reconhecidas
O arquivo JSON é uma cópia local fornecida ao usuário; não há backup em nuvem automático, múltiplos dispositivos sincronizados, autenticação remota ou criptografia do arquivo exportado. Não use armazenamento público para backups se contiverem dados que prefira manter privados.
