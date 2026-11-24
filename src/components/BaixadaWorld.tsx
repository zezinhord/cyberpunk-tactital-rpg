import {lazy,Suspense} from "react";
import {isAndroidDevice} from "../game/performance";
import BaixadaLiteWorld from "./BaixadaLiteWorld";
import type {OriginId} from "../game/character";
import type {TestAppearance} from "../game/test-arena/appearance";
import type {SectorId} from "../game/baixada/layout";

/** Android não precisa criar Phaser.Game nem carregar atlases extensos para
 * abrir a Baixada. O Phaser anterior permanece disponível em navegadores
 * desktop e é importado somente quando necessário.
 */
const PhaserWorld=lazy(()=>import("./BaixadaPhaserWorld"));
interface Props{
  onInteract:(id:string)=>void;
  originId:OriginId;
  appearance:TestAppearance;
  characterId:string;
  onSectorChange?:(sector:SectorId)=>void;
  onNearbyAccess?:(actorId:string|null)=>void;
  objectiveActorId?:string|null;
  worldAlert?:boolean;
}
export default function BaixadaWorld(props:Props){
  if(isAndroidDevice())return <BaixadaLiteWorld {...props}/>;
  return <Suspense fallback={<div className="baixada-world" role="status">Carregando mapa isométrico...</div>}>
    <PhaserWorld {...props}/>
  </Suspense>;
}
