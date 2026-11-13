extends Node2D
## TENEBRIA: ECOS DE RUTURAM  •  Isometrico
## Criacao, exploracao, comercio, missoes, escolhas, inventario, party, combate e save.
const DATA=preload("res://iso/content.gd")
const WORLD=preload("res://iso/world.gd")
const BATTLE=preload("res://iso/battle.gd")
const SAVE=preload("res://iso/save.gd")
const BOOK=preload("res://scripts/rules/catalog.gd")

var world: Node2D
var camera: Camera2D
var canvas: CanvasLayer
var ui: Control
var title_layer: ColorRect
var overlay: ColorRect
var overlay_content: VBoxContainer
var info_label: Label
var zone_label: Label
var resources_label: Label
var quest_label: Label
var hint_label: Label
var exploration_bar: HBoxContainer
var battle_bar: HBoxContainer
var combat_box: PanelContainer
var combat_label: Label
var battle_log_label: Label
var target_button: Button
var end_button: Button
var world_map_button: Button
var ambient: AudioStreamPlayer
var sfx: AudioStreamPlayer

var save_store=SAVE.new()
var combat=BATTLE.new()
var playing: bool=false
var paused: bool=false
var in_battle: bool=false
var region: String="vigilia"
var hero_pos:=Vector2i(18,19)
var player: Dictionary={}
var inventory: Dictionary={}
var party: Array[Dictionary]=[]
var objects_collected: Dictionary={}
var defeated: Dictionary={}
var flags: Dictionary={}
var discovered: Dictionary={"vigilia":true}
var codex_seen: Dictionary={"origem":true}
var kill_counts: Dictionary={}
var krovs: int=50
var reputation: int=0
var xp: int=0
var level: int=1
var level_points: int=0
var main_stage: int=0
var clock_hours: int=19
var moral_choice: String=""
var ending: String=""
var path: Array[Vector2i]=[]
var path_clock: float=0.0
var button_direction:=Vector2i.ZERO
var controller_clock: float=0.0
var focus_target: int=0
var select_ally_target: bool=false
var after_battle: Array[String]=[]
var current_battle_id: String=""
var menu_open: String=""
var message_timer: float=0.0
var audio_enabled: bool=true
var menu_music: bool=false
var region_portals: Array=[]
var intro_done: bool=false

var creator_name: LineEdit
var creator_race: OptionButton
var creator_class: OptionButton
var creator_body: OptionButton
var creator_quality1: OptionButton
var creator_quality2: OptionButton
var creator_stats: Dictionary={"f":2,"h":2,"v":2,"m":2}
var creator_skills: Dictionary={}
var creator_stat_labels: Dictionary={}
var creator_skill_labels: Dictionary={}
var creator_feedback: Label

func _ready() -> void:
 Engine.max_fps=30
 RenderingServer.set_default_clear_color(Color("#11151c"))
 world=WORLD.new()
 world.name="IsoWorld"
 add_child(world)
 camera=Camera2D.new()
 camera.name="CameraIso"
 camera.enabled=true
 camera.zoom=Vector2(0.93,0.93)
 add_child(camera)
 canvas=CanvasLayer.new()
 canvas.layer=2
 add_child(canvas)
 ui=Control.new()
 ui.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
 ui.mouse_filter=Control.MOUSE_FILTER_IGNORE
 canvas.add_child(ui)
 _build_audio()
 _build_hud()
 _build_layers()
 world.configure(region,Vector2(hero_pos),objects_collected,defeated,party)
 _show_title()
 set_process(true)

func _build_audio() -> void:
 ambient=AudioStreamPlayer.new()
 add_child(ambient)
 ambient.volume_db=-16.0
 if ResourceLoader.exists("res://assets/ambient.wav"):
  ambient.stream=load("res://assets/ambient.wav")
  ambient.play()
 sfx=AudioStreamPlayer.new()
 add_child(sfx)
 sfx.volume_db=-6.0

func _sound(name: String) -> void:
 if not audio_enabled:return
 var file: String="res://assets/"+name+".wav"
 if ResourceLoader.exists(file):
  sfx.stream=load(file)
  sfx.play()

func _style_panel() -> StyleBoxFlat:
 var style:=StyleBoxFlat.new()
 style.bg_color=Color("#181c28",0.96)
 style.border_color=Color("#b99670",0.82)
 style.set_border_width_all(2)
 style.set_corner_radius_all(10)
 style.set_content_margin_all(13)
 return style

func _button(parent: Node,text_value: String,callback: Callable,size: Vector2=Vector2(116,47)) -> Button:
 var b:=Button.new()
 b.text=text_value
 b.custom_minimum_size=size
 b.add_theme_font_size_override("font_size",15)
 b.add_theme_color_override("font_color",Color("#f0dfc2"))
 var style:=StyleBoxFlat.new()
 style.bg_color=Color("#35313b",0.92)
 style.border_color=Color("#aa8361",0.70)
 style.set_border_width_all(1)
 style.set_corner_radius_all(7)
 style.set_content_margin_all(7)
 b.add_theme_stylebox_override("normal",style)
 var pressed:=style.duplicate() as StyleBoxFlat
 pressed.bg_color=Color("#744b56")
 b.add_theme_stylebox_override("pressed",pressed)
 b.add_theme_stylebox_override("hover",pressed)
 b.pressed.connect(callback)
 parent.add_child(b)
 return b

func _label(parent: Node,message: String,font_size: int=17,tint: Color=Color("#e1d3bd")) -> Label:
 var l:=Label.new()
 l.text=message
 l.add_theme_font_size_override("font_size",font_size)
 l.add_theme_color_override("font_color",tint)
 l.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
 parent.add_child(l)
 return l

func _row(parent: Node) -> HBoxContainer:
 var row:=HBoxContainer.new()
 row.add_theme_constant_override("separation",6)
 row.size_flags_horizontal=Control.SIZE_EXPAND_FILL
 parent.add_child(row)
 return row

func _build_hud() -> void:
 var top:=PanelContainer.new()
 top.add_theme_stylebox_override("panel",_style_panel())
 top.anchor_right=1.0
 top.offset_bottom=92
 top.mouse_filter=Control.MOUSE_FILTER_IGNORE
 ui.add_child(top)
 var content:=HBoxContainer.new()
 content.add_theme_constant_override("separation",15)
 top.add_child(content)
 zone_label=_label(content,"TENEBRIA  •  VIGÍLIA",20,Color("#efc595"))
 zone_label.custom_minimum_size.x=390
 info_label=_label(content,"PV / Fadiga / Vontade",16)
 info_label.custom_minimum_size.x=335
 resources_label=_label(content,"Krovs / EXP",15)
 resources_label.custom_minimum_size.x=250
 quest_label=_label(content,"Prólogo",14)
 quest_label.size_flags_horizontal=Control.SIZE_EXPAND_FILL
 var bottom:=PanelContainer.new()
 bottom.anchor_top=1.0
 bottom.anchor_bottom=1.0
 bottom.anchor_right=1.0
 bottom.offset_top=-108.0
 bottom.offset_bottom=0
 bottom.add_theme_stylebox_override("panel",_style_panel())
 ui.add_child(bottom)
 var hold:=VBoxContainer.new()
 hold.add_theme_constant_override("separation",5)
 bottom.add_child(hold)
 hint_label=_label(hold,"Toque no chão para caminhar. Aproxime-se de alguém e toque em INTERAGIR.",13,Color("#b9baa7"))
 exploration_bar=_row(hold)
 _button(exploration_bar,"INTERAGIR",Callable(self,"_interact"),Vector2(132,48))
 _button(exploration_bar,"MOCHILA",Callable(self,"_open_inventory"),Vector2(124,48))
 _button(exploration_bar,"MISSÕES",Callable(self,"_open_journal"),Vector2(120,48))
 _button(exploration_bar,"FICHA",Callable(self,"_open_character"),Vector2(95,48))
 _button(exploration_bar,"MAPA",Callable(self,"_open_map"),Vector2(96,48))
 _button(exploration_bar,"OFICINA",Callable(self,"_open_crafting"),Vector2(112,48))
 _button(exploration_bar,"SALVAR",Callable(self,"_save_button"),Vector2(100,48))
 _button(exploration_bar,"PAUSA",Callable(self,"_pause_button"),Vector2(100,48))
 battle_bar=_row(hold)
 _button(battle_bar,"ATACAR",Callable(self,"_battle_action").bind("attack"),Vector2(112,48))
 _button(battle_bar,"TÉCNICAS",Callable(self,"_pick_skill"),Vector2(124,48))
 _button(battle_bar,"MOVER",Callable(self,"_battle_action").bind("move"),Vector2(100,48))
 _button(battle_bar,"GUARDA",Callable(self,"_battle_action").bind("guard"),Vector2(102,48))
 _button(battle_bar,"ATADURA",Callable(self,"_battle_action").bind("potion"),Vector2(114,48))
 target_button=_button(battle_bar,"ALVO",Callable(self,"_next_target"),Vector2(110,48))
 end_button=_button(battle_bar,"FIM DO TURNO",Callable(self,"_end_turn"),Vector2(167,48))
 battle_bar.hide()
 combat_box=PanelContainer.new()
 combat_box.add_theme_stylebox_override("panel",_style_panel())
 combat_box.anchor_left=0.20
 combat_box.anchor_right=0.80
 combat_box.anchor_top=0.105
 combat_box.anchor_bottom=0.26
 ui.add_child(combat_box)
 var combat_content:=VBoxContainer.new()
 combat_box.add_child(combat_content)
 combat_label=_label(combat_content,"",17,Color("#e8cb98"))
 battle_log_label=_label(combat_content,"",12,Color("#b9bac0"))
 combat_box.hide()
 var direction_pad:=GridContainer.new()
 direction_pad.columns=3
 direction_pad.anchor_top=0.72
 direction_pad.anchor_bottom=0.72
 direction_pad.offset_left=18
 direction_pad.offset_top=-43
 direction_pad.offset_bottom=83
 direction_pad.mouse_filter=Control.MOUSE_FILTER_PASS
 ui.add_child(direction_pad)
 var arrows: Array=[
  {"text":"","dir":Vector2i.ZERO},{"text":"▲","dir":Vector2i(0,-1)},{"text":"","dir":Vector2i.ZERO},
  {"text":"◀","dir":Vector2i(-1,0)},{"text":"▼","dir":Vector2i(0,1)},{"text":"▶","dir":Vector2i(1,0)}
 ]
 for entry in arrows:
  var b:=_button(direction_pad,str(entry["text"]),func()->void:pass,Vector2(58,49))
  b.disabled=str(entry["text"])==""
  if not b.disabled:
   b.button_down.connect(_direction_down.bind(entry["dir"]))
   b.button_up.connect(_direction_up)
 direction_pad.name="DirectionPad"

