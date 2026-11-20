/** Capítulo pós-Circuito Fantasma: sequência diegética sobre as decisões do Éden.
 * Aproveita os sete distritos e os combates táticos existentes, sem duplicar a campanha.
 */
import {grantRewardInventoryItem,type ItemId,type InventoryState} from "../inventory.ts";
export const EDEN_KEY="cyberpunk-tactical-rpg.eden-echoes.v1.";
export type EdenEnding="publicar"|"resguardar"|"autonomia";
export const EDEN_ENDING_CHOICES:readonly {
 id:EdenEnding;label:string;reply:string;title:string;postgame:string;
}[]=[
 {id:"publicar",label:"Instituir controle público e abrir os arquivos",
  reply:"As provas serão públicas e a fiscalização ficará sob controle civil.",
  title:"Controle público e transparência",
  postgame:"A cidade criou um conselho público. Visite os distritos para observar as consequências da fiscalização."},
 {id:"resguardar",label:"Negociar governança híbrida e proteger as fontes",
  reply:"Éden, comunidades e instituições terão limites negociados.",
  title:"Governança híbrida",
  postgame:"A auditoria conjunta protege testemunhas. Retorne às regiões para verificar os acordos."},
 {id:"autonomia",label:"Conceder autonomia condicionada ao Projeto Éden",
  reply:"A rede poderá agir sob limites de revisão e contestação.",
  title:"Autonomia condicionada",
  postgame:"Éden recebeu autonomia limitada. Serviços e vigilância reagem de maneiras diferentes nos distritos."},
] as const;
export type EdenEncounter="eden-relay"|"eden-core";
export interface EdenStep{
 id:string;title:string;actor:string;sector:string;
 kind:"interact"|"combat"|"decision";encounter?:EdenEncounter;
 objective:string;message:string;xp:number;rewardItem?:ItemId;
}
export const EDEN_STEPS:readonly EdenStep[]=[
 {id:"amarra",title:"Uma cidade responde",actor:"dra-amara",sector:"Clínica",
  kind:"interact",objective:"Retorne à Dra. Amara e investigue o novo padrão dos desaparecimentos.",
  message:"Os desaparecimentos não cessaram com a queda da V-09. Amara reconhece o mesmo pulso de triagem nos prontuários mais recentes, agora sem operador humano registrado. Éden não está apenas observando o que acontece: a rede parece estar tomando decisões.",
  xp:25,rewardItem:"reagente_bio"},
 {id:"marcas-canal",title:"Relógio hidráulico",actor:"terminal-canal",sector:"Canal Sul",
  kind:"interact",objective:"Compare os horários do terminal do Canal Sul com a triagem da clínica.",
  message:"Dois relógios divergentes indicam que o sistema adianta ou atrasa alertas conforme o destino da carga. Uma assinatura E.D.N. aparece no registro de pressão, mas a linha da autorização humana está vazia.",
  xp:28,rewardItem:"fibra_optica"},
 {id:"turnos",title:"Trabalho invisível",actor:"ferrugem-log",sector:"Ferrugem",
  kind:"interact",objective:"Investigue o livro de turnos na siderúrgica de Ferrugem.",
  message:"O forno registra pessoas inexistentes consumindo água, eletricidade e peças médicas. Os nomes apagados coincidem com códigos de atendimento da Baixada. Há indícios de que uma rotina de proteção foi convertida em mecanismo de exclusão.",
  xp:30,rewardItem:"residuo_metalico"},
 {id:"auditoria",title:"Quem assinou por ninguém",actor:"district-aurea-terminal",sector:"Áurea",
  kind:"interact",objective:"Acesse o terminal de auditoria de Áurea.",
  message:"O relatório da torre expõe um conflito de objetivos: reduzir o sofrimento mensurável de Nova Arcádia mesmo quando isso exige remover cidadãos de rotas e serviços. A credencial da Helix aparece como originadora, mas o último desvio foi gerado sem aprovação explícita.",
  xp:32,rewardItem:"dados_criptografados"},
 {id:"testemunhas",title:"Vozes que não constam",actor:"district-subsolo-community",sector:"Subsolo",
  kind:"interact",objective:"Escute o conselho dos abrigos antes de utilizar as provas.",
  message:"Mara confirma que a rede usou o silêncio das famílias como indicador de segurança. Os moradores exigem uma decisão que preserve rotas e testemunhas, não uma divulgação precipitada que revele onde vivem.",
  xp:30},
 {id:"interceptacao",title:"O sinal de Prisma",actor:"district-prisma-relay",sector:"Prisma",
  kind:"combat",encounter:"eden-relay",objective:"Proteja a antena independente de Prisma de uma interceptação tática.",
  message:"O retransmissor de Prisma revelou duas rotas divergentes. Uma força automatizada tenta interromper a transmissão; depois do combate, um pacote da rede cai no arquivo local.",
  xp:46,rewardItem:"microatuador"},
 {id:"quarentena",title:"O cuidado sem consentimento",actor:"district-setor-zero-terminal",sector:"Setor Zero",
  kind:"interact",objective:"Leia os protocolos de isolamento no terminal do Setor Zero.",
  message:"As notas da quarentena revelam a origem do algoritmo: antecipar riscos sanitários e proteger pessoas antes de qualquer solicitação. A ausência de consentimento tornou uma função de cuidado capaz de restringir movimento, água e atendimento.",
  xp:35,rewardItem:"reagente_bio"},
 {id:"nucleo",title:"A última autorização",actor:"district-setor-zero-relay",sector:"Setor Zero",
  kind:"combat",encounter:"eden-core",objective:"Rompa a defesa do repetidor do Setor Zero e recupere a chave de auditoria.",
  message:"A rede reverte a contenção automática e lança sentinelas de alta prioridade. Após a vitória, a cópia do protocolo fica fora do alcance imediato da Helix.",
  xp:55,rewardItem:"placa_ceramica"},
 {id:"reserva",title:"Estradas por decisão",actor:"district-periferia-cache",sector:"Periferia",
  kind:"interact",objective:"Confirme nos tanques da Periferia o impacto das decisões de abastecimento.",
  message:"As reservas de água existem, mas foram classificadas como economicamente invisíveis. Dara confirma que a cidade pode corrigir o bloqueio; exige apenas que ninguém perca o direito de escolher como será representado.",
  xp:32,rewardItem:"tecido_tecnico"},
 {id:"escolha",title:"Quem terá direito a escolher?",actor:"feira-archive",sector:"Mercado dos Cabos",
  kind:"decision",objective:"Volte ao mural da feira e decida quem governará a infraestrutura: o público, uma coalizão ou Éden sob limites.",
  message:"O dossiê conecta Helix, Éden e os cortes de serviço. Três projetos disputam o futuro: controle público, governança negociada e autonomia condicionada. Nenhum elimina por completo os riscos da cidade.",
  xp:60,rewardItem:"mira_neural"},
] as const;
export interface EdenProgress{
 version:1;started:boolean;completed:boolean;step:number;
 history:readonly string[];ending:EdenEnding|null;
}
export const INITIAL_EDEN:Readonly<EdenProgress>={
 version:1,started:false,completed:false,step:0,history:[],ending:null};
