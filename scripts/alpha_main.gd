extends "res://scripts/main.gd"
## Alpha 0.1.0 - camada jogavel modular sobre o cenario 3D anterior.
## Conteudo original digital; referencias a Tenebria sao identificadas em docs/rules_matrix.md.
const CATALOG = preload("res://scripts/rules/catalog.gd")
const COMBAT = preload("res://scripts/systems/turn_combat.gd")

var combat = COMBAT.new()
var combat_active := false
var battle_nodes: Dictionary = {}
var battle_anchor := Vector3.ZERO
var chosen_attributes := {"f":2,"h":2,"v":2,"m":2}
var chosen_qualities := ["Corajoso","Item Herdado"]
var chosen_name := "Viajante"
var chosen_presentation := "Masculina"
var char_name_edit: LineEdit
var race_picker: OptionButton
var class_picker: OptionButton
var quality_pickers: Array[OptionButton] = []
var attribute_labels: Dictionary = {}
var creator_layer: ColorRect
var creator_info: Label
var combat_layer: PanelContainer
var combat_info: Label
var combat_feed: Label
var target_button: Button
var end_turn_button: Button
var target_index := 0
var menu_panel: PanelContainer
var menu_content: VBoxContainer
var selected_tab := "Inventário"
var inventory := {"Atadura":3,"Erva cinzenta":0,"Fragmento Astral":0}
var equipment := {"weapon":"Espada gasta","armor":"Gibão de couro","shield":""}
var xp := 0
var level := 1
var krovs := 14
var reputation := 0
var quest_flags := {"herbs":0,"herbs_done":false,"relic_done":false,"refugee_done":false,"dungeon_done":false,"choice":""}
var companion_joined := false
var companion_visual: TenebriaHero
var extra_npcs: Dictionary = {}
var extra_objects: Dictionary = {}
var dungeon_built := false
var defeated_enemy_keys: Array[String] = []
var used_world_objects: Array[String] = []
var quality_profile: Array[String] = ["Corajoso","Item Herdado"]
var sector_name := "Vigília das Cinzas"
var log_expanded := false

func _ready() -> void:
    super._ready()
    Engine.max_fps = 30
    combat.event_logged.connect(_on_combat_log)
    _build_creator()
    _build_combat_hud()
    _build_character_panels()
    _build_extra_world()
    _add_menu_options()
    _refresh_stats_overlay()

func _physics_process(delta: float) -> void:
    if combat_active:
        if hero != null:
            hero.movement = Vector2.ZERO
        _camera_follow(delta)
        return
    super._physics_process(delta)

func _process(delta: float) -> void:
    super._process(delta)
    if not playing or hero == null or paused_by_user:
        return
    if not combat_active:
        if companion_joined and is_instance_valid(companion_visual):
            var desired: Vector3 = hero.global_position + Vector3(1.3,0,1.5)
            companion_visual.position = companion_visual.position.lerp(desired,minf(1.0,delta*2.4))
        if phase >= 1:
            for foe in foes:
                if is_instance_valid(foe) and foe.live and hero.position.distance_to(foe.position) < 6.5:
                    _begin_battle(foe)
                    break
    if combat_active:
        _refresh_combat_hud()

func _unhandled_input(event: InputEvent) -> void:
    if combat_active:
        if event.is_action_pressed("pause_game"):
            _pause()
            get_viewport().set_input_as_handled()
        return
    super._unhandled_input(event)

func _spawn_foe(place: Vector3,is_boss: bool) -> void:
    var key: String="%d_%d_%d" % [int(place.x),int(place.z),1 if is_boss else 0]
    if key in defeated_enemy_keys:
        return
    super._spawn_foe(place,is_boss)
    if not foes.is_empty() and is_instance_valid(foes[-1]):
        foes[-1].set_physics_process(false)
        foes[-1].set_meta("spawn_id",key)

func _on_enemy_eliminated(enemy: TenebriaFoe) -> void:
    var key: String=str(enemy.get_meta("spawn_id",""))
    if not key.is_empty() and not key in defeated_enemy_keys:
        defeated_enemy_keys.append(key)
    inventory["Fragmento Astral"]=int(inventory.get("Fragmento Astral",0))+1
    super._on_enemy_eliminated(enemy)

func _start_new() -> void:
    creator_layer.show()
    _creator_message()

func _show_start_screen() -> void:
    super._show_start_screen()
    if creator_layer != null:
        creator_layer.hide()
    if combat_layer != null:
        combat_layer.hide()
    if menu_panel != null:
        menu_panel.hide()
    combat_active = false

func _resume() -> void:
    super._resume()
    _load_alpha_state()

func _begin(role: String,race: String,from_save: bool) -> void:
    if from_save:
        var previous:=ConfigFile.new()
        if previous.load(SAVE_FILE)==OK:
            defeated_enemy_keys.clear()
            var gone: Array=previous.get_value("alpha","defeated_enemies",[])
            for key in gone:
                defeated_enemy_keys.append(str(key))
    else:
        defeated_enemy_keys.clear()
        used_world_objects.clear()
        for key in extra_objects:
            extra_objects[key]["used"]=false
            extra_objects[key]["node"].show()
    super._begin(role,race,from_save)
    hero.set_physics_process(true)
    if not from_save:
        inventory = {"Atadura":3,"Erva cinzenta":0,"Fragmento Astral":0}
        equipment = CATALOG.default_equipment(role)
        for piece in equipment.values():
            if not str(piece).is_empty():
                inventory[str(piece)] = 1
        xp = 0
        level = 1
        krovs = 14
        reputation = 0
        quest_flags = {"herbs":0,"herbs_done":false,"relic_done":false,"refugee_done":false,"dungeon_done":false,"choice":""}
        companion_joined = false
    _apply_player_configuration()
    if creator_layer != null:
        creator_layer.hide()
    _refresh_stats_overlay()