func _build_layers() -> void:
 title_layer=ColorRect.new()
 title_layer.color=Color("#11121c",0.965)
 title_layer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
 ui.add_child(title_layer)
 overlay=ColorRect.new()
 overlay.color=Color("#11131b",0.89)
 overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
 ui.add_child(overlay)
 overlay.hide()

func _clear_children(node: Node) -> void:
 for child in node.get_children():
  node.remove_child(child)
  child.queue_free()

func _panel_layer(parent: Control,left: float=0.15,right: float=0.85,top: float=0.10,bottom: float=0.90) -> VBoxContainer:
 var panel:=PanelContainer.new()
 panel.anchor_left=left
 panel.anchor_right=right
 panel.anchor_top=top
 panel.anchor_bottom=bottom
 panel.add_theme_stylebox_override("panel",_style_panel())
 parent.add_child(panel)
 var container:=VBoxContainer.new()
 container.add_theme_constant_override("separation",10)
 panel.add_child(container)
 return container

func _show_title() -> void:
 playing=false
 in_battle=false
 paused=false
 overlay.hide()
 title_layer.show()
 _clear_children(title_layer)
 var col:=_panel_layer(title_layer,0.23,0.77,0.09,0.92)
 var intro:=_label(col,"T E N E B R I A",48,Color("#e9c29b"))
 intro.horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER
 var subtitle:=_label(col,"ECOS DE RUTURAM     |     EDIÇÃO ISOMÉTRICA",18,Color("#c8a2a3"))
 subtitle.horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER
 _label(col,"Um mundo enlutado. Uma promessa sepultada. Um destino que não será perdoado.",17,Color("#a6a5ac")).horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER
 _label(col,"")
 _button(col,"NOVO JOGO • CRIAR PERSONAGEM",Callable(self,"_show_creator"),Vector2(430,53)).size_flags_horizontal=Control.SIZE_EXPAND_FILL
 var continue_btn:=_button(col,"CONTINUAR A CAMPANHA",Callable(self,"_continue_game"),Vector2(430,53))
 continue_btn.disabled=not save_store.exists()
 continue_btn.size_flags_horizontal=Control.SIZE_EXPAND_FILL
 _button(col,"CATÁLOGO DE OBSCURE",Callable(self,"_open_codex"),Vector2(430,49)).size_flags_horizontal=Control.SIZE_EXPAND_FILL
 _button(col,"CONFIGURAÇÕES",Callable(self,"_open_settings"),Vector2(430,49)).size_flags_horizontal=Control.SIZE_EXPAND_FILL
 _button(col,"CRÉDITOS",Callable(self,"_open_credits"),Vector2(430,49)).size_flags_horizontal=Control.SIZE_EXPAND_FILL
 _button(col,"SAIR",func()->void:get_tree().quit(),Vector2(430,49)).size_flags_horizontal=Control.SIZE_EXPAND_FILL
 _label(col,"Desenvolvimento incremental • Alpha isométrica • campanha offline",13,Color("#8f8a8c")).horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER

func _modal(title: String) -> VBoxContainer:
 menu_open=title
 overlay.show()
 _clear_children(overlay)
 var column:=_panel_layer(overlay,0.10,0.90,0.07,0.93)
 var toolbar:=_row(column)
 var heading:=_label(toolbar,title,26,Color("#ebca91"))
 heading.size_flags_horizontal=Control.SIZE_EXPAND_FILL
 _button(toolbar,"FECHAR ✕",Callable(self,"_close_overlay"),Vector2(127,39))
 var scroll:=ScrollContainer.new()
 scroll.horizontal_scroll_mode=ScrollContainer.SCROLL_MODE_DISABLED
 scroll.size_flags_vertical=Control.SIZE_EXPAND_FILL
 column.add_child(scroll)
 overlay_content=VBoxContainer.new()
 overlay_content.add_theme_constant_override("separation",10)
 overlay_content.size_flags_horizontal=Control.SIZE_EXPAND_FILL
 scroll.add_child(overlay_content)
 return overlay_content

func _close_overlay() -> void:
 overlay.hide()
 menu_open=""
 if not in_battle and playing:paused=false

func _show_creator() -> void:
 title_layer.hide()
 _modal("A FORJA DOS DESTINOS")
 _build_creator_form()

func _build_creator_form() -> void:
 var col:=overlay_content
 _label(col,"O universo dispõe de 27 raças e 27 classes catalogadas; seis combinações de cada estão prontas nesta edição.",15,Color("#bdb2a7"))
 creator_name=LineEdit.new()
 creator_name.placeholder_text="Nome de quem atravessará as ruínas"
 creator_name.text="Viajante"
 creator_name.custom_minimum_size.y=45
 col.add_child(creator_name)
 var options:=_row(col)
 var race_box:=VBoxContainer.new()
 race_box.size_flags_horizontal=Control.SIZE_EXPAND_FILL
 options.add_child(race_box)
 _label(race_box,"RAÇA",16,Color("#d8b789"))
 creator_race=OptionButton.new()
 race_box.add_child(creator_race)
 var race_keys: Array=BOOK.RACES.keys()
 race_keys.sort()
 for race in race_keys:
  creator_race.add_item(str(race))
  var i: int=creator_race.item_count-1
  creator_race.set_item_disabled(i,not str(race) in DATA.PLAYABLE_RACES)
  if str(race)=="Humano":creator_race.select(i)
 var class_box:=VBoxContainer.new()
 class_box.size_flags_horizontal=Control.SIZE_EXPAND_FILL
 options.add_child(class_box)
 _label(class_box,"CLASSE",16,Color("#d8b789"))
 creator_class=OptionButton.new()
 class_box.add_child(creator_class)
 for role in BOOK.CLASSES:
  creator_class.add_item(str(role))
  var i: int=creator_class.item_count-1
  creator_class.set_item_disabled(i,not str(role) in DATA.PLAYABLE_CLASSES)
  if str(role)=="Guerreiro":creator_class.select(i)
 creator_class.item_selected.connect(func(_i: int)->void:_reset_skills();_render_skill_rows();_refresh_creator())
 creator_race.item_selected.connect(func(_i: int)->void:_refresh_creator())
 var appearance_row:=_row(col)
 _label(appearance_row,"APRESENTAÇÃO",16,Color("#d8b789"))
 creator_body=OptionButton.new()
 creator_body.add_item("Masculina")
 creator_body.add_item("Feminina")
 creator_body.add_item("Andrógina")
 appearance_row.add_child(creator_body)
 _label(col,"ATRIBUTOS FUNDAMENTAIS • 8 PONTOS • NENHUM VALOR ZERO",18,Color("#e3c28d"))
 creator_stat_labels.clear()
 for key in ["f","h","v","m"]:
  var row:=_row(col)
  var names: Dictionary={"f":"Físico","h":"Habilidade","v":"Vigor","m":"Mental"}
  var title: Label=_label(row,str(names[key]),18)
  title.custom_minimum_size.x=190
  _button(row,"−",_change_attribute.bind(key,-1),Vector2(56,42))
  var val:=_label(row,"2",20,Color("#e7c588"))
  val.custom_minimum_size.x=64
  val.horizontal_alignment=HORIZONTAL_ALIGNMENT_CENTER
  creator_stat_labels[key]=val
  _button(row,"+",_change_attribute.bind(key,1),Vector2(56,42))
 var quality_row:=_row(col)
 _label(quality_row,"DUAS QUALIDADES",16,Color("#e3c28d"))
 creator_quality1=OptionButton.new()
 creator_quality2=OptionButton.new()
 for quality in DATA.QUALITIES:
  creator_quality1.add_item(str(quality))
  creator_quality2.add_item(str(quality))
 creator_quality1.select(0)
 creator_quality2.select(2)
 quality_row.add_child(creator_quality1)
 quality_row.add_child(creator_quality2)
 _label(col,"HABILIDADES INICIAIS • 5 PONTOS, CUSTOS CONFORME O CATÁLOGO",18,Color("#e3c28d"))
 _reset_skills()
 creator_feedback=_label(col,"",15,Color("#e9d8b9"))
 _render_skill_rows()
 _button(col,"INICIAR PRÓLOGO",Callable(self,"_confirm_creator"),Vector2(500,53)).size_flags_horizontal=Control.SIZE_EXPAND_FILL
 _refresh_creator()

func _reset_skills() -> void:
 creator_skills.clear()
 var role: String="Guerreiro"
 if creator_class!=null and creator_class.item_count>0:
  role=creator_class.get_item_text(creator_class.selected)
 for skill in DATA.SKILLS.get(role,[]):
  creator_skills[str(skill["id"])]=1

func _render_skill_rows() -> void:
 if overlay_content==null:return
 creator_skill_labels.clear()
 var role: String=creator_class.get_item_text(creator_class.selected)
 for child in overlay_content.get_children():
  if child.is_in_group("creator_skill_rows"):
   overlay_content.remove_child(child)
   child.queue_free()
 for skill in DATA.SKILLS.get(role,[]):
  var row:=_row(overlay_content)
  row.add_to_group("creator_skill_rows")
  var title:=_label(row,"%s • %s" % [skill["name"],skill["source"]],16)
  title.custom_minimum_size.x=380
  _button(row,"−",_change_skill.bind(str(skill["id"]),-1),Vector2(56,39))
  var value:=_label(row,"1",19,Color("#e3c28d"))
  value.custom_minimum_size.x=48
  creator_skill_labels[str(skill["id"])]=value
  _button(row,"+",_change_skill.bind(str(skill["id"]),1),Vector2(56,39))
  var before_info: int=overlay_content.get_children().find(creator_feedback)
  if before_info>=0:
   overlay_content.move_child(row,before_info)
 # As tecnicas ficam na secao de habilidades, antes do feedback da distribuicao.

