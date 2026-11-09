import type { OriginId } from "./origins";
import type { OriginGameplayProfile } from "./types";

/** Efeitos implementados nesta versão de teste. Valores ainda são balanceáveis. */
export const ORIGIN_GAMEPLAY: Readonly<Record<OriginId, OriginGameplayProfile>> = {
  corporativo: {
    passiveDescription: "Leitura de protocolos",
    passiveEffect: "+1 de Defesa (CA).",
    maxHpBonus: 0, armorBonus: 1, attackBonus: 0, movementBonus: 0,
    abilityId: "corporativo_credencial_arquivada", abilityName: "Credencial arquivada",
    abilityDescription: "Ativa uma rotina de proteção e recebe +2 de Defesa até a próxima ação inimiga.",
    abilityEffect: "guard", abilityPower: 2,
  },
  baixada: {
    passiveDescription: "Rede comunitária",
    passiveEffect: "+3 pontos de Vida máxima.",
    maxHpBonus: 3, armorBonus: 0, attackBonus: 0, movementBonus: 0,
    abilityId: "baixada_rotas_locais", abilityName: "Rotas locais",
    abilityDescription: "Encontra um atalho local e recebe +3 células de movimento neste turno.",
    abilityEffect: "movement", abilityPower: 3,
  },
  gangue: {
    passiveDescription: "Contatos no Subsolo",
    passiveEffect: "+1 no bônus de ataque.",
    maxHpBonus: 0, armorBonus: 0, attackBonus: 1, movementBonus: 0,
    abilityId: "gangue_reconhecer_codigo", abilityName: "Reconhecimento clandestino",
    abilityDescription: "Prepara o próximo golpe para causar +3 de dano se acertar.",
    abilityEffect: "damage", abilityPower: 3,
  },
  militar: {
    passiveDescription: "Leitura tática",
    passiveEffect: "+1 de Defesa (CA) e +1 no bônus de ataque.",
    maxHpBonus: 0, armorBonus: 1, attackBonus: 1, movementBonus: 0,
    abilityId: "militar_protocolos_operacionais", abilityName: "Protocolos operacionais",
    abilityDescription: "Assume uma postura defensiva e recebe +2 de Defesa até a próxima ação inimiga.",
    abilityEffect: "guard", abilityPower: 2,
  },
  pesquisador: {
    passiveDescription: "Análise tecnológica",
    passiveEffect: "+2 pontos de Vida máxima por preparação e ergonomia de implantes.",
    maxHpBonus: 2, armorBonus: 0, attackBonus: 0, movementBonus: 0,
    abilityId: "pesquisador_leitura_anomalias", abilityName: "Leitura de anomalias",
    abilityDescription: "Analisa a sentinela e recebe +2 no próximo teste de ataque.",
    abilityEffect: "accuracy", abilityPower: 2,
  },
  nomade: {
    passiveDescription: "Sobrevivência urbana",
    passiveEffect: "+2 pontos de Vida máxima e +1 célula de movimento por turno.",
    maxHpBonus: 2, armorBonus: 0, attackBonus: 0, movementBonus: 1,
    abilityId: "nomade_rotas_nao_catalogadas", abilityName: "Rotas não catalogadas",
    abilityDescription: "Encontra uma passagem improvisada e recebe +3 células de movimento neste turno.",
    abilityEffect: "movement", abilityPower: 3,
  },
};

export function getOriginGameplay(originId: OriginId): OriginGameplayProfile {
  return ORIGIN_GAMEPLAY[originId];
}
