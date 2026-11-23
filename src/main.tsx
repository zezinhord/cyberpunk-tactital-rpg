import React from "react";
import { createRoot } from "react-dom/client";
// The 3GB native installer must become interactive BEFORE loading the
// large game/story module graph on entry-level Android devices.
// This chunk is bundled INSIDE the same APK, never a network/DLC download.
const App=React.lazy(()=>import("./App"));
import GameInstallationGate from "./components/GameInstallationGate";
import "./styles.css";
import "./landscape.css";
import "./immersive-ui.css";
import "./arena-v030.css";
import "./character-presentation.css";
import "./audio-controls.css";
import "./class-selection.css";
import "./save-slots.css";
import "./progression.css";
import "./trial.css";
import "./opening-cutscene.css";

/** Renderiza um erro recuperável em vez de deixar a WebView preta após falha no React.
 * Não limpa arquivos, personagens, missões ou preferências do jogador.
 */
class AndroidStartupBoundary extends React.Component<
  {children:React.ReactNode},{error:string|null}
>{
  state:{error:string|null}={error:null};
  static getDerivedStateFromError(error:unknown){
    return {error:error instanceof Error?error.message:String(error)};
  }
  componentDidCatch(error:Error){
    console.error("Nova Arcádia: falha de interface durante inicialização",error);
  }
  render(){
    if(!this.state.error)return this.props.children;
    return <main role="alert" style={{
      minHeight:"100dvh",background:"#101e2a",color:"#eaf7f8",padding:24,
      fontFamily:"system-ui,sans-serif",display:"grid",alignContent:"center",gap:12
    }}>
      <h1 style={{margin:0}}>Não foi possível abrir a interface</h1>
      <p>Seus personagens e saves não foram apagados. Registre esta mensagem
        e tente iniciar novamente.</p>
      <pre style={{overflowWrap:"anywhere",whiteSpace:"pre-wrap",fontSize:12}}>
        {this.state.error.slice(0,350)}
      </pre>
      <button type="button" style={{minHeight:52,background:"#166478",color:"#fff",
        border:"1px solid #8fe6ee",borderRadius:8,fontWeight:700}}
        onClick={()=>window.location.reload()}>Reiniciar interface sem apagar dados</button>
    </main>;
  }
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Elemento raiz #root não encontrado.");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <AndroidStartupBoundary>
      <GameInstallationGate>
        <React.Suspense fallback={
          <main className="na-install-root" role="status">
            <section className="na-install-window">
              <h1>Iniciando Nova Arcádia</h1>
              <p>Carregando os sistemas do jogo completo a partir do APK.</p>
            </section>
          </main>
        }>
          <App />
        </React.Suspense>
      </GameInstallationGate>
    </AndroidStartupBoundary>
  </React.StrictMode>,
);