func _skill_spent() -> int:
 var total:=0
 var role: String=creator_class.get_item_text(creator_class.selected)
 for skill in DATA.SKILLS.get(role,[]):
  total+=int(creator_skills.get(str(skill["id"]),0))*int(skill["price"])
 return total

func _change_skill(id: String,amount: int) -> void:
 var next: int=int(creator_skills.get(id,0))+amount
 if next<0 or next>3:return
 creator_skills[id]=next
 if _skill_spent()>5:creator_skills[id]=next-amount
 _refresh_creator()

func _change_attribute(key: String,amount: int) -> void:
 var race: String=creator_race.get_item_text(creator_race.selected)
 var idx: int=["f","h","v","m"].find(key)
 var limit: int=int(BOOK.RACES[race]["cap"][idx])
 var next: int=int(creator_stats.get(key,2))+amount
 if next<1 or next>limit:return
 creator_stats[key]=next
 if _attribute_spent()>8:creator_stats[key]=next-amount
 _refresh_creator()

func _attribute_spent() -> int:
 var count:=0
 for key in ["f","h","v","m"]:
  count+=int(creator_stats[key])
 return count

func _refresh_creator() -> void:
 if creator_feedback==null or not is_instance_valid(creator_feedback):return
 var race: String=creator_race.get_item_text(creator_race.selected)
 var role: String=creator_class.get_item_text(creator_class.selected)
 for key in creator_stat_labels:
  if is_instance_valid(creator_stat_labels[key]):
   creator_stat_labels[key].text=str(creator_stats[key])
 for key in creator_skill_labels:
  if is_instance_valid(creator_skill_labels[key]):
   creator_skill_labels[key].text=str(creator_skills.get(key,0))
 var caps: Array=BOOK.RACES[race]["cap"]
 creator_feedback.text="Raça %s • movimento %sm • limites F%d/H%d/V%d/M%d • atributos restantes %d • habilidade restante %d\nClasse %s • PV base %d + Físico • evolução: Físico + %d PV/nível." % [
  race,str(BOOK.RACES[race]["move"]),caps[0],caps[1],caps[2],caps[3],
  8-_attribute_spent(),5-_skill_spent(),role,DATA.CLASS_HP[role][0],DATA.CLASS_HP[role][1]]

func _confirm_creator() -> void:
 var race: String=creator_race.get_item_text(creator_race.selected)
 var role: String=creator_class.get_item_text(creator_class.selected)
 if not race in DATA.PLAYABLE_RACES or not role in DATA.PLAYABLE_CLASSES:
  _notify("Esta opção ainda não está jogável.")
  return
 if not BOOK.valid_attributes(race,creator_stats):
  _notify("Distribua exatamente 8 pontos, sem zeros.")
  return
 if _skill_spent()!=5:
  _notify("Distribua todos os 5 pontos de habilidade.")
  return
 var q1: String=creator_quality1.get_item_text(creator_quality1.selected)
 var q2: String=creator_quality2.get_item_text(creator_quality2.selected)
 if q1==q2:
  _notify("Escolha duas qualidades diferentes.")
  return
 var chosen_name: String=creator_name.text.strip_edges().substr(0,22)
 if chosen_name.is_empty():chosen_name="Viajante"
 var equ: Dictionary=DATA.default_equipment(role)
 player=DATA.make_actor(chosen_name,role,race,creator_stats,[q1,q2],1,equ)
 player["presentation"]=creator_body.get_item_text(creator_body.selected)
 player["skills"]=creator_skills.duplicate(true)
 inventory=DATA.starter_items(role)
 party.clear()
 objects_collected.clear()
 defeated.clear()
 kill_counts.clear()
 flags={"herbs":false,"peregrina":false,"bosque":false,"santuario":false,"prisioneiro":false,
  "escriba":false,"ferro":false,"ossos":false,"guarnicao":false,"maera":false,"doran":false,
  "ilyra":false,"corrompidos":false,"intro":false}
 discovered={"vigilia":true}
 codex_seen={"origem":true}
 krovs=50
 reputation=0
 level=1
 xp=0
 level_points=0
 main_stage=0
 clock_hours=19
 moral_choice=""
 ending=""
 hero_pos=Vector2i(18,19)
 region="vigilia"
 intro_done=false
 title_layer.hide()
 overlay.hide()
 playing=true
 paused=false
 _enter_region(region,hero_pos)
 _notify("OBSCURE RESPIRA EM CINZAS. PROCURE HASAM NA VIGÍLIA.",6.0)
 _save()
 _sound("collect")

func _enter_region(next_region: String,spawn: Vector2i) -> void:
 region=next_region
 hero_pos=spawn
 discovered[region]=true
 path.clear()
 world.hero_race=str(player.get("race","Humano"))
 world.hero_class=str(player.get("role","Guerreiro"))
 world.configure(region,Vector2(hero_pos),objects_collected,defeated,party)
 camera.position=world.tile_to_world(Vector2(hero_pos))
 _update_hud()
 if region=="ruturam" and not flags.get("corruption_checked",false):
  flags["corruption_checked"]=true
  var test: int=randi_range(1,20)+int(player["f"])+int(player["m"])
  if test<15:
   player["corruption"]=mini(10,int(player.get("corruption",0))+1)
   _notify("Sua alma estremece diante da Fratura. +1 Corrupção.",5)
  else:_notify("Você resiste à influência de Ruturam.",4)
 _save()

func _direction_down(direction: Vector2i) -> void:
 button_direction=direction
 controller_clock=0.17

func _direction_up() -> void:
 button_direction=Vector2i.ZERO

func _process(delta: float) -> void:
 if not playing or paused:return
 if in_battle:
  camera.position=camera.position.lerp(Vector2.ZERO,minf(1.0,delta*8))
  world.battle_actors=combat.actors
  _refresh_battle_hud()
  return
 camera.position=camera.position.lerp(world.tile_to_world(Vector2(hero_pos)),minf(1.0,delta*8))
 path_clock+=delta
 controller_clock+=delta
 if button_direction!=Vector2i.ZERO and controller_clock>=0.18:
  controller_clock=0.0
  path.clear()
  _walk(hero_pos+button_direction)
 elif not path.is_empty() and path_clock>=0.15:
  path_clock=0.0
  var next_step: Vector2i=path.pop_front()
  _walk(next_step)

func _unhandled_input(event: InputEvent) -> void:
 if not playing or paused or overlay.visible:return
 if event is InputEventMouseButton and event.button_index==MOUSE_BUTTON_LEFT and event.pressed:
  var tile: Vector2i=world.world_to_tile(get_global_mouse_position())
  if in_battle:
   _tap_battle(tile)
   return
  if world.walkable(tile):
   path=world.path_to(hero_pos,tile)
   world.focus_tile=tile
   world.current_steps.clear()
   world.current_steps.append_array(path)
   world.queue_redraw()
 if event is InputEventKey and event.pressed and not event.echo:
  if event.keycode==KEY_E:_interact()
  elif event.keycode==KEY_I:_open_inventory()
  elif event.keycode==KEY_J:_open_journal()
  elif event.keycode==KEY_ESCAPE:_pause_button()
  elif event.keycode==KEY_W:_walk(hero_pos+Vector2i(0,-1))
  elif event.keycode==KEY_S:_walk(hero_pos+Vector2i(0,1))
  elif event.keycode==KEY_A:_walk(hero_pos+Vector2i(-1,0))
  elif event.keycode==KEY_D:_walk(hero_pos+Vector2i(1,0))

func _walk(tile: Vector2i) -> void:
 if in_battle or not world.walkable(tile):return
 var dist: int=absi(tile.x-hero_pos.x)+absi(tile.y-hero_pos.y)
 if dist!=1:return
 hero_pos=tile
 world.set_player(Vector2(hero_pos))
 world.current_steps=path.duplicate()
 clock_hours=(clock_hours+1)%24 if randi_range(0,20)==0 else clock_hours
 _check_foe_nearby()
 _update_hud()

func _check_foe_nearby() -> void:
 if main_stage==0:return
 for e in world.enemies:
  if defeated.has(str(e["id"])):continue
  var p:=Vector2i(int(e["at"][0]),int(e["at"][1]))
  if absi(p.x-hero_pos.x)+absi(p.y-hero_pos.y)<=1:
   _begin_fight(e)
   return

func _update_hud() -> void:
 if not playing:return
 zone_label.text="TENEBRIA  •  "+str(DATA.REGIONS[region]["name"])
 zone_label.tooltip_text=str(DATA.REGIONS[region]["subtitle"])
 info_label.text="PV %d/%d  •  F %d  •  V %d  •  C %d" % [
  int(player.get("hp",0)),int(player.get("max_hp",0)),int(player.get("fatigue",0)),
  int(player.get("will",0)),int(player.get("corruption",0))]
 resources_label.text="KROVS %d  •  NV %d  •  XP %d/10" % [krovs,level,xp]
 quest_label.text=_main_quest_brief()
 hint_label.text="Região: %s  |  %s  |  Interagir com E" % [DATA.REGIONS[region]["subtitle"],
  "BATALHA EM TURNOS" if in_battle else "Explore e recolha materiais"]

func _main_quest_brief() -> String:
 match main_stage:
  0:return "PRÓLOGO • CONVERSE COM HASAM"
  1:return "ENCONTRE A CHAVE DA CRIPTA • %d FRAGMENTOS" % int(inventory.get("Fragmento Astral",0))
  2:return "ATRAVESSE A FORTALEZA ATÉ RUTURAM"
  3:return "O ARAUTO DESPERTOU • BUSQUE A VOZ"
  _:return "ARCO I CONCLUÍDO • SUA ESCOLHA FOI FEITA"

