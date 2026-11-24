/** 28 avaliações forenses autorais, vinculadas às 28 salas da expansão.
 * Requer as três provas reais e a entrega do contrato. Resposta errada
 * não altera o save nem bloqueia a possibilidade de reexaminar a questão.
 */
import type {ExpansionInnerId} from "../districts/expansion-interiors.ts";
export interface ForensicCase{
 readonly question:string;
 readonly options:readonly [string,string,string];
 readonly correctIndex:0|1|2;
 readonly explanation:string;
 readonly rewardXp:number;
}
export const FORENSIC_CASES={
  "baixada-observatorio": {
    "question": "As cisternas estavam vazias antes da ordem de racionamento. Qual hipótese as medições sustentam?",
    "options": [
      "Uma seca absoluta atingiu todas as casas ao mesmo tempo.",
      "O sistema desviou a água apesar das chuvas registradas.",
      "Moradores danificaram intencionalmente os hidrômetros."
    ],
    "correctIndex": 1,
    "explanation": "O pluviômetro e a régua mecânica mostram água disponível e desvio de distribuição. Não se deve acusar moradores sem evidências.",
    "rewardXp": 24
  },
  "baixada-mercado-noturno": {
    "question": "A feira perde energia sempre que os sensores declaram o bairro vazio. O que corrigir primeiro?",
    "options": [
      "Reprogramar a alimentação para reconhecer o uso noturno e preservar a clínica.",
      "Desligar a feira para tornar correta a previsão automatizada.",
      "Publicar as credenciais individuais de todos os vendedores."
    ],
    "correctIndex": 0,
    "explanation": "Os recibos comprovam atividade legítima à noite. Redistribuir energia evita punir trabalhadores e não exige identificar pessoas.",
    "rewardXp": 28
  },
  "baixada-passarela": {
    "question": "Um sensor lê movimento por trás das cortinas. Qual intervenção é proporcional?",
    "options": [
      "Expandir a vigilância para provar quem mora em cada casa.",
      "Destruir o sistema comunitário de sinais.",
      "Limitar o campo de captura às vias públicas e preservar os avisos dos varais."
    ],
    "correctIndex": 2,
    "explanation": "O sensor desmontado demonstra captura de janelas privadas, enquanto os varais funcionam sem cadastro pessoal.",
    "rewardXp": 32
  },
  "baixada-memorial": {
    "question": "As vozes e os nomes divergem dos arquivos oficiais. Como tornar o memorial uma prova confiável?",
    "options": [
      "Apagar depoimentos não assinados e manter só o cadastro Helix.",
      "Registrar proveniência e consentimento, preservando testemunhos sem expor familiares.",
      "Divulgar endereços dos parentes para facilitar auditorias."
    ],
    "correctIndex": 1,
    "explanation": "Datas, gravação e relatos precisam de contexto e autorização. A ausência no cadastro não invalida automaticamente uma testemunha.",
    "rewardXp": 36
  },
  "ferrugem-turnos": {
    "question": "O relógio de bancada e o livro de ponto mostram jornadas diferentes. O que explica a discrepância?",
    "options": [
      "Uma escala digital substituiu horas efetivamente trabalhadas por intervalos fictícios.",
      "Todos os operários erraram o horário da fábrica.",
      "O oscilador comprova que nenhum trabalhador estava presente."
    ],
    "correctIndex": 0,
    "explanation": "Registros paralelos e medição independente contestam a versão oficial e sustentam uma revisão transparente das jornadas.",
    "rewardXp": 40
  },
  "ferrugem-caldeira": {
    "question": "Um pico de pressão foi classificado como erro humano. Qual prova deve orientar a perícia?",
    "options": [
      "A opinião do supervisor responsável pela meta mensal.",
      "O número de ferimentos como substituto da leitura técnica.",
      "O histórico do controlador confrontado com a ordem de manutenção e os filtros."
    ],
    "correctIndex": 2,
    "explanation": "A sequência do controlador e a condição física da caldeira permitem reconstruir o evento, sem presumir culpa de quem operava.",
    "rewardXp": 44
  },
  "ferrugem-sindicato": {
    "question": "A assembleia foi invalidada porque o painel eletrônico registrou poucos votantes. Qual solução preserva o direito coletivo?",
    "options": [
      "Aceitar o sistema corporativo como árbitro único.",
      "Conferir votos e presenças da urna com o painel, documentando a divergência.",
      "Expor publicamente a identidade dos votantes discordantes."
    ],
    "correctIndex": 1,
    "explanation": "O quórum deve ser auditável sem coerção. A urna física e o painel oferecem evidências complementares e contestáveis.",
    "rewardXp": 48
  },
  "ferrugem-carga": {
    "question": "Um vagão consta como entregue, mas a carga não chegou à comunidade. Qual pista estabelece o trajeto?",
    "options": [
      "Cruzamento entre manifesto, registro do guincho e lacres de isolamento.",
      "O destino declarado no anúncio de transporte.",
      "A cor da locomotiva que passou pela estação."
    ],
    "correctIndex": 0,
    "explanation": "Manifesto e operação do guincho indicam onde ocorreu a transferência; o lacre impede confundir carga igual com o mesmo lote.",
    "rewardXp": 24
  },
  "aurea-contabilidade": {
    "question": "Os serviços de manutenção aparecem pagos duas vezes por entidades distintas. Qual auditoria é defensável?",
    "options": [
      "Considerar todo pagamento duplicado uma doação.",
      "Apagar notas fiscais para interromper o fluxo.",
      "Reconciliar prestadores, datas e autorizações antes de atribuir responsabilidade."
    ],
    "correctIndex": 2,
    "explanation": "A relação de terceiros e o consolidador permitem seguir a cadeia contábil; duplicidade aparente ainda exige comprovação.",
    "rewardXp": 28
  },
  "aurea-triagem": {
    "question": "O leitor de prioridade rejeitou pacientes sem credencial, mesmo em risco clínico. Qual critério deve prevalecer?",
    "options": [
      "A reputação da corporação onde a pessoa trabalha.",
      "A urgência médica verificável, com revisão da decisão automatizada.",
      "A capacidade de compra do seguro hospitalar."
    ],
    "correctIndex": 1,
    "explanation": "A lista de espera permite identificar prejuízo real. Um protocolo de triagem deve considerar necessidade clínica, não afiliação econômica.",
    "rewardXp": 32
  },
  "aurea-cabos": {
    "question": "O mapa de conexões contém um circuito fechado que bloqueia avisos de segurança. Como isolá-lo?",
    "options": [
      "Desativar a chave de comutação do circuito irregular e testar a rota de emergência.",
      "Cortar toda a rede sem identificar o circuito.",
      "Enviar todos os dados privados ao primeiro repetidor disponível."
    ],
    "correctIndex": 0,
    "explanation": "A topologia e a chave local permitem isolar a falha sem desligar serviços essenciais nem expor o tráfego protegido.",
    "rewardXp": 36
  },
  "aurea-contratos": {
    "question": "Um aditivo contratual muda a política de dados sem autor identificável. O que vale como prova?",
    "options": [
      "A logomarca Helix impressa no contrato.",
      "O testemunho isolado de um executivo.",
      "Cadeia de versões, assinatura verificável e autorização de quem podia alterar a cláusula."
    ],
    "correctIndex": 2,
    "explanation": "Carimbos digitais podem registrar uma operação sem provar consentimento. A autoria precisa ser rastreada por versões e competências.",
    "rewardXp": 40
  },
  "subsolo-ventilacao": {
    "question": "O controle de ar favorece pontos monitorados e reduz oxigênio em abrigos. Qual saída é segura?",
    "options": [
      "Publicar o mapa detalhado de todos os abrigos.",
      "Equilibrar a vazão com leituras locais sem transmitir localizações privadas.",
      "Desligar os ventiladores até que os moradores sejam cadastrados."
    ],
    "correctIndex": 1,
    "explanation": "A escala e a turbina reparam a distribuição do ar. A privacidade dos moradores não deve ser o preço de respirar.",
    "rewardXp": 44
  },
  "subsolo-enfermaria": {
    "question": "A enfermaria improvisada recebe ordens para entregar listas nominativas. O que deve ser compartilhado?",
    "options": [
      "Dados clínicos agregados necessários ao abastecimento, com consentimento para casos individuais.",
      "Prontuários completos porque o algoritmo solicita.",
      "Nenhum pedido de suprimentos, mesmo em emergência."
    ],
    "correctIndex": 0,
    "explanation": "O caderno e o purificador sustentam a necessidade de insumos sem divulgar nomes, rotas ou históricos individuais.",
    "rewardXp": 48
  },
  "subsolo-arquivo": {
    "question": "A planta hidráulica foi desenhada sem endereços de residências. Que leitura respeita essa escolha?",
    "options": [
      "Adicionar as casas ao mapa para monetizar o serviço.",
      "Cancelar o reparo por falta de cadastro nominal.",
      "Usar vazões e trechos públicos para reparar o sistema, preservando os acessos privados."
    ],
    "correctIndex": 2,
    "explanation": "O rastreador permite localizar o defeito por circuito. Mapear o reparo não autoriza revelar entradas de abrigo.",
    "rewardXp": 24
  },
  "subsolo-trocas": {
    "question": "O livro de dívidas inclui valores cobrados após interrupções de energia causadas pela Helix. Qual reparação faz sentido?",
    "options": [
      "Cobrar juros maiores para custear sensores novos.",
      "Revisar as dívidas geradas pelo corte antes de exigir pagamento.",
      "Divulgar a lista de devedores como medida de transparência."
    ],
    "correctIndex": 1,
    "explanation": "A balança e o livro mostram prejuízos materiais. Responsabilizar moradores por um serviço indisponível distorce o contrato social.",
    "rewardXp": 28
  },
  "setor-zero-enfermaria": {
    "question": "Um protocolo de isolamento impede a reposição de oxigênio em pacientes. Qual ação evita dano adicional?",
    "options": [
      "Restaurar primeiro o circuito respiratório e registrar o comando que o bloqueou.",
      "Desligar todos os respiradores para reiniciar a rede.",
      "Tratar a ordem automática como autorização clínica suficiente."
    ],
    "correctIndex": 0,
    "explanation": "O histórico e os aparelhos mostram um risco imediato. Segurança de rede não justifica suspender cuidados vitais.",
    "rewardXp": 32
  },
  "setor-zero-despressurizacao": {
    "question": "A ordem de isolamento manda manter duas portas fechadas enquanto a pressão aumenta. Qual procedimento é verificável?",
    "options": [
      "Abrir as duas portas sem avaliar a pressão.",
      "Ignorar a válvula porque o protocolo é automático.",
      "Usar o registro e a válvula de emergência para equalizar setores antes da abertura."
    ],
    "correctIndex": 2,
    "explanation": "A diferença de pressão é observável. Uma intervenção sequenciada reduz risco para pessoas e protege o restante do complexo.",
    "rewardXp": 36
  },
  "setor-zero-reator": {
    "question": "O reator reserva alimenta a enfermaria, mas também um módulo de coerção. Que intervenção é seletiva?",
    "options": [
      "Cortar a alimentação geral para impedir qualquer uso indevido.",
      "Isolar a derivação coercitiva e manter o circuito médico supervisionado.",
      "Elevar a potência para vencer o bloqueio de software."
    ],
    "correctIndex": 1,
    "explanation": "O diário de energia e o módulo permitem rastrear cargas distintas. O objetivo é neutralizar coerção sem colapsar suporte vital.",
    "rewardXp": 40
  },
  "setor-zero-veto": {
    "question": "Um veto de emergência foi revogado por assinatura não verificável. Como restaurar o controle democrático?",
    "options": [
      "Auditar a cadeia de revisão e reativar o mecanismo limitado sob dupla supervisão.",
      "Apagar o histórico de revisões para evitar contestação.",
      "Conceder à Helix poder ilimitado de emergência."
    ],
    "correctIndex": 0,
    "explanation": "O procedimento revogado e a assinatura registram a ruptura das garantias. O restabelecimento exige rastreabilidade e fiscalização.",
    "rewardXp": 44
  },
  "prisma-radio": {
    "question": "Uma entrevista sobre os cortes foi interrompida antes da resposta dos moradores. Como corrigir o registro?",
    "options": [
      "Reproduzir apenas o trecho favorável à patrocinadora.",
      "Incluir comentários anônimos não verificados como fatos.",
      "Publicar o trecho completo verificado e oferecer direito de resposta sem expor fontes."
    ],
    "correctIndex": 2,
    "explanation": "A gravação e a mesa de sinal mostram a interrupção. A correção editorial deve preservar contexto e segurança das testemunhas.",
    "rewardXp": 48
  },
  "prisma-camarins": {
    "question": "Artistas foram obrigados a ceder dados biométricos para entrar no palco. Que alternativa é apropriada?",
    "options": [
      "Proibir apresentações comunitárias por falta de rastreamento.",
      "Usar credenciais temporárias não biométricas e registrar os acessos necessários.",
      "Publicar as leituras corporais no painel do teatro."
    ],
    "correctIndex": 1,
    "explanation": "O diário de produção e o controlador demonstram que a operação do palco não depende de identificação biométrica permanente.",
    "rewardXp": 24
  },
  "prisma-galeria": {
    "question": "A instalação reúne depoimentos de pessoas desaparecidas do cadastro. Como exibir o material?",
    "options": [
      "Solicitar autorização e separar registros públicos de materiais protegidos.",
      "Proteger a galeria apagando as falas contraditórias.",
      "Transmitir todas as gravações automaticamente para gerar audiência."
    ],
    "correctIndex": 0,
    "explanation": "O testemunho precisa de consentimento, contexto e possibilidade de contestação. Arquivar não equivale a ter licença para expor.",
    "rewardXp": 28
  },
  "prisma-estudio": {
    "question": "Uma mensagem falsa continua circulando após a retificação. Qual resposta melhora a informação pública?",
    "options": [
      "Censurar todas as falas sobre o tema.",
      "Publicar a retificação sem indicar o que estava errado.",
      "Associar a correção ao registro original, preservar histórico e apresentar a evidência."
    ],
    "correctIndex": 2,
    "explanation": "O painel e o gravador multicanal permitem ligar versões e registrar a origem de cada afirmação.",
    "rewardXp": 32
  },
  "periferia-garagem": {
    "question": "Uma caravana aparece como inexistente porque não tem endereço fixo. Como demonstrar a viagem?",
    "options": [
      "Exigir domicílio corporativo dos motoristas.",
      "Cruzamento entre caderno de viagens, consumo de carga e recibos de manutenção.",
      "Excluir a caravana dos mapas para simplificar a logística."
    ],
    "correctIndex": 1,
    "explanation": "Documentos de percurso e carregador auxiliar permitem verificar deslocamentos sem impor residência fixa.",
    "rewardXp": 36
  },
  "periferia-estufa": {
    "question": "O sistema declarou a estufa improdutiva apesar da colheita comunitária. Qual teste resolve a divergência?",
    "options": [
      "Confrontar memorial de colheita com vazão de irrigação e consumo elétrico.",
      "Destruir a plantação para repetir a medição.",
      "Aceitar o cálculo de produtividade corporativo sem inspeção."
    ],
    "correctIndex": 0,
    "explanation": "A bomba e a reserva fotovoltaica sustentam a atividade observada. Indicadores que ignoram autoconsumo não descrevem toda a produção.",
    "rewardXp": 40
  },
  "periferia-posto": {
    "question": "A central deseja trajetos médicos completos para justificar suprimentos. O que é suficiente?",
    "options": [
      "Transferir históricos completos dos pacientes para a Helix.",
      "Recusar pedidos de emergência até haver uma credencial.",
      "Validar atendimentos e consumo de insumos, ocultando rotas pessoais desnecessárias."
    ],
    "correctIndex": 2,
    "explanation": "O livro de resgates e o rádio confirmam intervenções. A prestação de contas pode preservar sigilo e segurança de quem recebeu socorro.",
    "rewardXp": 44
  },
  "periferia-farol": {
    "question": "O farol apagou rotas locais após uma atualização da rede. Como reabrir a estrada sem criar rastreamento permanente?",
    "options": [
      "Exigir que caravanas transmitam sua posição o tempo inteiro.",
      "Restaurar sinais públicos de orientação e limitar telemetria a alertas voluntários.",
      "Divulgar localizações de todos os acampamentos no painel."
    ],
    "correctIndex": 1,
    "explanation": "A bússola e o mapa de visibilidade permitem sinalizar caminhos sem identificar viajantes ou acampamentos.",
    "rewardXp": 48
  }
} as const satisfies Record<ExpansionInnerId,ForensicCase>;
