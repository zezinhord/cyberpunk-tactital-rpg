import { route, canTraverse } from "./navigation.ts";
import type { Tile } from "./layout.ts";
import type {CitizenContext} from "../ai/citizen-schedule.ts";

export type CitizenState = "idle" | "walk" | "interact" | "return" | "rest" | "alert";
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
  tick(position:Tile, occupied:ReadonlySet<string>,context?:CitizenContext):CitizenStep {
    if(context&&(context.phase==="rest"||context.alarmed)){
      // A frightened/resting resident returns home through real obstacles,
      // then stops updating until the alert or night period ends.
      const home=this.definition.route[0]!;
      const state:CitizenState=context.alarmed?"alert":"rest";
      if(position.x===home.x&&position.y===home.y){
        this.state=state;this.waypointIndex=0;
        return {tile:position,state,moved:false};
      }
      const path=route(position,home,{occupied});
      if(!path||path.length<2||!canTraverse(position,path[1]!,{occupied})){
        this.state="return";
        return {tile:position,state:"return",moved:false};
      }
      this.state="return";
      return {tile:path[1]!,state:"return",moved:true};
    }
    if(this.state==="rest"||this.state==="alert"){
      this.state="idle";this.pauseRemaining=this.definition.pauseTicks;
    }
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
