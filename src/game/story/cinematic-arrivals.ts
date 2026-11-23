/** Short, one-time district establishing beats. The physical exploration
 * scene remains mounted behind the existing cinematic dialogue compositor.
 * All lore for the five districts is imported from the canonical catalog.
 */
import {DISTRICTS,isDistrictId,getDistrict} from "../districts/catalog.ts";
import type {DistrictId} from "../districts/catalog.ts";

export const CINEMATIC_ARRIVAL_AREAS=[
 "ferrugem","aurea","subsolo","setor-zero","prisma","periferia","sewer-deep"
] as const;
export type CinematicArrivalArea=(typeof CINEMATIC_ARRIVAL_AREAS)[number];
export interface CinematicArrival{
 id:string;area:CinematicArrivalArea;title:string;speaker:string;
 role:string;portrait:string;text:string;durationMs:number;
}
const FERRUGEM:CinematicArrival={
 id:"arrival:ferrugem",area:"ferrugem",title:"Ferrugem · turno de trabalho",
 speaker:"NOVA ARCÁDIA",role:"CHEGADA AO DISTRITO · FERRUGEM",
 portrait:"▤",
 text:"As caldeiras de Ferrugem continuam acesas enquanto operários e oficinas disputam cada turno. Entre trilhos e depósitos, os registros de manutenção podem revelar quem controla o abastecimento.",
 durationMs:8200
};
const ESGOTOS:CinematicArrival={
 id:"arrival:sewer-deep",area:"sewer-deep",title:"Câmara de Recalque · acesso subterrâneo",
 speaker:"NOVA ARCÁDIA",role:"CHEGADA AO DISTRITO · REDE DE ESGOTOS",
 portrait:"▤",
 text:"Os canais subterrâneos levam os resíduos e os registros que a superfície prefere esquecer. A manutenção da rede pluvial é parte da investigação V-09.",
 durationMs:8000
};
export function arrivalForArea(area:string|null):CinematicArrival|null{
 if(area==="ferrugem")return FERRUGEM;
 if(area==="sewer-deep")return ESGOTOS;
 if(!isDistrictId(area))return null;
 const district=getDistrict(area);
 return {
  id:"arrival:"+district.id,area:district.id,
  title:district.name+" · "+district.subtitle.toLocaleLowerCase("pt-BR"),
  speaker:"NOVA ARCÁDIA",
  role:"CHEGADA AO DISTRITO · "+district.name.toLocaleUpperCase("pt-BR"),
  portrait:"▤",
  text:district.intro,
  durationMs:8200
 };
}
export function cinematicArrivalForDistrict(id:DistrictId):CinematicArrival{
 return arrivalForArea(id)!;
}
export function validateCinematicArrivals():boolean{
 return CINEMATIC_ARRIVAL_AREAS.length===DISTRICTS.length+2&&
  new Set(CINEMATIC_ARRIVAL_AREAS.map(a=>arrivalForArea(a)?.id)).size===
    CINEMATIC_ARRIVAL_AREAS.length;
}
