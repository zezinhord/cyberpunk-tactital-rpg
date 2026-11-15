import {Component,type ReactNode} from "react";
const ERROR_KEY="cyberpunk-tactical-rpg.last-scene-failure.v1";
interface Props{name:string;children:ReactNode}
interface State{failure:boolean;message:string}
/** Contenção local: falha de WebGL/Canvas ou do chunk não derruba
 * criação de personagem, slots e a interface React do aplicativo.
 * Nunca envia telemetria e nunca apaga salvamentos. */
export default class SceneRecovery extends Component<Props,State>{
 state:State={failure:false,message:""};
 static getDerivedStateFromError(error:Error):State{
   return {failure:true,message:String(error?.name||"Erro de cena").slice(0,48)};
 }
 componentDidCatch(error:Error):void{
   try{globalThis.localStorage?.setItem(ERROR_KEY,JSON.stringify({
     scene:this.props.name,kind:String(error?.name||"Error").slice(0,48),
     at:new Date().toISOString(),
   }));}catch{/* Logs opcionais; jamais bloquear UI por quota. */}
 }
 render():ReactNode{
   if(!this.state.failure)return this.props.children;
   return <section className="na-scene-recovery" role="alert">
     <strong>Não foi possível abrir {this.props.name}.</strong>
     <p>O restante do aplicativo permanece disponível. Seu personagem e seus
       salvamentos não foram apagados.</p>
     <small>Diagnóstico local: {this.state.message}</small>
     <button type="button" onClick={()=>window.location.reload()}>
       Reiniciar aplicativo com segurança
     </button>
   </section>;
 }
}
