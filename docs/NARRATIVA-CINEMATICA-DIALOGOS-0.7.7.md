# NOVA ARCÁDIA 0.7.7 — Direção cinematográfica e conversas expressivas

**Estado:** especificação de produção, **não implementada**. Base visual: 0.7.6 / PR #9. Agente: \`nova-arcadia-game-art-ui\`. Não há alterações de gameplay, assets ou saves neste documento.

## 0. Diagnóstico do jogo atual

- \`src/game/story/opening.ts\`: a abertura tem **seis** painéis: Promise, Eden, Divide, Erased, You, Begin. Inclui identificação da origem e pista V-09. \`OpeningCutscene.tsx\` já fornece digitação gradual (2 caracteres/25 ms), avanço em dois toques, pular e redução de movimento.
- \`src/opening-cutscene.css\`: os quadros são CSS estáticos com formas e planos, não cenas isométricas animadas.
- \`src/screens/ExplorationScreen.tsx\`: um \`DialogueState\` contém páginas \`{speaker,role,portrait,text,choices}\`, e o retrato visual é apenas a letra/símbolo. O \`selectAnswer\` já aplica \`clue\` e \`marketAction\` com efeitos reais de missão; **não remover nem duplicar essas ações**.
- \`src/game/dialogues/patio.ts\`: Lia, Ramon e Duda possuem opções narrativas. Outras interações têm somente fala ou progressão específica. Os novos componentes devem funcionar com ambos.
- \`src/game/character/introductions.ts\`: existem seis introduções exclusivas por origem. O novo prólogo geral não substitui nem invalida essa etapa.
- \`src/game/baixada/sprites.ts\` e \`tools/generate_character_sprites.py\`: spritesheets 64×80 quadros, animações direcionais. **Sprites de corpo inteiro não são equivalentes a retratos emocionais de alta resolução**; desenvolver retratos próprios e consistentes.

## 1. Conceito dramatúrgico

**Título:** NOVA ARCÁDIA: A CIDADE QUE LEMBRA.

**Pergunta narrativa:** quando um sistema decide o que merece permanecer registrado, quem protege as histórias das pessoas que ficaram fora da versão oficial?

**Tom:** thriller urbano com agência comunitária, não trailer de ação genérico. Evitar revelar que Éden é malicioso ou apresentar suspeitas como fatos; sua fala começa institucional e só ganha uma mínima inflexão anômala. Preservar as ambiguidades da Helix, a agência da Baixada e o mistério V-09.

**Duração sugerida:** 80–110 s para quem acompanha o ritmo; **sem contagem obrigatória ou temporizador que trave o usuário**. Pode pular e avançar desde o primeiro quadro. Um toque durante a digitação revela todo o texto; outro avança. Autoavanço somente como opção desligada por padrão; suspende com o app em segundo plano, escolhas e reduzido movimento.

### 1.1 Storyboard completo (8 cenas)

| ID | Quadro e duração indicativa | Cenário e encenação | Áudio / transição | Texto final apresentado |
| --- | --- | --- | --- | --- |
| C01 | **Pulso** · 8–10 s | Tela escura → acende painel distante → skyline tropical em três profundidades, postes e chuva tênue; aproximação lenta | Drone grave; corte seco do preto | “Nova Arcádia não dorme. Ela apenas decide quem pode descansar.” |
| C02 | **A promessa** · 10–12 s | Áurea: torres, câmera subindo por fachada, passarela distante, credenciais. Contraponto ao nível da rua da Baixada | Ambiência corporativa cessa; som de oficina e feira cresce | “Prometeram uma cidade sem sofrimento. / As promessas chegaram primeiro às torres.” |
| C03 | **A rede** · 10–12 s | Plano técnico de trânsito e abastecimento; hexágono verde identifica o Éden, nenhuma outra interface é verde | Sinal limpo e voz institucional sintetizada opcional | “PROJETO ÉDEN: fornecimento estável. Rotas otimizadas. Interrupções minimizadas.” |
| C04 | **Quem sustenta a cidade** · 10–14 s | Baixada: barraca, oficina de Nilo, clínica e casa comum. Personagens pequenos se movem em 2–3 quadros, câmera desliza sem cortar caminhos | Ferramentas, água, rádio baixo, gente na rua | “Na Baixada, nenhuma peça dura para sempre. / Mas sempre há alguém disposto a consertar outra.” |
| C05 | **Registro ausente** · 12–14 s | Close em prontuário da clínica; nome apaga gradualmente, código V-09 permanece. Uma câmera de segurança vira para fora do quadro | Áudio se estreita; interferência âmbar, não verde de Éden | “Entrada confirmada. Identidade removida. / A pessoa existiu. O sistema discorda.” |
| C06 | **Seu passado** · 12–15 s | Silhueta substituída pela aparência escolhida do protagonista, sem sobrescrever gênero/origem; cartão de identidade: nome + classe + local de origem. Plano ao fundo muda conforme origem | Tom da origem, animação de leitura de dados | “{name}. Você não chegou aqui por acaso. / {originLine}” |
| C07 | **Interferência** · 8–12 s | Rede Éden sofre uma pequena duplicação, linha institucional é interrompida por texto não catalogado. Nenhum antagonista revelado | Um único pulso e silêncio curto | “REGISTRO NÃO LOCALIZADO. / ...Por que há uma cópia fora da rede?” |
| C08 | **A primeira pista** · 10–15 s | Câmera acompanha luz da clínica comunitária até o Canal Sul; placa V-09 aparece parcialmente; foco termina na porta da clínica, com botão “Entrar na história” | Ambiente da Baixada aproxima-se e faz transição contínua para exploração/introd. origem | “Uma médica guardou o prontuário que deveria ter desaparecido. / O rastro começa na ocorrência V-09.” |

**Observação de continuidade:** C08 é o gancho da campanha principal, não uma afirmação de que todas as origens devem começar fisicamente na clínica. **Depois do prólogo geral, a introdução de cada origem continua existindo**. O objetivo local da origem é apresentado antes do gameplay; o mapa efetivo permanece o que o código já suporta.

### 1.2 Personalização da cena C06: seis origens

| Origem | Plano ao fundo | Linha contextual |
| --- | --- | --- |
| Corporativo | Corredor Helix, acesso negado | “Você conhece as portas que a Helix prefere manter fechadas.” |
| Baixada | Mercado, clínica e fios | “Você conhece quem mantém a cidade em funcionamento.” |
| Gangue | Subsolo, portões e becos | “Algumas dívidas continuam ativas mesmo depois da saída.” |
| Militar | Ferrugem, bloqueio e silhueta de sentinela | “Você sabe que uma ordem não equivale a justiça.” |
| Pesquisador | Arquivo de laboratório e experimento incompleto | “Você aprendeu a desconfiar de resultados perfeitos demais.” |
| Nômade | Portão perimetral e caravanas | “Você reconhece caminhos que os mapas oficiais não mostram.” |

Não adicionar flags de reputação nesta cena. Nome, origem, classe e apresentação vêm **do mesmo save atual**, usando a aparência real, não uma silhueta masculina universal.

### 1.3 Camadas e transições

**Cena de imagem:** fundo isométrico estático leve, parallax de 2–3 camadas com CSS transform, props panorâmicos e uma camada atmosférica; no máximo uma animação dominante por vez.

**Câmera:** deslocamento suave de 3–6% e zoom moderado de até 1.08; respeitar oclusão, evitar tremor contínuo. No modo reduzido, cortes sem parallax, flash ou digitação prolongada.

**Ritmo:** som ambiente quase constante, um efeito focal por corte, silêncio intencional em C05/C07. Reutilizar \`audioDirector\`, mas mapear efeitos disponíveis antes de invocar chaves novas. Não alegar dublagem onde não existe: voz sintética é opção futura, sempre com legenda.

**Paleta:** ciano aliado, magenta hostil, âmbar neutro, verde exclusivamente na manifestação do Éden. Contraste social se expressa sobretudo por arquitetura, enquadramento, materiais e distribuição de luz.

## 2. Novo sistema de diálogos: NOVA ARCÁDIA / PRESENÇA

### 2.1 Layout de referência (landscape 914×411)

- **Faixa de fundo:** gameplay da cena atual permanece visível e desfocado/escurecido discretamente, sem recriar Phaser ou redimensionar os mapas.
- **Painel modal:** margens adaptativas 12–20 px e safe areas; largura utilizável ~890 px, altura não superior à área livre.
- **Coluna esquerda (aprox. 205 px):** retrato/busto do NPC, silhueta reconhecível, nome, cargo/facção e expressão; recorte contextual do local atrás do retrato.
- **Coluna direita (restante):** linha curta de contexto, texto em até 3–4 linhas visíveis, escolhas em até três linhas/botões de no mínimo 48 dp, ações “Histórico”, “Avançar”, “Encerrar”. Se a fala for longa, **somente o texto rola**, nunca os botões.
- **Modo sem escolhas:** usar o espaço livre para a fala e manter um único CTA de avanço/fechar. Modo com 4+ escolhas: área de lista com rolagem interna, ações fixas. Em telas 914×411, nenhum botão essencial fora do viewport.
- **Versão 1600×720:** retrato ampliado e texto mais arejado, sem esticar pixel art. O foco permanece no NPC; o protagonista aparece em miniatura ou no lado direito apenas quando responde.

**Esquema visual**

    ┌─────────────────────────────────────────────────────────────────────────┐
    │ CENA ATUAL  ·  CLÍNICA / BAIXADA                   HISTÓRICO     ✕   │
    │                                                                         │
    │   [BUSTO: AMARA]   DRA. AMARA SOLIS   ·   MÉDICA COMUNITÁRIA            │
    │   [preocupada]     “O prontuário ainda existe. Só o nome foi apagado.”  │
    │                                                                         │
    │                   [ Ver a cópia local ]                                  │
    │                   [ Quem autorizou a remoção? ]                         │
    │                   [ Preciso de mais informações. ]                      │
    └─────────────────────────────────────────────────────────────────────────┘

### 2.2 Linguagem das expressões e câmera

- **neutro:** pouca animação; contato visual natural.
- **preocupado:** sobrancelhas/olhos e ombros alterados; recuo de 2–3 px.
- **determinado:** olhar estável; aproximação de 1–2%.
- **desconfiado:** olhar lateral e pequena pausa antes da fala.
- **hostil:** expressão fechada; marcador magenta/triângulo somente se a personagem for hostil de fato, não por simples tensão narrativa.
- **Éden:** não usar rosto humano genérico. Apresentar hexágono/rede verde e pulso contido; tom institucional no começo, com microfalhas narrativas posteriores.
- **terminal:** usar representação de equipamento/documento em vez de rosto humano.

Para NPCs principais, produzir bustos próprios com no mínimo **neutro, preocupado e determinado**; expandir para hostil/desconfiado quando o roteiro exigir. As ilustrações devem corresponder ao sprite e roupas já existentes. Os sprites direcionais 64×80 podem fornecer referência, mas **não** ser apenas ampliados como retratos finais.

**Animação de diálogo:** retrato entra em ~180–240 ms, duas poses subtis de respiração, piscar ocasional; uma reação pontual por fala, sem loop de glitch indiscriminado. Tap durante texto animado revela fala inteira; segundo tap avança. Opções aparecem quando o trecho termina. Redução de movimento desativa entrada e idle.

### 2.3 Tipos de conversa e tratamento

| Tipo | Indicador | Particularidade |
| --- | --- | --- |
| Comunitário / neutro | Âmbar e losango | Retrato cálido, ambiente da Baixada |
| Contato aliado | Ciano e círculo | Aliado identificado; não tratar todo NPC simpático como “aliado” mecânico |
| Corporativo | Tons frios e logotipo contextual | Indicador de hostilidade só quando houver hostilidade real |
| Comércio | Âmbar + símbolo de troca | Mantém callbacks de inventário/mercado |
| Tensão / interrogatório | Contraste ampliado, pausa curta | Sem magenta gratuito |
| Terminal / documento | Frame de scanner, sem rosto | Histórico e pistas preservados |
| Projeto Éden | Verde hexagonal exclusivo | Voz institucional e interferência contextual |

### 2.4 Modelo de dados para futura implementação

O adaptador visual **não altera** as missões. O novo tipo estende as páginas existentes por campos opcionais:

    DialogueBeat {
      id: string;
      speakerId?: string;
      speaker: string;
      role: string;
      text: string;
      portraitId?: string;        // "amara", "joana", "nilo", "eden", "terminal"
      emotion?: "neutral" | "concerned" | "resolute" | "suspicious" | "angry";
      tone?: "community" | "ally" | "corporate" | "hostile" | "system" | "eden";
      framing?: "bust" | "split" | "document";
      sfx?: string;
      choices?: ConversationOption[]; // reutilizar o tipo atual
    }

**Migração:** quando \`portraitId\` não existir, mostrar retrato visual neutro do tipo; a letra antiga permanece fallback temporário, nunca tela branca. IDs de \`choices\`, \`clue\` e \`marketAction\` continuam idênticos. O registro de pistas passa pela função atual; a UI **não** grava missão ou XP por si mesma. Cancelar diálogo não deve aplicar decisão pendente.

### 2.5 Exemplo completo A: Dra. Amara (clínica, começo da V-09)

**A1 / Entrada** — Retrato: Amara, preocupada. Ambiente: luz intermitente da clínica.

**AMARA:** “O prontuário ainda existe, mas o nome foi removido. O sistema afirma que ninguém esteve aqui. Eu vi essa pessoa entrar.”

**Escolhas de resposta:**
1. **“Mostre a cópia local.”** — Amara, determinada: “O terminal da recepção ainda guarda uma versão. Consulte a ocorrência V-09.” **Ação:** orientar ao terminal já existente, sem conceder pista fictícia antes da interação.
2. **“Quem autorizou a remoção?”** — Amara, desconfiada: “Não reconheço a assinatura. E alguém parece ter se esforçado para que eu não a reconhecesse.” **Ação:** apenas contexto.
3. **“Por que você não registrou outra denúncia?”** — Amara, cansada: “Registrei. A denúncia desapareceu junto com o prontuário. Foi por isso que fiz cópias.” **Ação:** apenas contexto.

**A2 / Revelação posterior** — Após consulta do terminal, usar a fala existente de Amara: V-09 **não é o nome** da pessoa, e sim um código de transferência ligado à rota técnica do canal. O protagonista não aprende esse fato antes do gatilho apropriado. Uma reação emocional, não um novo efeito de jogo.

### 2.6 Exemplo completo B: Joana (testemunha da Baixada)

**J1 / Entrada** — Retrato: Joana, desconfiada; som baixo de mercado.

**JOANA:** “Depois que levaram aquelas caixas, ninguém quis falar muito sobre a passagem do canal. Tem gente com medo de perder o pouco que tem.”

**Respostas:**
1. **“Você viu quem estava lá?”** — Joana: “Não vi o rosto de todo mundo. Vi as caixas e um veículo sem identificação.” **Pista:** reutilizar a pista Joana existente, sem dar recompensa duplicada.
2. **“Posso proteger os moradores?”** — Joana, determinada: “Então comece escutando. Não somos cenário de investigação.” **Consequência:** possível futura reputação comunitária, **não implementada ainda**.
3. **“Só preciso da localização.”** — Joana, séria: “Perto do canal. Mas o que aconteceu ali não é só um endereço.” **Consequência:** informação, sem bloqueio artificial.

### 2.7 Exemplo completo C: Projeto Éden (interferência narrativa)

**E1 / Mensagem de sistema** — Visual: hexágono verde sobre fluxo de dados. Sem rosto ou facção hostil.

**ÉDEN (institucional):** “Solicitação recebida. A integridade do arquivo consultado não pôde ser confirmada.”

**Opções:** “Quem alterou o arquivo?” → “A origem da alteração não está disponível neste terminal.”; “O registro anterior ainda existe?” → pausa breve e texto “...Consulta não autorizada.”  
**Limite narrativo:** não declarar Éden culpado nem revelar seus objetivos finais na abertura.

## 3. Plano técnico em incrementos isolados

**Entrega 1 — Prólogo:** ampliar \`OpeningVisual\` e \`OPENING_PANELS\` para 8 quadros; extrair a arte para componentes de camadas com parallax controlado; manter marcação \`openingSeen\`, opção pular, \`nextStoryScreen\`, acessibilidade e seis origens. A intro individual continua a seguir.

**Entrega 2 — UI de diálogo:** criar \`NpcDialoguePanel\` e adaptador da estrutura atual; mover a apresentação do bloco JSX de \`ExplorationScreen.tsx\` para esse componente mantendo os mesmos callbacks, \`say\`, \`selectAnswer\` e bloqueios de missão. Integrar Amara, Joana e Nilo primeiro, depois Lia, demais testemunhas e guias distritais.

**Entrega 3 — Retratos:** produzir assets locais por NPC, poses neutro/preocupado/determinado; cache/carregamento por conversa, fallback seguro por tipo de falante; sem imagens remotas ou fonte de rede.

**Entrega 4 — QA:** comparar antes/depois em 914×411 e 1600×720, tanto modo Economia quanto renderização de interiores. Validar tap, foco, botões >48 dp, navegação, mudança de origem, desistência, reabertura, salvamento, preferências de movimento e diálogos de missão/comércio. Sem alegar FPS Android por Chromium.

## 4. Critérios objetivos de aceite

- Abertura completa e pulo terminam na introdução de origem correta; nenhuma missão é desbloqueada apenas pela animação. Criação do protagonista e aparência preservadas.
- Oito cenas visuais distintas e sem tela vazia; progresso e botões sempre acessíveis, inclusive a 914×411, com movimento reduzido.
- No primeiro contato com Amara, Joana e Nilo aparece retrato de personagem — não letra. Mudança de expressão visível e alinhada à fala.
- Selecionar uma resposta não duplica XP, inventário, pistas ou flags; loja e caminhos de missão continuam funcionais.
- Não usar verde de Éden para vegetação/contatos comuns como elemento funcional.
- Com o jogo minimizado e retomado, as falas e os botões mantêm estado seguro, sem loop de som ou crashe.
- Capturas inspecionadas por humano + suites de QA; validação de Galaxy A07 e Redmi Note 12S obrigatória antes de homologar.

**Esta especificação não constitui implementação.** A revisão do gameplay deve ocorrer em branch separada e PR draft, sem merge na \`main\` sem autorização.
