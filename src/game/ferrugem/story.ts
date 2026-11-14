/** Capítulo industrial novo: uma rede independente de desaparecimentos
 * alimenta a siderúrgica de Ferrugem. A progressão é por ação no mapa, nunca
 * por temporizador. As escolhas finais têm consequências narrativas próprias.
 */
export const FERRUGEM_SAVE_PREFIX="cyberpunk-tactical-rpg.ferrugem.v1.";
export type FerrugemEnding="publicar"|"proteger";
export interface FerrugemStep{
 readonly id:string;readonly actor:string;readonly title:string;
 readonly objective:string;readonly detail:string;readonly xp:number;
 readonly speaker:string;readonly role:string;readonly message:string;
}
export const FERRUGEM_STEPS:readonly FerrugemStep[]=[
 {id:"chamada",actor:"ferrugem-foreman",title:"Cinzas no turno",
  objective:"Converse com Rosa, operadora da siderúrgica de Ferrugem.",
  detail:"Os trabalhadores relatam máquinas que continuam operando após a interrupção oficial do turno.",
  xp:14,speaker:"Rosa",role:"OPERADORA DA SIDERÚRGICA",
  message:"A energia daqui tem dois relógios: um aparece no contracheque, o outro nas máquinas. Quero saber quem está usando nossa fábrica fora do turno."},
 {id:"consumo",actor:"ferrugem-cabinet",title:"Energia emprestada",
  objective:"Investigue o quadro elétrico junto ao corredor das máquinas.",
  detail:"Compare os horários de produção com a demanda requisitada pela rede corporativa.",
  xp:14,speaker:"QUADRO ELÉTRICO",role:"REDE INDUSTRIAL",
  message:"SOBRECARGA 13% // Fornecimento secundário alimenta unidades desconhecidas. Origem da requisição: uma credencial técnica da Helix."},
 {id:"componentes",actor:"ferrugem-scrap",title:"Peças que não deveriam existir",
  objective:"Examine o depósito de sucata na área sul de Ferrugem.",
  detail:"Há componentes selados por uma subsidiária que não aparece nos registros de compra.",
  xp:15,speaker:"DEPÓSITO DE SUCATA",role:"INSPEÇÃO MATERIAL",
  message:"Placas com lote de pesquisa neural, removidas antes da triagem. O cobre derretido e o isolamento não correspondem ao material comum da fábrica."},
 {id:"pressao",actor:"ferrugem-pump",title:"A pressão do silêncio",
  objective:"Regule a válvula de vapor no lado leste do galpão.",
  detail:"A liberação de vapor abre o acesso seguro aos registros de produção.",
  xp:16,speaker:"VÁLVULA DE VAPOR",role:"CONTROLE DE PRESSÃO",
  message:"Pressão estabilizada. Uma derivação oculta ligava o forno ao circuito de descarte de equipamentos neurais."},
 {id:"turno",actor:"ferrugem-log",title:"Pessoas fora da planilha",
  objective:"Consulte o livro de turno e compare os nomes removidos.",
  detail:"As transferências da clínica se cruzam com escalas de funcionários inexistentes.",
  xp:18,speaker:"LIVRO DE TURNO",role:"ARQUIVO NÃO SINCRONIZADO",
  message:"Acesso a turnos de madrugada confirmado. Três pessoas constam como auxiliares temporários; nenhuma recebeu pagamento. Identidade civil substituída por códigos."},
 {id:"interferencia",actor:"ferrugem-relay",title:"Quem fala pela fábrica",
  objective:"Inspecione o repetidor clandestino da Helix no extremo leste.",
  detail:"A antena desviou os registros de produção para fora da rede comunitária.",
  xp:20,speaker:"REPETIDOR CLANDESTINO",role:"SINAL CORPORATIVO",
  message:"Desvio isolado. Pacotes identificados como E.D.N. indicam decisões automatizadas sobre turnos, entregas e circulação de pessoas."},
 {id:"testemunhas",actor:"ferrugem-shelter",title:"A escolha pertence a todos",
  objective:"Ouça os trabalhadores no posto comunitário ao sul.",
  detail:"As testemunhas querem saber se a publicação imediata pode expô-las.",
  xp:16,speaker:"POSTO COMUNITÁRIO",role:"ASSEMBLEIA DOS TRABALHADORES",
  message:"A fábrica não é só aço e sucata. É o lugar onde as famílias conseguem pagar a comida. Se você expuser esses nomes, precisamos garantir que ninguém seja deixado para trás."},
 {id:"prova",actor:"ferrugem-conveyor",title:"O último carregamento",
  objective:"Recupere a prova física na esteira industrial.",
  detail:"Uma carga desviada contém registros verificáveis sobre os implantes e os turnos.",
  xp:24,speaker:"ESTEIRA INDUSTRIAL",role:"CARGA INTERCEPTADA",
  message:"PACOTE 04 ARQUIVADO. Foram recuperados lacres, amostras técnicas e números de turno. As evidências podem ser publicadas ou preservadas pela comunidade."},
 {id:"decisao",actor:"ferrugem-foreman",title:"Ferrugem escolhe",
  objective:"Retorne a Rosa e decida o destino das provas.",
  detail:"Publicar imediatamente ou proteger as testemunhas enquanto se prepara uma denúncia coletiva.",
  xp:35,speaker:"Rosa",role:"OPERADORA DA SIDERÚRGICA",
  message:"Trouxe tudo o que precisamos. Agora decidimos o destino do dossiê: divulgar os nomes ou guardar as cópias sob proteção comunitária?"},
] as const;
export interface FerrugemProgress{
 started:boolean;step:number;completed:boolean;
 history:readonly string[];ending:FerrugemEnding|null;
}
export const FRESH_FERRUGEM:Readonly<FerrugemProgress>={
 started:false,step:0,completed:false,history:[],ending:null,
};
export function normalizeFerrugem(input:unknown):FerrugemProgress{
 if(!input||typeof input!=="object"||Array.isArray(input))return {...FRESH_FERRUGEM};
 const v=input as Record<string,unknown>,len=FERRUGEM_STEPS.length;
 const step=Number.isSafeInteger(v.step)&&Number(v.step)>=0&&Number(v.step)<=len?Number(v.step):0;
 const history=Array.isArray(v.history)?v.history.filter((id):id is string=>
  typeof id==="string"&&FERRUGEM_STEPS.some(s=>s.id===id)).slice(0,len):[];
 const ending=v.ending==="publicar"||v.ending==="proteger"?v.ending:null;
 const completed=v.completed===true&&step===len&&ending!==null;
 return {started:v.started===true||completed,step:completed?step:Math.min(step,len-1),
  completed,history:completed?history:history.slice(0,Math.min(step,len-1)),ending:completed?ending:null};
}
export function readFerrugem(characterId:string):FerrugemProgress{
 try{
  if(!characterId)return {...FRESH_FERRUGEM};
  const s=globalThis.localStorage?.getItem(FERRUGEM_SAVE_PREFIX+characterId);
  return s?normalizeFerrugem(JSON.parse(s)):{...FRESH_FERRUGEM};
 }catch{return {...FRESH_FERRUGEM};}
}
export function saveFerrugem(characterId:string,progress:FerrugemProgress):boolean{
 if(!characterId)return false;
 try{
  if(!globalThis.localStorage)return false;
  globalThis.localStorage.setItem(FERRUGEM_SAVE_PREFIX+characterId,JSON.stringify(normalizeFerrugem(progress)));
  return true;
 }catch{return false;}
}
export function currentFerrugemStep(state:FerrugemProgress):FerrugemStep|null{
 if(!state.started||state.completed)return null;
 return FERRUGEM_STEPS[state.step]??null;
}
export function startFerrugem(state:FerrugemProgress):FerrugemProgress{
 if(state.started||state.completed)return state;
 return {...FRESH_FERRUGEM,started:true};
}
export function advanceFerrugem(state:FerrugemProgress,actor:string,ending?:FerrugemEnding):
 {advanced:boolean;progress:FerrugemProgress;stage?:FerrugemStep;message:string}{
 const stage=currentFerrugemStep(state);
 if(!stage)return {advanced:false,progress:state,message:"A investigação ainda não começou ou já foi concluída."};
 if(stage.actor!==actor)
  return {advanced:false,progress:state,message:"Este ponto não é o próximo passo. "+stage.objective};
 if(stage.id==="decisao"&&!ending)
  return {advanced:false,progress:state,message:"Rosa aguarda a decisão sobre a divulgação ou a proteção das provas."};
 if(stage.id!=="decisao"&&ending)
  return {advanced:false,progress:state,message:"A decisão final só ocorre depois de reunir todas as evidências."};
 const next=state.step+1;
 const ended=next===FERRUGEM_STEPS.length;
 const result:FerrugemProgress={
  started:true,step:next,completed:ended,
  history:[...state.history,stage.id],ending:ended?(ending??null):null,
 };
 return {advanced:true,progress:result,stage,message:stage.message};
}
export function ferrugemObjective(state:FerrugemProgress):string{
 if(state.completed)return state.ending==="publicar"
  ?"Dossiê de Ferrugem publicado. Acompanhe a reação da Helix e proteja as testemunhas."
  :"Provas preservadas pela comunidade. Uma denúncia coletiva está sendo preparada.";
 if(!state.started)return "Visite Ferrugem pelo transporte industrial do Pátio Sul para iniciar o capítulo.";
 return currentFerrugemStep(state)?.objective??"Retorne à assembleia de trabalhadores.";
}