func _apply_player_configuration() -> void:
    if hero == null:
        return
    if CATALOG.valid_attributes(hero.race_name,chosen_attributes):
        hero.attrs = chosen_attributes.duplicate(true)
    var attrs: Dictionary = hero.attrs
    # Bonus racial fixo do Anao, descrito no livro.
    if hero.race_name == "Anão":
        attrs["v"] = mini(int(CATALOG.RACES["Anão"]["cap"][2]),int(attrs["v"])+1)
    var derived: Dictionary = CATALOG.starting_stats(attrs,hero.race_name,quality_profile)
    hero.max_hp = int(derived["hp"])+maxi(0,level-1)*(int(attrs["f"])+2)
    hero.max_fatigue = int(derived["fatigue"])
    hero.max_willpower = int(derived["will"])
    hero.hp = mini(hero.max_hp,maxi(1,hero.hp))
    hero.fatigue = mini(hero.max_fatigue,maxi(0,hero.fatigue))
    hero.willpower = mini(hero.max_willpower,maxi(0,hero.willpower))
    hero.speed = maxf(4.7,float(derived["move"])*0.76)
    _customize_elf()

func _customize_elf() -> void:
    if hero == null or hero.body_visual == null or hero.race_name != "Elfo":
        return
    hero.body_visual.scale = Vector3(0.86,1.14,0.85)
    var skin := StandardMaterial3D.new()
    skin.albedo_color = Color("b9bec7")
    for side in [-1,1]:
        var ear := CylinderMesh.new()
        ear.bottom_radius = 0.16
        ear.top_radius = 0.0
        ear.height = 0.6
        ear.radial_segments = 4
        var mesh := MeshInstance3D.new()
        mesh.mesh = ear
        mesh.material_override = skin
        mesh.position = Vector3(side*0.31,1.82,0)
        mesh.rotation_degrees.z = 66.0*side
        hero.body_visual.add_child(mesh)

func _build_creator() -> void:
    creator_layer = ColorRect.new()
    creator_layer.color = Color(0.035,0.037,0.06,0.98)
    creator_layer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    ui.add_child(creator_layer)
    var scroller := ScrollContainer.new()
    scroller.anchor_left = 0.16
    scroller.anchor_right = 0.84
    scroller.anchor_top = 0.04
    scroller.anchor_bottom = 0.96
    creator_layer.add_child(scroller)
    var column := VBoxContainer.new()
    column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    column.add_theme_constant_override("separation",9)
    scroller.add_child(column)
    var ttl: Label = _label(column,"FORJAR DESTINO  •  TENEBRIA",34,Color("e8c48f"))
    ttl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    _label(column,"27 raças e 27 classes catalogadas • opções cinzas ainda não jogáveis",14,Color("b6acac"))
    char_name_edit = LineEdit.new()
    char_name_edit.placeholder_text = "Nome do aventureiro"
    char_name_edit.text = chosen_name
    char_name_edit.custom_minimum_size.y = 48
    column.add_child(char_name_edit)
    var form_row := HBoxContainer.new()
    column.add_child(form_row)
    var race_column := VBoxContainer.new()
    race_column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    form_row.add_child(race_column)
    _label(race_column,"RAÇA",18,Color("c7b191"))
    race_picker = OptionButton.new()
    race_column.add_child(race_picker)
    var classes_column := VBoxContainer.new()
    classes_column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    form_row.add_child(classes_column)
    _label(classes_column,"CLASSE",18,Color("c7b191"))
    class_picker = OptionButton.new()
    classes_column.add_child(class_picker)
    var all_races: Array = CATALOG.RACES.keys()
    all_races.sort()
    for value in all_races:
        race_picker.add_item(str(value))
        var index := race_picker.item_count-1
        race_picker.set_item_disabled(index,not str(value) in CATALOG.PLAYABLE_RACES)
        if str(value)=="Humano":
            race_picker.select(index)
    for value in CATALOG.CLASSES:
        class_picker.add_item(str(value))
        var index := class_picker.item_count-1
        class_picker.set_item_disabled(index,not str(value) in CATALOG.PLAYABLE_CLASSES)
        if str(value) == "Guerreiro":
            class_picker.select(index)
    race_picker.item_selected.connect(func(_i: int) -> void: _creator_message())
    class_picker.item_selected.connect(func(_i: int) -> void: _creator_message())
    _label(column,"APRESENTAÇÃO",16,Color("c7b191"))
    var appearance := OptionButton.new()
    appearance.add_item("Masculina")
    appearance.add_item("Feminina")
    appearance.item_selected.connect(func(i: int) -> void: chosen_presentation = appearance.get_item_text(i))
    column.add_child(appearance)
    _label(column,"ATRIBUTOS • DISTRIBUA EXATAMENTE OITO PONTOS",18,Color("c7b191"))
    for key in ["f","h","v","m"]:
        var row := HBoxContainer.new()
        column.add_child(row)
        var label_name: String = str({"f":"Físico","h":"Habilidade","v":"Vigor","m":"Mental"}[key])
        var name_lbl := _label(row,label_name,18,Color("ece2cf"))
        name_lbl.custom_minimum_size.x = 200
        var minus := Button.new()
        minus.text = "−"
        minus.custom_minimum_size = Vector2(60,44)
        row.add_child(minus)
        var value_lbl := _label(row,"2",22,Color("f9d7a1"))
        value_lbl.custom_minimum_size.x = 66
        value_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
        attribute_labels[key] = value_lbl
        var plus := Button.new()
        plus.text = "+"
        plus.custom_minimum_size = Vector2(60,44)
        row.add_child(plus)
        minus.pressed.connect(_change_attr.bind(key,-1))
        plus.pressed.connect(_change_attr.bind(key,1))
    _label(column,"QUALIDADES INICIAIS • ESCOLHA DUAS",17,Color("c7b191"))
    for i in range(2):
        var selector := OptionButton.new()
        var options: Array = CATALOG.QUALITIES.keys()
        options.sort()
        for entry in options:
            selector.add_item(str(entry))
        selector.select(options.find(chosen_qualities[i]))
        column.add_child(selector)
        quality_pickers.append(selector)
    creator_info = _label(column,"",16,Color("ded3c5"))
    creator_info.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
    creator_info.custom_minimum_size.y = 62
    var begin_button := _button(column,"COMEÇAR O PRÓLOGO",Vector2.ZERO,Vector2(400,56),Callable(self,"_confirm_character"),20)
    begin_button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    _button(column,"VOLTAR AO MENU",Vector2.ZERO,Vector2(400,48),func() -> void: creator_layer.hide(),17).size_flags_horizontal = Control.SIZE_EXPAND_FILL
    creator_layer.hide()

