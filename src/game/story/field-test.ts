/** Operação Circuito Fantasma: campanha guiada de teste SEM temporizador
 * artificial. Cada objetivo exige interagir num local jogável ou vencer combate.
 * Duração alvo 35–50 minutos em Android, depende do ritmo do jogador.
 */
export type TrialEncounter="trial-1"|"trial-2"|"trial-3";
export type TrialStep={
 id:string;chapter:1|2|3|4;sector:string;title:string;objective:string;
 actor:string;kind:"interact"|"combat";xp:number;minutes:number;encounter?:TrialEncounter;
 detail:string;
};
export const TRIAL_STEPS:readonly TrialStep[]=[
 {id:"brief",chapter:1,sector:"Clínica",title:"A ausência não é um erro",objective:"Converse com a Dra. Amara na clínica.",actor:"dra-amara",kind:"interact",xp:12,minutes:2,detail:"Amara recebe relatórios de triagem que não correspondem a atendimentos reais."},
 {id:"prontuario",chapter:1,sector:"Clínica",title:"Prontuário fantasma",objective:"Consulte o terminal da clínica.",actor:"terminal-clinica",kind:"interact",xp:12,minutes:2,detail:"A assinatura de um protocolo E.D.N. aparece em registros incompletos."},
 {id:"testemunha",chapter:1,sector:"Baixada",title:"Uma moradora lembra",objective:"Encontre Joana e ouça seu relato.",actor:"moradora",kind:"interact",xp:10,minutes:2,detail:"O relato aponta um fluxo de peças e de moradores pelo Canal Sul."},
 {id:"conector",chapter:1,sector:"Baixada",title:"Peça fora de série",objective:"Procure o mecânico Nilo no mercado.",actor:"vendedor",kind:"interact",xp:12,minutes:2,detail:"O conector tem uma identificação de lote que não consta na rede central."},
 {id:"canal-registro",chapter:2,sector:"Canal Sul",title:"A rota que desapareceu",objective:"Interaja com o terminal público do Canal.",actor:"terminal-canal",kind:"interact",xp:12,minutes:2,detail:"Uma rota de abastecimento foi reclassificada como transferência de pessoas."},
 {id:"correio",chapter:2,sector:"Galeria do Canal",title:"O último entregador",objective:"Encontre Téo na galeria técnica.",actor:"teo",kind:"interact",xp:12,minutes:2,detail:"Téo reconhece uma alteração no horário dos comboios."},
 {id:"console",chapter:2,sector:"Pátio do Reúso",title:"Controle de demanda",objective:"Examine o console do Pátio do Reúso.",actor:"patio-console",kind:"interact",xp:15,minutes:2,detail:"Uma atualização remota substituiu o cadastro comunitário."},
 {id:"combate-1",chapter:2,sector:"Pátio do Reúso",title:"Bloqueio da vigilância",objective:"Interaja com a sentinela V-09 e vença as duas ondas de segurança.",actor:"patio-sentinel",kind:"combat",encounter:"trial-1",xp:35,minutes:5,detail:"Duas ondas de vigilância protegem o acesso aos registros."},
 {id:"lia",chapter:3,sector:"Pátio do Reúso",title:"A voz da cooperativa",objective:"Fale com Lia no Pátio.",actor:"lia",kind:"interact",xp:12,minutes:2,detail:"Lia descreve o impacto humano das prioridades automáticas."},
 {id:"ramon",chapter:3,sector:"Pátio do Reúso",title:"Reparos e sabotagem",objective:"Fale com Ramon e examine os relatos técnicos.",actor:"ramon",kind:"interact",xp:12,minutes:2,detail:"A cooperativa encontra um componente que não instalou."},
 {id:"duda",chapter:3,sector:"Pátio do Reúso",title:"Prova testemunhal",objective:"Encontre Duda perto das casas do Pátio.",actor:"duda",kind:"interact",xp:12,minutes:2,detail:"Duda consegue identificar o horário da transferência irregular."},
 {id:"tomas",chapter:3,sector:"Mercado dos Cabos",title:"O estoque do entreposto",objective:"Localize Tomás no Mercado dos Cabos.",actor:"tomas",kind:"interact",xp:12,minutes:2,detail:"Um depósito confirmou o desvio de material para a terceirizada."},
 {id:"iza",chapter:3,sector:"Mercado dos Cabos",title:"Um caminho real",objective:"Encontre Iza e compare as rotas de entrega.",actor:"iza",kind:"interact",xp:12,minutes:2,detail:"Uma rota alternativa foi mantida pelos entregadores."},
 {id:"mural",chapter:3,sector:"Mercado dos Cabos",title:"Registros contraditórios",objective:"Consulte o Mural de Boletins da feira.",actor:"feira-archive",kind:"interact",xp:15,minutes:2,detail:"O arquivo comunitário contém provas que divergem do sistema público."},
 {id:"davi",chapter:4,sector:"Mercado dos Cabos",title:"Um acordo difícil",objective:"Negocie informações com Davi.",actor:"feira-corretor",kind:"interact",xp:12,minutes:2,detail:"Davi confirma que o acesso à rede foi vendido para terceiros."},
 {id:"marta",chapter:4,sector:"Mercado dos Cabos",title:"O custo de uma decisão",objective:"Converse com Marta, responsável pela Casa Comum.",actor:"feira-ajuda",kind:"interact",xp:12,minutes:2,detail:"Marta exige que os moradores participem da decisão sobre as provas."},
 {id:"combate-2",chapter:4,sector:"Mercado dos Cabos",title:"Interferência no mural",objective:"Retorne ao Mural e defenda o arquivo de duas ondas de drones.",actor:"feira-archive",kind:"combat",encounter:"trial-2",xp:40,minutes:5,detail:"Dois drones tentam suprimir a cópia independente da comunidade."},
 {id:"combate-3",chapter:4,sector:"Canal Sul",title:"Interceptação final",objective:"Volte ao Terminal do Canal e derrote três ondas de vigilância.",actor:"terminal-canal",kind:"combat",encounter:"trial-3",xp:45,minutes:6,detail:"A rede de triagem reage ao material preservado no Canal Sul."},
 {id:"relatorio",chapter:4,sector:"Clínica",title:"Relatório para Amara",objective:"Volte à Dra. Amara e entregue o dossiê reunido.",actor:"dra-amara",kind:"interact",xp:35,minutes:3,detail:"Amara reúne os arquivos e prepara um pedido de auditoria pública independente."},
] as const;
export const ESTIMATED_MINUTES=TRIAL_STEPS.reduce((sum,s)=>sum+s.minutes,0);
export const TRIAL_KEY="cyberpunk-tactical-rpg.trial.v1.";
export interface TrialProgress {
 started:boolean;completed:boolean;step:number;history:readonly string[];
}
export const FRESH_TRIAL:TrialProgress={started:false,completed:false,step:0,history:[]};
export function readTrial(id:string):TrialProgress{
 try{
 const raw=globalThis.localStorage?.getItem(TRIAL_KEY+id);
 if(!raw)return {...FRESH_TRIAL};
 const value=JSON.parse(raw) as Partial<TrialProgress>;
 if(!Number.isSafeInteger(value.step)||value.step!<0||value.step!>TRIAL_STEPS.length)
  return {...FRESH_TRIAL};
 const history=Array.isArray(value.history)?
   value.history.filter((x):x is string=>typeof x==="string"&&TRIAL_STEPS.some(s=>s.id===x)):[];
 const started=value.started===true,completed=value.completed===true&&value.step===TRIAL_STEPS.length;
 return {started,completed,step:value.step!,history};
 }catch{return {...FRESH_TRIAL};}
}
export function saveTrial(id:string,value:TrialProgress):boolean{
 if(!id)return false;
 try{globalThis.localStorage?.setItem(TRIAL_KEY+id,JSON.stringify(value));return true;}
 catch{return false;}
}
export function startTrial(old:TrialProgress):TrialProgress{
 if(old.started||old.completed)return old;
 return {started:true,completed:false,step:0,history:[]};
}
export function currentTrialStep(value:TrialProgress):TrialStep|null{
 return value.started&&!value.completed?TRIAL_STEPS[value.step]??null:null;
}
export function trialCombatForActor(state:TrialProgress,actor:string):TrialEncounter|null{
 const stage=currentTrialStep(state);
 return stage?.kind==="combat" && stage.actor===actor?stage.encounter??null:null;
}
export function advanceTrial(state:TrialProgress,actor:string,encounter?:TrialEncounter):
 {advanced:boolean;progress:TrialProgress;completedStep?:TrialStep}{
 const step=currentTrialStep(state);
 if(!step||step.actor!==actor)return {advanced:false,progress:state};
 if(step.kind==="combat"&&step.encounter!==encounter)return {advanced:false,progress:state};
 if(step.kind==="interact"&&encounter)return {advanced:false,progress:state};
 const next=state.step+1;
 return {advanced:true,completedStep:step,progress:{started:true,
  step:next,completed:next>=TRIAL_STEPS.length,history:[...state.history,step.id]}};
}
export function advanceTrialBattle(state:TrialProgress,encounter:TrialEncounter){
 const step=currentTrialStep(state);
 if(!step||step.kind!=="combat"||step.encounter!==encounter)
   return {advanced:false,progress:state};
 return advanceTrial(state,step.actor,encounter);
}
export function reconcileTrial(state:TrialProgress,rewardIds:readonly string[]):TrialProgress{
 let result=state;
 while(true){
 const step=currentTrialStep(result);
 if(!step||!rewardIds.includes("trial-"+step.id))return result;
 result=advanceTrial(result,step.actor,step.encounter).progress;
 }
}
export function isTrialEncounter(id:string):id is TrialEncounter{
 return id==="trial-1"||id==="trial-2"||id==="trial-3";
}