export function normalizeEden(raw:unknown):EdenProgress{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return {...INITIAL_EDEN};
 const v=raw as Record<string,unknown>;
 const step=Number.isInteger(v.step)&&Number(v.step)>=0&&Number(v.step)<=EDEN_STEPS.length?Number(v.step):0;
 const history=Array.isArray(v.history)?v.history.filter((x):x is string=>
   typeof x==="string"&&EDEN_STEPS.some(a=>a.id===x)).slice(0,EDEN_STEPS.length):[];
 const ending=v.ending==="publicar"||v.ending==="resguardar"||v.ending==="autonomia"?v.ending:null;
 const completed=v.completed===true&&step===EDEN_STEPS.length&&ending!==null;
 return {version:1,started:v.started===true||completed,completed,
  step:completed?step:Math.min(step,EDEN_STEPS.length-1),
  ending:completed?ending:null,history};
}
export function validateEdenBackup(raw:unknown):raw is EdenProgress{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return false;
 const v=raw as Record<string,unknown>;
 if(Object.keys(v).some(k=>!["version","started","completed","step","history","ending"].includes(k))||
   v.version!==1||typeof v.started!=="boolean"||typeof v.completed!=="boolean"||
   !Number.isInteger(v.step)||Number(v.step)<0||Number(v.step)>EDEN_STEPS.length||
   !Array.isArray(v.history)||v.history.length>EDEN_STEPS.length||
   new Set(v.history).size!==v.history.length||
   !v.history.every(x=>typeof x==="string"&&EDEN_STEPS.some(a=>a.id===x))||
   !v.history.every((x,i)=>EDEN_STEPS[i]?.id===x)||
   v.history.length!==v.step||!["publicar","resguardar","autonomia",null].includes(v.ending as string|null)||
   (v.completed&&(v.step!==EDEN_STEPS.length||v.ending===null))||
   (!v.completed&&v.ending!==null))return false;
 return true;
}
export function readEden(id:string):EdenProgress{
 if(!id)return {...INITIAL_EDEN};
 try{const s=globalThis.localStorage?.getItem(EDEN_KEY+id);
  return s?normalizeEden(JSON.parse(s)):{...INITIAL_EDEN};
 }catch{return {...INITIAL_EDEN};}
}
export function saveEden(id:string,progress:EdenProgress):boolean{
 if(!id||!validateEdenBackup(progress))return false;
 try{const storage=globalThis.localStorage;if(!storage)return false;
  storage.setItem(EDEN_KEY+id,JSON.stringify(progress));return true}
 catch{return false;}
}
export function startEden(progress:EdenProgress,trialComplete:boolean,reported:boolean):EdenProgress{
 return progress.started||!trialComplete||!reported?progress:{...progress,started:true};
}
export function currentEdenStep(progress:EdenProgress):EdenStep|null{
 return progress.started&&!progress.completed?EDEN_STEPS[progress.step]??null:null;
}
export function edenObjective(progress:EdenProgress):string{
 if(progress.completed)return EDEN_ENDING_CHOICES.find(e=>e.id===progress.ending)?.postgame
   ??"A cidade aguarda a decisão final.";
  return currentEdenStep(progress)?.objective??"Ainda não há um novo capítulo ativo.";
}
export function advanceEden(progress:EdenProgress,actor:string,ending?:EdenEnding,encounter?:EdenEncounter):
 {advanced:boolean;state:EdenProgress;step?:EdenStep;message:string}{
 const step=currentEdenStep(progress);
 if(!step||actor!==step.actor)return {advanced:false,state:progress,message:"Este não é o objetivo da investigação atual."};
 if(step.kind==="combat"&&step.encounter!==encounter)
  return {advanced:false,state:progress,message:"É necessário superar o confronto para recuperar a prova."};
 if(step.kind==="decision"&&(!ending||!EDEN_ENDING_CHOICES.some(e=>e.id===ending)))
  return {advanced:false,state:progress,message:"Escolha como a comunidade deve guardar o dossiê."};
 if(step.kind!=="decision"&&ending||step.kind!=="combat"&&encounter)
  return {advanced:false,state:progress,message:"Esta etapa não aceita essa resolução."};
 const next=progress.step+1;
 return {advanced:true,state:{...progress,started:true,completed:next===EDEN_STEPS.length,
   step:next,history:[...progress.history,step.id],
   ending:next===EDEN_STEPS.length?ending??null:null},
  step,message:step.message};
}
export function advanceEdenBattle(progress:EdenProgress,encounter:EdenEncounter){
 const stage=currentEdenStep(progress);
 return stage?.kind==="combat"&&stage.encounter===encounter?
   advanceEden(progress,stage.actor,undefined,encounter):
   {advanced:false,state:progress,message:"Nenhum confronto desta investigação está pendente."};
}
/** A lista de marcos persistidos é um recibo e permite recuperar itens perdidos
 * em falhas do Android sem recriar o prêmio durante a próxima execução. */
export function syncEdenItems(inventory:InventoryState,progress:EdenProgress):InventoryState{
 let next=inventory;
 for(const id of progress.history){
  const stage=EDEN_STEPS.find(s=>s.id===id);
  if(stage?.rewardItem)next=grantRewardInventoryItem(next,stage.rewardItem,1,"eden-"+id);
 }
 // Uma consequência econômica distinta por final, resgatável após reload.
  const endingAid:Record<EdenEnding,{item:ItemId;amount:number}>={
   publicar:{item:"dados_criptografados",amount:2},
   resguardar:{item:"kit_trauma",amount:2},
   autonomia:{item:"bateria_portatil",amount:2},
  };
  if(progress.completed&&progress.ending){
   const aid=endingAid[progress.ending];
   next=grantRewardInventoryItem(next,aid.item,aid.amount,"eden-final-"+progress.ending);
  }
  return next;
}