func _change_attr(key: String,shift: int) -> void:
    var race := race_picker.get_item_text(race_picker.selected)
    var keys := ["f","h","v","m"]
    var max_value: int = int(CATALOG.RACES[race]["cap"][keys.find(key)])
    var current: int = int(chosen_attributes[key])
    var sum_total: int = int(chosen_attributes["f"])+int(chosen_attributes["h"])+int(chosen_attributes["v"])+int(chosen_attributes["m"])
    if current+shift < 1 or current+shift > max_value or sum_total+shift > 8:
        return
    chosen_attributes[key] = current+shift
    _creator_message()

func _creator_message() -> void:
    if creator_info == null:
        return
    var race: String = race_picker.get_item_text(race_picker.selected)
    var role: String = class_picker.get_item_text(class_picker.selected)
    var spent := 0
    for key in ["f","h","v","m"]:
        spent += int(chosen_attributes[key])
        var value_lbl: Label = attribute_labels[key]
        value_lbl.text = str(chosen_attributes[key])
    var caps: Array = CATALOG.RACES[race]["cap"]
    creator_info.text = "Raça: %s | Movimento: %dm/turno | Limites F%d H%d V%d M%d\nClasse: %s | %s | Restantes: %d" % [
        race,int(CATALOG.RACES[race]["move"]),caps[0],caps[1],caps[2],caps[3],role,str(CATALOG.ABILITIES.get(role,{}).get("name","Em preparo")),8-spent
    ]

func _confirm_character() -> void:
    var race: String = race_picker.get_item_text(race_picker.selected)
    var role: String = class_picker.get_item_text(class_picker.selected)
    if not race in CATALOG.PLAYABLE_RACES or not role in CATALOG.PLAYABLE_CLASSES:
        creator_info.text = "Essa combinação ainda não possui implementação funcional."
        return
    if not CATALOG.valid_attributes(race,chosen_attributes):
        creator_info.text = "Distribua 8 pontos, nenhum atributo zero, respeitando os limites raciais."
        return
    var qualities: Array[String] = []
    for picker in quality_pickers:
        qualities.append(picker.get_item_text(picker.selected))
    if qualities[0] == qualities[1]:
        creator_info.text = "Escolha duas qualidades diferentes."
        return
    quality_profile = qualities
    chosen_name = char_name_edit.text.strip_edges().substr(0,24)
    if chosen_name.is_empty():
        chosen_name = "Viajante"
    _begin(role,race,false)
    hero.hp = hero.max_hp
    hero.fatigue = hero.max_fatigue
    hero.willpower = hero.max_willpower
    _save_game()
    _notice("Hasam aguarda. Sua historia comeca agora.",4.0)

func _build_extra_world() -> void:
    _spawn_extra_npc("Maera, a Exilada",Vector3(-10,0,8),Color("6a6577"))
    _spawn_extra_npc("Oswin, Comerciante",Vector3(10,0,7),Color("8b6f50"))
    _spawn_extra_npc("Peregrina ferida",Vector3(-25,0,18),Color("655065"))
    _spawn_extra_npc("Sentinela",Vector3(12,0,1),Color("536b67"))
    _make_pickup("Erva I",Vector3(-13,0,17),"herb")
    _make_pickup("Erva II",Vector3(-20,0,22),"herb")
    _make_pickup("Erva III",Vector3(-25,0,29),"herb")
    _make_pickup("Baú esquecido",Vector3(18,0,-10),"chest")
    _make_pickup("Entrada da Cripta",Vector3(25,0,-21),"dungeon")
    _make_pickup("Inscrição Astral",Vector3(24,0,-28),"rune")
    _build_dungeon()

func _spawn_extra_npc(label: String,point: Vector3,tint: Color) -> void:
    var root := Node3D.new()
    root.position = point
    add_child(root)
    _cylinder(root,Vector3(0,0.75,0),0.35,1.45,_material(tint.to_html(false)),0.23)
    _ball(root,Vector3(0,1.62,0),0.25,_material("b8a38d"))
    var title := Label3D.new()
    title.text = label
    title.position.y = 2.15
    title.font_size = 27
    title.pixel_size = 0.008
    title.modulate = Color("e5c38b")
    title.billboard = BaseMaterial3D.BILLBOARD_ENABLED
    root.add_child(title)
    extra_npcs[label] = root

func _make_pickup(label: String,point: Vector3,kind: String) -> void:
    var root := Node3D.new()
    root.position = point
    add_child(root)
    var color_code := "638662" if kind=="herb" else ("ba9a66" if kind=="chest" else "a25c80")
    _box(root,Vector3(0,0.35,0),Vector3(0.7,0.6,0.7),_material(color_code,true))
    var title := Label3D.new()
    title.text = label
    title.position.y = 1.4
    title.billboard = BaseMaterial3D.BILLBOARD_ENABLED
    title.font_size = 28
    title.pixel_size = 0.0075
    root.add_child(title)
    extra_objects[label] = {"node":root,"kind":kind,"used":false}