func _notify(message: String,seconds: float=3.0) -> void:
 if not playing and title_layer.visible:
  print("[TENEBRIA] "+message)
  return
 hint_label.text=message
 print("[TENEBRIA] "+message)
 message_timer=seconds
 if message.begins_with("ENCONTRO"):_sound("collect")

func _interact() -> void:
 if not playing or in_battle or paused:return
 var target: Dictionary=world.nearest_interactable(hero_pos,2)
 if target.is_empty():
  _notify("Ninguém está próximo. Caminhe até uma porta, objeto ou personagem.")
  return
 match str(target["kind"]):
  "npc":_talk_to(str(target["entry"]["id"]))
  "object":_collect_object(target["entry"])
  "enemy":_begin_fight(target["entry"])
  "exit":
   var door: Dictionary=target["entry"]
   var destination: String=str(door["to"])
   if destination=="ruturam" and int(inventory.get("Chave Velada",0))<=0:
    _notify("O portão do Limiar requer a Chave Velada encontrada na Cripta.",5)
    return
   _enter_region(destination,Vector2i(int(door["spawn"][0]),int(door["spawn"][1])))
   _notify("Você adentra %s." % DATA.REGIONS[region]["name"],4)
   _sound("swing")

func _collect_object(entry: Dictionary) -> void:
 var id: String=str(entry["id"])
 if objects_collected.has(id):return
 var name_item: String=str(entry["name"])
 match str(entry["kind"]):
  "forage":
   inventory[name_item]=int(inventory.get(name_item,0))+1
   _notify("Coletado: %s." % name_item)
  "chest":
   krovs+=8+int(DATA.REGIONS[region]["danger"])*4
   var pool: Array=["Atadura","Ferro Antigo","Cinza Viva","Poção de Vontade","Poção de Fadiga"]
   var loot_name: String=str(pool[abs(id.hash())%pool.size()])
   inventory[loot_name]=int(inventory.get(loot_name,0))+1
   if region=="fortaleza" and id.ends_with("_chest_2"):
    inventory["Couraça dos Sem-Rosto"]=int(inventory.get("Couraça dos Sem-Rosto",0))+1
    loot_name="Couraça dos Sem-Rosto"
   _notify("Baú aberto: Krovs e %s." % loot_name,4)
  "lore":
   var keys: Array=DATA.CODEX.keys()
   var selection: String=str(keys[abs(id.hash())%keys.size()])
   codex_seen[selection]=true
   _show_dialogue("INSCRIÇÃO DO PASSADO",str(DATA.CODEX[selection]),
    [{"name":"Guardar a memória","callback":Callable(self,"_close_overlay")}])
   xp+=1
   _check_level()
  "shrine":
   player["hp"]=int(player["max_hp"])
   player["will"]=int(player["m"])+int(player["h"])
   if region=="bosque" and not bool(flags.get("santuario",false)):
    flags["santuario"]=true
    reputation+=1
    xp+=2
    inventory["Água de Santuário"]=int(inventory.get("Água de Santuário",0))+2
    _check_level()
   player["corruption"]=maxi(0,int(player.get("corruption",0))-1)
   _notify("O santuário oferece descanso e alivia um ponto de corrupção.",5)
 objects_collected[id]=true
 world.found=objects_collected
 world.queue_redraw()
 _update_hud()
 _save()

func _show_dialogue(title: String,text_value: String,choices: Array[Dictionary]) -> void:
 _modal(title)
 _label(overlay_content,text_value,19)
 _label(overlay_content,"")
 for choice in choices:
  _button(overlay_content,str(choice["name"]),choice["callback"],Vector2(540,47)).size_flags_horizontal=Control.SIZE_EXPAND_FILL

func _talk_to(npc_id: String) -> void:
 match npc_id:
  "hasam":
   if main_stage==0:
    _show_dialogue("HASAM, O VIGIA","Quando os deuses se calaram, nossos reis fingiram que tudo havia terminado. A Cripta guarda a Chave Velada. Traga-a antes que o Arauto atravesse. Mas salve quem puder: vitórias que sacrificam todos não valem o sangue.",[
     {"name":"Assumir a missão e proteger a Vigília","callback":Callable(self,"_choose_hasam").bind("proteger")},
     {"name":"Assumir a missão e procurar poder","callback":Callable(self,"_choose_hasam").bind("poder")},
     {"name":"Ainda não","callback":Callable(self,"_close_overlay")}])
   else:
    _show_dialogue("HASAM","Vi muitos reinos desaparecem. O mundo não precisa de outro soberano imortal. Precisa de pessoas que recusem a indiferença.",[
     {"name":"Descansar e recuperar recursos","callback":Callable(self,"_rest_in_town")},
     {"name":"Voltar","callback":Callable(self,"_close_overlay")}])
  "maera":
   if not flags.get("maera",false):
    _show_dialogue("MAERA, A EXILADA","Fugi de uma corte em que o silêncio era exigido sob pena de morte. Sei manipular o Véu; não prometo obediência, mas posso lutar ao seu lado.",[
     {"name":"Recrutar Maera • Mago","callback":Callable(self,"_recruit").bind("maera")},
     {"name":"Recusar","callback":Callable(self,"_close_overlay")}])
   else:_show_dialogue("MAERA","Em cada ruína, vejo alguém que quis se tornar eterno. Nunca vejo os que consentiram.",[{"name":"Seguir","callback":Callable(self,"_close_overlay")}])
  "ilyra":
   if int(inventory.get("Erva Cinzenta",0))>=5 and not flags.get("herbs",false):
    _show_dialogue("ILYRA, SACERDOTISA","Cinco ervas. Cinco chances de impedir uma morte. Não posso ficar aqui enquanto outros padecem.",[
     {"name":"Entregar ervas e recrutar Ilyra","callback":Callable(self,"_finish_herbs")},
     {"name":"Guardar por enquanto","callback":Callable(self,"_close_overlay")}])
   else:_show_dialogue("ILYRA, SACERDOTISA","Os feridos da Vigília precisam de cinco ervas cinzentas. Procure-as no bosque e no pântano. Nenhum milagre nasce da indiferença.",[
    {"name":"Sair","callback":Callable(self,"_close_overlay")}])
  "oswin":_open_shop()
  "sentinela":
   if int(kill_counts.get("Errante",0))+int(kill_counts.get("Incarna Ferrão",0))>=3 and not flags.get("doran",false):
    _show_dialogue("DORAN, A SENTINELA","Você enfrentou mais horrores do que todos nós nesta semana. Se me aceitar, assumirei a guarda do seu grupo.",[
     {"name":"Recrutar Doran • Guerreiro","callback":Callable(self,"_recruit").bind("doran")},
     {"name":"A guarda deve ficar aqui","callback":Callable(self,"_close_overlay")}])
   else:_show_dialogue("DORAN","Três monstros derrotados demonstrariam que existe um futuro para a Vigília. Eu preciso acreditar nisso.",[
    {"name":"Retirar-se","callback":Callable(self,"_close_overlay")}])
  "peregrina":
   if not flags.get("peregrina",false):
    _show_dialogue("A PEREGRINA","Não tenho Krovs nem família. Deixei duas crianças sob a ponte. Preciso de uma atadura.",[
     {"name":"Doar uma atadura","callback":Callable(self,"_resolve_pilgrim").bind(true)},
     {"name":"Afastar-se","callback":Callable(self,"_resolve_pilgrim").bind(false)}])
   else:_show_dialogue("A PEREGRINA","Algumas bondades ainda resistem ao fim do mundo.",[{"name":"Partir","callback":Callable(self,"_close_overlay")}])
  "escriba":
   if int(inventory.get("Papel Queimado",0))>=3 and not flags.get("escriba",false):
    _show_dialogue("ESCRIBA ARVEN","Essas páginas provam que nossa história foi alterada. Quem ganha quando o passado é apagado?",[
     {"name":"Entregar as páginas","callback":Callable(self,"_deliver_quest").bind("escriba","Papel Queimado",3,"Anel de Osso")},
     {"name":"Manter o segredo","callback":Callable(self,"_close_overlay")}])
   else:_show_dialogue("ESCRIBA ARVEN","Três páginas queimadas foram escondidas entre os escombros. Traga-as; preciso reconstruir o que os reis queimaram.",[
    {"name":"Sair","callback":Callable(self,"_close_overlay")}])
  "caçadora":
   if int(kill_counts.get("Aranha do Véu",0))>=2 and not flags.get("bosque",false):
    _show_dialogue("NERYS, A CAÇADORA","A trilha está mais segura. Minha família poderá atravessar antes do inverno.",[
     {"name":"Receber Arco da Viúva","callback":Callable(self,"_reward_hunter")},
     {"name":"Recusar a recompensa","callback":Callable(self,"_close_overlay")}])
   else:_show_dialogue("NERYS, A CAÇADORA","As Aranhas do Véu tomaram os caminhos. Derrote duas e minha gente voltará a atravessar o bosque.",[
    {"name":"Seguir a trilha","callback":Callable(self,"_close_overlay")}])
  "espirito":_show_dialogue("ECO DA VIÚVA","Minha voz existe onde enterraram os nomes. Busque a capela e acenda novamente uma vela por quem não teve túmulo.",[
   {"name":"Guardar essa memória","callback":Callable(self,"_remember").bind("luz")},
   {"name":"Silenciar","callback":Callable(self,"_close_overlay")}])
  "alquimista":
   if int(inventory.get("Ferro Antigo",0))>=4 and not flags.get("ferro",false):
    _show_dialogue("HAVEL, ALQUIMISTA","Ferro antigo. Ele guarda o peso de uma batalha que ainda não terminou. Posso trocá-lo por uma arma.",[
     {"name":"Trocar quatro ferros por lança","callback":Callable(self,"_deliver_quest").bind("ferro","Ferro Antigo",4,"Lança do Pântano")},
     {"name":"Guardar material","callback":Callable(self,"_close_overlay")}])
   else:_show_dialogue("HAVEL","Quatro ferros antigos bastariam para forjar algo que ainda funcione. Traga-os.",[{"name":"Ir","callback":Callable(self,"_close_overlay")}])
  "prisioneiro":
   if not flags.get("prisioneiro",false):
    _show_dialogue("O PRISIONEIRO","Disseram que eu traí meu senhor. Na verdade, recusei queimar as casas dos camponeses. O capitão me deixou aqui para apodrecer.",[
     {"name":"Libertá-lo • +reputação","callback":Callable(self,"_prisoner_choice").bind(true)},
     {"name":"Entregá-lo ao capitão • Krovs","callback":Callable(self,"_prisoner_choice").bind(false)}])
   else:_show_dialogue("O PRISIONEIRO","Minha sentença foi dada há muito tempo. Sua escolha será lembrada.",[{"name":"Sair","callback":Callable(self,"_close_overlay")}])
  "monge":
   if int(inventory.get("Osso Inscrito",0))>=3 and not flags.get("ossos",false):
    _show_dialogue("O MONGE CEGO","Leio marcas onde outros veem ossos. Três nomes devolvidos à memória revelam o caminho da Chave.",[
     {"name":"Entregar três ossos","callback":Callable(self,"_deliver_quest").bind("ossos","Osso Inscrito",3,"Selo da Vigília")},
     {"name":"Não","callback":Callable(self,"_close_overlay")}])
   else:_show_dialogue("O MONGE CEGO","Há três ossos inscritos entre os túmulos. Cada um abriga um nome que os reis extinguiram.",[{"name":"Seguir","callback":Callable(self,"_close_overlay")}])
  "capitao":
   if int(kill_counts.get("Cavaleiro Oco",0))>=3 and not flags.get("guarnicao",false):
    _show_dialogue("CAPITÃO EDRIK","Os cavaleiros sem rosto caíram. Não esqueça que cada um foi um homem antes de ser uma ordem.",[
     {"name":"Receber uma couraça","callback":Callable(self,"_deliver_quest").bind("guarnicao","",0,"Couraça dos Sem-Rosto")},
     {"name":"Partir","callback":Callable(self,"_close_overlay")}])
   else:_show_dialogue("CAPITÃO EDRIK","A guarnição jurou obediência além da morte. Derrote três Cavaleiros Ocos antes que a fortaleza desperte por inteiro.",[
    {"name":"Avançar","callback":Callable(self,"_close_overlay")}])
  "sombria":_show_dialogue("DAMA DO VÉU","A história pertence aos sobreviventes. Mas a verdade pertence aos que estão dispostos a pagar por ela.",[
   {"name":"Escutar","callback":Callable(self,"_remember").bind("sem_rosto")},
   {"name":"Ir embora","callback":Callable(self,"_close_overlay")}])
  "voz":
   if main_stage>=3 and ending.is_empty():_last_choice()
   else:_show_dialogue("A VOZ DO ABISMO","A verdade não aceita ser encerrada outra vez.",[{"name":"Silenciar","callback":Callable(self,"_close_overlay")}])
  _:
   _notify("Esta personagem não tem diálogo ainda.")

