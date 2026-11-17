import {useEffect,useMemo,useState} from "react";
import {BOARD_WIDTH,BOARD_HEIGHT,isBlocked} from "../game/map";
import type {GameState,Position,Unit} from "../game/types";
import type {TurnManager} from "../game/TurnManager";
import type {TestAppearance} from "../game/test-arena/appearance";
import type {OriginId} from "../game/character/origins";

/** Campo tático SVG: dispensa WebGL/Canvas em Android, sem substituir a lógica
 * de turno, cobertura, IA ou as spritesheets das seis origens. */
const SPRITES=import.meta.glob([
 "../assets/characters/player-*-masculine.png",
 "../assets/characters/player-*-feminine.png",
],{query:"?url",import:"default",eager:true}) as Record<string,string>;
const BOARD=Array.from({length:BOARD_WIDTH*BOARD_HEIGHT},(_,i)=>{
 const x=i%BOARD_WIDTH,y=Math.floor(i/BOARD_WIDTH);
 return {x,y,blocked:isBlocked({x,y}),id:i};
}).sort((a,b)=>a.x+a.y-b.x-b.y||a.y-b.y);
const point=(p:Position)=>({x:240+(p.x-p.y)*28,y:70+(p.x+p.y)*14});
function diamond(x:number,y:number,w=56,h=28){
 return [[x,y-h/2],[x+w/2,y],[x,y+h/2],[x-w/2,y]]
  .map(p=>p.join(",")).join(" ");
}
function UnitSprite({unit,isPlayer,url,appearance}:{
 unit:Unit;isPlayer:boolean;url:string|undefined;appearance:TestAppearance
}){
 if(unit.hp<=0)return null;
 const p=point(unit),accent=isPlayer?"#00e5ff":"#ff2e88";
 const hp=Math.max(0,Math.min(1,unit.hp/Math.max(1,unit.maxHp)));
 return <g data-unit={unit.id} transform={"translate("+p.x+" "+p.y+")"}
    pointerEvents="none">
   <ellipse rx="19" ry="6" fill="#060d15" opacity=".8"/>
   <ellipse rx="15" ry="5" fill={accent} opacity=".22"/>
   {isPlayer&&url?
     <svg x="-24" y="-65" width="48" height="62" viewBox="0 80 64 80"
       overflow="hidden">
       <image href={url} x="0" y="0" width="768" height="320"/>
     </svg>:
     <image x="-23" y="-66" width="46" height="64"
       href={isPlayer?"/assets/arena/operative-"+(appearance==="feminine"?"f":"m")+".svg":
         "/assets/arena/sentinel.svg"}/>}
   <rect x="-20" y="-73" width="40" height="5" rx="2" fill="#152433" stroke={accent}/>
   <rect x="-19" y="-72" width={38*hp} height="3" rx="1" fill={accent}/>
   <text x="0" y="-78" textAnchor="middle" fill={accent} fontSize="8" fontWeight="bold">
     {isPlayer?"OPERATIVO":"HOSTIL"}
   </text>
 </g>;
}
export default function Battlefield({manager,appearance,originId}:{
 manager:TurnManager;appearance:TestAppearance;originId:OriginId
}){
 const [state,setState]=useState<GameState>(()=>manager.getState());
 useEffect(()=>{
   setState(manager.getState());
   return manager.subscribe(next=>setState(next));
 },[manager]);
 const reachable=useMemo(()=>new Set(manager.getReachableCells().map(p=>p.x+","+p.y)),
   [manager,state]);
 const player=state.units.find(u=>u.id==="runner");
 const enemy=state.units.find(u=>u.id==="drone");
 const active=!state.combatComplete&&state.activeSide==="player";
 const spriteUrl=SPRITES["../assets/characters/player-"+originId+"-"+appearance+".png"];
 function tap(cell:{x:number;y:number;blocked:boolean}){
   if(!active||cell.blocked)return;
   if(cell.x===0&&cell.y===6){manager.interactWithTerminal(0,6);return;}
   if(reachable.has(cell.x+","+cell.y))manager.movePlayerTo(cell.x,cell.y);
 }
 return <div className="battlefield-canvas na-svg-battlefield"
   data-battlefield-renderer="svg"
   aria-label={"Mapa de combate isométrico com origem "+originId+" e visual "+appearance}>
   <svg className="na-battlefield-svg" viewBox="0 0 480 320"
     preserveAspectRatio="xMidYMid meet" role="group"
     aria-label="Tabuleiro interativo de combate 8 por 8">
    <defs>
      <linearGradient id="na-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#223a43"/><stop offset="1" stopColor="#0d1220"/>
      </linearGradient>
      <pattern id="na-lines" width="26" height="26" patternUnits="userSpaceOnUse">
        <path d="M0 26L26 0" stroke="#63899a" strokeWidth=".5" opacity=".22"/>
      </pattern>
    </defs>
    <rect width="480" height="320" fill="#0d1220"/>
    <rect width="480" height="80" fill="url(#na-sky)"/>
    {Array.from({length:9},(_,i)=><g key={i} opacity=".34">
      <rect x={i*59-10} y={32+(i*13)%25} width={37+(i%3)*7}
         height="52" fill={i%2===0?"#425364":"#263945"}/>
      <rect x={i*59+4} y={44+(i*13)%25} width="5" height="4" fill="#e9b877"/>
    </g>)}
    <rect width="480" height="320" fill="url(#na-lines)"/>
    <path d="M0 70L87 55 181 69 270 53 353 71 480 50"
      fill="none" stroke="#67939d" strokeWidth="1.5" opacity=".42"/>
    <ellipse cx="232" cy="199" rx="210" ry="103" fill="#68b2c0" opacity=".08"/>
    {BOARD.map(cell=>{
      const p=point(cell),canMove=active&&reachable.has(cell.x+","+cell.y);
      const terminal=cell.x===0&&cell.y===6;
      const interactive=active&&!cell.blocked&&(canMove||terminal);
      const x=p.x,y=p.y;
      return <g key={cell.id} role={interactive?"button":undefined}
         tabIndex={interactive?0:undefined} className={interactive?"na-iso-actionable":undefined}
         aria-label={interactive?(terminal?"Ativar terminal de energia":
           "Mover para coluna "+(cell.x+1)+" linha "+(cell.y+1)):undefined}
         onClick={interactive?()=>tap(cell):undefined}
         onKeyDown={interactive?e=>{
           if(e.key==="Enter"||e.key===" "){e.preventDefault();tap(cell);}
         }:undefined}>
        <polygon points={diamond(x,y)}
          fill={cell.blocked?"#29394a":(cell.x+cell.y)%2?"#1b2739":"#1e2d40"}
          stroke="#546b80" strokeWidth=".9"/>
        {canMove&&!cell.blocked&&<polygon points={diamond(x,y,51,23)}
          fill="#00e5ff" fillOpacity=".18" stroke="#00e5ff" strokeWidth="1.5"/>}
        {cell.blocked&&<g pointerEvents="none">
          <polygon points={[[x-14,y-10],[x,y-18],[x+15,y-10],[x,y-2]].map(a=>a.join(",")).join(" ")}
             fill="#5c6b7b" stroke="#879aa9"/>
          <polygon points={[[x-14,y-10],[x,y-2],[x,y+10],[x-14,y+2]].map(a=>a.join(",")).join(" ")}
             fill="#1b2739"/>
          <polygon points={[[x,y-2],[x+15,y-10],[x+15,y+2],[x,y+10]].map(a=>a.join(",")).join(" ")}
             fill="#34495c"/>
        </g>}
        {terminal&&<g pointerEvents="none">
          <rect x={x-9} y={y-17} width="18" height="14" rx="2"
            fill="#29343f" stroke="#ffd166" strokeWidth="1.5"/>
          <rect x={x-5} y={y-13} width="10" height="5"
             fill={state.terminalUsed?"#63717b":"#ffd166"}/>
          <text x={x} y={y-22} textAnchor="middle" fontSize="7" fill="#ffd166">ENERGIA</text>
        </g>}
      </g>;
    })}
    {[...(player?[player]:[]),...(enemy?[enemy]:[])]
      .sort((a,b)=>a.x+a.y-b.x-b.y)
      .map(unit=><UnitSprite key={unit.id} unit={unit}
        isPlayer={unit.id==="runner"}
        url={unit.id==="runner"?spriteUrl:undefined} appearance={appearance}/>)}
    <text x="15" y="16" fill="#b9d3d8" fontSize="9" letterSpacing="1">
      NOVA ARCÁDIA · COMBATE TÁTICO</text>
    <text x="460" y="16" fill="#ffd166" fontSize="9" textAnchor="end">
      ONDA {state.wave}/{state.totalWaves}</text>
    <text x="240" y="307" textAnchor="middle" fill="#cfdae0" fontSize="10">
      {state.combatComplete?"CONFRONTO ENCERRADO · VOLTE AO MAPA":
       active?"TOQUE NAS CÉLULAS CIANO PARA MOVER":"AGUARDE O INIMIGO"}
    </text>
   </svg>
 </div>;
}
