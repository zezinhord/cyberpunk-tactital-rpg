import type {PlayerCharacter} from "../character/types.ts";
import {ADVANCED_CLASS_SKILLS, getClassSkills} from "../classes/registry.ts";

export const STAT_IDS=["vigor","precisao","reflexos","interface","influencia"] as const;
export type StatId=(typeof STAT_IDS)[number];
export const STATS:Readonly<Record<StatId,{name:string;description:string}>>={
  vigor:{name:"Vigor",description:"+3 Vida máxima por ponto."},
  precisao:{name:"Precisão",description:"+1 bônus no ataque básico por ponto."},
  reflexos:{name:"Reflexos",description:"+1 Defesa por ponto; cada 2 pontos dão +1 movimento."},
  interface:{name:"Interface",description:"+2 Energia máxima por ponto."},
  influencia:{name:"Influência",description:"Ajuda a obter confiança comunitária ao agir na Feira."},
};
export const GENERAL_PASSIVES={
 "passivo-fortaleza":{name:"Fibra Reforçada",description:"+4 Vida máxima.",minimumLevel:2},
 "passivo-mira":{name:"Mira Estável",description:"+1 no ataque básico.",minimumLevel:2},
 "passivo-circuitos":{name:"Circuitos Otimizados",description:"+2 Energia máxima.",minimumLevel:2},
} as const;
export type GeneralPassiveId=keyof typeof GENERAL_PASSIVES;
export const LEVEL_XP=[0,30,75,135,210,300,405,525,660,810] as const;
export const MAX_LEVEL=LEVEL_XP.length;
export function levelAtXp(xp:number):number{
 if(!Number.isFinite(xp)||xp<0)return 1;
 let level=1;
 for(let i=1;i<LEVEL_XP.length;i++)if(xp>=LEVEL_XP[i])level=i+1;
 return level;
}
export function gainExperience(character:PlayerCharacter,amount:number):{character:PlayerCharacter;levelsGained:number}{
 if(!Number.isSafeInteger(amount)||amount<=0)return {character,levelsGained:0};
 const experience=Math.min(2_000_000,character.experience+amount);
 const level=Math.max(character.level,levelAtXp(experience));
 return {character:{...character,experience,level,updatedAt:new Date().toISOString()},levelsGained:level-character.level};
}
export function statRank(char:PlayerCharacter,id:StatId):number{
 const rank=char.attributes[id];
 return Number.isInteger(rank)&&rank>=0&&rank<=5?rank:0;
}
export function availableAttributePoints(char:PlayerCharacter):number{
 const spent=STAT_IDS.reduce((sum,id)=>sum+statRank(char,id),0);
 return Math.max(0,2*(char.level-1)-spent);
}
export function purchasedActiveSkills(char:PlayerCharacter):string[]{
 return char.abilities.filter(id=>Boolean(ADVANCED_CLASS_SKILLS[id]));
}
export function availableSkillPoints(char:PlayerCharacter):number{
 const spent=new Set([...purchasedActiveSkills(char),
  ...char.skills.filter(id=>id in GENERAL_PASSIVES)]).size;
 return Math.max(0,2*(char.level-1)-spent);
}
export function purchaseAttribute(char:PlayerCharacter,id:StatId):
 {ok:boolean;character:PlayerCharacter;message:string}{
 if(!STAT_IDS.includes(id))return {ok:false,character:char,message:"Atributo desconhecido."};
 if(availableAttributePoints(char)<1)return {ok:false,character:char,message:"Sem pontos de atributo."};
 if(statRank(char,id)>=5)return {ok:false,character:char,message:"Atributo no máximo (5)."};
 return {ok:true,character:{...char,attributes:{...char.attributes,[id]:statRank(char,id)+1},
  updatedAt:new Date().toISOString()},message:"Ponto aplicado em "+STATS[id].name+"."};
}
export function skillPrerequisite(char:PlayerCharacter,id:string):string|null{
 const skill=ADVANCED_CLASS_SKILLS[id];
 if(!skill)return null;
 if(skill.minimumLevel<=2)return null;
 const prior=getClassSkills(skill.classId).find(node=>node.minimumLevel===2);
 return prior?.id??null;
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
 const skill=ADVANCED_CLASS_SKILLS[id];
 if(!skill||skill.classId!==char.classId)return {ok:false,character:char,message:"Técnica exclusiva de outra classe."};
 if(char.level<skill.minimumLevel)return {ok:false,character:char,message:"Exige nível "+skill.minimumLevel+"."};
 if(char.abilities.includes(id))return {ok:false,character:char,message:"Técnica já adquirida."};
 const prior=skillPrerequisite(char,id);
 if(prior&&!char.abilities.includes(prior))return {ok:false,character:char,message:"Compre primeiro a técnica anterior da sua classe."};
 return {ok:true,character:{...char,abilities:[...char.abilities,id],updatedAt:new Date().toISOString()},
   message:"Técnica desbloqueada: "+skill.name+"."};
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
