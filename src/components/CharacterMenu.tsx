import { useState } from "react";
import AudioControls from "./AudioControls";
import {readGraphicsMode,saveGraphicsMode,type GraphicsMode} from "../game/performance";
import {readPerformanceReport} from "../game/performance-diagnostics";
import {readAccessibility,saveAccessibility,
  type AccessibilityPreferences} from "../game/accessibility.ts";
import type { OriginGameplayProfile, PlayerCharacter } from "../game/character";
import { ITEM_CATALOG, ITEM_IDS,equippedCalibration,calibrationCostLabel,
 EQUIPMENT_CALIBRATIONS } from "../game/inventory";
import {CRAFTING_RECIPES,canCraft,craftingIngredientsLabel,type RecipeId} from "../game/crafting";
import type { InventoryState, ItemId } from "../game/inventory";
import type { TestAppearance } from "../game/test-arena/appearance";
import { getPlayerSpriteUrl } from "../game/baixada/sprites";
import ClassSelection from "./ClassSelection";
import ProgressionTree from "./ProgressionTree";
import CinematicArchive from "./CinematicArchive";
import {SEWER_MAPS} from "../game/baixada/sewer-layout";
import {favorStatus,visibleFavors,type FavorContext,type FavorState} from "../game/story/favors";
import {FACTION_NAMES,factionStanding,type Reputation} from "../game/story/reputation";
import {EDEN_STEPS,edenObjective,type EdenProgress} from "../game/story/eden-echoes.ts";
import {sewerStatus,type SewerProgress} from "../game/story/sewer-v09";
import {FERRUGEM_STEPS,ferrugemObjective,type FerrugemProgress} from "../game/ferrugem/story";
import {STAT_IDS,STATS,statBreakdown,statRank,type StatId} from "../game/progression/tree";
import {getClassById,CLASS_SKILLS,getClassSkills,type ClassId} from "../game/classes/registry";
import {getHybridArchetype} from "../game/classes/hybrids.ts";
import {CYBERWARE_IDS,CYBERWARE_CATALOG,cyberwareCapacity,cyberwareLoad,
  cyberwareCostLabel,canInstallCyberware,type CyberwareId} from "../game/cyberware.ts";
import {COMPANION_IDS,COMPANION_CATALOG,type CompanionId,type PartyState} from "../game/companions.ts";
import {PARTY_POSTURES,PARTY_POSTURE_LABELS,type PartyPosture} from "../game/ai/companion-brain.ts";

type MenuSection = "character" | "progression" | "inventory" | "equipment" | "cyberware" | "team" | "abilities" | "map" | "journal" | "cinema" | "settings";

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
  onPurchaseMulticlass:(id:ClassId)=>string;
  originName: string;
  originDescription: string;
  originProfile: OriginGameplayProfile;
  missionStep: 0 | 1 | 2 | 3;
  missionObjective: string;
  favors:FavorState;
  favorContext:FavorContext;
  reputation:Reputation;
  edenProgress:EdenProgress;
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
  onCraft:(id:RecipeId,quantity?:number)=>string;
  onCalibrateEquipment:(id:ItemId)=>string;
  onInstallCyberware:(id:CyberwareId)=>string;
  onRemoveCyberware:(id:CyberwareId)=>string;
  canOperateCyberware:boolean;
  party:PartyState;
  availableCompanions:readonly CompanionId[];
  onRecruitCompanion:(id:CompanionId)=>string;
  onToggleCompanion:(id:CompanionId)=>string;
  onSetPartyPosture:(posture:PartyPosture)=>string;
  partyNotice:string;
}

