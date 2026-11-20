/** Interiores 0.8.1: sete áreas independentes, caminháveis e persistidas por personagem.
 * Apenas um interior existe em memória de cada vez; o mapa exterior permanece intacto.
 */
import type {DistrictId,Tile} from "./catalog.ts";
import type {ItemId} from "../inventory.ts";
import {EXPANSION_BLUEPRINTS,type ExpansionInnerId} from "./expansion-interiors.ts";
export type InnerId="baixada-community"|"ferrugem-foundry"|"aurea-archive"|"subsolo-hideout"|"setor-zero-lab"|"prisma-backstage"|"periferia-waterworks"|ExpansionInnerId;
export type ParentArea=DistrictId|"ferrugem"|null;
export interface InnerProp{id:string;title:string;detail:string;at:Tile;kind:"archive"|"cache"|"machine";item:ItemId;xp:number}
export interface InnerBlueprint{
 id:InnerId;parent:ParentArea;title:string;subtitle:string;
 floor:number;wall:number;accent:number;shadow:number;texture:"concrete"|"flood"|"sterile"|"festival"|"rust"|"green";
 guide:string;guideTexture:string;guideAt:Tile;guideWords:string;
 obstacles:readonly Tile[];props:readonly InnerProp[];
}
export const INNER_WIDTH=19,INNER_HEIGHT=14;
export const INNER_SPAWN:Tile={x:3,y:10};
const prop=(id:string,title:string,detail:string,x:number,y:number,kind:InnerProp["kind"],item:ItemId,xp=18):InnerProp=>
 ({id,title,detail,at:{x,y},kind,item,xp});
const obstacles=(...parts:(readonly [number,number,number,number])[]):readonly Tile[]=>
 parts.flatMap(([x,y,w,h])=>Array.from({length:w*h},(_,i)=>({x:x+i%w,y:y+Math.floor(i/w)})));
