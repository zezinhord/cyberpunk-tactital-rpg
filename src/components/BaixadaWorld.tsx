import {lazy,Suspense} from "react";
import type {OriginId} from "../game/character";
import type {TestAppearance} from "../game/test-arena/appearance";
import type {SectorId} from "../game/baixada/layout";

/** A Baixada usa um único mapa oficial Phaser em Android e navegadores.
 * Economia/Balanced controlam somente FPS/renderização, jamais trocam
 * conteúdo, NPCs, progressão ou mapa por uma experiência Lite.
 * O chunk é carregado só depois de entrar na exploração, reduzindo o
 * custo do primeiro boot sem reduzir o jogo.
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
  return <Suspense fallback={<div className="baixada-world na-world-host" role="status">
    Carregando o mapa completo de Nova Arcádia…
  </div>}>
    <PhaserWorld {...props}/>
  </Suspense>;
}