func _choose_hasam(option: String) -> void:
 moral_choice=option
 main_stage=1
 if option=="proteger":
  reputation+=1
  inventory["Atadura"]=int(inventory.get("Atadura",0))+2
 else:
  krovs+=24
  player["corruption"]=int(player.get("corruption",0))+1
 _close_overlay()
 _notify("MISSÃO PRINCIPAL INICIADA: recupere a Chave Velada da Cripta.",5)
 _update_hud()
 _save()

func _recruit(id: String) -> void:
 if flags.get(id,false):
  _close_overlay()
  return
 if party.size()>=3:
  _notify("O grupo já possui três companheiros.")
  return
 flags[id]=true
 var model: Dictionary=DATA.COMPANIONS[id].duplicate(true)
 model["id"]=id
 party.append(model)
 world.companions.clear()
 for ally in party:
  world.companions.append(ally.duplicate(true))
 world.queue_redraw()
 reputation+=1
 _close_overlay()
 _notify("%s entrou no grupo e poderá ser controlado em combate." % model["name"],5)
 _save()

func _finish_herbs() -> void:
 inventory["Erva Cinzenta"]=int(inventory["Erva Cinzenta"])-5
 flags["herbs"]=true
 krovs+=35
 xp+=2
 _check_level()
 _close_overlay()
 _recruit("ilyra")
 _notify("Ilyra agradece as ervas. +35 Krovs e novo membro de grupo.",5)
 _save()

func _resolve_pilgrim(help: bool) -> void:
 if help and int(inventory.get("Atadura",0))<=0:
  _notify("Você não possui ataduras.")
  return
 flags["peregrina"]=true
 if help:
  inventory["Atadura"]=int(inventory["Atadura"])-1
  reputation+=2
  xp+=2
  _check_level()
  _notify("A Peregrina sobreviveu. A Vigília se lembra do gesto.",5)
 else:
  reputation-=1
  krovs+=8
  _notify("Você guardou recursos. Um desconhecido o pagou para se afastar.",5)
 _close_overlay()
 _save()

func _prisoner_choice(free_him: bool) -> void:
 flags["prisioneiro"]=true
 if free_him:
  reputation+=2
  xp+=2
  _notify("O prisioneiro fugiu. Seu nome será lembrado pelo capitão.",5)
 else:
  krovs+=40
  reputation-=2
  _notify("Você entregou um inocente em troca de 40 Krovs.",5)
 _close_overlay()
 _check_level()
 _save()

func _deliver_quest(id: String,item_name: String,amount: int,reward: String) -> void:
 if item_name!="" and int(inventory.get(item_name,0))<amount:
  _notify("Materiais insuficientes.")
  return
 if item_name!="":
  inventory[item_name]=int(inventory[item_name])-amount
 flags[id]=true
 inventory[reward]=int(inventory.get(reward,0))+1
 xp+=2
 krovs+=25
 reputation+=1
 _check_level()
 _close_overlay()
 _notify("Missão concluída: %s adquirido, 25 Krovs, 2 XP." % reward,5)
 _save()

func _reward_hunter() -> void:
 flags["bosque"]=true
 inventory["Arco da Viúva"]=int(inventory.get("Arco da Viúva",0))+1
 xp+=2
 _check_level()
 _close_overlay()
 _notify("Nerys entrega o Arco da Viúva.",4)
 _save()

func _remember(key: String) -> void:
 codex_seen[key]=true
 _close_overlay()
 _notify("Inscrição adicionada ao Códice.",3)
 _save()

func _rest_in_town() -> void:
 if krovs<5:
  _notify("Descansar custa 5 Krovs.")
  return
 krovs-=5
 player["hp"]=int(player["max_hp"])
 player["fatigue"]=int(player["f"])+int(player["v"])
 player["will"]=int(player["h"])+int(player["m"])
 _close_overlay()
 _notify("Um abrigo e algumas horas de silêncio restauraram suas forças.",5)
 _update_hud()
 _save()

func _last_choice() -> void:
 _show_dialogue("O ÚLTIMO JURAMENTO","O Arauto caiu, mas o pacto não morreu. O selo protegerá os vivos à custa de manter os crimes ocultos. Rompê-lo revelará a verdade, mas espalhará o medo. Não existe escolha sem vítimas.",[
  {"name":"SELAR A FRATURA • proteger o povoado","callback":Callable(self,"_ending_choice").bind("selo")},
  {"name":"REVELAR O PACTO • expor a verdade","callback":Callable(self,"_ending_choice").bind("verdade")},
  {"name":"Ainda não decidir","callback":Callable(self,"_close_overlay")}])

func _ending_choice(choice: String) -> void:
 ending=choice
 main_stage=4
 if choice=="selo":
  reputation+=3
  player["corruption"]=maxi(0,int(player.get("corruption",0))-2)
  _show_dialogue("EPÍLOGO • A ÚLTIMA CHAMA","A fratura se fecha. Hasam conserva sua mentira para salvar o povoado. Algumas crianças verão um novo inverno. O preço do silêncio é invisível — até deixar de ser.",[
   {"name":"Continuar explorando Obscure","callback":Callable(self,"_close_overlay")}])
 else:
  reputation-=1
  player["corruption"]=mini(10,int(player.get("corruption",0))+2)
  _show_dialogue("EPÍLOGO • A VERDADE SANGRA","As inscrições espalham-se por Obscure. Reis, sacerdotes e soldados serão julgados pelo que ocultaram. A Vigília perde a paz, mas recupera os próprios nomes.",[
   {"name":"Continuar explorando Obscure","callback":Callable(self,"_close_overlay")}])
 codex_seen["epilogo"]=true
 inventory["Lâmina Astral"]=int(inventory.get("Lâmina Astral",0))+1
 xp+=8
 _check_level()
 _update_hud()
 _save()

func _open_shop() -> void:
 _modal("OSWIN • MERCADO DA VIGÍLIA")
 _label(overlay_content,"Cada troca pesa mais depois que a moeda encontra o medo. Krovs: %d." % krovs,16)
 var items: Array=["Atadura","Poção de Fadiga","Poção de Vontade","Gibão de Couro",
  "Cota Enferrujada","Escudo de Madeira","Arco de Teixo","Maça de Bronze","Katana Antiga","Elixir Antigo"]
 var catalog: Dictionary=DATA.item_catalog()
 for item in items:
  var row:=_row(overlay_content)
  var data: Dictionary=catalog[item]
  var lbl:=_label(row,"%s   •   %d Krovs" % [item,int(data["price"])],17)
  lbl.size_flags_horizontal=Control.SIZE_EXPAND_FILL
  _button(row,"COMPRAR",Callable(self,"_buy").bind(item),Vector2(150,39))

