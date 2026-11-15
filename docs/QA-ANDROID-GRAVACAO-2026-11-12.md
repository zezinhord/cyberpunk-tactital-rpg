# QA real Android · gravação de 12/11/2026
A filmagem fornecida tem aproximadamente 170 segundos, resolução 1600×720. O jogador cria protagonista Veterano Militar, seleciona apresentações corporais, acessa Baixada, Oficina, Galeria e Clínica, progride a investigação V-09 e derrota Sentinela-07 na arena usando golpes, Pulso Eletromagnético e Protocolo de Regeneração.

## Constatações visuais
- Sem barras do sistema persistentemente visíveis após o teclado fechar.
- A Baixada está navegável e os interiores acessíveis no teste observado; isso não demonstra validação de todas as células.
- O mapa ainda transmite aparência de plataforma isolada sem continuidade de quarteirões, e os caminhos não têm contraste suficiente.
- Os sprites são reconhecíveis, mas pequenos para leitura de detalhes e de animações.
- Problema prioritário: painel de combate exige rolamento vertical contínuo para acessar Ataque Básico e Encerrar Turno. Isto afeta jogabilidade real em 1600×720.
- No término do combate, cabeçalho ainda informava “Seu turno”, embora a sentinela já estivesse neutralizada.

## Alteração de interface
Painel lateral de combate separado em área rolável para unidade, recursos, habilidades, texto e log, e um bloco fixo inferior com movimentação, ação principal/bônus, curativo, ataque básico, encerrar turno, reiniciar e voltar à Baixada. O indicador de turno apresenta Vitória ou Derrota quando a arena termina. Nenhum método do motor de habilidades, da movimentação ou das recompensas foi alterado.

## Próximo QA
Instalar nova APK e verificar (1) comandos do turno sempre visíveis sem rolagem, (2) barra de habilidades ainda acessível rolando apenas a área superior, (3) vitória exibida no topo após neutralizar sentinela, (4) funcionamento sob diferentes heights de landscape e com teclado. A validação de frame rate, oclusões e desempenho permanece física, não inferida do vídeo.
