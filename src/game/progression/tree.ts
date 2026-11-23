import type {PlayerCharacter} from "../character/types.ts";
import type {OriginId} from "../character/origins.ts";
import {ALL_CLASS_SKILLS,CLASS_IDS,getClassBranches,getStartingClassAbilities,
 isPlayableClass,type ClassId,type ClassSkill} from "../classes/registry.ts";

export const STAT_IDS=["vigor","precisao","reflexos","interface","influencia"] as const;
export type StatId=(typeof STAT_IDS)[number];
export const MAX_STAT_RANK=5;
export const STATS:Readonly<Record<StatId,{name:string;description:string}>>={
 vigor:{name:"Vigor",description:"+3 Vida máxima por ponto."},
 precisao:{name:"Precisão",description:"+1 bônus no ataque básico por ponto."},
 reflexos:{name:"Reflexos",description:"+1 Defesa por ponto; cada 2 pontos dão +1 movimento."},
 interface:{name:"Interface",description:"+2 Energia máxima por ponto."},
 influencia:{name:"Influência",description:"Confiança nas escolhas da Feira: +1 no grau 1–2, +2 no 3–4 e +3 no grau 5."},
};
/** Social milestone bonuses for the Mercado dos Cabos.
 * Unlike the old rank>0 check, investment in higher ranks now has
 * persistent, bounded value without bypassing story prerequisites.
 */
export function influenceTrustBonus(rank:number):number{
 if(!Number.isSafeInteger(rank)||rank<1)return 0;
 if(rank>=5)return 3;
 if(rank>=3)return 2;
 return 1;
}
export const BASE_ATTRIBUTES:Readonly<Record<StatId,number>>={
 vigor:0,precisao:0,reflexos:0,interface:0,influencia:0,
};
/** Bônus próprios da progressão, além das passivas históricas de origem.
 * Em saves novos são instantâneos e ficam registrados como snapshot: nunca
 * se reaplicam em load. Saves antigos recebem o snapshot uma única vez.
 */
export const ORIGIN_STAT_BONUSES:Readonly<Record<OriginId,Readonly<Partial<Record<StatId,number>>>>>={
 corporativo:{interface:1,influencia:1},baixada:{vigor:1,influencia:1},
 gangue:{precisao:1,reflexos:1},militar:{vigor:1,precisao:1},
 pesquisador:{interface:2},nomade:{vigor:1,reflexos:1},
};
export const CLASS_STAT_BONUSES:Readonly<Record<ClassId,Readonly<Partial<Record<StatId,number>>>>>={
 solo:{precisao:1,reflexos:1},netrunner:{interface:2},
 tecnico:{vigor:1,interface:1},medtech:{interface:1,influencia:1},
 rockerboy:{influencia:2},midia:{interface:1,influencia:1},
 corporativo:{vigor:1,influencia:1},policial:{vigor:1,precisao:1},
 nomade:{reflexos:2},marginal:{reflexos:1,influencia:1},fixador:{influencia:2},
};
export const GENERAL_PASSIVES={
 "passivo-fortaleza":{name:"Fibra Reforçada",description:"+4 Vida máxima.",minimumLevel:2},
 "passivo-mira":{name:"Mira Estável",description:"+1 no ataque básico.",minimumLevel:2},
 "passivo-circuitos":{name:"Circuitos Otimizados",description:"+2 Energia máxima.",minimumLevel:2},
} as const;
export type GeneralPassiveId=keyof typeof GENERAL_PASSIVES;
// Curva preservada do jogo 0.7.0: mudar requer novo teste de pacing.
export const LEVEL_XP=[0,30,75,135,210,300,405,525,660,810] as const;
export const MAX_LEVEL=LEVEL_XP.length;
export const POINTS_PER_LEVEL={attributes:2,skills:2} as const;
/** XP earned in the CURRENT level, not since character creation.
 * Legacy saves with a level ahead of their stored XP display zero progress,
 * never a negative bar. The original 10-level pacing is unchanged.
 */
