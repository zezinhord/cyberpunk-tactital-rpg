import { route, canTraverse } from "./navigation.ts";
import type { Tile } from "./layout.ts";

export type CitizenState = "idle" | "walk" | "interact" | "return";
export interface CitizenDefinition {
  id: string; name: string; route: readonly Tile[]; pauseTicks: number;
}
export interface CitizenStep { tile: Tile; state: CitizenState; moved: boolean }
/** Simulação determinística sem Phaser: uma intenção por atualização.
 * As entidades nunca podem atravessar um sólido nem cortar caminhos diagonais.
 */
export class CitizenRoutine {
  state: CitizenState = "idle";
  readonly definition: CitizenDefinition;
  private waypointIndex=0;
  private pauseRemaining: number;
  constructor(definition: CitizenDefinition) {
    this.definition=definition;
    if(definition.route.length<2)throw new Error("Rota requer pelo menos dois destinos.");
    this.pauseRemaining=definition.pauseTicks;
  }
  interact():void { this.state="interact"; this.pauseRemaining=3; }
  tick(position:Tile, occupied:ReadonlySet<string>):CitizenStep {
    if(this.state==="interact"){
      this.pauseRemaining-=1;
      if(this.pauseRemaining<=0){this.state="return";this.pauseRemaining=0;}
      return {tile:position,state:this.state,moved:false};
    }
    if(this.state==="idle"){
      if(this.pauseRemaining>0){this.pauseRemaining-=1;return {tile:position,state:this.state,moved:false};}
      this.state="walk";
    }
    const nextIndex=(this.waypointIndex+1)%this.definition.route.length;
    const target=this.definition.route[nextIndex]!;
    const path=route(position,target,{occupied});
    if(!path || path.length===0)return {tile:position,state:this.state,moved:false};
    if(path.length===1){
      this.waypointIndex=nextIndex;
      if(this.waypointIndex===0){this.state="idle";this.pauseRemaining=this.definition.pauseTicks;}
      return {tile:position,state:this.state,moved:false};
    }
    const next=path[1]!;
    if(!canTraverse(position,next,{occupied}))return {tile:position,state:this.state,moved:false};
    if(next.x===target.x&&next.y===target.y){
      this.waypointIndex=nextIndex;
      if(nextIndex===0){this.state="idle";this.pauseRemaining=this.definition.pauseTicks;}
      else if(this.state==="return"){this.state="walk";}
    }
    return {tile:next,state:this.state,moved:true};
  }
}