func _build_dungeon() -> void:
    if dungeon_built:
        return
    dungeon_built = true
    var stone := _material("454754")
    _box(self,Vector3(25,0.2,-27),Vector3(17,0.3,16),_material("464650"))
    for x in [17.0,33.0]:
        _box(self,Vector3(x,1.3,-27),Vector3(0.9,2.6,16),stone,true)
    _box(self,Vector3(25,1.3,-35),Vector3(17,2.6,0.9),stone,true)
    for x in [19.0,25.0,31.0]:
        _cylinder(self,Vector3(x,1.6,-33),0.43,3.2,_material("66616a"),0.40)
    _box(self,Vector3(21,0.4,-26),Vector3(2,0.8,1.3),_material("625660"))
    _box(self,Vector3(29,0.4,-29),Vector3(2,0.8,1.3),_material("625660"))
    var glyph := _ball(self,Vector3(25,1.6,-30),0.7,_material("8c3f7b",true))
    glyph.scale = Vector3(0.8,1.7,0.8)
    _make_pickup("Sarcófago antigo",Vector3(29,0,-31),"chest")

func _add_menu_options() -> void:
    var start_panel: Node = title_layer.find_child("Resume",true,false)
    if start_panel != null:
        var parent: Node = start_panel.get_parent()
        _button(parent,"CONFIGURAÇÕES",Vector2.ZERO,Vector2(340,43),func() -> void: _open_menu("Configurações"),16)
        _button(parent,"CRÉDITOS",Vector2.ZERO,Vector2(340,43),func() -> void: _open_menu("Créditos"),16)
    var p := _button(ui,"PERSONAGEM / BOLSA",Vector2.ZERO,Vector2(235,42),func() -> void: _open_menu("Inventário"),14)
    p.anchor_left=0.5
    p.anchor_right=0.5
    p.offset_left=-110
    p.offset_right=125
    p.offset_top=108
    p.offset_bottom=150

func _build_character_panels() -> void:
    menu_panel = PanelContainer.new()
    menu_panel.anchor_left=0.10
    menu_panel.anchor_right=0.90
    menu_panel.anchor_top=0.15
    menu_panel.anchor_bottom=0.93
    ui.add_child(menu_panel)
    var wrap := VBoxContainer.new()
    menu_panel.add_child(wrap)
    var tabs := HBoxContainer.new()
    wrap.add_child(tabs)
    for label in ["Inventário","Personagem","Diário","Configurações","Créditos"]:
        _button(tabs,label,Vector2.ZERO,Vector2(145,42),_open_menu.bind(label),15)
    _button(tabs,"FECHAR",Vector2.ZERO,Vector2(120,42),func() -> void: menu_panel.hide(),15)
    var scroll := ScrollContainer.new()
    scroll.size_flags_vertical=Control.SIZE_EXPAND_FILL
    wrap.add_child(scroll)
    menu_content=VBoxContainer.new()
    menu_content.size_flags_horizontal=Control.SIZE_EXPAND_FILL
    scroll.add_child(menu_content)
    menu_panel.hide()

func _open_menu(tab: String) -> void:
    selected_tab=tab
    for child in menu_content.get_children():
        child.queue_free()
    menu_panel.show()
    _label(menu_content,tab.to_upper(),26,Color("e5c28e"))
    match tab:
        "Inventário":
            _label(menu_content,"Krovs: %d | Itens realmente equipáveis alteram as estatísticas de combate." % krovs,15,Color("ded4c1"))
            for slot in ["weapon","armor","shield"]:
                _label(menu_content,"%s: %s" % [slot.to_upper(),str(equipment.get(slot,"(vazio)"))],18,Color("e1cfb7"))
            var choices: Array = inventory.keys()
            choices.sort()
            for item in choices:
                if int(inventory[item]) > 0:
                    var row:=HBoxContainer.new()
                    menu_content.add_child(row)
                    _label(row,"%s  x%d" % [item,int(inventory[item])],17,Color("eee0c8"))
                    if item=="Atadura":
                        _button(row,"USAR",Vector2.ZERO,Vector2(100,36),func() -> void: _use_bandage(),14)
            for name in ["Espada gasta","Machado de ferro","Bastão de freixo","Arco de teixo","Gibão de couro","Cota de malha","Escudo de madeira"]:
                if int(inventory.get(name,0)) > 0:
                    var item: Dictionary = CATALOG.ITEMS[name]
                    _button(menu_content,"EQUIPAR %s [%s]" % [name,str(item["slot"])],Vector2.ZERO,Vector2(560,36),_equip.bind(name),14)
        "Personagem":
            _label(menu_content,"%s | %s | %s | Nível %d | XP %d/10" % [chosen_name,hero.race_name if hero != null else "—",hero.role_name if hero != null else "—",level,xp],17,Color("ded4c1"))
            if hero != null:
                _label(menu_content,"F %d • H %d • V %d • M %d | Defesa %d" % [hero.attrs["f"],hero.attrs["h"],hero.attrs["v"],hero.attrs["m"],10+int(hero.attrs["v"])+CATALOG.equipment_defense(equipment)],17,Color("e1cfb7"))
            _label(menu_content,"Qualidades: "+", ".join(PackedStringArray(quality_profile)),16,Color("ded4c1"))
            _label(menu_content,"Companheira Maera: %s" % ("recrutada" if companion_joined else "não recrutada"),16,Color("ded4c1"))
        "Diário":
            _label(menu_content,_quest_text(),19,Color("e4c799"))
            _label(menu_content,"Ervas da Vigília: %d/3 (%s)" % [int(quest_flags["herbs"]),"concluída" if quest_flags["herbs_done"] else "aberta"],17,Color("ded4c1"))
            _label(menu_content,"A Peregrina: %s" % ("ajudada" if quest_flags["refugee_done"] else "precisa de socorro"),17,Color("ded4c1"))
            _label(menu_content,"Segredo da Cripta: %s" % ("revelado" if quest_flags["dungeon_done"] else "não descoberto"),17,Color("ded4c1"))
            _label(menu_content,"Decisão: %s | Reputação: %d" % [str(quest_flags["choice"]),reputation],17,Color("ded4c1"))
        "Configurações":
            _label(menu_content,"Limite de quadros (requer teste real no Motorola)",15,Color("ded4c1"))
            _button(menu_content,"MODO ECONOMIA • 30 FPS",Vector2.ZERO,Vector2(450,44),func() -> void: Engine.max_fps=30,16)
            _button(menu_content,"MODO 60 FPS (EXPERIMENTAL)",Vector2.ZERO,Vector2(450,44),func() -> void: Engine.max_fps=60,16)
            _button(menu_content,"SOM AMBIENTE LIGAR / DESLIGAR",Vector2.ZERO,Vector2(450,44),func() -> void: ambient_player.stream_paused=not ambient_player.stream_paused,16)
        "Créditos":
            _label(menu_content,"Adaptação digital experimental do universo TENEBRIA REVISADO 3.0.",18,Color("ded4c1"))
            _label(menu_content,"Código e assets procedurais originais. Livro e ilustrações pertencem aos respectivos titulares.",16,Color("ded4c1"))

