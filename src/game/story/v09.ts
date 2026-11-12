/** Episódio do Pátio: persistência isolada para não migrar saves da missão 0.6.7a. */
const KEY="cyberpunk-tactical-rpg.story-v09.v068.";
export interface V09Progress { defeated:boolean; reported:boolean }
export function readV09(characterId:string):V09Progress {
  try {
    const raw=globalThis.localStorage?.getItem(KEY+characterId);
    if(!raw)return {defeated:false,reported:false};
    const value=JSON.parse(raw) as Partial<V09Progress>;
    return {defeated:value.defeated===true,reported:value.defeated===true&&value.reported===true};
  }catch{return {defeated:false,reported:false};}
}
export function markV09Defeated(characterId:string):boolean {
  if(!characterId)return false;
  const previous=readV09(characterId);
  if(previous.defeated)return false;
  try {
    globalThis.localStorage?.setItem(KEY+characterId,JSON.stringify({...previous,defeated:true}));
    return true;
  }catch{return false;}
}
export function markV09Reported(characterId:string):boolean {
  if(!characterId)return false;
  const state=readV09(characterId);
  if(!state.defeated||state.reported)return false;
  try{globalThis.localStorage?.setItem(KEY+characterId,JSON.stringify({...state,reported:true}));return true;}
  catch{return false;}
}
