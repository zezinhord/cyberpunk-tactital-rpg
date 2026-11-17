/** Recuperação de derrota: fluxo determinístico e por personagem.
 * Não avança missões nem concede XP, créditos ou consumíveis.
 * Todas as escritas são verificadas; se o destino falhar, a vida é revertida.
 */
import {loadHealth,saveHealth} from "./health.ts";
import {loadWorldArea,saveWorldArea} from "../baixada/world-area.ts";
import type {GameState} from "../types.ts";

export type DefeatChoice="clinic"|"retry";
export function isOperativeDefeated(state:GameState):boolean{
 return state.combatComplete&&
   (state.units.find(unit=>unit.id==="runner")?.hp??1)<=0;
}
export function stabilizeAfterDefeat(maxHp:number,choice:DefeatChoice):number{
 if(!Number.isInteger(maxHp)||maxHp<1)return 0;
 // A unidade acorda com recursos suficientes para se mover, mas deve
 // procurar tratamento completo ou tentar o encontro com desvantagem.
 return Math.min(maxHp,Math.max(1,Math.ceil(maxHp*(choice==="clinic"?.35:.5))));
}
export function recoverFromDefeat(characterId:string,maxHp:number,choice:DefeatChoice):
 {ok:boolean;hp:number;message:string}{
 if(!characterId||!Number.isInteger(maxHp)||maxHp<1||
   (choice!=="clinic"&&choice!=="retry"))
  return {ok:false,hp:0,message:"Não foi possível identificar o protagonista."};
 const hp=stabilizeAfterDefeat(maxHp,choice);
 const previousHealth=loadHealth(characterId,maxHp);
 const previousArea=loadWorldArea(characterId);
 if(!saveHealth(characterId,hp,maxHp))
  return {ok:false,hp:previousHealth,message:"Não foi possível gravar a Vida. Verifique o armazenamento."};
 if(choice==="clinic"&&!saveWorldArea(characterId,"clinic")){
  // Save do personagem e progresso permanecem intactos caso falhe a transição.
  saveHealth(characterId,previousHealth,maxHp);
  saveWorldArea(characterId,previousArea);
  return {ok:false,hp:previousHealth,message:"Não foi possível salvar o retorno à clínica. Libere espaço e tente novamente."};
 }
 return {
  ok:true,hp,message:choice==="clinic"
   ?"Você foi evacuado para a clínica da Baixada. A missão permanece pendente."
   :"Novo confronto iniciado com parte da Vida recuperada. A missão não foi reiniciada.",
 };
}
