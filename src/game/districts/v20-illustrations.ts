/** Generated at build time from the 28 real interactive interiors.
 * Avoid eager imports from src/assets; public assets are requested only on
 * entering their room. In low-memory Android only 4 textures exist per room.
 */
import {EXPANSION_ROOM_DESIGNS,type ExpansionInnerId} from "./expansion-interiors.ts";
import type {InnerId} from "./interiors.ts";
export const ILLUSTRATED_INTERIORS:readonly ExpansionInnerId[]=
 EXPANSION_ROOM_DESIGNS.map(x=>x.id);
export type IllustratedObjectId="arquivo"|"sistema"|"suprimento";
export function isV20IllustratedRoom(id:InnerId|string):id is ExpansionInnerId{
 return ILLUSTRATED_INTERIORS.some(x=>x===id);
}
export function environmentArtKey(id:ExpansionInnerId,kind?:string):string{
 return "na-v20-env-"+id+(kind?"-"+kind:"-mural");
}
export function environmentArtUrl(id:ExpansionInnerId,kind?:string):string{
 const root="assets/v20-illustrations/";
 return kind?root+"props/"+id+"-"+kind+".png":root+"murals/"+id+".png";
}
