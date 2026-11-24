/** RC19: canonical narrative cues drive actual Phaser camera, without
 * forging decisions, rewards, quest state or replay history.
 * These camera directions are presentation only, not a save migration.
 */
export type CinematicCameraFocus="hero"|"guide"|"objective";
export interface SceneDialogueCue{
 readonly speaker:string;readonly role:string;readonly cinematicId?:string;
}
export function focusForNarrativeCue(
 page:SceneDialogueCue|null|undefined,guideName:string
):CinematicCameraFocus|null{
 if(!page)return null;
 const role=page.role.toLocaleUpperCase("pt-BR");
 if(page.cinematicId?.startsWith("arrival:")||
    role.includes("CHEGADA AO DISTRITO"))return "objective";
 const speaker=page.speaker.toLocaleLowerCase("pt-BR").trim();
 if(speaker===guideName.toLocaleLowerCase("pt-BR").trim()||
    page.cinematicId?.startsWith("first-contact:"))
  return "guide";
 if(role.includes("DOSS")||role.includes("ARQUIVO")||
    role.includes("EVIDÊNCIA")||role.includes("PROTOCOLO"))
  return "objective";
 return "hero";
}
