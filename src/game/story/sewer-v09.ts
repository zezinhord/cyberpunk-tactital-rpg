/** Investigação V-09 expandida: etapa subterrânea independente de saves legados.
 * Os marcos são monotônicos, persistidos por protagonista, sem recompensar XP duas vezes.
 */
export const SEWER_KEY="cyberpunk-tactical-rpg.sewer-v09.v1.";
export interface SewerProgress{
 traceFound:boolean;
 pumpRestored:boolean;
 gateOpened:boolean;
 manifestRecovered:boolean;
 sampleRecovered:boolean;
}
export type SewerEvent="sewer-track"|"sewer-pump"|"sewer-gate"|"sewer-manifest"|"sewer-sample";
export const FRESH_SEWER:Readonly<SewerProgress>={
 traceFound:false,pumpRestored:false,gateOpened:false,manifestRecovered:false,sampleRecovered:false,
};
export function normalizeSewer(value:unknown):SewerProgress{
 if(!value||typeof value!=="object"||Array.isArray(value))return {...FRESH_SEWER};
 const a=value as Record<string,unknown>;
 return {
  traceFound:a.traceFound===true,pumpRestored:a.pumpRestored===true,
  gateOpened:a.gateOpened===true,manifestRecovered:a.manifestRecovered===true,
  sampleRecovered:a.sampleRecovered===true,
 };
}
export function readSewer(id:string):SewerProgress{
 if(!id)return {...FRESH_SEWER};
 try{
  const raw=globalThis.localStorage?.getItem(SEWER_KEY+id);
  return raw?normalizeSewer(JSON.parse(raw)):{...FRESH_SEWER};
 }catch{return {...FRESH_SEWER};}
}
export function saveSewer(id:string,state:SewerProgress):boolean{
 if(!id)return false;
 try{
  const storage=globalThis.localStorage;
  if(!storage)return false;
  storage.setItem(SEWER_KEY+id,JSON.stringify(normalizeSewer(state)));
  return true;
 }catch{return false;}
}
export function sewerNextObjective(state:SewerProgress):string{
 if(!state.traceFound)return "Encontre a entrada de esgoto no Pátio Sul e examine os rastros V-09 na Galeria de Drenagem.";
 if(!state.pumpRestored)return "Na Galeria de Drenagem, religue a bomba hidráulica para liberar a comporta 04.";
 if(!state.gateOpened)return "Atravesse a Galeria de Drenagem e abra a comporta 04 rumo à Câmara de Recalque.";
 if(!state.manifestRecovered)return "Explore a Câmara de Recalque 04 e recupere o manifesto digital V-09.";
 return "Volte à superfície, investigue o console do Pátio do Reúso e localize a sentinela V-09.";
}
export function sewerStatus(state:SewerProgress):string{
 const completed=[state.traceFound,state.pumpRestored,state.gateOpened,state.manifestRecovered].filter(Boolean).length;
 return completed+" / 4 marcos da investigação subterrânea";
}
export function applySewerEvent(state:SewerProgress,event:SewerEvent):
 {state:SewerProgress;changed:boolean;allowed:boolean;message:string}{
 switch(event){
  case "sewer-track":
   return {state:state.traceFound?state:{...state,traceFound:true},
    changed:!state.traceFound,allowed:true,
    message:"LOG V-09: trilhas de transporte foram ocultadas dos registros públicos. A bomba da galeria precisa ser religada para recuperar o acesso."};
  case "sewer-pump":
   if(!state.traceFound)return {state,changed:false,allowed:false,
    message:"O quadro hidráulico pede a chave de serviço. Examine primeiro os rastros e o terminal V-09 ao norte da galeria."};
   return {state:state.pumpRestored?state:{...state,pumpRestored:true},
    changed:!state.pumpRestored,allowed:true,
    message:"Bombas restabelecidas. O canal lateral foi drenado e a comporta 04 agora responde ao controle manual."};
  case "sewer-gate":
   if(!state.pumpRestored)return {state,changed:false,allowed:false,
    message:"COMPORTA BLOQUEADA: pressão hidráulica excessiva. Encontre a trilha V-09 e religue a bomba antes de prosseguir."};
   return {state:state.gateOpened?state:{...state,gateOpened:true},
    changed:!state.gateOpened,allowed:true,
    message:"Comporta 04 liberada. A passagem leva à Câmara de Recalque, onde os manifestos de transferência eram arquivados."};
  case "sewer-manifest":
   if(!state.gateOpened)return {state,changed:false,allowed:false,
    message:"Acesso incompleto. Primeiro abra a comporta 04 na Galeria de Drenagem."};
   return {state:state.manifestRecovered?state:{...state,manifestRecovered:true},
    changed:!state.manifestRecovered,allowed:true,
    message:"MANIFESTO V-09 RECUPERADO. A pessoa transferida foi desviada por uma credencial experimental. A rota termina na cooperativa do Pátio do Reúso."};
  case "sewer-sample":
   if(!state.gateOpened)return {state,changed:false,allowed:false,message:"O contêiner está atrás da comporta de serviço."};
   return {state:state.sampleRecovered?state:{...state,sampleRecovered:true},
    changed:!state.sampleRecovered,allowed:true,
    message:"Amostra lacrada recolhida: um implante neural com sinais de adulteração. Evidência opcional preservada na investigação."};
 }
}
export function hasSewerEvidence(s:SewerProgress):boolean{return s.manifestRecovered;}