func _buy(item_name: String) -> void:
 var data: Dictionary=DATA.item_catalog().get(item_name,{})
 var price: int=int(data.get("price",0))
 if price<=0 or krovs<price:
  _notify("Krovs insuficientes.")
  return
 krovs-=price
 inventory[item_name]=int(inventory.get(item_name,0))+1
 _notify("%s comprado por %d Krovs." % [item_name,price])
 _update_hud()
 _save()

func _open_inventory() -> void:
 if not playing:return
 _modal("MOCHILA • EQUIPAMENTOS")
 _label(overlay_content,"Itens carregados: %d tipos  •  Krovs: %d" % [inventory.size(),krovs],16)
 for slot in ["weapon","armor","shield","accessory"]:
  _label(overlay_content,"%s: %s" % [slot.to_upper(),str(player.get("gear",{}).get(slot,"(vazio)"))],16,Color("#e8c590"))
 var catalog: Dictionary=DATA.item_catalog()
 var keys: Array=inventory.keys()
 keys.sort()
 for item in keys:
  if int(inventory[item])<=0:continue
  var data: Dictionary=catalog.get(str(item),{})
  var row:=_row(overlay_content)
  var lb:=_label(row,"%s  x%d  •  %s" % [item,int(inventory[item]),str(data.get("desc",""))],15)
  lb.size_flags_horizontal=Control.SIZE_EXPAND_FILL
  if str(data.get("slot","")) in ["weapon","armor","shield","accessory"]:
   _button(row,"EQUIPAR",Callable(self,"_equip").bind(str(item)),Vector2(116,37))
  elif str(data.get("slot",""))=="consumable":
   _button(row,"USAR",Callable(self,"_use_item").bind(str(item)),Vector2(90,37))
 _button(overlay_content,"DESEQUIPAR ESCUDO",Callable(self,"_unequip").bind("shield"),Vector2(290,41))

func _equip(name_item: String) -> bool:
 var data: Dictionary=DATA.item_catalog().get(name_item,{})
 if int(inventory.get(name_item,0))<=0:return false
 var slot: String=str(data.get("slot",""))
 if not slot in ["weapon","armor","shield","accessory"]:return false
 player["gear"][slot]=name_item
 _notify("%s equipado; atributos da batalha atualizados." % name_item)
 _update_hud()
 _save()
 return true

func _unequip(slot: String) -> void:
 player["gear"][slot]=""
 _notify("Equipamento removido.")
 _save()

func _use_item(item_name: String) -> bool:
 if int(inventory.get(item_name,0))<=0:return false
 match item_name:
  "Atadura":
   if int(player["hp"])>=int(player["max_hp"]):return false
   player["hp"]=mini(int(player["max_hp"]),int(player["hp"])+randi_range(1,6)+2)
  "Poção de Vontade":
   player["will"]=mini(int(player["h"])+int(player["m"])+3,int(player["will"])+randi_range(1,4))
  "Poção de Fadiga":
   player["fatigue"]=mini(int(player["f"])+int(player["v"])+3,int(player["fatigue"])+randi_range(1,4))
  "Elixir Antigo":
   player["hp"]=int(player["max_hp"])
   player["corruption"]=maxi(0,int(player.get("corruption",0))-1)
  _:return false
 inventory[item_name]=int(inventory[item_name])-1
 _notify("Consumiu "+item_name)
 _sound("heal")
 _update_hud()
 _save()
 return true

func _open_crafting() -> void:
 if not playing:return
 _modal("OFICINA • ALQUIMIA E FERRARIA")
 _label(overlay_content,"Receitas são adaptações de gameplay; não representam receitas oficiais do Nano-Dungeon.",14,Color("#baa99f"))
 for recipe in DATA.RECIPES:
  var row:=_row(overlay_content)
  var list: Array[String]=[]
  for item in recipe["needs"]:
   list.append("%s x%d" % [item,recipe["needs"][item]])
  var lbl:=_label(row,"%s  •  %s" % [recipe["title"],", ".join(list)],16)
  lbl.size_flags_horizontal=Control.SIZE_EXPAND_FILL
  _button(row,"FABRICAR",Callable(self,"_craft").bind(recipe),Vector2(134,38))

func _craft(recipe: Dictionary) -> bool:
 for item in recipe["needs"]:
  if int(inventory.get(item,0))<int(recipe["needs"][item]):
   _notify("Materiais insuficientes para a receita.")
   return false
 for item in recipe["needs"]:
  inventory[item]=int(inventory[item])-int(recipe["needs"][item])
 for item in recipe["gives"]:
  inventory[item]=int(inventory.get(item,0))+int(recipe["gives"][item])
 _sound("collect")
 _notify("Fabricado: %s." % recipe["title"],4)
 _save()
 return true

func _open_journal() -> void:
 if not playing:return
 _modal("DIÁRIO • MISSÕES E CONSEQUÊNCIAS")
 _label(overlay_content,"Sua reputação: %d  •  grupo: %d companheiros  •  desfecho: %s" % [reputation,party.size(),ending],17)
 for q in DATA.QUESTS:
  _label(overlay_content,str(q["title"]),20,Color("#e8c590"))
  _label(overlay_content,_quest_status(str(q["id"]))+"   |   "+str(q["description"]),15)

func _quest_status(id: String) -> String:
 match id:
  "principal":return "CONCLUÍDA" if main_stage>=4 else ("ATIVA" if main_stage>0 else "A INICIAR")
  "final":return "CONCLUÍDA" if main_stage>=4 else ("ATIVA" if main_stage>=3 else "EM ESPERA")
  "ervas":return "CONCLUÍDA" if flags.get("herbs",false) else "%d/5" % mini(5,int(inventory.get("Erva Cinzenta",0)))
  "peregrina":return "DECIDIDA" if flags.get("peregrina",false) else "PENDENTE"
  "maera":return "RECRUTADA" if flags.get("maera",false) else "PENDENTE"
  "cacadora":return "CONCLUÍDA" if flags.get("bosque",false) else "%d/2" % int(kill_counts.get("Aranha do Véu",0))
  "guarnicao":return "CONCLUÍDA" if flags.get("guarnicao",false) else "%d/3" % int(kill_counts.get("Cavaleiro Oco",0))
  "santuario":return "CONCLUÍDA" if flags.get("santuario",false) else "PENDENTE"
  "cripta":return "CONCLUÍDA" if int(inventory.get("Chave Velada",0))>0 else "PENDENTE"
  "corrompidos":return "CONCLUÍDA" if flags.get("corruption_checked",false) else "PENDENTE"
  "ossos":return "CONCLUÍDA" if flags.get("ossos",false) else "%d/3" % int(inventory.get("Osso Inscrito",0))
  "escriba":return "CONCLUÍDA" if flags.get("escriba",false) else "%d/3" % int(inventory.get("Papel Queimado",0))
  "ferro":return "CONCLUÍDA" if flags.get("ferro",false) else "%d/4" % int(inventory.get("Ferro Antigo",0))
  "prisioneiro":return "DECIDIDA" if flags.get("prisioneiro",false) else "PENDENTE"
 return "PENDENTE"

func _open_character() -> void:
 if not playing:return
 _modal("PERSONAGEM • PROGRESSÃO")
 _label(overlay_content,"%s • %s • %s • %s" % [player["name"],player["race"],player["role"],player.get("presentation","")],21)
 _label(overlay_content,"Nível %d • %d/10 EXP • %d pontos de atributo para distribuir" % [level,xp,level_points],17)
 _label(overlay_content,"Físico %d | Habilidade %d | Vigor %d | Mental %d | Defesa %d" % [
  player["f"],player["h"],player["v"],player["m"],_hero_defense()],18,Color("#e1ca9b"))
 _label(overlay_content,"Qualidades: %s | corrupção: %d/10" % [", ".join(player["qualities"]),int(player.get("corruption",0))],15)
 if level_points>0:
  _label(overlay_content,"APERFEIÇOAR ATRIBUTO (limites raciais respeitados)",19,Color("#e8c590"))
  var row:=_row(overlay_content)
  for key in ["f","h","v","m"]:
   _button(row,"+ "+key.to_upper(),Callable(self,"_raise_stat").bind(key),Vector2(113,40))
 _label(overlay_content,"HABILIDADES ADQUIRIDAS",19,Color("#e8c590"))
 for skill in DATA.SKILLS.get(str(player["role"]),[]):
  _label(overlay_content,"%s  •  nível %d  •  %s" % [skill["name"],int(player["skills"].get(str(skill["id"]),0)),skill["source"]],16)
 _label(overlay_content,"Companheiros:",18,Color("#e8c590"))
 for companion in party:_label(overlay_content,"%s • %s • PV %d" % [companion["name"],companion["class"],companion["hp"]],15)

func _hero_defense() -> int:
 var total: int=10+int(player.get("v",2))
 var catalog: Dictionary=DATA.item_catalog()
 for slot in ["armor","shield","accessory"]:
  total+=int(catalog.get(str(player["gear"].get(slot,"")) ,{}).get("defense",0))
 return total

func _raise_stat(key: String) -> void:
 if level_points<=0:return
 var race: String=str(player["race"])
 var idx: int=["f","h","v","m"].find(key)
 var limit: int=int(BOOK.RACES[race]["cap"][idx])
 if int(player[key])>=limit:
  _notify("Limite racial atingido.")
  return
 player[key]=int(player[key])+1
 level_points-=1
 var old_hp: int=int(player["max_hp"])
 var hp_base: Array=DATA.CLASS_HP[str(player["role"])]
 player["max_hp"]=int(hp_base[0])+int(player["f"])+maxi(0,level-1)*(int(player["f"])+int(hp_base[1]))
 player["hp"]=min(int(player["max_hp"]),int(player["hp"])+int(player["max_hp"])-old_hp)
 _notify("Seu %s foi aperfeiçoado." % key.to_upper())
 _save()
 _open_character()

func _check_level() -> void:
 while xp>=10:
  xp-=10
  level+=1
  level_points+=1
  var hp_gain: int=int(player["f"])+int(DATA.CLASS_HP[str(player["role"])][1])
  player["max_hp"]=int(player["max_hp"])+hp_gain
  player["hp"]=int(player["hp"])+hp_gain
  player["fatigue"]=int(player["fatigue"])+1
  player["will"]=int(player["will"])+1
  _notify("NÍVEL %d ALCANÇADO • +%d PV • novo ponto de atributo." % [level,hp_gain],5)
 _update_hud()

