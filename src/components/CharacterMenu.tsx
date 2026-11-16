import { useState } from "react";
import AudioControls from "./AudioControls";
import {readGraphicsMode,saveGraphicsMode,type GraphicsMode} from "../game/performance";
import {readPerformanceReport} from "../game/performance-diagnostics";
import type { OriginGameplayProfile, PlayerCharacter } from "../game/character";
import { ITEM_CATALOG, ITEM_IDS } from "../game/inventory";
import {CRAFTING_RECIPES,canCraft,craftingIngredientsLabel,type RecipeId} from "../game/crafting";
import type { InventoryState, ItemId } from "../game/inventory";
import type { TestAppearance } from "../game/test-arena/appearance";
import { getPlayerSpriteUrl } from "../game/baixada/sprites";
import ClassSelection from "./ClassSelection";
import ProgressionTree from "./ProgressionTree";
import {SEWER_MAPS} from "../game/baixada/sewer-layout";
import {favorStatus,visibleFavors,type FavorContext,type FavorState} from "../game/story/favors";
import {sewerStatus,type SewerProgress} from "../game/story/sewer-v09";
import {FERRUGEM_STEPS,ferrugemObjective,type FerrugemProgress} from "../game/ferrugem/story";
import type {StatId} from "../game/progression/tree";
import {getClassById,CLASS_SKILLS,getClassSkills,type ClassId} from "../game/classes/registry";

type MenuSection = "character" | "progression" | "inventory" | "equipment" | "abilities" | "map" | "journal" | "settings";

interface JournalClue {
  id: string;
  text: string;
}

interface Props {
  initialSection?:"character"|"progression"|"journal";
  character: PlayerCharacter;
  appearance: TestAppearance;
  onChangeAppearance: (appearance: TestAppearance) => void;
  onChooseClass: (classId: ClassId) => void;
  onPurchaseAttribute:(id:StatId)=>string;
  onPurchaseSkill:(id:string)=>string;
  originName: string;
  originDescription: string;
  originProfile: OriginGameplayProfile;
  missionStep: 0 | 1 | 2 | 3;
  missionObjective: string;
  favors:FavorState;
  favorContext:FavorContext;
  sewerProgress:SewerProgress;
  ferrugemProgress:FerrugemProgress;
  clues: JournalClue[];
  sceneTitle: string;
  sceneSubtitle: string;
  onClose: () => void;
  onReturnToTitle: () => void;
  onOpenTestArena: () => void;
  inventory: InventoryState;
  onToggleEquipment: (id: ItemId) => void;
  onCraft:(id:RecipeId)=>string;
}

const MENU_ITEMS: ReadonlyArray<{ id: MenuSection; code: string; label: string; description: string }> = [
  { id: "character", code: "ID", label: "Personagem", description: "Identidade e progressão" },
  { id: "progression", code: "XP", label: "Árvore de evolução", description: "Comprar atributos e habilidades" },
  { id: "inventory", code: "INV", label: "Inventário", description: "Itens e recursos" },
  { id: "equipment", code: "EQP", label: "Equipamentos", description: "Armas, trajes e implantes" },
  { id: "abilities", code: "HAB", label: "Habilidades", description: "Vantagens e técnicas" },
  { id: "map", code: "MAP", label: "Mapa", description: "Distritos e localização" },
  { id: "journal", code: "LOG", label: "Diário", description: "Missões e descobertas" },
  { id: "settings", code: "CFG", label: "Configurações", description: "Preferências do jogo" },
];

const DISTRICTS = [
  { name: "Baixada Central", status: "ÁREA JOGÁVEL", current: true },
  { name: "Pátio do Reúso", status: "SETOR INDUSTRIAL JOGÁVEL", current: true },
  { name: "Mercado dos Cabos", status: "SETOR COMERCIAL JOGÁVEL", current: true },
  { name: "Áurea", status: "DISTRITO JOGÁVEL · CAMPANHA ATIVA", current: true },
  { name: "Ferrugem", status: "DISTRITO INDUSTRIAL JOGÁVEL", current: true },
  { name: "Subsolo", status: "DISTRITO JOGÁVEL · CAMPANHA ATIVA", current: true },
  { name: "Setor Zero", status: "DISTRITO JOGÁVEL · CAMPANHA ATIVA", current: true },
  { name: "Prisma", status: "DISTRITO JOGÁVEL · CAMPANHA ATIVA", current: true },
  { name: "Periferia externa", status: "DISTRITO JOGÁVEL · CAMPANHA ATIVA", current: true },
];

function DataCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <article className="menu-data-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </article>
  );
}

export default function CharacterMenu({
  initialSection,
  character,
  appearance,
  onChangeAppearance,
  onChooseClass,
  onPurchaseAttribute,
  onPurchaseSkill,
  originName,
  originDescription,
  originProfile,
  missionStep,
  missionObjective,
  favors,
  favorContext,
  sewerProgress,
  ferrugemProgress,
  clues,
  sceneTitle,
  sceneSubtitle,
  onClose,
  onReturnToTitle,
  onOpenTestArena,
  inventory,
  onToggleEquipment,
  onCraft,
}: Props) {
  const [activeSection, setActiveSection] = useState<MenuSection>(initialSection??"character");
  const [pendingClass,setPendingClass]=useState<ClassId|null>(null);
  const [craftNotice,setCraftNotice]=useState("");
  const [graphicsMode,setGraphicsMode]=useState<GraphicsMode>(readGraphicsMode);
  const [graphicsNotice,setGraphicsNotice]=useState("");
  const [performanceReport]=useState(readPerformanceReport);
  const activeItem = MENU_ITEMS.find((item) => item.id === activeSection)!;
  const attributeEntries = Object.entries(character.attributes);
  const progress = Math.max(0, Math.min(3, missionStep));

  return (
    <div className="character-menu-scrim">
      <section className="character-menu-shell" role="dialog" aria-modal="true" aria-labelledby="character-menu-title">
        <header className="character-menu-header">
          <div className="menu-brand">
            <span className="menu-brand-mark" aria-hidden="true">NA</span>
            <div>
              <span className="menu-overline">NOVA ARCÁDIA // ARQUIVO PESSOAL</span>
              <h2 id="character-menu-title">Central do protagonista</h2>
            </div>
          </div>
          <div className="menu-header-meta">
            <span className="menu-save-state"><i /> DADOS LOCAIS</span>
            <button type="button" className="menu-close-button" onClick={onClose}>
              <span aria-hidden="true">←</span> VOLTAR AO JOGO
            </button>
          </div>
        </header>

        <div className="character-menu-layout">
          <nav className="character-menu-nav" aria-label="Seções do menu do protagonista">
            <span className="menu-nav-heading">SEÇÕES</span>
            {MENU_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={activeSection === item.id ? "active" : ""}
                onClick={() => setActiveSection(item.id)}
                aria-pressed={activeSection === item.id}
              >
                <span className="menu-nav-code">{item.code}</span>
                <span className="menu-nav-copy">
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
                <span className="menu-nav-arrow" aria-hidden="true">›</span>
              </button>
            ))}
            <div className="menu-nav-foot">
              <span>REGISTRO ATIVO</span>
              <strong>{character.name}</strong>
              <small>Salvo neste dispositivo</small>
            </div>
          </nav>

          <div className="character-menu-content">
            <div className="menu-section-heading">
              <div>
                <span>{activeItem.code} // {activeItem.description.toUpperCase()}</span>
                <h3>{activeItem.label}</h3>
              </div>
              <div className="menu-location-chip">
                <span>LOCALIZAÇÃO</span>
                <strong>{sceneTitle}</strong>
              </div>
            </div>

            {activeSection === "character" && (
              <div className="menu-section-stack">
                <section className="menu-character-hero">
                  <div className="menu-character-avatar sprite-preview" aria-hidden="true" style={{
                    backgroundImage: `url("${getPlayerSpriteUrl(character.originId, appearance)}")`,
                    backgroundSize: "672px 280px", backgroundPosition: "0px -210px",
                  }} />
                  <div className="menu-character-identity">
                    <span>IDENTIDADE CONFIRMADA</span>
                    <h4>{character.name}</h4>
                    <p>{originName} <i /> {sceneSubtitle}</p>
                  </div>
                  <div className="menu-level-block"><strong>{String(character.level).padStart(2, "0")}</strong><span>NÍVEL</span></div>
                </section>

                <section className="menu-info-panel">
                  <span className="menu-panel-kicker">APRESENTAÇÃO CORPORAL · SEM ALTERAÇÕES MECÂNICAS</span>
                  <div className="character-body-selection" role="group" aria-label="Apresentação visual do protagonista">
                    <button type="button" aria-pressed={appearance === "masculine"}
                      onClick={() => onChangeAppearance("masculine")}>Masculina</button>
                    <button type="button" aria-pressed={appearance === "feminine"}
                      onClick={() => onChangeAppearance("feminine")}>Feminina</button>
                  </div>
                  <p>Troca apenas o sprite na Baixada e interiores. Atributos, equipamentos e habilidades são idênticos.</p>
                </section>
                <div className="menu-data-grid">
                  <DataCard label="ORIGEM" value={originName} detail="Histórico de nascimento e contatos" />
                  <DataCard label="CLASSE" value={character.classId ? getClassById(character.classId).name : "Não definida"} detail={character.classId?"Especialização mecânica independente da origem":"Escolha uma das 11 classes oficiais"} />
                  <DataCard label="EXPERIÊNCIA" value={String(character.experience)} detail="Pontos registrados" />
                  <DataCard label="MISSÃO PRINCIPAL" value={missionStep === 3 ? (sewerProgress.manifestRecovered ? "Esgoto investigado" : "Rota V-09 ativa") : "Em andamento"} detail={progress + " de 3 etapas da clínica"} />
                </div>

                {!character.classId && <section className="menu-info-panel">
                  <ClassSelection value={pendingClass} onChange={setPendingClass} compact />
                  <button type="button" className="ability-button" disabled={!pendingClass}
                    onClick={()=>{if(pendingClass)onChooseClass(pendingClass);}}>
                    Confirmar classe do protagonista
                  </button>
                  <p>Esta seleção será vinculada ao salvamento atual. Sua origem e aparência continuarão inalteradas.</p>
                </section>}
                {character.classId&&<section className="menu-info-panel">
                  <span className="menu-panel-kicker">CLASSE · ESPECIALIZAÇÃO</span>
                  <h4>{getClassById(character.classId).name}</h4>
                  <p>{getClassById(character.classId).description}</p>
                  <p><b>Exploração:</b> {getClassById(character.classId).explorationFocus}</p>
                </section>}
                <section className="menu-info-panel">
                  <span className="menu-panel-kicker">HISTÓRICO DE ORIGEM</span>
                  <p>{originDescription}</p>
                </section>

                <div className="menu-two-columns">
                  <section className="menu-info-panel">
                    <span className="menu-panel-kicker">VANTAGEM PASSIVA</span>
                    <h4>{originProfile.passiveDescription}</h4>
                    <p>{originProfile.passiveEffect}</p>
                  </section>
                  <section className="menu-info-panel">
                    <span className="menu-panel-kicker">HABILIDADE DE ORIGEM</span>
                    <h4>{originProfile.abilityName}</h4>
                    <p>{originProfile.abilityDescription}</p>
                  </section>
                </div>

                <section className="menu-info-panel">
                  <span className="menu-panel-kicker">ATRIBUTOS</span>
                  {attributeEntries.length > 0 ? (
                    <div className="menu-attribute-grid">
                      {attributeEntries.map(([name, value]) => <DataCard key={name} label={name} value={String(value)} />)}
                    </div>
                  ) : (
                    <p>Os atributos ainda não foram distribuídos. A ficha já reserva este espaço para a futura progressão do protagonista.</p>
                  )}
                </section>
              </div>
            )}

            {activeSection === "progression" && (
              <ProgressionTree character={character}
                onAttribute={onPurchaseAttribute} onSkill={onPurchaseSkill}/>
            )}
            {activeSection === "inventory" && (
              <div className="menu-section-stack">
                <section className="menu-list-panel">
                  <span className="menu-panel-kicker">ITENS DO PROTAGONISTA // SALVAMENTO LOCAL</span>
                  {ITEM_IDS.filter((id) => inventory.quantities[id] > 0).map((id) => {
                    const item = ITEM_CATALOG[id];
                    const equipped = item.slot ? inventory.equipped[item.slot] === id : false;
                    return (
                      <article className="na-item-row" key={id}>
                        <div>
                          <span>{item.category.toUpperCase()} · QTD {inventory.quantities[id]}</span>
                          <h4>{item.name}</h4>
                          <p>{item.description}</p>
                        </div>
                        {item.slot && <button type="button" onClick={() => onToggleEquipment(id)}>
                          {equipped ? "Remover" : "Equipar"}
                        </button>}
                      </article>
                    );
                  })}
                  {ITEM_IDS.every((id) => inventory.quantities[id] === 0) && <p className="menu-empty-copy">Inventário vazio.</p>}
                </section>
                <section className="na-crafting-panel" aria-label="Bancada de fabricação de Ferrugem">
                  <span className="menu-panel-kicker">BANCADA INDUSTRIAL · FABRICAÇÃO</span>
                  <p>Combine os componentes recuperados em Ferrugem e na oficina de Nilo.
                    A fabricação consome recursos e produz equipamentos utilizáveis no combate.</p>
                  {CRAFTING_RECIPES.map(recipe=>
                    <article key={recipe.id} className="na-crafting-recipe">
                      <div><strong>{recipe.title}</strong>
                        <small>{recipe.description}</small>
                        <small>Materiais: {craftingIngredientsLabel(recipe)}</small></div>
                      <button type="button" disabled={!canCraft(inventory,recipe.id)}
                        onClick={()=>setCraftNotice(onCraft(recipe.id))}>Fabricar</button>
                    </article>)}
                  {craftNotice&&<p role="status">{craftNotice}</p>}
                </section>
                <p className="menu-footnote">O inventário e os equipamentos fabricados são salvos neste aparelho. Curativos podem ser usados em combate.</p>
              </div>
            )}

            {activeSection === "equipment" && (
              <div className="menu-section-stack">
                <div className="menu-two-columns">
                  {(["weapon", "armor"] as const).map((slot) => {
                    const id = inventory.equipped[slot];
                    return (
                      <section className="menu-info-panel" key={slot}>
                        <span className="menu-panel-kicker">{slot === "weapon" ? "ARMA" : "PROTEÇÃO"}</span>
                        <h4>{id ? ITEM_CATALOG[id].name : "Espaço livre"}</h4>
                        <p>{id ? ITEM_CATALOG[id].description : "Abra o Inventário para equipar um item."}</p>
                        {id && <button type="button" className="na-item-unequip" onClick={() => onToggleEquipment(id)}>Remover equipamento</button>}
                      </section>
                    );
                  })}
                </div>
                <p className="menu-footnote">Modificadores de arma e proteção são aplicados na próxima entrada no Limbo de Teste.</p>
              </div>
            )}

            {activeSection === "abilities" && (
              <div className="menu-section-stack">
                <section className="menu-info-panel menu-ability-card">
                  <span className="menu-panel-kicker">PASSIVA DE ORIGEM // SEM CUSTO</span>
                  <h4>{originProfile.passiveDescription}</h4>
                  <p>{originProfile.passiveEffect}</p>
                </section>
                <section className="menu-info-panel menu-ability-card">
                  <span className="menu-panel-kicker">HABILIDADE ATIVA DE ORIGEM</span>
                  <h4>{originProfile.abilityName}</h4>
                  <p>{originProfile.abilityDescription}</p>
                  <small>O efeito está ligado à arena tática de teste nesta versão.</small>
                </section>
                {character.classId&&<section className="menu-info-panel menu-ability-card">
                  <span className="menu-panel-kicker">HABILIDADE EXCLUSIVA · {getClassById(character.classId).name.toUpperCase()}</span>
                  {getClassSkills(character.classId).map(skill=><div className="class-ability-readout" key={skill.id}>
                    <h4>{skill.name} {character.abilities.includes(skill.id)?"· COMPRADA":"· BLOQUEADA"}</h4><p>{skill.description}</p>
                    <small>Custo: {skill.cost} energia · Recarga: {skill.cooldown} turnos · Alcance: {skill.range} células · Nível {skill.minimumLevel}</small>
                    <p><small>{character.abilities.includes(skill.id)?"Usável no combate.":"Abra a Árvore de evolução e compre esta técnica no nível exigido."}</small></p>
                  </div>)}
                </section>}
                {character.abilities.length > 0 && (
                  <section className="menu-list-panel">
                    <span className="menu-panel-kicker">OUTRAS HABILIDADES REGISTRADAS</span>
                    {character.abilities.map((ability, index) => <div className="menu-list-row" key={ability + index}><span>HAB-{String(index + 1).padStart(2, "0")}</span><strong>{CLASS_SKILLS[ability]?.name??ability}</strong></div>)}
                  </section>
                )}
              </div>
            )}

            {activeSection === "map" && (
              <div className="menu-section-stack">
                <section className="menu-current-location">
                  <span className="menu-panel-kicker">POSIÇÃO ATUAL</span>
                  <h4>{sceneTitle}</h4>
                  <p>{sceneSubtitle}</p>
                  <strong>BAIXADA · NOVA ARCÁDIA</strong>
                </section>
                <section className="menu-list-panel">
                  <span className="menu-panel-kicker">DISTRITOS DA CIDADE</span>
                  {DISTRICTS.map((district) => (
                    <div className={"menu-list-row " + (district.current ? "current" : "planned")} key={district.name}>
                      <span>{district.current ? "●" : "○"}</span>
                      <strong>{district.name}</strong>
                      <small>{district.status}</small>
                    </div>
                  ))}
                </section>
                <section className="menu-list-panel">
                  <span className="menu-panel-kicker">SUBSOLO / ROTAS JOGÁVEIS</span>
                  {Object.values(SEWER_MAPS).map(area=><div className="menu-list-row current" key={area.id}>
                    <span>↓</span><strong>{area.name}</strong>
                    <small>{area.subtitle} · JOGÁVEL</small>
                  </div>)}
                </section>
                <p className="menu-footnote">Sete distritos possuem exploração e missões: Baixada, Ferrugem, Áurea, Subsolo, Setor Zero, Prisma e Periferia. Utilize a estação de trânsito no Pátio Sul depois de recuperar o manifesto V-09.</p>
              </div>
            )}

            {activeSection === "journal" && (
              <div className="menu-section-stack">
                <section className="menu-quest-card">
                  <div className="menu-quest-heading">
                    <div><span className="menu-panel-kicker">MISSÃO PRINCIPAL // BAIXADA</span><h4>O nome que sumiu</h4></div>
                    <strong>{missionStep === 3 ? (sewerProgress.manifestRecovered?"ESGOTO INVESTIGADO":"CLÍNICA CONCLUÍDA") : "ATIVA"}</strong>
                  </div>
                  <p>Uma pessoa desapareceu depois de procurar atendimento por causa de um implante defeituoso. O registro oficial foi apagado, mas a clínica preservou uma cópia local.</p>
                  <div className="menu-quest-progress"><span style={{ width: ((progress / 3) * 100) + "%" }} /></div>
                  <small>{progress} / 3 etapas da clínica concluídas</small>
                  <div className="menu-objective"><span>OBJETIVO ATUAL</span><strong>{missionObjective}</strong></div>
                </section>
                {missionStep>=3&&<section className="menu-list-panel">
                  <span className="menu-panel-kicker">ROTA SUBTERRÂNEA // {sewerStatus(sewerProgress)}</span>
                  <div className="menu-list-row"><span>{sewerProgress.traceFound?"✓":"○"}</span><strong>Rastros V-09</strong><small>GALERIA -01</small></div>
                  {sewerProgress.traceFound&&<div className="menu-list-row"><span>{sewerProgress.pumpRestored?"✓":"○"}</span><strong>Bomba hidráulica</strong><small>GALERIA -01</small></div>}
                  {sewerProgress.pumpRestored&&<div className="menu-list-row"><span>{sewerProgress.gateOpened?"✓":"○"}</span><strong>Comporta 04</strong><small>DESCIDA -02</small></div>}
                  {sewerProgress.gateOpened&&<div className="menu-list-row"><span>{sewerProgress.manifestRecovered?"✓":"○"}</span><strong>Manifesto V-09</strong><small>CÂMARA -02</small></div>}
                </section>}
                {ferrugemProgress.started&&<section className="menu-list-panel">
                  <span className="menu-panel-kicker">CAPÍTULO FERRUGEM // {ferrugemProgress.completed?"CONCLUÍDO":ferrugemProgress.started?(ferrugemProgress.step+"/"+FERRUGEM_STEPS.length):"NÃO INICIADO"}</span>
                  <p>{ferrugemObjective(ferrugemProgress)}</p>
                  {ferrugemProgress.started&&<div className="menu-list-row current">
                    <span>◈</span><strong>{ferrugemProgress.completed?"Destino das provas":FERRUGEM_STEPS[ferrugemProgress.step]?.title}</strong>
                    <small>{ferrugemProgress.ending==="publicar"?"PUBLICAÇÃO":ferrugemProgress.ending==="proteger"?"PROTEÇÃO COMUNITÁRIA":"EM INVESTIGAÇÃO"}</small>
                  </div>}
                </section>}
                <section className="menu-list-panel" aria-label="Histórico dos favores">
                  <span className="menu-panel-kicker">REDE DE FAVORES · {favors.credits} CRÉDITOS · {favors.honor} HONRA</span>
                  {visibleFavors(favorContext).length===0?
                    <p className="menu-empty-copy">Nenhum favor conhecido. Avance na clínica e converse com os moradores.</p>:
                    visibleFavors(favorContext).filter(f=>favors.accepted.includes(f.id)).length===0?
                      <p className="menu-empty-copy">Existem pedidos disponíveis no quadro de favores; aceite os que quiser realizar.</p>:
                      visibleFavors(favorContext).filter(f=>favors.accepted.includes(f.id)).map(f=>
                        <div className="menu-list-row" key={f.id}>
                          <span>{favorStatus(favors,f.id)==="claimed"?"✓":favorStatus(favors,f.id)==="ready"?"◆":"○"}</span>
                          <strong>{f.title} · {f.contact}</strong>
                          <small>{favorStatus(favors,f.id)==="claimed"?"CONCLUÍDO":
                            favorStatus(favors,f.id)==="ready"?"ENTREGAR AO CONTATO":"EM ANDAMENTO"}</small>
                          <p>{f.objective}</p>
                          <small>+{f.reward.xp} XP · {f.reward.credits} créditos · {f.reward.honor} Honra</small>
                        </div>)}
                </section>
                <section className="menu-list-panel">
                  <span className="menu-panel-kicker">PISTAS E REGISTROS // {clues.length}</span>
                  {clues.length > 0 ? clues.map((clue) => (
                    <div className="menu-clue-row" key={clue.id}><span>REGISTRO {clue.id.toUpperCase()}</span><p>{clue.text}</p></div>
                  )) : <p className="menu-empty-copy">Nenhuma pista adicional foi registrada. Converse com moradores e consulte os terminais da Baixada.</p>}
                </section>
              </div>
            )}

            {activeSection === "settings" && (
              <div className="menu-section-stack">
                <div className="menu-two-columns">
                  <button type="button" className="menu-close-button" onClick={onReturnToTitle}>← Voltar ao menu inicial</button>
                  <button type="button" className="menu-close-button" onClick={onOpenTestArena}>Abrir Limbo de Teste</button>
                </div>
                <section className="menu-settings-grid">
                  <DataCard label="ORIENTAÇÃO" value="Horizontal" detail="Paisagem obrigatória nesta versão" />
                  <DataCard label="MOVIMENTAÇÃO" value="Toque no cenário" detail="Deslocamento por navegação automática" />
                  <DataCard label="SALVAMENTO" value="Neste dispositivo" detail="Personagem e missão em armazenamento local" />
                  <DataCard label="PLATAFORMA" value="Android" detail="Aplicativo compilado via Capacitor" />
                </section>
                <section className="na-performance-options" aria-label="Qualidade gráfica e desempenho">
                  <strong>DESEMPENHO NO ANDROID</strong>
                  <p>Se ocorrerem travamentos ou quedas de FPS, escolha Economia (30 FPS).
                    Para aparelhos que suportarem, use Balanceado (até 60 FPS).
                    A alteração entra em vigor quando reabrir o aplicativo.</p>
                  <div role="group" aria-label="Perfil de gráficos">
                    {(["economy","balanced"] as const).map(mode=>
                      <button type="button" key={mode}
                        aria-pressed={graphicsMode===mode}
                        onClick={()=>{
                          if(saveGraphicsMode(mode)){
                            setGraphicsMode(mode);
                            setGraphicsNotice("Perfil salvo. Feche e reabra o jogo para aplicar a configuração.");
                          }else setGraphicsNotice("Não foi possível salvar a configuração gráfica.");
                        }}>
                        {mode==="economy"?"Economia · 30 FPS":"Balanceado · até 60 FPS"}
                      </button>)}
                  </div>
                  {graphicsNotice&&<small role="status">{graphicsNotice}</small>}
                </section>
                <section className="na-performance-options" aria-label="Resumo de FPS do último mapa">
                  <strong>DIAGNÓSTICO LOCAL · ÚLTIMA AMOSTRA</strong>
                  {performanceReport
                    ? <p>{performanceReport.scene}: {performanceReport.fps} FPS registrados,
                       mínimo {performanceReport.minimumFps} FPS · {performanceReport.mode==="economy"?"Economia":"Balanceado"}.
                       {performanceReport.contextLost?" Atenção: perda de contexto gráfico registrada.":""}</p>
                    : <p>Sem amostra ainda. Explore um mapa por mais de dez segundos e reabra este menu.</p>}
                  <small>Esses números são estimativas do jogo e não substituem o relatório de fechamento do Android.</small>
                </section>
                <AudioControls />
                <p className="menu-footnote">Em caso de fechamento inesperado, anote o aparelho,
                  a etapa do jogo e se estava explorando ou combatendo.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