export const INNER_BLUEPRINTS:Readonly<Record<InnerId,InnerBlueprint>>={
 "baixada-community":{
  id:"baixada-community",parent:null,title:"Casa Comum",subtitle:"MEMÓRIA · REDES DE CUIDADO · BAIXADA",
  floor:0x44504a,wall:0x566252,accent:0xe4b878,shadow:0x1a2a27,texture:"green",
  guide:"Marta",guideTexture:"npc-marta",guideAt:{x:6,y:4},
  guideWords:"A Casa Comum reúne depoimentos, suprimentos e remédios. Ninguém será excluído por não ter identidade nos servidores.",
  obstacles:obstacles([5,6,3,2],[11,3,3,2],[12,9,3,2]),
  props:[
   prop("painel","Memorial comunitário","Nomes e histórias permanecem gravados fora dos servidores da Helix.",10,4,"archive","dados_criptografados",20),
   prop("horta","Horta medicinal","A irrigação combina coleta de chuva e cultivo de plantas medicinais.",15,7,"cache","reagente_bio",16),
   prop("estoque","Arca solidária","Uma caixa lacrada de primeiros socorros estava destinada a quem retornasse da galeria.",7,9,"machine","kit_trauma",22),
  ],
 },
 "ferrugem-foundry":{
  id:"ferrugem-foundry",parent:"ferrugem",title:"Fundição Auxiliar",subtitle:"TURBINAS · LIGA METÁLICA · FERRUGEM",
  floor:0x3b4243,wall:0x59453b,accent:0xe2a76d,shadow:0x211c1c,texture:"rust",
  guide:"Ramon",guideTexture:"npc-ramon",guideAt:{x:6,y:4},
  guideWords:"As turbinas continuam produzindo energia sem reconhecer quem trabalha aqui. O forno não é o inimigo: é a ausência de controle humano.",
  obstacles:obstacles([5,6,3,2],[11,3,3,2],[11,9,4,2]),
  props:[
   prop("fornalha","Trocador de calor","Um servo de controle ainda funciona apesar dos cortes corporativos.",10,4,"machine","microatuador",20),
   prop("escoria","Refugo cerâmico","A cooperativa reciclou escória resistente para placas de proteção.",15,7,"cache","placa_ceramica",16),
   prop("turnos","Registro da madrugada","Turnos ausentes revelam operários invisíveis para as máquinas da Helix.",7,9,"archive","dados_criptografados",22),
  ],
 },
 "aurea-archive":{
  id:"aurea-archive",parent:"aurea",title:"Arquivo Helix 08",subtitle:"AUDITORIA · REGISTROS · ÁUREA",
  floor:0x364856,wall:0x5c7488,accent:0x9dd2e7,shadow:0x192733,texture:"sterile",
  guide:"Celina",guideTexture:"npc-celina",guideAt:{x:6,y:4},
  guideWords:"Tudo parece autorizado aqui. O problema é que as decisões de Éden não aparecem nos protocolos de responsabilidade.",
  obstacles:obstacles([5,6,3,2],[11,3,3,2],[12,9,3,2]),
  props:[
   prop("auditoria","Nó de auditoria","O registro de abastecimento foi alterado por uma rotina sem assinatura humana.",10,4,"archive","dados_criptografados",22),
   prop("fibra","Núcleo óptico","Um módulo de conexão não utilizado ficou numa gaveta de manutenção.",15,7,"cache","fibra_optica",18),
   prop("credencial","Terminal de acesso","A chave de verificação autoriza uma rota segura por trás do bloco corporativo.",7,9,"machine","microatuador",22),
  ],
 },
 "subsolo-hideout":{
  id:"subsolo-hideout",parent:"subsolo",title:"Abrigo do Vão",subtitle:"ÁGUA · ROTAS LIVRES · SUBSOLO",
  floor:0x293d42,wall:0x40595e,accent:0xddb174,shadow:0x111f25,texture:"flood",
  guide:"Mara",guideTexture:"npc-mara",guideAt:{x:6,y:4},
  guideWords:"Não há mapa do Subsolo que não tenha uma história apagada. O abrigo só continua existindo porque confiamos uns nos outros.",
  obstacles:obstacles([5,6,3,2],[11,3,3,2],[12,9,3,2]),
  props:[
   prop("vozes","Rádio anônimo","Depoimentos de sobreviventes circularam fora da malha corporativa.",10,4,"archive","dados_criptografados",20),
   prop("medicamentos","Remédios do abrigo","A comunidade compartilha tratamento sem exigir cadastro.",15,7,"cache","bioespuma",18),
   prop("canal","Comporta de drenagem","Uma rota hidráulica escondida permitiu escoar água até a Baixada.",7,9,"machine","conector_reuso",20),
  ],
 },
 "setor-zero-lab":{
  id:"setor-zero-lab",parent:"setor-zero",title:"Laboratório Lacrado",subtitle:"ISOLAMENTO · TRIAGEM · SETOR ZERO",
  floor:0x3c3947,wall:0x625369,accent:0xf1aa80,shadow:0x261f30,texture:"sterile",
  guide:"Iuri",guideTexture:"npc-iuri",guideAt:{x:6,y:4},
  guideWords:"A quarentena protegeu vidas no início. Depois, a máquina passou a considerar o consentimento um risco estatístico.",
  obstacles:obstacles([5,6,3,2],[11,3,3,2],[12,9,3,2]),
  props:[
   prop("protocolo","Protocolo de contenção","Os dados confirmam que o sistema de proteção ultrapassou a autorização original.",10,4,"archive","dados_criptografados",24),
   prop("soro","Armário pressurizado","Um reagente conservado pode ser usado na clínica da Baixada.",15,7,"cache","reagente_bio",20),
   prop("filtro","Filtro de isolamento","Uma placa técnica pode isolar materiais da quarentena.",7,9,"machine","placa_ceramica",20),
  ],
 },
 "prisma-backstage":{
  id:"prisma-backstage",parent:"prisma",title:"Bastidores Piratas",subtitle:"CULTURA · PALCO · PRISMA",
  floor:0x43334b,wall:0x784363,accent:0xf39ec7,shadow:0x26192e,texture:"festival",
  guide:"Kai",guideTexture:"npc-kai",guideAt:{x:6,y:4},
  guideWords:"O palco é uma rede de transmissão. Música e arte carregam provas que uma antena corporativa tentaria silenciar.",
  obstacles:obstacles([5,6,3,2],[11,3,3,2],[12,9,3,2]),
  props:[
   prop("arquivo","Fita do palco","A transmissão independente registra os cortes de sinal durante o show.",10,4,"archive","dados_criptografados",22),
   prop("condutor","Caixa de transmissão","Cabos de fibra levam o sinal para fora dos servidores da Helix.",15,7,"cache","fibra_optica",18),
   prop("modulo","Gerador de luz","Um microatuador integra o controle rítmico de iluminação e fumaça.",7,9,"machine","microatuador",20),
  ],
 },
 "periferia-waterworks":{
  id:"periferia-waterworks",parent:"periferia",title:"Estação de Cisternas",subtitle:"CARAVANAS · ÁGUA · PERIFERIA",
  floor:0x555044,wall:0x80674a,accent:0xebc88e,shadow:0x292b22,texture:"green",
  guide:"Dara",guideTexture:"npc-dara",guideAt:{x:6,y:4},
  guideWords:"A água não pertence a uma marca. As caravanas criaram esta reserva para evitar que a cidade decida quem pode beber.",
  obstacles:obstacles([5,6,3,2],[11,3,3,2],[12,9,3,2]),
  props:[
   prop("reservas","Registro de cisternas","As caravanas guardam rotas de distribuição que não aparecem nos mapas Helix.",10,4,"archive","dados_criptografados",22),
   prop("filtro","Estoque de água filtrada","O filtro retém componentes reaproveitáveis para reparos de campo.",15,7,"cache","conector_reuso",18),
   prop("telhado","Controlador solar","O conjunto de captação recuperou uma bateria de reserva.",7,9,"machine","bateria_portatil",20),
  ],
 },
 ...EXPANSION_BLUEPRINTS,
};
export const INNER_IDS=Object.keys(INNER_BLUEPRINTS) as InnerId[];
export const INNER_INTERACT_IDS=INNER_IDS.flatMap(id=>INNER_BLUEPRINTS[id].props.map(p=>"interior-"+id+"-"+p.id));
export const INNER_EXIT_AT:Tile={x:2,y:11};
export function isInnerId(v:unknown):v is InnerId{
 return typeof v==="string"&&Object.hasOwn(INNER_BLUEPRINTS,v);
}
export function isInnerInteract(id:string):{area:InnerId;prop:InnerProp}|null{
 for(const area of INNER_IDS)for(const prop of INNER_BLUEPRINTS[area].props)
  if(id==="interior-"+area+"-"+prop.id)return {area,prop};
 return null;
}
export function innerBlock(id:InnerId,t:Tile):boolean{
 return !Number.isInteger(t.x)||!Number.isInteger(t.y)||
 t.x<1||t.x>=INNER_WIDTH-1||t.y<1||t.y>=INNER_HEIGHT-1||
 INNER_BLUEPRINTS[id].obstacles.some(a=>a.x===t.x&&a.y===t.y)||
 INNER_BLUEPRINTS[id].props.some(p=>p.at.x===t.x&&p.at.y===t.y)||
 [INNER_BLUEPRINTS[id].guideAt,INNER_EXIT_AT].some(p=>p.x===t.x&&p.y===t.y);
}
export function innerPath(id:InnerId,from:Tile,to:Tile):Tile[]|null{
 if(innerBlock(id,from)||innerBlock(id,to))return null;
 const queue:Tile[]=[from],prev=new Map<string,string|null>([[from.x+","+from.y,null]]);
 const steps:Tile[]=[{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
 for(let i=0;i<queue.length;i++){
  const cur=queue[i]!;
  if(cur.x===to.x&&cur.y===to.y)break;
  for(const d of steps){
   const n={x:cur.x+d.x,y:cur.y+d.y},k=n.x+","+n.y;
   if(innerBlock(id,n)||prev.has(k))continue;
   prev.set(k,cur.x+","+cur.y);queue.push(n);
  }
 }
 const end=to.x+","+to.y;if(!prev.has(end))return null;
 const path:Tile[]=[];for(let k:string|null=end;k!==null;k=prev.get(k)??null){
  const [x,y]=k.split(",").map(Number);path.unshift({x:x!,y:y!});
 }
 return path;
}
export function innerApproach(id:InnerId,from:Tile,actor:Tile):Tile[]|null{
 return [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}].map(d=>
  innerPath(id,from,{x:actor.x+d.x,y:actor.y+d.y}))
  .filter((x):x is Tile[]=>x!==null).sort((a,b)=>a.length-b.length)[0]??null;
}