func _equip(item_name: String) -> void:
    var data: Dictionary = CATALOG.ITEMS.get(item_name,{})
    if data.is_empty():
        return
    if int(inventory.get(item_name,0)) <= 0:
        _notice("Item não adquirido: "+item_name)
        return
    var slot: String = str(data["slot"])
    equipment[slot]=item_name
    _notice("Equipado: "+item_name)
    _open_menu("Inventário")
    _save_game()

func _use_bandage() -> void:
    if combat_active or hero == null or int(inventory.get("Atadura",0)) <= 0 or hero.hp >= hero.max_hp:
        _notice("Atadura indisponível.")
        return
    inventory["Atadura"]=int(inventory["Atadura"])-1
    hero.hp=mini(hero.max_hp,hero.hp+rng.randi_range(1,4))
    _sfx("heal")
    _open_menu("Inventário")
    _save_game()

func _build_combat_hud() -> void:
    combat_layer=PanelContainer.new()
    combat_layer.anchor_left=0.17
    combat_layer.anchor_right=0.83
    combat_layer.anchor_top=0.22
    combat_layer.anchor_bottom=0.54
    ui.add_child(combat_layer)
    var box:=VBoxContainer.new()
    combat_layer.add_child(box)
    combat_info=_label(box,"",19,Color("f2d9ad"))
    combat_info.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
    target_button=_button(box,"ALVO →",Vector2.ZERO,Vector2(260,41),Callable(self,"_cycle_target"),16)
    end_turn_button=_button(box,"ENCERRAR TURNO",Vector2.ZERO,Vector2(260,41),Callable(self,"_end_current_turn"),16)
    combat_feed=_label(box,"",14,Color("d5c1b8"))
    combat_feed.autowrap_mode=TextServer.AUTOWRAP_WORD_SMART
    combat_layer.hide()

func _begin_battle(foe: TenebriaFoe) -> void:
    if combat_active or not is_instance_valid(foe):
        return
    combat_active=true
    hero.movement=Vector2.ZERO
    hero.set_physics_process(false)
    joystick.hide()
    combat_layer.show()
    menu_panel.hide()
    battle_anchor=hero.position
    var derived: Dictionary=CATALOG.starting_stats(hero.attrs,hero.race_name,quality_profile)
    var item: Dictionary=CATALOG.ITEMS.get(str(equipment.get("weapon","")),{})
    var player_actor: Dictionary={"id":"hero","name":chosen_name,"role":hero.role_name,
        "hp":hero.hp,"f":hero.attrs["f"],"h":hero.attrs["h"],"v":hero.attrs["v"],"m":hero.attrs["m"],
        "move":int(derived["move"]),"fatigue":hero.fatigue,"will":hero.willpower,
        "equipment_defense":CATALOG.equipment_defense(equipment),"weapon_die":int(item.get("die",6)),
        "weapon_bonus":int(item.get("bonus",0))+(1 if "Item Herdado" in quality_profile else 0),
        "weapon":str(equipment.get("weapon","")),"potions":int(inventory.get("Atadura",0))}
    var allies: Array[Dictionary]=[player_actor]
    battle_nodes={"hero":hero}
    if companion_joined and is_instance_valid(companion_visual):
        allies.append({"id":"maera","name":"Maera","role":"Mago","hp":16,"f":1,"h":2,"v":2,"m":3,
            "move":9,"fatigue":3,"will":7,"equipment_defense":1,"weapon_die":4,
            "weapon_bonus":0,"weapon":"Bastão de freixo","potions":1})
        battle_nodes["maera"]=companion_visual
    var enemy_group: Array[Dictionary]=[]
    var enemy_count:=0
    for enemy in foes:
        if not is_instance_valid(enemy) or not enemy.live:
            continue
        if enemy.position.distance_to(foe.position)>8.0 and enemy!=foe:
            continue
        var kind: String = "Guardião" if enemy.boss else ["Errante","Portador do Ferrão","Corrompido","Arauto"][enemy_count%4]
        var template: Dictionary = CATALOG.ENEMIES[kind]
        var ident: String = "foe_%d" % enemy.get_instance_id()
        var copy: Dictionary = {"id":ident,"name":kind,"role":kind,"hp":int(template["hp"]),
            "f":int(template["f"]),"h":int(template["h"]),"v":int(template["v"]),"m":int(template["m"]),
            "move":int(template["move"]),"fatigue":4,"will":4,"equipment_defense":int(template["armor"]),
            "weapon_die":int(template["attack"]),"weapon_bonus":0,
            "weapon":"Arco de teixo" if kind=="Arauto" else "Espada gasta"}
        enemy_group.append(copy)
        battle_nodes[ident]=enemy
        if enemy.body_mesh != null:
            enemy.body_mesh.scale=Vector3.ONE*(1.23 if kind=="Portador do Ferrão" else (0.87 if kind=="Arauto" else 1.0))
        if enemy.label3d != null:
            enemy.label3d.text=kind.to_upper()
        enemy_count+=1
        if enemy_count>=3:
            break
    if enemy_group.is_empty():
        combat_active=false
        hero.set_physics_process(true)
        joystick.show()
        combat_layer.hide()
        return
    combat.start(allies,enemy_group)
    target_index=0
    _position_tactical_models()
    _sfx("swing")
    _notice("Encontro iniciado: iniciativa determinada por D20!",3)
    _update_battle_buttons()
    _drive_enemy_turns()

