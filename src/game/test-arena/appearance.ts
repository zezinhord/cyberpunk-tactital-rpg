/** Apresentação corporal do arquétipo Operativo de Campo no Limbo de Teste.
 * Esta opção é somente visual, sem bônus de atributos ou efeitos em combate.
 */
export type TestAppearance = "masculine" | "feminine";
export const TEST_APPEARANCES: ReadonlyArray<{id:TestAppearance;label:string;asset:string}> = [
  {id:"masculine",label:"Masculina",asset:"/assets/arena/operative-m.svg"},
  {id:"feminine",label:"Feminina",asset:"/assets/arena/operative-f.svg"},
];
const KEY = "cyberpunk-tactical-rpg.arena-appearance.v1.";
export function loadTestAppearance(characterId: string): TestAppearance {
  try { return globalThis.localStorage?.getItem(KEY+characterId)==="feminine"?"feminine":"masculine"; }
  catch { return "masculine"; }
}
export function saveTestAppearance(characterId:string, value:TestAppearance):void {
  if(!characterId)return;
  try { globalThis.localStorage?.setItem(KEY+characterId,value); } catch { /* Sem armazenamento, a sessão ainda funciona. */ }
}
