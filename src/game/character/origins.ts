/**
 * Registro inicial das seis origens do protagonista.
 *
 * As vantagens narrativas e os primeiros efeitos mecânicos estão descritos
 * no módulo gameplay.ts; seus valores ainda são provisórios e balanceáveis.
 */

export const ORIGIN_IDS = [
  "corporativo",
  "baixada",
  "gangue",
  "militar",
  "pesquisador",
  "nomade",
] as const;

export type OriginId = (typeof ORIGIN_IDS)[number];

export type OriginAdvantageCategory = "passive" | "active" | "narrative";
export type OriginAdvantageStatus = "planned" | "implemented";

export interface OriginAdvantage {
  id: string;
  category: OriginAdvantageCategory;
  name: string;
  description: string;
  status: OriginAdvantageStatus;
}

export interface OriginStartingLocation {
  /** Identificador do distrito ou da região externa no mapa. */
  districtId: string;
  /** Identificador único do ponto inicial dentro do distrito. */
  areaId: string;
  areaName: string;
  /** A região ainda precisa ser incorporada ao mapa definitivo. */
  provisional?: boolean;
}

export interface OriginContact {
  id: string;
  name: string;
  role: string;
}

export interface OriginEdenRecord {
  id: string;
  title: string;
  firstClue: string;
}

export interface OriginDefinition {
  id: OriginId;
  name: string;
  tagline: string;
  description: string;
  background: string;
  startingLocation: OriginStartingLocation;
  introductionId: string;
  advantages: readonly OriginAdvantage[];
  contacts: readonly OriginContact[];
  dialogueTags: readonly string[];
  edenRecord: OriginEdenRecord;
}

export type OriginRegistry = {
  readonly [Id in OriginId]: OriginDefinition & { readonly id: Id };
};

/**
 * O status "implemented" indica que a vantagem já possui efeito na versão
 * demonstrativa; não significa que toda a progressão narrativa esteja pronta.
 */
