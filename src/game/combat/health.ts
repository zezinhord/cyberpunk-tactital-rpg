/** Persistência mínima de Vida entre arena, missão e exploração, por personagem. */
export const HEALTH_KEY="cyberpunk-tactical-rpg.health.v1.";
export interface HealthRecord{hp:number;maxHp:number}
export function loadHealth(id:string,maxHp:number):number {
 if(!id)return maxHp;
 try{
   const raw=globalThis.localStorage?.getItem(HEALTH_KEY+id);
   if(!raw)return maxHp;
   const value=JSON.parse(raw) as Partial<HealthRecord>;
   if(!Number.isInteger(value.hp)||!Number.isInteger(value.maxHp)||
     !value.maxHp||value.maxHp<1||value.hp!<0)return maxHp;
   // Após uma derrota, estabiliza o protagonista com 1 HP para evitar softlock.
   return Math.min(maxHp,Math.max(1,value.hp!));
 }catch{return maxHp;}
}
export function saveHealth(id:string,hp:number,maxHp:number):boolean{
 if(!id||!Number.isInteger(hp)||!Number.isInteger(maxHp)||maxHp<1)return false;
 const safe=Math.min(maxHp,Math.max(1,hp));
 try{const storage=globalThis.localStorage;if(!storage)return false;
 storage.setItem(HEALTH_KEY+id,JSON.stringify({hp:safe,maxHp}));return true;}
 catch{return false;}
}
export function healAtClinic(id:string,maxHp:number):boolean{
 return saveHealth(id,maxHp,maxHp);
}