export function levelExperienceProgress(char:Pick<PlayerCharacter,"level"|"experience">):{
 earned:number;required:number;remaining:number;percent:number;nextLevel:number|null;
}{
 const level=Number.isSafeInteger(char.level)?
  Math.max(1,Math.min(MAX_LEVEL,char.level)):1;
 const start=LEVEL_XP[level-1]??0;
 const end=LEVEL_XP[level]??null;
 if(end===null)return {earned:0,required:0,remaining:0,percent:100,nextLevel:null};
 const required=end-start;
 const earned=Math.max(0,Math.min(required,
  Number.isFinite(char.experience)?char.experience-start:0));
 return {earned,required,remaining:required-earned,
  percent:Math.max(0,Math.min(100,earned/required*100)),nextLevel:level+1};
}
export function levelAtXp(xp:number):number{
 if(!Number.isFinite(xp)||xp<0)return 1;
 let level=1;
 for(let i=1;i<LEVEL_XP.length;i++)if(xp>=LEVEL_XP[i]!)level=i+1;
 return level;
}
export function gainExperience(character:PlayerCharacter,amount:number):{character:PlayerCharacter;levelsGained:number}{
 if(!Number.isSafeInteger(amount)||amount<=0)return {character,levelsGained:0};
 const experience=Math.min(2_000_000,character.experience+amount);
 const level=Math.min(MAX_LEVEL,Math.max(character.level,levelAtXp(experience)));
 return {character:{...character,experience,level,updatedAt:new Date().toISOString()},levelsGained:level-character.level};
}
/** XP e recibo do evento na mesma transação lógica; nunca conceder duas vezes. */
export function grantUniqueExperience(character:PlayerCharacter,eventId:string,amount:number):
 {character:PlayerCharacter;awarded:boolean;levelsGained:number}{
 if(!/^[a-z0-9][a-z0-9-]{1,100}$/.test(eventId)||
    character.questRewards.includes(eventId)||!Number.isSafeInteger(amount)||amount<=0)
   return {character,awarded:false,levelsGained:0};
 const result=gainExperience(character,amount);
 return {character:{...result.character,questRewards:[...character.questRewards,eventId]},
   awarded:true,levelsGained:result.levelsGained};
}
const sane=(number:unknown,max=MAX_STAT_RANK):number=>
 typeof number==="number"&&Number.isSafeInteger(number)&&number>=0?
 Math.min(max,number):0;
export function statBreakdown(char:PlayerCharacter,id:StatId){
 const base=sane(char.baseAttributes?.[id]);
 const allocated=sane(char.attributes[id]);
 const origin=sane((char.originStatBonuses??ORIGIN_STAT_BONUSES[char.originId])?.[id]);
 const profession=sane((char.classStatBonuses??(char.classId?CLASS_STAT_BONUSES[char.classId]:{}))?.[id]);
 return {base,allocated,origin,profession,
   total:Math.min(MAX_STAT_RANK,base+allocated+origin+profession)};
}
export function statRank(char:PlayerCharacter,id:StatId):number{
 return statBreakdown(char,id).total;
}
const allocatedTotal=(char:PlayerCharacter):number=>
 STAT_IDS.reduce((sum,id)=>sum+sane(char.attributes[id]),0);
