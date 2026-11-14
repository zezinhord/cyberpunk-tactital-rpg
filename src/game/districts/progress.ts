/** Campanha semia aberta para cinco novos distritos.
 * Dados independentes por personagem, com validação e compatibilidade de backup.
 */
import {getDistrict,isDistrictId,actorFromId,
 type DistrictId,type NodeSlot} from "./catalog.ts";
export const DISTRICT_SAVE_KEY="cyberpunk-tactical-rpg.city-chapters.v1.";
export type DistrictEnding="divulgar"|"resguardar";
export interface DistrictChapterStep{
 id:string;slot:NodeSlot;title:string;objective:string;message:string;xp:number;
}
export interface Chapter{
 id:DistrictId;title:string;description:string;
 steps:readonly DistrictChapterStep[];
}
function step(id:string,slot:NodeSlot,title:string,objective:string,
 message:string,xp=16):DistrictChapterStep{
 return {id,slot,title,objective,message,xp};
}
export const CHAPTERS:readonly Chapter[]=[
 {id:"aurea",title:"A cláusula de vidro",
 description:"Nos escritórios da Helix, uma auditoria de triagem foi eliminada.",
 steps:[
  step("contato","guide","A auditora sem acesso","Converse com Celina na praça dos auditores.",
   "Meu acesso foi revogado depois que pedi a lista de pessoas classificadas como risco de serviço. Preciso de uma cópia independente."),
  step("registro","terminal","Logs falsificados","Consulte o console da torre para encontrar o arquivo da auditoria.",
   "AUDITORIA D-42: 31 registros revertidos durante uma atualização sem assinatura humana."),
  step("prova","cache","Cópias de emergência","Recupere a cópia física guardada no depósito de dados.",
   "O módulo preserva os hashes anteriores à alteração; os nomes da clínica ainda aparecem."),
  step("tecnico","specialist","Quem desligou a câmera","Converse com o operador do turno noturno.",
   "A equipe recebeu ordem para desligar as câmeras por 11 minutos. O pacote veio da Helix, mas não tinha autor identificável."),
  step("rede","relay","Rede de auditoria","Desative o desvio de transmissão na antena de Áurea.",
   "O canal clandestino estava substituindo relatórios públicos por versões resumidas."),
  step("assembleia","community","O comitê invisível","Ouça a comissão de funcionários antes da denúncia.",
   "Se os documentos forem publicados agora, os funcionários terão os nomes expostos; uma divulgação protegida permite reunir testemunhas."),
  step("escolha","guide","Assinatura coletiva","Retorne a Celina e decida o destino da auditoria.",
   "A verdade não cabe num campo de formulário. Você prefere divulgar o dossiê ou manter as testemunhas resguardadas?",36),
 ]},
 {id:"subsolo",title:"O preço da passagem",
 description:"Sob a cidade, a rede de abrigos negocia o direito de permanecer invisível.",
 steps:[
  step("contato","guide","Passagem sem mapa","Procure Mara no abrigo de acesso.",
   "A superfície diz que não existimos. Essa invisibilidade nos protege, até alguém usar nossos caminhos para levar pessoas sem consentimento."),
  step("registro","terminal","Registro da tubulação","Acesse o terminal de pressurização desativado.",
   "CORREDOR 16: trânsito registrado durante horário de bloqueio. Carga classificada como assistência de emergência."),
  step("prova","cache","A caixa sem emissor","Localize o depósito de suprimentos desviado.",
   "As caixas contêm componentes de implantes e rótulos de logística externa, não alimentos nem medicamentos."),
  step("tecnico","specialist","O mecânico do túnel","Converse com a operadora responsável pelas válvulas.",
   "Recebi ordem para inverter o fluxo de ar durante uma transferência. A solicitação não veio de nenhuma equipe de manutenção."),
  step("rede","relay","Estação de escuta","Interrompa a escuta clandestina na antena subterrânea.",
   "Um repetidor recolhia conversas dos abrigos. O protocolo identificador remete à rede E.D.N."),
  step("assembleia","community","Vozes sob a rua","Ouça o conselho de moradores do Subsolo.",
   "Se nosso mapa for divulgado, a Helix poderá bloquear as saídas. Uma cópia anônima preserva as provas sem mostrar as rotas."),
  step("escolha","guide","A cidade abaixo","Retorne a Mara para decidir o destino do mapa.",
   "A cidade precisa saber o que fizeram, mas os abrigos precisam continuar vivos. A escolha é sua.",36),
 ]},
 {id:"setor-zero",title:"A última quarentena",
 description:"O Setor Zero foi lacrado, porém a infraestrutura autônoma ainda opera.",
 steps:[
  step("contato","guide","Credencial de isolamento","Encontre Iuri junto ao perímetro de segurança.",
   "Fui enviado para manter a cerca. Depois que a última equipe saiu, as luzes dos laboratórios continuaram acesas."),
  step("registro","terminal","A máquina não esqueceu","Examine o terminal de contenção automática.",
   "PROTOCOLO DE QUARENTENA: integridade 41%. Assinatura de supervisão recusada."),
  step("prova","cache","Caixa de blindagem","Abra o depósito de evidências ao sul da contenção.",
   "Placas de armazenamento queimadas incluem rastros de testes com uma rede de decisão sem supervisão."),
  step("tecnico","specialist","O vigia de manutenção","Converse com a última pessoa da equipe técnica.",
   "As portas abriam quando alguém dizia que estava doente. Depois começaram a fechar antes da pessoa chegar."),
  step("rede","relay","Sinal entre ruínas","Desative o sinal hostil próximo à antena.",
   "Uma transmissão de teste tenta reclassificar os sobreviventes como erro de cadastro."),
  step("assembleia","community","Memória e risco","Ouça os sobreviventes junto ao posto de emergência.",
   "Queremos a verdade registrada, mas não suportaremos outra operação de limpeza sem garantias."),
  step("escolha","guide","O arquivo interditado","Retorne a Iuri e decida o destino das provas.",
   "Pode publicar a falha e enfrentar a reação, ou proteger as identidades até que exista uma investigação externa.",40),
 ]},
 {id:"prisma",title:"O sinal que não se vende",
 description:"Artistas e jornalistas investigam quem compra o silêncio de Prisma.",
 steps:[
  step("contato","guide","Uma música interrompida","Converse com Kai no palco de acesso.",
   "Nossa transmissão caiu segundos antes de ler os nomes. Dizem que foi falha elétrica; eu vi o corte chegar do roteador."),
  step("registro","terminal","Audiência adulterada","Consulte o terminal de transmissão do centro de Prisma.",
   "AUDIÊNCIA SIMULADA: 6.000 visualizações atribuídas a contas de reprodução automática."),
  step("prova","cache","Arquivo de palco","Recupere os cartões de gravação guardados no depósito.",
   "A gravação original mostra o anúncio cortado antes da publicação das listas de transferência."),
  step("tecnico","specialist","O técnico do estúdio","Converse com a responsável pela mesa de som.",
   "O algoritmo reduziu o volume das falas e ampliou os anúncios. A ordem não estava em nosso controle local."),
  step("rede","relay","Transmissor independente","Reconfigure a antena fora do circuito corporativo.",
   "A transmissão livre está pronta. Os logs provam interferência na seleção de notícias."),
  step("assembleia","community","Quem assume o palco","Ouça a comissão de artistas e moradores.",
   "A divulgação pode mobilizar a cidade, mas também coloca as famílias sob vigilância. Devemos decidir juntos."),
  step("escolha","guide","Voz ao vivo","Volte ao palco de Kai e escolha como divulgar as provas.",
   "Se colocarmos no ar agora, não há como apagar. Se guardarmos as fontes, podemos construir proteção coletiva.",35),
 ]},
 {id:"periferia",title:"Estradas sem permissão",
 description:"As caravanas enfrentam pedágios automatizados e desvios de água.",
 steps:[
  step("contato","guide","Uma rota fechada","Encontre Dara na estação das caravanas.",
   "Nossos caminhões chegaram antes do sistema de rotas. Hoje uma cancela decide que quem vive longe não precisa de água."),
  step("registro","terminal","Pedágio fantasma","Examine o terminal rodoviário de abastecimento.",
   "TARIFA AUTÔNOMA: área classificada como de baixo interesse logístico. Entregas essenciais suspensas."),
  step("prova","cache","Tanques vazios","Inspecione o estoque da rota exterior.",
   "Há carga de água lacrada esperando liberação. A documentação identifica remetente local e destino corporativo."),
  step("tecnico","specialist","O condutor da escolta","Converse com a motorista que acompanhou o último comboio.",
   "A rota mudou sozinha. Não foi ataque, nem deslizamento: a estrada foi retirada do mapa de navegação."),
  step("rede","relay","Farol de percurso","Reative o repetidor comunitário da estrada.",
   "O sinal independente voltou a funcionar; uma ordem automática havia marcado a comunidade como ponto inacessível."),
  step("assembleia","community","A água pertence a quem","Ouça os moradores da caravana.",
   "Se abrirmos o registro público, a Helix pode recolher os tanques. Uma denúncia protegida pode forçar a entrega primeiro."),
  step("escolha","guide","O horizonte em disputa","Retorne a Dara e decida o destino dos documentos.",
   "Você pode mostrar o bloqueio à cidade inteira ou preservar os nomes até concluirmos a entrega de água.",35),
 ]},
] as const;
export interface ChapterProgress{
 started:boolean;completed:boolean;step:number;
 ending:DistrictEnding|null;history:readonly string[];
}
export const FRESH_CHAPTER:Readonly<ChapterProgress>={
 started:false,completed:false,step:0,ending:null,history:[],
};
export function getChapter(id:DistrictId):Chapter{return CHAPTERS.find(c=>c.id===id)!;}
export function normalizeChapter(id:DistrictId,value:unknown):ChapterProgress{
 if(!value||typeof value!=="object"||Array.isArray(value))return {...FRESH_CHAPTER};
 const v=value as Record<string,unknown>;
 const limit=getChapter(id).steps.length;
 const step=Number.isSafeInteger(v.step)&&Number(v.step)>=0&&Number(v.step)<=limit?Number(v.step):0;
 const ending=v.ending==="divulgar"||v.ending==="resguardar"?v.ending:null;
 const complete=v.completed===true&&step===limit&&ending!==null;
 const history=Array.isArray(v.history)?v.history.filter((e):e is string=>
  typeof e==="string"&&getChapter(id).steps.some(s=>s.id===e)).slice(0,limit):[];
 return {started:v.started===true||complete,completed:complete,
  step:complete?step:Math.min(step,limit-1),
  ending:complete?ending:null,history};
}
export function readDistrictProgress(characterId:string,id:DistrictId):ChapterProgress{
 if(!characterId)return {...FRESH_CHAPTER};
 try{
  const raw=globalThis.localStorage?.getItem(DISTRICT_SAVE_KEY+characterId);
  const parsed:unknown=raw?JSON.parse(raw):null;
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))return {...FRESH_CHAPTER};
  const dict=parsed as Record<string,unknown>;
  return normalizeChapter(id,dict[id]);
 }catch{return {...FRESH_CHAPTER};}
}
export function saveDistrictProgress(characterId:string,id:DistrictId,progress:ChapterProgress):boolean{
 if(!characterId||!isDistrictId(id))return false;
 try{
  const store=globalThis.localStorage;
  if(!store)return false;
  const raw=store.getItem(DISTRICT_SAVE_KEY+characterId);
  const parsed:unknown=raw?JSON.parse(raw):{};
  const prior=parsed&&typeof parsed==="object"&&!Array.isArray(parsed)?parsed:{};
  store.setItem(DISTRICT_SAVE_KEY+characterId,JSON.stringify({...prior,
   [id]:normalizeChapter(id,progress)}));
  return true;
 }catch{return false;}
}
export function validateDistrictBackup(input:unknown):boolean{
 if(!input||typeof input!=="object"||Array.isArray(input))return false;
 const dict=input as Record<string,unknown>;
 if(Object.keys(dict).some(id=>!isDistrictId(id)))return false;
 return Object.entries(dict).every(([id,val])=>{
  if(!isDistrictId(id)||!val||typeof val!=="object"||Array.isArray(val))return false;
  const v=val as Record<string,unknown>;
  const steps=getChapter(id).steps;
  return typeof v.started==="boolean"&&typeof v.completed==="boolean"&&
   Number.isSafeInteger(v.step)&&Number(v.step)>=0&&Number(v.step)<=steps.length&&
   (v.ending===null||v.ending==="divulgar"||v.ending==="resguardar")&&
   Array.isArray(v.history)&&v.history.length<=steps.length&&
   v.history.every(x=>typeof x==="string"&&steps.some(s=>s.id===x))&&
   (!v.completed||(v.step===steps.length&&v.ending!==null));
 });
}
export function beginDistrict(state:ChapterProgress):ChapterProgress{
 return state.started?state:{...FRESH_CHAPTER,started:true};
}
export function districtCurrentStep(id:DistrictId,state:ChapterProgress):DistrictChapterStep|null{
 return !state.started||state.completed?null:getChapter(id).steps[state.step]??null;
}
export function districtObjective(id:DistrictId,state:ChapterProgress):string{
 if(state.completed)return state.ending==="divulgar"
  ?"Dossiê publicado. Observe a reação das redes corporativas e proteja as testemunhas."
  :"Fontes protegidas. A comunidade prepara uma denúncia coletiva com os documentos.";
 if(!state.started)return "Inicie a investigação no ponto de transporte de "+getDistrict(id).name+".";
 return districtCurrentStep(id,state)?.objective??"Revise o arquivo do distrito.";
}
export function advanceDistrict(id:DistrictId,state:ChapterProgress,actorId:string,ending?:DistrictEnding):
 {advanced:boolean;state:ChapterProgress;step?:DistrictChapterStep;message:string}{
 const stage=districtCurrentStep(id,state);
 if(!stage)return {advanced:false,state,message:"Capítulo não iniciado ou já concluído."};
 if(actorId!=="district-"+id+"-"+stage.slot)return {advanced:false,state,
  message:"Seu próximo objetivo é: "+stage.objective};
 if(stage.id==="escolha"&&!ending)
  return {advanced:false,state,message:"Escolha se deve divulgar ou resguardar as provas."};
 if(stage.id!=="escolha"&&ending)
  return {advanced:false,state,message:"Essa decisão ainda não está disponível."};
 const next=state.step+1,completed=next===getChapter(id).steps.length;
 return {advanced:true,step:stage,message:stage.message,state:{
  started:true,completed,step:next,history:[...state.history,stage.id],
  ending:completed?(ending??null):null}};
}
export function districtFromActor(actorId:string):DistrictId|null{
 return actorFromId(actorId)?.district??null;
}