func _position_tactical_models() -> void:
    for actor in combat.actors:
        var node: Node3D = battle_nodes.get(str(actor["id"]),null)
        if is_instance_valid(node):
            var grid: Vector2i=actor["position"]
            node.position=battle_anchor+Vector3((grid.x-1.8)*1.6,0,(grid.y-1.0)*1.6)

func _update_battle_buttons() -> void:
    for child in ui.get_children():
        if child is Button:
            var bt: Button=child
            if bt.text=="ESQUIVA" or bt.text=="MOVER":
                bt.text="MOVER" if combat_active else "ESQUIVA"
            elif bt.text=="AÇÃO" or bt.text=="DEFENDER":
                bt.text="DEFENDER" if combat_active else "AÇÃO"
            elif bt.text=="CURAR" or bt.text=="ATADURA":
                bt.text="ATADURA" if combat_active else "CURAR"

func _selected_target() -> Dictionary:
    var pool: Array[Dictionary] = combat.targets("enemy")
    if pool.is_empty():
        return {}
    target_index=posmod(target_index,pool.size())
    return pool[target_index]

func _cycle_target() -> void:
    target_index+=1
    _refresh_combat_hud()

func _refresh_combat_hud() -> void:
    if not combat_active:
        return
    var actor: Dictionary=combat.current()
    if actor.is_empty():
        return
    var target: Dictionary=_selected_target()
    combat_info.text="RODADA %d • TURNO: %s (%s)\nPV %d/%d • FADIGA %d • VONTADE %d • DEFESA %d\nALVO: %s | PV %d | DISTÂNCIA TÁTICA %d" % [
        combat.round_number,str(actor["name"]),str(actor["role"]),int(actor["hp"]),int(actor["max_hp"]),
        int(actor["fatigue"]),int(actor["will"]),combat.defense(actor),
        str(target.get("name","—")),int(target.get("hp",0)),_grid_distance(actor,target)]
    target_button.text="ALVO → "+str(target.get("name","Nenhum"))
    combat_feed.text="\n".join(PackedStringArray(combat.log_lines.slice(maxi(0,combat.log_lines.size()-3))))
    var allies_turn: bool=str(actor.get("side",""))=="ally"
    target_button.disabled=not allies_turn
    end_turn_button.disabled=not allies_turn

func _grid_distance(a: Dictionary,b: Dictionary) -> int:
    if a.is_empty() or b.is_empty():
        return -1
    var pa: Vector2i=a["position"]
    var pb: Vector2i=b["position"]
    return absi(pa.x-pb.x)+absi(pa.y-pb.y)

func _attack() -> void:
    if combat_active:
        _battle_action("attack")
    elif playing:
        _notice("Exploração: aproxime-se de um inimigo para iniciar o combate por turnos.")

func _skill() -> void:
    if combat_active:
        _battle_action("skill")
    elif playing:
        _notice("Habilidades de combate só são usadas durante seu turno.")

func _dash() -> void:
    if combat_active:
        _battle_action("move")
    else:
        super._dash()

func _heal() -> void:
    if combat_active:
        _battle_action("potion")
    else:
        _use_bandage()

func _battle_action(mode: String) -> void:
    if not combat_active or paused_by_user or not combat.running:
        return
    var actor: Dictionary=combat.current()
    if str(actor.get("side",""))!="ally":
        return
    var target: Dictionary=_selected_target()
    if mode=="move":
        if target.is_empty():
            return
        var origin: Vector2i=actor["position"]
        var goal: Vector2i=target["position"]
        var next_pos:=origin
        var steps:=maxi(1,int(actor["speed"])/2)
        for _i in range(steps):
            var possible:=next_pos
            if possible.x!=goal.x:
                possible.x+=1 if possible.x<goal.x else -1
            elif possible.y!=goal.y:
                possible.y+=1 if possible.y<goal.y else -1
            if combat.occupied(possible,str(actor["id"])) or possible==goal:
                break
            next_pos=possible
        if not combat.move_to(next_pos):
            _notice("Movimento indisponível neste turno")
        else:
            _position_tactical_models()
        _refresh_combat_hud()
        return
    var target_id: String=str(target.get("id",""))
    if not combat.action(mode,target_id):
        _notice("Ação indisponível: alcance, recursos ou turno.")
        return
    _animate_attack(str(actor["id"]),target_id)
    if combat.running:
        combat.next_turn()
    _drive_enemy_turns()

func _animate_attack(source_id: String,target_id: String) -> void:
    var source: Node3D=battle_nodes.get(source_id,null)
    var target: Node3D=battle_nodes.get(target_id,null)
    if is_instance_valid(source):
        var original: Vector3=source.scale
        var tween:=create_tween()
        tween.tween_property(source,"scale",original*1.09,0.11)
        tween.tween_property(source,"scale",original,0.13)
    if is_instance_valid(target):
        var orig: Vector3=target.scale
        var impact:=create_tween()
        impact.tween_property(target,"scale",orig*0.88,0.09)
        impact.tween_property(target,"scale",orig,0.22)
    _sfx("hit")

