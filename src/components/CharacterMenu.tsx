import { useState } from "react";
import AudioControls from "./AudioControls";
import type { OriginGameplayProfile, PlayerCharacter } from "../game/character";
import { ITEM_CATALOG, ITEM_IDS } from "../game/inventory";
import type { InventoryState, ItemId } from "../game/inventory";
import type { TestAppearance } from "../game/test-arena/appearance";
import { getPlayerSpriteUrl } from "../game/baixada/sprites";

type MenuSection = "character" | "inventory" | "equipment" | "abilities" | "map" | "journal" | "settings";

interface JournalClue {
  id: string;
  text: string;
}

interface Props {
  character: PlayerCharacter;
  appearance: TestAppearance;
  onChangeAppearance: (appearance: TestAppearance) => void;
  originName: string;
  originDescription: string;
  originProfile: OriginGameplayProfile;
  missionStep: 0 | 1 | 2 | 3;
  missionObjective: string;
  clues: JournalClue[];
  sceneTitle: string;
  sceneSubtitle: string;
  onClose: () => void;
  onReturnToTitle: () => void;
  onOpenTestArena: () => void;
  inventory: InventoryState;
  onToggleEquipment: (id: ItemId) => void;
}

const MENU_ITEMS: ReadonlyArray<{ id: MenuSection; code: string; label: string; description: string }> = [
  { id: "character", code: "ID", label: "Personagem", description: "Identidade e progressão" },
  { id: "inventory", code: "INV", label: "Inventário", description: "Itens e recursos" },
  { id: "equipment", code: "EQP", label: "Equipamentos", description: "Armas, trajes e implantes" },
  { id: "abilities", code: "HAB", label: "Habilidades", description: "Vantagens e técnicas" },
  { id: "map", code: "MAP", label: "Mapa", description: "Distritos e localização" },
  { id: "journal", code: "LOG", label: "Diário", description: "Missões e descobertas" },
  { id: "settings", code: "CFG", label: "Configurações", description: "Preferências do jogo" },
];

const DISTRICTS = [
  { name: "Baixada", status: "ÁREA JOGÁVEL", current: true },
  { name: "Áurea", status: "PLANEJADO", current: false },
  { name: "Ferrugem", status: "PLANEJADO", current: false },
  { name: "Subsolo", status: "PLANEJADO", current: false },
  { name: "Setor Zero", status: "PLANEJADO", current: false },
  { name: "Prisma", status: "PLANEJADO", current: false },
  { name: "Periferia externa", status: "PLANEJADO", current: false },
];

function EmptyState({ code, title, description }: { code: string; title: string; description: string }) {
  return (
    <section className="menu-empty-state">
      <span className="menu-empty-code">{code}</span>
      <div className="menu-empty-glyph" aria-hidden="true">＋</div>
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="menu-development-label">SISTEMA AINDA NÃO IMPLEMENTADO</span>
    </section>
  );
}

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
  character,
  appearance,
  onChangeAppearance,
  originName,
  originDescription,
  originProfile,
  missionStep,
  missionObjective,
  clues,
  sceneTitle,
  sceneSubtitle,
  onClose,
  onReturnToTitle,
  onOpenTestArena,
  inventory,
  onToggleEquipment,
}: Props) {
  const [activeSection, setActiveSection] = useState<MenuSection>("character");
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
                  <DataCard label="CLASSE" value={character.classId ?? "Não definida"} detail="Escolha de classe ainda não integrada" />
                  <DataCard label="EXPERIÊNCIA" value={String(character.experience)} detail="Pontos registrados" />
                  <DataCard label="MISSÃO PRINCIPAL" value={missionStep === 3 ? "Concluída" : "Em andamento"} detail={progress + " de 3 etapas"} />
                </div>

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
                <p className="menu-footnote">O inventário é salvo neste aparelho. Curativos podem ser usados no Limbo de Teste, durante seu turno.</p>
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
                {character.abilities.length > 0 && (
                  <section className="menu-list-panel">
                    <span className="menu-panel-kicker">OUTRAS HABILIDADES REGISTRADAS</span>
                    {character.abilities.map((ability, index) => <div className="menu-list-row" key={ability + index}><span>HAB-{String(index + 1).padStart(2, "0")}</span><strong>{ability}</strong></div>)}
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
                <p className="menu-footnote">O mapa interativo e o deslocamento entre distritos ainda não estão disponíveis nesta versão. A Baixada é a área jogável atual.</p>
              </div>
            )}

            {activeSection === "journal" && (
              <div className="menu-section-stack">
                <section className="menu-quest-card">
                  <div className="menu-quest-heading">
                    <div><span className="menu-panel-kicker">MISSÃO PRINCIPAL // BAIXADA</span><h4>O nome que sumiu</h4></div>
                    <strong>{missionStep === 3 ? "CONCLUÍDA" : "ATIVA"}</strong>
                  </div>
                  <p>Uma pessoa desapareceu depois de procurar atendimento por causa de um implante defeituoso. O registro oficial foi apagado, mas a clínica preservou uma cópia local.</p>
                  <div className="menu-quest-progress"><span style={{ width: ((progress / 3) * 100) + "%" }} /></div>
                  <small>{progress} / 3 etapas concluídas</small>
                  <div className="menu-objective"><span>OBJETIVO ATUAL</span><strong>{missionObjective}</strong></div>
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
                <AudioControls />
                <p className="menu-footnote">Idioma e qualidade gráfica serão configuráveis em entregas futuras.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