const MENU_ITEMS: ReadonlyArray<{ id: MenuSection; code: string; label: string; description: string }> = [
  { id: "character", code: "ID", label: "Personagem", description: "Identidade e progressão" },
  { id: "progression", code: "XP", label: "Árvore de evolução", description: "Comprar atributos e habilidades" },
  { id: "inventory", code: "INV", label: "Inventário", description: "Itens e recursos" },
  { id: "equipment", code: "EQP", label: "Equipamentos", description: "Armas, trajes e implantes" },
  { id: "cyberware", code: "CYB", label: "Cyberware", description: "Instalações, materiais e carga neural" },
  { id: "team", code: "EQU", label: "Companheiros", description: "Recrutamento e apoio tático" },
  { id: "abilities", code: "HAB", label: "Habilidades", description: "Vantagens e técnicas" },
  { id: "map", code: "MAP", label: "Mapa", description: "Distritos e localização" },
  { id: "journal", code: "LOG", label: "Diário", description: "Missões e descobertas" },
  { id: "cinema", code: "MEM", label: "Memórias", description: "Rever cenas já descobertas" },
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
  onPurchaseMulticlass,
  originName,
  originDescription,
  originProfile,
  missionStep,
  missionObjective,
  favors,
  favorContext,
  reputation,
  edenProgress,
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
  onCraft,onCalibrateEquipment,
  onInstallCyberware,onRemoveCyberware,canOperateCyberware,
  party,availableCompanions,onRecruitCompanion,onToggleCompanion,
  onSetPartyPosture,partyNotice,
}: Props) {
  const [activeSection, setActiveSection] = useState<MenuSection>(initialSection??"character");
  const [pendingClass,setPendingClass]=useState<ClassId|null>(null);
  const [craftNotice,setCraftNotice]=useState("");
  const [calibrationNotice,setCalibrationNotice]=useState("");
  const [craftQuantity,setCraftQuantity]=useState<1|2|3|5>(1);
  const [cyberwareNotice,setCyberwareNotice]=useState("");
  const [teamNotice,setTeamNotice]=useState("");
  const [graphicsMode,setGraphicsMode]=useState<GraphicsMode>(readGraphicsMode);
  const [graphicsNotice,setGraphicsNotice]=useState("");
  const [accessibility,setAccessibility]=useState(readAccessibility);
  const [accessibilityNotice,setAccessibilityNotice]=useState("");
  const changeAccessibility=(key:Exclude<keyof AccessibilityPreferences,"version">)=>{
    const next={...accessibility,[key]:!accessibility[key]};
    if(!saveAccessibility(next)){
      setAccessibilityNotice("Não foi possível salvar as preferências no dispositivo.");
      return;
    }
    setAccessibility(next);
    setAccessibilityNotice("Preferência aplicada imediatamente e salva no aparelho.");
  };
  const [performanceReport]=useState(readPerformanceReport);
  const activeItem = MENU_ITEMS.find((item) => item.id === activeSection)!;
  const attributeEntries=STAT_IDS.map(id=>({id,
    name:STATS[id].name,total:statRank(character,id),
    components:statBreakdown(character,id)}));
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
                  <DataCard label="CLASSE PRINCIPAL" value={character.classId ? getClassById(character.classId).name : "Não definida"} detail="Define atributos e técnica inicial" />
                  <DataCard label="MULTICLASSE" value={character.multiclassId?getClassById(character.multiclassId).name:"Ainda não escolhida"} detail={character.multiclassId?"Segunda disciplina vinculada ao mesmo personagem":"Liberada no nível 4 · custa 2 HAB"} />
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
                  <span className="menu-panel-kicker">CLASSE PRINCIPAL · ESPECIALIZAÇÃO</span>
                  <h4>{getClassById(character.classId).name}</h4>
                  <p>{getClassById(character.classId).description}</p>
                  <p><b>Exploração:</b> {getClassById(character.classId).explorationFocus}</p>
                  {character.multiclassId&&getHybridArchetype(character.classId,character.multiclassId)&&
                   <div className="na-archetype-summary">
                    <strong>ARQUÉTIPO · {getHybridArchetype(character.classId,character.multiclassId)?.name}</strong>
                    <p>{getHybridArchetype(character.classId,character.multiclassId)?.description}</p>
                    <small>{getHybridArchetype(character.classId,character.multiclassId)?.bonusText} · apenas no combate</small>
                    <p><b>Classe secundária:</b> {getClassById(character.multiclassId).name}.
                     Compartilha pontos, energia e ações; não recebe bônus de atributos extras.</p>
                   </div>}
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
                  <div className="menu-attribute-grid">
                    {attributeEntries.map(stat=><DataCard key={stat.id} label={stat.name}
                      value={stat.total+" / 5"}
                      detail={"Base "+stat.components.base+" · Inv. +"+
                        stat.components.allocated+" · Origem +"+
                        stat.components.origin+" · Classe +"+
                        stat.components.profession}/>)}
                  </div>
                  <p>Os valores mostrados são efetivos. A multiclasse não soma
                     os bônus de atributos da profissão secundária.</p>
                </section>
              </div>
            )}

            {activeSection === "progression" && (
              <ProgressionTree character={character}
                onAttribute={onPurchaseAttribute} onSkill={onPurchaseSkill}
                onMulticlass={onPurchaseMulticlass}/>
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
                <details className="na-crafting-panel" aria-label="Bancada de fabricação de Ferrugem">
                  <summary className="menu-panel-kicker">BANCADA INDUSTRIAL · {CRAFTING_RECIPES.length} RECEITAS · ABRIR</summary>
                  <p>Combine os componentes recuperados em Ferrugem e na oficina de Nilo.
                    A fabricação consome recursos e produz equipamentos utilizáveis no combate.</p>
                  <label className="na-craft-batch-label">Unidades por fabricação (materiais/consumíveis)
                    <select aria-label="Quantidade de fabricação" value={craftQuantity}
                      onChange={event=>setCraftQuantity(Number(event.target.value) as 1|2|3|5)}>
                      {[1,2,3,5].map(n=><option key={n} value={n}>{n}×</option>)}
                    </select>
                  </label>
                  {CRAFTING_RECIPES.map(recipe=>
                    <article key={recipe.id} className="na-crafting-recipe">
                      <div><strong>{recipe.title}</strong>
                        <small>{recipe.description}</small>
                        <small>Materiais: {craftingIngredientsLabel(recipe)}</small></div>
                      <button type="button" disabled={!canCraft(inventory,recipe.id,
                          ITEM_CATALOG[recipe.output].category==="material"||
                          ITEM_CATALOG[recipe.output].category==="consumable"?craftQuantity:1)}
                        onClick={()=>setCraftNotice(onCraft(recipe.id,
                          ITEM_CATALOG[recipe.output].category==="material"||
                          ITEM_CATALOG[recipe.output].category==="consumable"?craftQuantity:1))}>
                        Fabricar {ITEM_CATALOG[recipe.output].category==="material"||
                          ITEM_CATALOG[recipe.output].category==="consumable"?craftQuantity+"×":"1×"}
                      </button>
                    </article>)}
                  {craftNotice&&<p role="status">{craftNotice}</p>}
                </details>
                <p className="menu-footnote">As receitas consomem componentes reais. Curativos e baterias podem ser usados em combate.</p>
              </div>
            )}

            {activeSection === "equipment" && (
              <div className="menu-section-stack">
                <div className="menu-two-columns">
                  {(["weapon", "armor","implant"] as const).map((slot) => {
                    const id = inventory.equipped[slot];
                    return (
                      <section className="menu-info-panel" key={slot}>
                        <span className="menu-panel-kicker">{slot === "weapon" ? "ARMA" : slot==="armor"?"PROTEÇÃO":"IMPLANTE"}</span>
                        <h4>{id ? ITEM_CATALOG[id].name : "Espaço livre"}</h4>
                        <p>{id ? ITEM_CATALOG[id].description : "Abra o Inventário para equipar um item."}</p>
                        {id&&<div className="na-calibration-panel"
                          data-calibrated-slot={slot}>
                          <span>CALIBRAÇÃO {equippedCalibration(inventory,slot)}/2 ·
                            {" "}{equippedCalibration(inventory,slot)===0?"PADRÃO":
                              equippedCalibration(inventory,slot)===1?"INCOMUM":"RARO"}</span>
                          {equippedCalibration(inventory,slot)<2&&
                          <small>{EQUIPMENT_CALIBRATIONS[slot][equippedCalibration(inventory,slot)]!.name}
                            {" · "}Nível {EQUIPMENT_CALIBRATIONS[slot][equippedCalibration(inventory,slot)]!.minLevel}
                            {" · "}{calibrationCostLabel(inventory,id)}</small>}
                          <button type="button"
                            disabled={equippedCalibration(inventory,slot)>=2}
                            onClick={()=>setCalibrationNotice(onCalibrateEquipment(id))}>
                            {equippedCalibration(inventory,slot)>=2?
                              "Calibração máxima":"Calibrar equipamento"}
                          </button>
                        </div>}
                        {id && <button type="button" className="na-item-unequip" onClick={() => onToggleEquipment(id)}>Remover equipamento</button>}
                      </section>
                    );
                  })}
                </div>
                {calibrationNotice&&<p role="status" className="menu-footnote">{calibrationNotice}</p>}
                <p className="menu-footnote">Armas, armaduras e implantes alteram alcance, Vida,
                  energia, movimento e defesa. A calibração consome materiais reais, acompanha
                  o item específico e concede +1/+2 ATQ (arma), DEF (armadura)
                  ou EN (implante). Itens calibrados não transferem bônus para outros
                  itens ao trocar equipamento. Os dados permanecem no save v1.</p>
              </div>
            )}

            {activeSection === "cyberware" && (
              <div className="menu-section-stack">
                <section className="menu-info-panel">
                  <span className="menu-panel-kicker">IMPLANTES AUXILIARES · EXPANSÃO 2.0</span>
                  <h4>Carga neural {cyberwareLoad(inventory.cyberware??[])} / {cyberwareCapacity(character.level)}</h4>
                  <p>{(inventory.cyberware??[]).length}/3 módulos auxiliares instalados.
                    Os implantes originais do inventário continuam funcionando no slot legado.</p>
                  <small>{canOperateCyberware?
                    "Você está numa unidade habilitada para implantação.":
                    "Para instalar ou remover, visite a clínica comunitária ou a oficina de Nilo."}</small>
                </section>
                <section className="menu-list-panel">
                  <span className="menu-panel-kicker">CATÁLOGO · CUSTO EM MATERIAIS REAIS</span>
                  {CYBERWARE_IDS.map(id=>{
                    const module=CYBERWARE_CATALOG[id];
                    const installed=(inventory.cyberware??[]).includes(id);
                    const check=canInstallCyberware(inventory,id,character.level);
                    return <article className="na-item-row" key={id}>
                      <div>
                        <span>{module.slot.toUpperCase()} · CARGA {module.load} · NÍVEL {module.minLevel}</span>
                        <h4>{module.name} {installed?"· INSTALADO":""}</h4>
                        <p>{module.description}</p>
                        <small>{cyberwareCostLabel(id)}</small>
                        {!installed&&!check.ok&&<small>Indisponível: {check.message}</small>}
                      </div>
                      {installed?
                        <button type="button" disabled={!canOperateCyberware}
                          onClick={()=>setCyberwareNotice(onRemoveCyberware(id))}>Remover</button>:
                        <button type="button" disabled={!canOperateCyberware||!check.ok}
                          onClick={()=>setCyberwareNotice(onInstallCyberware(id))}>Instalar</button>}
                    </article>;
                  })}
                </section>
                {cyberwareNotice&&<p role="status" className="menu-footnote">{cyberwareNotice}</p>}
              </div>
            )}
            {activeSection === "team" && (
              <div className="menu-section-stack">
                <section className="menu-info-panel">
                  <span className="menu-panel-kicker">CONTATOS RECRUTÁVEIS · EXPANSÃO 2.0</span>
                  <h4>Equipe ativa: {party.active.length}/2</h4>
                  <p>Aliados atuam como apoio tático remoto, sem sobrecarregar o tabuleiro.
                    Cada um oferece bônus passivo e uma ação exclusiva por confronto.</p>
                  <small>É necessário encontrar cada aliado em seu local de atuação.</small>
                </section>
                <section className="menu-info-panel" aria-label="Ordens dos companheiros">
                  <span className="menu-panel-kicker">IA DE APOIO · ORDENS DO JOGADOR</span>
                  <div className="na-party-postures" role="group" aria-label="Postura de apoio">
                    {PARTY_POSTURES.map(posture=><button type="button"
                      key={posture} aria-pressed={(party.posture??"manual")===posture}
                      className={(party.posture??"manual")===posture?"selected":""}
                      onClick={()=>setTeamNotice(onSetPartyPosture(posture))}>
                      {PARTY_POSTURE_LABELS[posture]}
                    </button>)}
                  </div>
                  <small>Manual: você decide. Ofensiva: preparar acerto.
                    Defensiva: proteção e atendimento. Suporte: cura/energia.
                    Manter posição: nenhum apoio automático.
                    Toda ordem respeita o uso único e a ação bônus.</small>
                </section>
                <section className="menu-list-panel">
                  {COMPANION_IDS.map(id=>{
                    const c=COMPANION_CATALOG[id];
                    const recruited=party.recruited.includes(id);
                    const active=party.active.includes(id);
                    const available=availableCompanions.includes(id);
                    return <article className="na-item-row" key={id}>
                      <div>
                        <span>{c.role.toUpperCase()} · {c.home}</span>
                        <h4>{c.name} {active?"· NA EQUIPE":recruited?"· RECRUTADO":""}</h4>
                        <p>{c.bio}</p><small>{c.description}</small>
                      </div>
                      {!recruited?
                        <button type="button" disabled={!available}
                          onClick={()=>setTeamNotice(onRecruitCompanion(id))}>
                          {available?"Recrutar":"Encontrar contato"}</button>:
                        <button type="button" disabled={!active&&party.active.length>=2}
                          onClick={()=>setTeamNotice(onToggleCompanion(id))}>
                          {active?"Deixar reserva":"Ativar"}</button>}
                    </article>;
                  })}
                </section>
                {(teamNotice||partyNotice)&&<p role="status" className="menu-footnote">{teamNotice||partyNotice}</p>}
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
                  {[...getClassSkills(character.classId),...getClassSkills(character.multiclassId??null)].map(skill=><div className="class-ability-readout" key={skill.id}>
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

            {activeSection === "cinema" && (
              <CinematicArchive character={character}/>
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
                {edenProgress.started&&<section className="menu-list-panel" aria-label="Operação Ecos da Cidade">
                  <span className="menu-panel-kicker">PROJETO ÉDEN // ECOS DA CIDADE</span>
                  <p>{edenObjective(edenProgress)}</p>
                  <small>Etapa {edenProgress.step} de {EDEN_STEPS.length}</small>
                  {edenProgress.history.map(id=>{
                    const stage=EDEN_STEPS.find(s=>s.id===id);
                    return stage?<div className="menu-list-row" key={id}>
                      <span>✓</span><strong>{stage.title}</strong><small>{stage.sector}</small>
                    </div>:null;
                  })}
                  {!edenProgress.completed&&<div className="menu-list-row current">
                    <span>◇</span><strong>{EDEN_STEPS[edenProgress.step]?.title}</strong>
                    <small>EM ANDAMENTO</small>
                  </div>}
                  {edenProgress.completed&&<p className="menu-footnote">
                    Desfecho: {edenProgress.ending==="publicar"?"dossiê público":"testemunhas protegidas"}.
                  </p>}
                </section>}
                {ferrugemProgress.started&&<section className="menu-list-panel">
                  <span className="menu-panel-kicker">CAPÍTULO FERRUGEM // {ferrugemProgress.completed?"CONCLUÍDO":ferrugemProgress.started?(ferrugemProgress.step+"/"+FERRUGEM_STEPS.length):"NÃO INICIADO"}</span>
                  <p>{ferrugemObjective(ferrugemProgress)}</p>
                  {ferrugemProgress.started&&<div className="menu-list-row current">
                    <span>◈</span><strong>{ferrugemProgress.completed?"Destino das provas":FERRUGEM_STEPS[ferrugemProgress.step]?.title}</strong>
                    <small>{ferrugemProgress.ending==="publicar"?"PUBLICAÇÃO":ferrugemProgress.ending==="proteger"?"PROTEÇÃO COMUNITÁRIA":"EM INVESTIGAÇÃO"}</small>
                  </div>}
                </section>}
                <details className="menu-list-panel menu-faction-brief">
                  <summary>RELAÇÕES E REPUTAÇÃO · {reputation.honor} HONRA · {reputation.community}/10 CONFIANÇA LOCAL</summary>
                  <p>A Honra reconhece ajuda entregue; cada facção mantém sua própria relação.
                    Escolhas de divulgação, sigilo e credenciais têm consequências distintas.</p>
                  {(["helix","movimento_livre","mercado_cinzento","consorcio_civico"] as const).map(id=>
                    <div className="menu-list-row" key={id}>
                      <span aria-hidden="true">{reputation.factions[id]<0?"!":reputation.factions[id]>=4?"✦":"○"}</span>
                      <strong>{FACTION_NAMES[id]}</strong>
                      <small>{factionStanding(reputation.factions[id])} ·
                        {" "}{reputation.factions[id]>0?"+":""}{reputation.factions[id]}</small>
                    </div>)}
                  <p>Ajuda médica de Marta: 3 Honra e +2 no Movimento Livre.
                    Contatos de Davi: +2 no Mercado Cinzento e dossiê V-09 entregue.
                    Acesso Helix: +2 na corporação e dossiê entregue.
                    Consórcio Cívico: denúncia oficial ou audiência independente após duas provas e V-09.
                    O protocolo pode liberar reagentes, mas registra contatos; os acordos alteram relações.</p>
                </details>
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
                <section className="na-performance-options na-accessibility-options"
                  aria-label="Acessibilidade e controles Android">
                  <strong>ACESSIBILIDADE · APLICAÇÃO IMEDIATA</strong>
                  <p>Texto ampliado, contraste elevado e movimento reduzido funcionam
                    na edição integral do jogo, sem alterar missões, saves ou gráficos.
                    Os botões principais de combate continuam visíveis em landscape.</p>
                  <div role="group" aria-label="Preferências de acessibilidade">
                    {([
                      ["largeText","Texto ampliado"],
                      ["highContrast","Alto contraste"],
                      ["reduceMotion","Movimento reduzido"],
                    ] as const).map(([key,label])=>
                      <button type="button" key={key}
                        aria-pressed={accessibility[key]}
                        onClick={()=>changeAccessibility(key)}>
                        {label} · {accessibility[key]?"Ativo":"Desativado"}
                      </button>)}
                  </div>
                  {accessibilityNotice&&<small role="status">{accessibilityNotice}</small>}
                </section>
                <section className="na-performance-options" aria-label="Qualidade gráfica e desempenho">
                  <strong>DESEMPENHO NO ANDROID</strong>
                  <p>Se ocorrerem travamentos ou quedas de FPS, escolha Economia (30 FPS).
                    Para aparelhos que suportarem, use Balanceado (até 60 FPS).
                    Os dois perfis usam exatamente o mesmo mapa completo, com todos os NPCs, missões e efeitos. Somente a taxa de quadros muda. A alteração entra em vigor quando reabrir o aplicativo.</p>
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