func _end_current_turn() -> void:
    if not combat_active or not combat.running:
        return
    var actor: Dictionary=combat.current()
    if str(actor.get("side",""))!="ally":
        return
    combat.next_turn()
    _drive_enemy_turns()

func _drive_enemy_turns() -> void:
    var safety:=0
    while combat.running and safety<30:
        safety+=1
        var actor: Dictionary=combat.current()
        if actor.is_empty() or str(actor["side"])=="ally":
            break
        combat.enemy_step()
        _position_tactical_models()
        if combat.running:
            combat.next_turn()
    _refresh_combat_hud()
    if not combat.running:
        _conclude_battle()

func _on_combat_log(message: String) -> void:
    if combat_active:
        _refresh_combat_hud()

func _conclude_battle() -> void:
    var victory: bool=combat.result=="victory"
    var actor: Dictionary=combat.get_actor("hero")
    if not actor.is_empty():
        hero.hp=maxi(1,int(actor["hp"])) if victory else 1
        hero.fatigue=maxi(0,int(actor["fatigue"]))
        hero.willpower=maxi(0,int(actor["will"]))
        inventory["Atadura"]=int(actor.get("potions",0))
    combat_active=false
    combat_layer.hide()
    joystick.show()
    hero.set_physics_process(true)
    _update_battle_buttons()
    if victory:
        var xp_reward:=0
        for entry in combat.actors:
            if str(entry["side"])=="enemy" and int(entry["hp"])<=0:
                var model: Node3D=battle_nodes.get(str(entry["id"]),null)
                if is_instance_valid(model) and model is TenebriaFoe:
                    var foe: TenebriaFoe=model
                    xp_reward+=3 if foe.boss else 1
                    foe.take_damage(9999)
        _grant_xp(xp_reward)
        krovs+=5+xp_reward*2
        _notice("Vitória por turnos! +%d XP e Krovs encontrados." % xp_reward,4.5)
        _sfx("victory")
    else:
        hero.hp=hero.max_hp
        hero.position=Vector3(0,0,6)
        krovs=maxi(0,krovs-5)
        _notice("Seu grupo caiu. Regressou à Vigília, ferido e com menos Krovs.",4.5)
        _sfx("hurt")
    battle_nodes.clear()
    _save_game()

func _grant_xp(points: int) -> void:
    xp+=maxi(0,points)
    while xp>=10:
        xp-=10
        level+=1
        var before_hp:=hero.max_hp
        _apply_player_configuration()
        hero.hp+=maxi(0,hero.max_hp-before_hp)
        _notice("Você alcançou o nível %d!" % level,4)

func _interact() -> void:
    if combat_active:
        _battle_action("guard")
        return
    if not _can_act():
        return
    var pos: Vector3=hero.global_position
    var near_name: String=""
    var best_distance:=3.9
    for key in extra_npcs:
        var node: Node3D=extra_npcs[key]
        var dist: float=pos.distance_to(node.global_position)
        if dist<best_distance:
            near_name=str(key)
            best_distance=dist
    if not near_name.is_empty():
        match near_name:
            "Maera, a Exilada":
                if not companion_joined:
                    _recruit_maera()
                else:
                    _notice("MAERA: Ruturam sempre cobra seu preço.",4)
            "Oswin, Comerciante":
                if krovs>=3:
                    krovs-=3
                    inventory["Atadura"]=int(inventory.get("Atadura",0))+1
                    _notice("OSWIN: Uma atadura por 3 Krovs. Que os mortos esperem.")
                else:
                    _notice("OSWIN: Sem Krovs, nenhuma troca.")
            "Peregrina ferida":
                if not bool(quest_flags["refugee_done"]) and int(inventory.get("Atadura",0))>0:
                    inventory["Atadura"]=int(inventory["Atadura"])-1
                    quest_flags["refugee_done"]=true
                    reputation+=2
                    _grant_xp(1)
                    _notice("PEREGRINA: Você gastou uma atadura e salvou minha vida.",5)
                else:
                    _notice("PEREGRINA: Às vezes, sobreviver é uma maldição.",4)
            "Sentinela":
                if int(quest_flags["herbs"])>=3 and not bool(quest_flags["herbs_done"]):
                    quest_flags["herbs_done"]=true
                    inventory["Atadura"]=int(inventory.get("Atadura",0))+2
                    _grant_xp(1)
                    _notice("SENTINELA: Ervas entregues. Duas ataduras como pagamento.",5)
                else:
                    _notice("SENTINELA: Traga três ervas cinzentas da mata.")
        _save_game()
        return
    for key in extra_objects:
        var info: Dictionary=extra_objects[key]
        var object_node: Node3D=info["node"]
        if pos.distance_to(object_node.global_position)<3.4 and not bool(info["used"]):
            _use_world_object(str(key),info)
            _save_game()
            return
    if pos.distance_to(npc_pos)<4.1 and phase==0:
        _show_moral_dialogue()
        return
    super._interact()

func _recruit_maera() -> void:
    companion_joined=true
    companion_visual=HERO.new()
    companion_visual.position=extra_npcs["Maera, a Exilada"].position+Vector3(0,0,1)
    add_child(companion_visual)
    companion_visual.configure("Elfo","Mago")
    companion_visual.set_physics_process(false)
    extra_npcs["Maera, a Exilada"].hide()
    _notice("MAERA recrutada! Ela age sob seu comando nos turnos.",5)