func _open_map() -> void:
 if not playing:return
 _modal("MAPA • ESTRADAS DE OBSCURE")
 _label(overlay_content,"Região atual: "+DATA.REGIONS[region]["name"],19,Color("#e8c590"))
 _label(overlay_content,"Toque nos portais do cenário para viajar. Regiões descobertas:",15)
 for r in DATA.REGION_IDS:
  var status: String="DESCOBERTA" if discovered.has(r) else "AINDA NÃO VISITADA"
  _label(overlay_content,"%s  •  %s  •  perigo %d" % [DATA.REGIONS[r]["name"],status,DATA.REGIONS[r]["danger"]],16)
 _label(overlay_content,"Encontros restantes nesta área: %d" % _living_enemy_count(),15)

func _living_enemy_count() -> int:
 var count:=0
 for e in world.enemies:
  if not defeated.has(str(e["id"])):count+=1
 return count

func _open_codex() -> void:
 _modal("CÓDICE • OBSCURE")
 _label(overlay_content,"27 RAÇAS DO MANUAL",20,Color("#e8c590"))
 var keys: Array=BOOK.RACES.keys()
 keys.sort()
 _label(overlay_content,", ".join(PackedStringArray(keys)),14)
 _label(overlay_content,"27 CLASSES DO MANUAL",20,Color("#e8c590"))
 _label(overlay_content,", ".join(PackedStringArray(BOOK.CLASSES)),14)
 _label(overlay_content,"MEMÓRIAS E INSCRIÇÕES RECOLHIDAS",20,Color("#e8c590"))
 for key in codex_seen:
  if codex_seen[key]:
   _label(overlay_content,str(key).to_upper(),18,Color("#e8c590"))
   _label(overlay_content,str(DATA.CODEX.get(key,"")),15)
 _label(overlay_content,"Os textos do códice e a trama desta adaptação são originais; o manual orienta nomes e regras.",13)

func _open_settings() -> void:
 _modal("CONFIGURAÇÕES")
 _label(overlay_content,"Os modos gráficos são orientados ao Moto G34 5G; 30 FPS é a meta, não uma medição.",16)
 _button(overlay_content,"ECONOMIA DE ENERGIA • 30 FPS",Callable(self,"_set_fps").bind(30),Vector2(440,46))
 _button(overlay_content,"60 FPS (EXPERIMENTAL)",Callable(self,"_set_fps").bind(60),Vector2(440,46))
 _button(overlay_content,"ZOOM +",func()->void:camera.zoom*=Vector2(1.1,1.1),Vector2(250,42))
 _button(overlay_content,"ZOOM −",func()->void:camera.zoom*=Vector2(.9,.9),Vector2(250,42))
 _button(overlay_content,"ÁUDIO ON/OFF",Callable(self,"_toggle_audio"),Vector2(250,42))

func _set_fps(value: int) -> void:
 Engine.max_fps=value
 _notify("Limite de %d FPS aplicado." % value)

func _toggle_audio() -> void:
 audio_enabled=not audio_enabled
 ambient.stream_paused=not audio_enabled
 _notify("Áudio "+("ativado" if audio_enabled else "desativado"))

func _open_credits() -> void:
 _modal("CRÉDITOS")
 _label(overlay_content,"TENEBRIA • ECOS DE RUTURAM",23,Color("#e8c590"))
 _label(overlay_content,"Adaptação digital experimental baseada no manual Tenebria Revisado 3.0, fornecido para desenvolvimento.",17)
 _label(overlay_content,"Arte isométrica procedural, música procedural e campanha original desta edição. O livro, marcas e ilustrações não são redistribuídos.",17)
 _label(overlay_content,"Compilado em Godot 4.4.1 para Android ARM64. Uso de desenvolvimento e testes.",16)

func _save_button() -> void:
 _save()
 _notify("Partida salva localmente.",3)

func _pause_button() -> void:
 if not playing:return
 paused=true
 _modal("PAUSA")
 _button(overlay_content,"VOLTAR À AVENTURA",Callable(self,"_close_overlay"),Vector2(420,48))
 _button(overlay_content,"SALVAR",Callable(self,"_save_button"),Vector2(420,48))
 _button(overlay_content,"CONFIGURAÇÕES",Callable(self,"_open_settings"),Vector2(420,48))
 _button(overlay_content,"MENU INICIAL",Callable(self,"_return_title"),Vector2(420,48))

func _return_title() -> void:
 _save()
 path.clear()
 in_battle=false
 combat.active=false
 world.end_battle()
 overlay.hide()
 _show_title()

func _snapshot() -> Dictionary:
 return {"player":player.duplicate(true),"inventory":inventory.duplicate(true),"party":party.duplicate(true),
  "region":region,"position":hero_pos,"removed":objects_collected.duplicate(true),"defeated":defeated.duplicate(true),
  "flags":flags.duplicate(true),"discovered":discovered.duplicate(true),"codex":codex_seen.duplicate(true),
  "kills":kill_counts.duplicate(true),"krovs":krovs,"reputation":reputation,"xp":xp,"level":level,"level_points":level_points,
  "main_stage":main_stage,"moral":moral_choice,"ending":ending,"clock":clock_hours}

func _save() -> bool:
 if not playing or player.is_empty():return false
 var ok: bool=save_store.save_state(_snapshot())
 if not ok:push_error("Falha no save: "+save_store.last_error)
 return ok

func _continue_game() -> void:
 var data: Dictionary=save_store.load_state()
 if data.is_empty():
  _notify("Falha ao carregar: "+save_store.last_error)
  return
 _restore_state(data)

func _restore_state(data: Dictionary) -> void:
 if not data.has("player") or not data.has("inventory"):return
 player=data["player"].duplicate(true)
 inventory=data["inventory"].duplicate(true)
 party.clear()
 for companion in data.get("party",[]):
  party.append(companion)
 region=str(data.get("region","vigilia"))
 hero_pos=data.get("position",Vector2i(18,19))
 objects_collected=data.get("removed",{}).duplicate(true)
 defeated=data.get("defeated",{}).duplicate(true)
 flags=data.get("flags",{}).duplicate(true)
 discovered=data.get("discovered",{"vigilia":true}).duplicate(true)
 codex_seen=data.get("codex",{"origem":true}).duplicate(true)
 kill_counts=data.get("kills",{}).duplicate(true)
 krovs=int(data.get("krovs",50))
 reputation=int(data.get("reputation",0))
 xp=int(data.get("xp",0))
 level=int(data.get("level",1))
 level_points=int(data.get("level_points",0))
 main_stage=int(data.get("main_stage",0))
 moral_choice=str(data.get("moral",""))
 ending=str(data.get("ending",""))
 clock_hours=int(data.get("clock",19))
 paused=false
 in_battle=false
 playing=true
 title_layer.hide()
 overlay.hide()
 _enter_region(region,hero_pos)
 _notify("A partida foi restaurada. Obscure ainda aguarda.",4)
 _update_hud()


func _begin_fight(encounter: Dictionary) -> void:
 if not playing or in_battle or main_stage==0:return
 path.clear()
 world.current_steps.clear()
 current_battle_id=str(encounter["id"])
 var allies: Array[Dictionary]=[]
 var hero: Dictionary=player.duplicate(true)
 hero["id"]="hero"
 hero["side"]="ally"
 var catalog: Dictionary=DATA.item_catalog()
 var weapon: Dictionary=catalog.get(str(player["gear"].get("weapon","")),{})
 hero["die"]=int(weapon.get("die",6))
 hero["bonus"]=int(weapon.get("bonus",0))+(1 if "Item Herdado" in player["qualities"] else 0)
 hero["range"]=5 if str(player["gear"].get("weapon","")) in ["Arco de Teixo","Arco da Viúva"] else 1
 hero["armor"]=_hero_defense()-10-int(player["v"])
 hero["potions"]=int(inventory.get("Atadura",0))
 hero["max_hp"]=int(player["max_hp"])
 allies.append(hero)
 var party_index:=0
 for companion in party:
  if party_index>=3:break
  var ally: Dictionary=companion.duplicate(true)
  ally["id"]="ally_"+str(companion["id"])
  ally["role"]=str(companion["class"])
  ally["race"]=str(companion["race"])
  ally["die"]=6
  ally["armor"]=1
  ally["bonus"]=0
  ally["range"]=1
  ally["move"]=8
  ally["fatigue"]=int(ally["f"])+int(ally["v"])
  ally["will"]=int(ally["h"])+int(ally["m"])+2
  ally["max_hp"]=int(ally["hp"])
  ally["potions"]=1
  ally["skills"]={}
  var skills: Array=DATA.SKILLS.get(str(ally["role"]),[])
  if not skills.is_empty():
   ally["skills"][str(skills[0]["id"])]=1
  allies.append(ally)
  party_index+=1
 var hostiles: Array[Dictionary]=[]
 var foe_count: int=int(encounter.get("group",1))
 if bool(encounter.get("boss",false)):foe_count=1
 for i in range(foe_count):
  var enemy_name: String=str(encounter["name"])
  if i>0:
   var pool: Array=DATA.REGION_ENEMIES.get(region,[])
   enemy_name=str(pool[(i+str(encounter["id"]).length())%pool.size()])
  var data: Dictionary=DATA.ENEMY_TYPES[enemy_name]
  var dangerous: int=int(DATA.REGIONS[region]["danger"])
  var hostile: Dictionary={"id":"enemy_"+str(i),"name":enemy_name,"role":enemy_name,"side":"enemy",
   "hp":int(data["hp"])+dangerous*2,"max_hp":int(data["hp"])+dangerous*2,
   "f":int(data["f"]),"h":int(data["h"]),"v":int(data["v"]),"m":int(data["m"]),
   "fatigue":5,"will":5,"move":5,"die":int(data["die"]),
   "range":5 if enemy_name in ["Arqueiro Sombrio","Cultista","Mago Impuro","Arauto de Ruturam"] else 1,
   "armor":1 if enemy_name in ["Golem de Ferrugem","Cavaleiro Oco"] else 0,
   "bonus":0,"xp_reward":int(data["xp"]),"gold_reward":int(data["gold"]),"skills":{}}
  hostiles.append(hostile)
 combat.begin(allies,hostiles)
 in_battle=true
 world.set_battle(combat.actors)
 world.focus_tile=Vector2i(-1,-1)
 camera.position=Vector2.ZERO
 focus_target=0
 exploration_bar.hide()
 battle_bar.show()
 combat_box.show()
 _sound("swing")
 _notify("ENCONTRO: %s • batalha por turnos iniciada." % encounter["name"],4)
 _refresh_battle_hud()
 _drive_enemies()

