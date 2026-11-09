import type { OriginId } from "./origins";
import type { OriginIntroduction } from "./types";

/** Prólogos independentes: cada origem começa em seu próprio contexto narrativo. */
export const ORIGIN_INTRODUCTIONS: Readonly<Record<OriginId, OriginIntroduction>> = {
  corporativo: {
    id: "intro_corporativo",
    title: "O último acesso",
    setting: "Anexo administrativo da Helix · Áurea",
    narrative:
      "O elevador reconhece seu rosto, mas não sua autorização. Por alguns segundos, as luzes do anexo ficam verdes; em seguida, todos os painéis exibem a mesma mensagem: ACESSO REVOGADO. Você veio recuperar uma cópia de um relatório que provava alterações nos registros de segurança. O arquivo desapareceu do sistema oficial, mas uma credencial antiga ainda responde em um terminal isolado.",
    objective: "Acesse o terminal arquivado e recupere o fragmento do relatório.",
    openingLine: "IDENTIDADE RECONHECIDA. Seu vínculo institucional foi encerrado. Sua observação, não.",
  },
  baixada: {
    id: "intro_baixada",
    title: "O nome que sumiu",
    setting: "Clínica comunitária · Baixada",
    narrative:
      "A clínica funciona com peças recuperadas e energia instável. A pessoa que você procurava esteve ali por causa de um implante defeituoso; depois do atendimento, desapareceu. A Dra. Amara Solis mostra o prontuário: a consulta existe, mas a identificação do paciente foi apagada. Do lado de fora, moradores juram ter visto um veículo de segurança levando alguém durante a madrugada.",
    objective: "Converse com a médica e examine o terminal de registros da clínica.",
    openingLine: "OCORRÊNCIA COMUNITÁRIA LOCALIZADA. O registro foi removido por uma autoridade não identificada.",
  },
  gangue: {
    id: "intro_gangue",
    title: "Dívida de saída",
    setting: "Mercado Cinzento · Subsolo",
    narrative:
      "O Subsolo continua negociando o que a cidade de cima finge não existir. Você reconhece os sinais nas paredes: a antiga organização ainda procura por você. Dorian Kade oferece uma saída — uma entrega recuperada de um depósito automatizado em troca de apagar uma dívida antiga. Antes que a conversa termine, um intermediário menciona uma operação da qual você participou e que, oficialmente, nunca aconteceu.",
    objective: "Encontre Dorian Kade e descubra quem está rastreando a antiga operação.",
    openingLine: "PADRÃO DE IDENTIFICAÇÃO CRIMINAL RECONHECIDO. O histórico de associação permanece ativo.",
  },
  militar: {
    id: "intro_militar",
    title: "Ordem de contenção",
    setting: "Ponto de controle industrial · Ferrugem",
    narrative:
      "O turno da fábrica termina sob sirenes. Um bloqueio automatizado impede trabalhadores de deixar o setor, embora não exista alerta de vazamento ou ataque. O protocolo é familiar: isolamento, classificação de risco e contenção. É o mesmo procedimento que você recebeu na operação que encerrou sua carreira — uma ordem que colocou civis na linha de fogo. Um antigo colega pede que você não intervenha.",
    objective: "Verifique o painel de contenção e identifique quem autorizou o bloqueio.",
    openingLine: "PROTOCOLO OPERACIONAL RECONHECIDO. Perfil de resposta tática compatível.",
  },
  pesquisador: {
    id: "intro_pesquisador",
    title: "A variável ausente",
    setting: "Anexo de pesquisa independente · Áurea",
    narrative:
      "Seu acesso aos laboratórios foi cancelado depois que você encontrou divergências em uma série de experimentos. Os dados indicavam decisões automatizadas que não constavam na arquitetura documentada do Projeto Éden. No anexo independente, uma cópia parcial do experimento permanece em cache. Entre centenas de identificadores, um registro contém seu nome — associado a uma observação anterior ao início de sua investigação.",
    objective: "Reconstrua o arquivo parcial e identifique a origem do registro pessoal.",
    openingLine: "IDENTIDADE RECONHECIDA. A variável consta em registros anteriores à coleta declarada.",
  },
  nomade: {
    id: "intro_nomade",
    title: "Antes do portão",
    setting: "Portão perimetral · Limite urbano",
    narrative:
      "Você chega a Nova Arcádia depois de atravessar assentamentos e zonas industriais fora dos mapas públicos. O portão perimetral libera a passagem sem solicitar documentos. Isso deveria ser impossível: seu cadastro ainda não foi criado. Um terminal de inspeção pisca, registra sua presença e apaga a própria tela. Ao longe, um veículo sem identificação deixa a via principal e segue em sua direção.",
    objective: "Atravesse a zona de inspeção e descubra por que o sistema já conhece sua identidade.",
    openingLine: "IDENTIDADE RECONHECIDA. Primeiro registro confirmado antes da entrada na cidade.",
  },
};

export function getOriginIntroduction(originId: OriginId): OriginIntroduction {
  return ORIGIN_INTRODUCTIONS[originId];
}