func _use_world_object(key: String,info: Dictionary) -> void:
    match str(info["kind"]):
        "herb":
            inventory["Erva cinzenta"]=int(inventory.get("Erva cinzenta",0))+1
            quest_flags["herbs"]=int(quest_flags["herbs"])+1
            info["used"]=true
            info["node"].hide()
            _notice("Erva cinzenta coletada (%d/3)." % int(quest_flags["herbs"]))
        "chest":
            krovs+=8
            inventory["Atadura"]=int(inventory.get("Atadura",0))+1
            info["used"]=true
            info["node"].hide()
            _notice("Baú aberto: 8 Krovs e 1 atadura.")
        "dungeon":
            sector_name="Cripta de Ruturam"
            _notice("Cripta descoberta. Explore as inscrições ao fundo.",4)
        "rune":
            quest_flags["dungeon_done"]=true
            inventory["Fragmento Astral"]=int(inventory.get("Fragmento Astral",0))+1
            info["used"]=true
            info["node"].hide()
            _grant_xp(2)
            _notice("INSCRIÇÃO: O selo de Morcânia foi um pacto, não o fim da guerra.",6)

    if bool(info["used"]) and not key in used_world_objects:
        used_world_objects.append(key)

func _show_moral_dialogue() -> void:
    var dlg:=ConfirmationDialog.new()
    dlg.title="HASAM: A FERIDA DE OBSCURE"
    dlg.dialog_text="Os Incarnas surgiram nas ruínas. Há peregrinos presos no bosque.\nSalvar os civis arrisca perder os fragmentos Astral.\nO que você escolhe?"
    dlg.ok_button_text="PROTEGER CIVIS"
    dlg.add_button("PRIORIZAR ASTRAL",false,"astral")
    dlg.confirmed.connect(func() -> void: _resolve_moral_choice("civis"))
    dlg.custom_action.connect(func(action: StringName) -> void:
        _resolve_moral_choice(str(action))
        dlg.hide()
    )
    ui.add_child(dlg)
    dlg.popup_centered(Vector2i(680,310))

func _resolve_moral_choice(choice: String) -> void:
    if phase>0:
        return
    quest_flags["choice"]=choice
    phase=1
    if choice=="civis":
        reputation+=2
        inventory["Atadura"]=int(inventory.get("Atadura",0))+1
        _notice("Hasam confiará em você. Procure os sobreviventes e enfrente os Incarnas.",6)
    else:
        reputation-=1
        krovs+=12
        _notice("O Astral é prioridade. Hasam discorda, mas oferece 12 Krovs.",6)
    _save_game()

func _save_game() -> void:
    super._save_game()
    if hero==null:
        return
    var config:=ConfigFile.new()
    if config.load(SAVE_FILE)!=OK:
        return
    config.set_value("alpha","version",1)
    config.set_value("alpha","name",chosen_name)
    config.set_value("alpha","presentation",chosen_presentation)
    config.set_value("alpha","attributes",chosen_attributes)
    config.set_value("alpha","qualities",quality_profile)
    config.set_value("alpha","inventory",inventory)
    config.set_value("alpha","equipment",equipment)
    config.set_value("alpha","xp",xp)
    config.set_value("alpha","level",level)
    config.set_value("alpha","krovs",krovs)
    config.set_value("alpha","reputation",reputation)
    config.set_value("alpha","quests",quest_flags)
    config.set_value("alpha","companion",companion_joined)
    config.set_value("alpha","defeated_enemies",defeated_enemy_keys)
    config.set_value("alpha","used_objects",used_world_objects)
    var temp: String=SAVE_FILE+".tmp"
    if config.save(temp)==OK:
        DirAccess.rename_absolute(temp,SAVE_FILE)

func _load_alpha_state() -> void:
    var config:=ConfigFile.new()
    if config.load(SAVE_FILE)!=OK:
        return
    if int(config.get_value("alpha","version",0))!=1:
        return
    chosen_name=str(config.get_value("alpha","name","Viajante"))
    chosen_presentation=str(config.get_value("alpha","presentation","Masculina"))
    chosen_attributes=config.get_value("alpha","attributes",chosen_attributes)
    var stored_qualities: Array=config.get_value("alpha","qualities",quality_profile)
    quality_profile.clear()
    for q in stored_qualities:
        quality_profile.append(str(q))
    inventory=config.get_value("alpha","inventory",inventory)
    equipment=config.get_value("alpha","equipment",equipment)
    xp=int(config.get_value("alpha","xp",0))
    level=int(config.get_value("alpha","level",1))
    krovs=int(config.get_value("alpha","krovs",14))
    reputation=int(config.get_value("alpha","reputation",0))
    quest_flags=config.get_value("alpha","quests",quest_flags)
    companion_joined=bool(config.get_value("alpha","companion",false))
    used_world_objects.clear()
    var stored_used: Array=config.get_value("alpha","used_objects",[])
    for key in stored_used:
        used_world_objects.append(str(key))
    for key in used_world_objects:
        if extra_objects.has(key):
            extra_objects[key]["used"]=true
            extra_objects[key]["node"].hide()
    var hp:=hero.hp
    var fatigue:=hero.fatigue
    var will:=hero.willpower
    _apply_player_configuration()
    hero.hp=clampi(hp,1,hero.max_hp)
    hero.fatigue=clampi(fatigue,0,hero.max_fatigue)
    hero.willpower=clampi(will,0,hero.max_willpower)
    if companion_joined and not is_instance_valid(companion_visual):
        companion_joined=false
        _recruit_maera()
    _refresh_stats_overlay()

func _refresh_stats_overlay() -> void:
    if not is_instance_valid(stats_label):
        return
    if hero!=null:
        stats_label.text="%s • %s | %s | NV %d • %s" % [chosen_name,hero.race_name,hero.role_name,level,sector_name]

func _quest_text() -> String:
    var normal: String=super._quest_text()
    if phase>=4:
        return "ARCO I ENCERRADO • Obscure ainda guarda segredos."
    return normal