export function availableAttributePoints(char:PlayerCharacter):number{
 return Math.max(0,POINTS_PER_LEVEL.attributes*(char.level-1)-allocatedTotal(char));
}
export function skillPrerequisite(id:string):string|null{
 for(const classId of CLASS_IDS)for(const branch of getClassBranches(classId))
   if(branch.skillIds[1]===id)return branch.skillIds[0];
   else if(branch.skillIds[2]===id)return branch.skillIds[1];
 // A relação entre as técnicas antigas de níveis 2 e 3 é contrato de
 // progressão de versões anteriores e continua obrigatória após a expansão.
 const node=ALL_CLASS_SKILLS[id];
 if(node?.minimumLevel===3)
   return Object.values(ALL_CLASS_SKILLS).find(skill=>
     skill.classId===node.classId&&skill.minimumLevel===2)?.id??null;
 return null;
}
export function getSkillRank(char:PlayerCharacter,id:string):number{
 const spec=ALL_CLASS_SKILLS[id];
 if(!spec||spec.classId!==char.classId||!char.abilities.includes(id))return 0;
 const raw=char.skillRanks?.[id];
 return typeof raw==="number"&&Number.isSafeInteger(raw)?
 Math.min(spec.maxRank,Math.max(1,raw)):1;
}
export function purchasedActiveSkills(char:PlayerCharacter):string[]{
 return char.abilities.filter(id=>{
   const node=ALL_CLASS_SKILLS[id];
   return Boolean(node&&node.minimumLevel>1&&node.classId===char.classId);
 });
}
export function availableSkillPoints(char:PlayerCharacter):number{
 const spent=[...new Set(purchasedActiveSkills(char))].length+
  new Set(char.skills.filter(id=>id in GENERAL_PASSIVES)).size+
  Object.keys(ALL_CLASS_SKILLS).reduce((sum,id)=>sum+Math.max(0,getSkillRank(char,id)-1),0);
 return Math.max(0,POINTS_PER_LEVEL.skills*(char.level-1)-spent);
}
export function purchaseAttribute(char:PlayerCharacter,id:StatId):
 {ok:boolean;character:PlayerCharacter;message:string}{
 if(!STAT_IDS.includes(id))return {ok:false,character:char,message:"Atributo desconhecido."};
 if(availableAttributePoints(char)<1)return {ok:false,character:char,message:"Sem pontos de atributo."};
 if(statRank(char,id)>=MAX_STAT_RANK)return {ok:false,character:char,message:"Atributo no máximo (5)."};
 return {ok:true,character:{...char,attributes:{...char.attributes,[id]:sane(char.attributes[id])+1},
  updatedAt:new Date().toISOString()},message:"Ponto aplicado em "+STATS[id].name+"."};
}
export function purchaseSkill(char:PlayerCharacter,id:string):
 {ok:boolean;character:PlayerCharacter;message:string}{
 if(availableSkillPoints(char)<1)return {ok:false,character:char,message:"Sem pontos de habilidade."};
 if(id in GENERAL_PASSIVES){
   const passive=GENERAL_PASSIVES[id as GeneralPassiveId];
   if(char.level<passive.minimumLevel)return {ok:false,character:char,message:"Nível insuficiente."};
   if(char.skills.includes(id))return {ok:false,character:char,message:"Passiva já adquirida."};
   return {ok:true,character:{...char,skills:[...char.skills,id],updatedAt:new Date().toISOString()},
     message:"Passiva desbloqueada: "+passive.name+"."};
 }
 const skill=ALL_CLASS_SKILLS[id];
 if(!skill||skill.classId!==char.classId)return {ok:false,character:char,message:"Técnica exclusiva de outra classe."};
 if(char.level<skill.minimumLevel)return {ok:false,character:char,message:"Exige nível "+skill.minimumLevel+"."};
 const prior=skillPrerequisite(id);
 if(prior&&!char.abilities.includes(prior))
   return {ok:false,character:char,message:"Requer desbloquear "+(ALL_CLASS_SKILLS[prior]?.name??prior)+"."};
 const current=getSkillRank(char,id);
 if(current>=skill.maxRank)return {ok:false,character:char,message:"Habilidade no nível máximo."};
 if(current>0&&char.level<skill.minimumLevel+current)
   return {ok:false,character:char,message:"Próxima melhoria exige nível "+(skill.minimumLevel+current)+"."};
 const updated={...char,abilities:current?[...char.abilities]:[...char.abilities,id],
   skillRanks:{...char.skillRanks,[id]:current+1},updatedAt:new Date().toISOString()};
 return {ok:true,character:updated,
   message:current?skill.name+" melhorada para grau "+(current+1)+".":"Técnica desbloqueada: "+skill.name+"."};
}
/** Valida saves legados e backups: sem perder origem, inventário ou história.
 * A partir do total de XP/pontos, remove apenas progressão inválida (inclusive
 * técnicas de outra classe, ranks acima do máximo e compras sem pré-requisitos).
 */