export const ORIGINS = {
  corporativo: {
    id: "corporativo",
    name: "Ex-funcionário corporativo",
    tagline: "Você conhece os protocolos por dentro.",
    description:
      "Você trabalhou para uma empresa vinculada à Helix e deixou a corporação depois de encontrar irregularidades em documentos e operações internas.",
    background:
      "Seu antigo acesso foi cancelado depois que você questionou seus superiores. Ainda existem registros de sua passagem pela estrutura corporativa.",
    startingLocation: {
      districtId: "aurea",
      areaId: "helix_administrative_annex",
      areaName: "Anexo administrativo da Helix",
    },
    introductionId: "intro_corporativo",
    advantages: [
      {
        id: "corporativo_leitura_protocolos",
        category: "passive",
        name: "Leitura de protocolos",
        description:
          "Reconhece procedimentos e rotinas de segurança corporativas, recebendo +1 de Defesa (CA) no combate de teste.",
        status: "implemented",
      },
      {
        id: "corporativo_credencial_arquivada",
        category: "active",
        name: "Credencial arquivada",
        description:
          "Ativa um protocolo residual de segurança e recebe +2 de Defesa até a próxima ação inimiga.",
        status: "implemented",
      },
    ],
    contacts: [
      {
        id: "helena_voss",
        name: "Helena Voss",
        role:
          "Diretora da Helix; conhece parte do histórico profissional do protagonista.",
      },
    ],
    dialogueTags: ["origin:corporativo", "knowledge:corporate_protocols"],
    edenRecord: {
      id: "eden_record_corporativo",
      title: "Histórico de identificação corporativa",
      firstClue:
        "Seu antigo identificador aparece em um sistema que deveria ter sido desativado.",
    },
  },

  baixada: {
    id: "baixada",
    name: "Habitante da Baixada",
    tagline: "A cidade oficial nunca contou a sua história inteira.",
    description:
      "Você cresceu na Baixada, entre redes comunitárias, comércio informal, oficinas e tecnologia reaproveitada.",
    background:
      "Uma pessoa próxima desapareceu depois de procurar atendimento por causa de um implante defeituoso. Os registros oficiais não explicam o que aconteceu.",
    startingLocation: {
      districtId: "baixada",
      areaId: "community_clinic",
      areaName: "Clínica comunitária",
    },
    introductionId: "intro_baixada",
    advantages: [
      {
        id: "baixada_rede_comunitaria",
        category: "passive",
        name: "Rede comunitária",
        description:
          "Os vínculos comunitários e os recursos compartilhados aumentam sua Vida máxima em 3 pontos.",
        status: "implemented",
      },
      {
        id: "baixada_rotas_locais",
        category: "active",
        name: "Rotas locais",
        description:
          "Encontra um atalho local e recebe +3 células de movimento neste turno.",
        status: "implemented",
      },
    ],
    contacts: [
      {
        id: "dra_amara_solis",
        name: "Dra. Amara Solis",
        role:
          "Médica independente que atende moradores da Baixada e conhece a comunidade.",
      },
    ],
    dialogueTags: ["origin:baixada", "knowledge:community_routes"],
    edenRecord: {
      id: "eden_record_baixada",
      title: "Ocorrência comunitária apagada",
      firstClue:
        "Uma referência ligada ao desaparecimento ainda existe na infraestrutura, embora o registro oficial tenha sido apagado.",
    },
  },

  gangue: {
    id: "gangue",
    name: "Ex-integrante de gangue",
    tagline: "Você conhece as regras que a cidade esconde.",
    description:
      "Você pertenceu a uma organização criminosa envolvida em disputas territoriais, comércio clandestino e recuperação de equipamentos.",
    background:
      "Você abandonou o grupo depois de uma traição, de recusar uma ordem ou de entrar em conflito com os métodos da organização. A razão exata poderá ser definida na introdução.",
    startingLocation: {
      districtId: "subsolo",
      areaId: "grey_market",
      areaName: "Mercado Cinzento",
    },
    introductionId: "intro_gangue",
    advantages: [
      {
        id: "gangue_contatos_subsolo",
        category: "passive",
        name: "Contatos no Subsolo",
        description:
          "Conhece intermediários e códigos sociais do mercado clandestino, recebendo +1 no bônus de ataque.",
        status: "implemented",
      },
      {
        id: "gangue_reconhecer_codigo",
        category: "active",
        name: "Reconhecimento clandestino",
        description:
          "Identifica uma abertura no padrão do inimigo e prepara o próximo golpe para causar +3 de dano se acertar.",
        status: "implemented",
      },
    ],
    contacts: [
      {
        id: "dorian_kade",
        name: "Dorian Kade",
        role:
          "Intermediário do Subsolo; a relação inicial depende do passado escolhido para o protagonista.",
      },
    ],
    dialogueTags: ["origin:gangue", "knowledge:underworld_networks"],
    edenRecord: {
      id: "eden_record_gangue",
      title: "Operação clandestina monitorada",
      firstClue:
        "Uma operação da qual você participou aparece em um registro automatizado que não deveria existir.",
    },
  },

  militar: {
    id: "militar",
    name: "Veterano militar",
    tagline: "Você aprendeu a reconhecer o perigo antes do primeiro disparo.",
    description:
      "Você serviu em uma força militar ou unidade privada de segurança e participou de operações de contenção e proteção de instalações.",
    background:
      "Você deixou o serviço depois de uma operação cuja ordem entrou em conflito com seus princípios. O acontecimento exato ainda será construído na introdução.",
    startingLocation: {
      districtId: "ferrugem",
      areaId: "industrial_checkpoint",
      areaName: "Ponto de controle industrial",
    },
    introductionId: "intro_militar",
    advantages: [
      {
        id: "militar_leitura_tatica",
        category: "passive",
        name: "Leitura tática",
        description:
          "Reconhece posições defensivas e riscos de exposição, recebendo +1 de Defesa e +1 no bônus de ataque.",
        status: "implemented",
      },
      {
        id: "militar_protocolos_operacionais",
        category: "active",
        name: "Protocolos operacionais",
        description:
          "Ativa uma postura treinada e recebe +2 de Defesa até a próxima ação inimiga.",
        status: "implemented",
      },
    ],
    contacts: [
      {
        id: "private_security_network",
        name: "Antigos contatos da segurança privada",
        role:
          "Relações profissionais que podem oferecer informações ou representar riscos.",
      },
    ],
    dialogueTags: ["origin:militar", "knowledge:security_procedures"],
    edenRecord: {
      id: "eden_record_militar",
      title: "Arquivo de operação de segurança",
      firstClue:
        "O protocolo automatizado da operação que marcou sua saída aparece em um arquivo que deveria estar inacessível.",
    },
  },

  pesquisador: {
    id: "pesquisador",
    name: "Pesquisador",
    tagline: "Você encontrou uma falha nos dados — ou algo além dela.",
    description:
      "Você trabalhou com ciência, engenharia de sistemas, neurotecnologia ou inteligência artificial e encontrou inconsistências em dados ligados ao Éden.",
    background:
      "Depois de tentar investigar as divergências, você perdeu o acesso aos laboratórios e às bases de pesquisa.",
    startingLocation: {
      districtId: "aurea",
      areaId: "independent_research_annex",
      areaName: "Anexo de pesquisa independente",
    },
    introductionId: "intro_pesquisador",
    advantages: [
      {
        id: "pesquisador_analise_tecnica",
        category: "passive",
        name: "Análise tecnológica",
        description:
          "Interpreta registros técnicos e prepara implantes e equipamentos, aumentando sua Vida máxima em 2 pontos.",
        status: "implemented",
      },
      {
        id: "pesquisador_leitura_anomalias",
        category: "active",
        name: "Leitura de anomalias",
        description:
          "Analisa padrões do alvo e recebe +2 no próximo teste de ataque.",
        status: "implemented",
      },
    ],
    contacts: [
      {
        id: "elias_renner",
        name: "Elias Renner",
        role:
          "Pesquisador desaparecido, ligado à arquitetura original do Projeto Éden.",
      },
    ],
    dialogueTags: ["origin:pesquisador", "knowledge:technical_analysis"],
    edenRecord: {
      id: "eden_record_pesquisador",
      title: "Referência experimental de identidade",
      firstClue:
        "Dados experimentais contêm uma referência à sua identidade, embora você não reconheça aquele experimento.",
    },
  },

  nomade: {
    id: "nomade",
    name: "Nômade urbano",
    tagline: "Você aprendeu a sobreviver onde os mapas terminam.",
    description:
      "Você passou boa parte da vida circulando entre regiões urbanas, zonas industriais e assentamentos externos, sem vínculos sólidos com uma instituição.",
    background:
      "Você chegou a Nova Arcádia em busca de uma oportunidade, fugindo de uma dívida ou tentando recomeçar. Ao se aproximar da cidade, percebeu que já estava sendo monitorado.",
    startingLocation: {
      districtId: "limite_urbano",
      areaId: "perimeter_gate",
      areaName: "Portão perimetral de Nova Arcádia",
      provisional: true,
    },
    introductionId: "intro_nomade",
    advantages: [
      {
        id: "nomade_sobrevivencia_urbana",
        category: "passive",
        name: "Sobrevivência urbana",
        description:
          "Reconhece recursos improvisados e soluções práticas, aumentando sua Vida máxima em 2 pontos e seu movimento em 1 célula por turno.",
        status: "implemented",
      },
      {
        id: "nomade_rotas_nao_catalogadas",
        category: "active",
        name: "Rotas não catalogadas",
        description:
          "Encontra uma rota improvisada e recebe +3 células de movimento neste turno.",
        status: "implemented",
      },
    ],
    contacts: [
      {
        id: "dorian_kade",
        name: "Dorian Kade",
        role:
          "Intermediário com contatos no mercado clandestino; a relação começa a ser construída na cidade.",
      },
    ],
    dialogueTags: ["origin:nomade", "knowledge:unmapped_routes"],
    edenRecord: {
      id: "eden_record_nomade",
      title: "Identificação anterior à entrada",
      firstClue:
        "Seu identificador aparece em um registro de monitoramento anterior à sua entrada em Nova Arcádia.",
    },
  },
} as const satisfies OriginRegistry;

export function getOriginById(id: OriginId): OriginDefinition {
  return ORIGINS[id];
}

export function getAllOrigins(): OriginDefinition[] {
  return ORIGIN_IDS.map((id) => ORIGINS[id]);
}

export function isOriginId(value: unknown): value is OriginId {
  return (
    typeof value === "string" &&
    (ORIGIN_IDS as readonly string[]).includes(value)
  );
}