func _refresh_battle_hud() -> void:
 if not in_battle or not combat.active:return
 var actor: Dictionary=combat.current()
 if actor.is_empty():return
 var focus: Dictionary=_target_selected()
 var opponent: String=str(focus.get("name","—"))
 var hp: int=int(focus.get("hp",0))
 var reach:int=combat.distance(actor,focus) if not focus.is_empty() else -1
 combat_label.text="RODADA %d • %s [%s] | PV %d/%d | FADIGA %d | VONTADE %d\nALVO: %s • PV %d • DISTÂNCIA %d" % [
  combat.round_number,actor["name"],actor["role"],actor["hp"],actor["max_hp"],actor["fatigue"],actor["will"],opponent,hp,reach]
 var start: int=maxi(0,combat.logs.size()-2)
 battle_log_label.text="\n".join(PackedStringArray(combat.logs.slice(start)))
 target_button.text="ALVO: "+opponent.substr(0,10)
 var player_turn:bool=str(actor.get("side",""))=="ally"
 target_button.disabled=not player_turn
 end_button.disabled=not player_turn

func _target_selected() -> Dictionary:
 var enemies: Array[Dictionary]=combat.alive("enemy")
 if enemies.is_empty():return {}
 focus_target=posmod(focus_target,enemies.size())
 return enemies[focus_target]

func _next_target() -> void:
 if not in_battle:return
 focus_target+=1
 _refresh_battle_hud()

func _tap_battle(tile: Vector2i) -> void:
 var chosen:=Vector2i(tile.x+4,tile.y+3)
 for target in combat.alive("enemy"):
  if target["position"]==chosen:
   var enemies: Array[Dictionary]=combat.alive("enemy")
   focus_target=enemies.find(target)
   _refresh_battle_hud()
   return
 var actor: Dictionary=combat.current()
 if actor.is_empty() or str(actor["side"])!="ally":return
 if combat.move(str(actor["id"]),chosen):
  _notify("%s tomou posição." % actor["name"],2)
  world.queue_redraw()
  _refresh_battle_hud()

func _battle_action(kind: String,skill_id: String="") -> void:
 if not in_battle or not combat.active or paused or overlay.visible:return
 var actor: Dictionary=combat.current()
 if actor.is_empty() or str(actor["side"])!="ally":return
 var success:=false
 if kind=="move":
  var target: Dictionary=_target_selected()
  if target.is_empty():return
  var p: Vector2i=actor["position"]
  var q: Vector2i=target["position"]
  var max_steps: int=maxi(1,int(actor["move"])/2)
  for i in range(max_steps):
   var v: Vector2i=p
   if p.x!=q.x:v.x+=1 if p.x<q.x else -1
   elif p.y!=q.y:v.y+=1 if p.y<q.y else -1
   if not combat.walkable(v,str(actor["id"])) or v==q:break
   p=v
  success=combat.move(str(actor["id"]),p)
 elif kind=="attack":
  var target: Dictionary=_target_selected()
  if not target.is_empty():success=combat.do_action("attack",str(target["id"]))
 elif kind=="skill":
  var skill: Dictionary={}
  for entry in DATA.SKILLS.get(str(actor["role"]),[]):
   if str(entry["id"])==skill_id:skill=entry
  if skill.is_empty():return
  if str(skill["effect"])=="heal":
   var allies: Array[Dictionary]=combat.alive("ally")
   allies.sort_custom(func(a: Dictionary,b: Dictionary)->bool:
    return float(a["hp"])/maxf(1.0,float(a["max_hp"]))<float(b["hp"])/maxf(1.0,float(b["max_hp"])))
   if not allies.is_empty():
    success=combat.do_action("skill",str(allies[0]["id"]),skill_id)
  elif str(skill["effect"])=="guard":
   success=combat.do_action("skill","",skill_id)
  else:
   var selected: Dictionary=_target_selected()
   if not selected.is_empty():
    success=combat.do_action("skill",str(selected["id"]),skill_id)
 elif kind=="guard":
  success=combat.do_action("guard")
 elif kind=="potion":
  success=combat.do_action("potion")
 if not success:
  _notify("Ação inválida: confira movimento, alcance, recursos e turno.",3)
  return
 _sound("hit" if kind in ["attack","skill"] else "collect")
 combat.boss_rage()
 world.queue_redraw()
 _refresh_battle_hud()
 if not combat.active:
  _finish_battle()
  return
 if kind!="move":
  combat.next_turn()
  _drive_enemies()

func _pick_skill() -> void:
 if not in_battle or not combat.active or paused:return
 var actor: Dictionary=combat.current()
 if actor.is_empty() or str(actor["side"])!="ally":return
 _modal("TÉCNICAS DE "+str(actor["name"]).to_upper())
 var known:=0
 for skill in DATA.SKILLS.get(str(actor["role"]),[]):
  if not actor["skills"].has(str(skill["id"])):continue
  known+=1
  var btn:=_button(overlay_content,"%s • %d %s • %s" % [
   skill["name"],skill["cost"],str(skill["energy"]).to_upper(),skill["effect"]],
   Callable(self,"_execute_skill").bind(str(skill["id"])),Vector2(500,45))
  btn.disabled=not combat.can_skill(actor,str(skill["id"]))
 if known==0:_label(overlay_content,"Nenhuma técnica inicial foi adquirida.",17)

func _execute_skill(skill_id: String) -> void:
 _close_overlay()
 _battle_action("skill",skill_id)

func _end_turn() -> void:
 if not in_battle or not combat.active:return
 var actor: Dictionary=combat.current()
 if actor.is_empty() or str(actor["side"])!="ally":return
 combat.next_turn()
 _drive_enemies()

func _drive_enemies() -> void:
 var attempts:=0
 while combat.active and attempts<80:
  attempts+=1
  var actor: Dictionary=combat.current()
  if actor.is_empty() or str(actor.get("side",""))=="ally":break
  combat.enemy_turn()
  combat.boss_rage()
  if combat.active:combat.next_turn()
  else:break
 if not combat.active:
  _finish_battle()
 else:
  _refresh_battle_hud()
  world.queue_redraw()

func _finish_battle() -> void:
 if not in_battle:return
 var victory: bool=combat.result=="victory"
 var hero: Dictionary=combat.get_actor("hero")
 if not hero.is_empty():
  player["hp"]=maxi(1,int(hero["hp"]))
  player["fatigue"]=maxi(0,int(hero["fatigue"]))
  player["will"]=maxi(0,int(hero["will"]))
  inventory["Atadura"]=int(hero["potions"])
 for member in party:
  var ref: Dictionary=combat.get_actor("ally_"+str(member["id"]))
  if not ref.is_empty():
   member["hp"]=maxi(1,int(ref["hp"]))
 in_battle=false
 world.end_battle()
 exploration_bar.show()
 battle_bar.hide()
 combat_box.hide()
 camera.position=world.tile_to_world(Vector2(hero_pos))
 if victory:
  defeated[current_battle_id]=true
  world.defeated=defeated
  xp+=int(combat.rewards.get("xp",0))
  krovs+=int(combat.rewards.get("gold",0))
  var num: int=0
  for foe in combat.actors:
   if str(foe["side"])!="enemy":continue
   num+=1
   var foe_name: String=str(foe["name"])
   kill_counts[foe_name]=int(kill_counts.get(foe_name,0))+1
   var reward_item: String="Presa de Incarna" if foe_name.begins_with("Incarna") else ("Cinza Viva" if foe_name in ["Cultista","Mago Impuro"] else "Ferro Antigo")
   inventory[reward_item]=int(inventory.get(reward_item,0))+1
  if main_stage>0:
   inventory["Fragmento Astral"]=int(inventory.get("Fragmento Astral",0))+num
  if current_battle_id=="cripta_boss":
   inventory["Chave Velada"]=int(inventory.get("Chave Velada",0))+1
   inventory["Machado da Cripta"]=int(inventory.get("Machado da Cripta",0))+1
   main_stage=maxi(main_stage,2)
   codex_seen["ruturam"]=true
   _notify("GUARDIÃO CAIU: Chave Velada e Machado da Cripta adquiridos. O Limiar aguarda!",7)
  elif current_battle_id=="ruturam_boss":
   main_stage=3
   _notify("O ARAUTO CAIU. A Voz do Abismo agora pode ser confrontada.",6)
  else:
   _notify("VITÓRIA • %d XP, %d Krovs e saques recolhidos." % [combat.rewards["xp"],combat.rewards["gold"]],5)
  _check_level()
  _sound("victory")
 else:
  krovs=maxi(0,krovs-12)
  player["hp"]=int(player["max_hp"])
  player["fatigue"]=int(player["f"])+int(player["v"])
  player["will"]=int(player["m"])+int(player["h"])
  for member in party:member["hp"]=int(DATA.COMPANIONS.get(str(member["id"]),{}).get("hp",17))
  _enter_region("vigilia",Vector2i(18,19))
  _notify("Seu grupo perdeu. Sobreviventes o trouxeram à Vigília; 12 Krovs ficaram nas ruínas.",7)
  _sound("hurt")
 world.queue_redraw()
 _update_hud()
 _save()