export function normalizeProgression(char:PlayerCharacter):PlayerCharacter{
 const level=Math.min(MAX_LEVEL,Math.max(1,levelAtXp(char.experience),sane(char.level,MAX_LEVEL)));
 const originStatBonuses={...ORIGIN_STAT_BONUSES[char.originId],...(char.originStatBonuses??{})};
 const classStatBonuses={...(char.classId?CLASS_STAT_BONUSES[char.classId]:{}),...(char.classStatBonuses??{})};
 const baseAttributes={...BASE_ATTRIBUTES,...(char.baseAttributes??{})};
 const attr:Record<string,number>={};
 let attrBudget=POINTS_PER_LEVEL.attributes*(level-1);
 for(const id of STAT_IDS){
   const fixed=sane(baseAttributes[id])+sane(originStatBonuses[id])+sane(classStatBonuses[id]);
   const count=Math.min(sane(char.attributes[id]),attrBudget,Math.max(0,MAX_STAT_RANK-fixed));
   attr[id]=count;attrBudget-=count;
 }
 // Sem classe definida, IDs legados são mantidos como arquivo inerte.
 // O motor só executa IDs cadastrados da classe ativa.
 const abilities=new Set<string>(char.classId&&isPlayableClass(char.classId)?
   getStartingClassAbilities(char.classId):
   char.abilities.filter(id=>typeof id==="string"&&id.length<=80));
 // Identificadores históricos desconhecidos não são pontos compráveis e
 // permanecem no save inertes para não descartar informação de versões antigas.
 const general:string[]=char.skills.filter(id=>
   typeof id==="string"&&!(id in GENERAL_PASSIVES)&&id.length<=80);
 const ranks:Record<string,number>={};
 let budget=POINTS_PER_LEVEL.skills*(level-1);
 // Legado possuía técnicas desbloqueadas sem mapa de ranks.
 const acquired=[...new Set(char.abilities)].filter(id=>{
   const node=ALL_CLASS_SKILLS[id];
   return Boolean(node&&node.classId===char.classId);
 })
   .sort((a,b)=>ALL_CLASS_SKILLS[a]!.minimumLevel-ALL_CLASS_SKILLS[b]!.minimumLevel);
 for(const id of acquired){
   const node=ALL_CLASS_SKILLS[id]!;
   if(abilities.has(id)||level<node.minimumLevel||budget<1)continue;
   const prior=skillPrerequisite(id);
   if(prior&&!abilities.has(prior))continue;
   abilities.add(id);budget--;
 }
 for(const id of new Set(char.skills)){
   if(!(id in GENERAL_PASSIVES)||level<GENERAL_PASSIVES[id as GeneralPassiveId].minimumLevel||budget<1)continue;
   general.push(id);budget--;
 }
 for(const id of abilities){
   const node=ALL_CLASS_SKILLS[id];
   if(!node)continue;
   const claimed=sane(char.skillRanks?.[id],node.maxRank);
   const capped=Math.min(node.maxRank,Math.max(1,claimed||1),
     Math.max(1,level-node.minimumLevel+1));
   const desired=Math.min(budget,capped-1);
   if(desired>0){ranks[id]=desired+1;budget-=desired;}
 }
 return {...char,level,attributes:attr,baseAttributes,originStatBonuses,classStatBonuses,
   skills:general,abilities:[...abilities],skillRanks:ranks,
   questRewards:[...new Set(char.questRewards.filter(id=>typeof id==="string"&&id.length<120))]};
}
/** Prévia determinística idêntica ao cálculo de rank do motor de combate. */
export function skillEffectPreview(skill:ClassSkill,rank:number):string{
 const valid=Math.max(1,Math.min(skill.maxRank,Math.floor(rank)));
 return skill.effects.map(effect=>{
   const amount=("amount" in effect?effect.amount:0)+(valid-1)*
      (effect.type==="damage"||effect.type==="heal"?2:1);
   const turns=("turns" in effect?effect.turns:0)+
      (effect.type==="jam"&&valid>=3?1:0);
   switch(effect.type){
     case "damage":return "Dano "+amount;
     case "heal":return "Cura "+amount;
     case "jam":return "Bloqueia "+turns+" ação(ões)";
     case "guard":return "Defesa +"+amount+" por "+turns+" ação(ões)";
     case "energy":return "Energia +"+amount;
     case "movement":return "Movimento +"+amount;
     case "nextDamage":return "Próximo dano +"+amount;
     case "nextAccuracy":return "Próximo acerto +"+amount;
     case "enemyArmor":return "Defesa inimiga -"+amount+" por "+turns+" ação(ões)";
     case "enemyAttack":return "Ataque inimigo -"+amount+" por "+turns+" ação(ões)";
   }
 }).join(" · ");
}
export function combatProgression(char:PlayerCharacter|null):{
 hp:number;attack:number;armor:number;movement:number;energy:number}{
 if(!char)return {hp:0,attack:0,armor:0,movement:0,energy:0};
 return {
 hp:statRank(char,"vigor")*3+(char.skills.includes("passivo-fortaleza")?4:0),
 attack:statRank(char,"precisao")+(char.skills.includes("passivo-mira")?1:0),
 armor:statRank(char,"reflexos"),
 movement:Math.floor(statRank(char,"reflexos")/2),
 energy:statRank(char,"interface")*2+(char.skills.includes("passivo-circuitos")?2:0),
 };
}
