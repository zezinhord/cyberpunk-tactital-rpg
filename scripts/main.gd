extends Node3D

# TENEBRIA: ECOS DE RUTURAM | Prototipo 3D mobile / Godot 4.4+
# Arte geometrica, enredo introdutorio e sons originais. Adaptacao simplificada de regras Nano-Dungeon.

const HERO = preload("res://scripts/hero.gd")
const FOE = preload("res://scripts/foe.gd")
const JOYSTICK = preload("res://scripts/joystick.gd")
const SAVE_FILE = "user://tenebria_eco_save.cfg"

var hero: TenebriaHero
var foes: Array[TenebriaFoe] = []
var cam: Camera3D
var cam_yaw: float = 0.0
var cam_tilt: float = -0.15
var npc_pos := Vector3(3.0,0.0,1.0)
var gate_pos := Vector3(0.0,0.0,-27.0)
var phase: int = 0
var kills: int = 0
var relics: int = 0
var boss_defeated: bool = false
var playing: bool = false
var paused_by_user: bool = false
var rng := RandomNumberGenerator.new()
var ui: Control
var joystick: TenebriaJoystick
var title_layer: ColorRect
var pause_layer: ColorRect
var hp_label: Label
var fatigue_label: Label
var quest_label: Label
var stats_label: Label
var notice_label: Label
var interact_button: Button
var heal_button: Button
var menu_class: OptionButton
var menu_race: OptionButton
var selected_role_name: String = "Espadachim Oriental"
var race_name: String = "Humano"
var notice_timer: float = 0.0
var autosave_timer: float = 0.0
var ambient_player: AudioStreamPlayer
var effect_player: AudioStreamPlayer
var portal_ring: Node3D
var boss_seen: bool = false

func _ready() -> void:
    rng.seed = 580049
    _create_world()
    _create_camera()
    _create_ui()
    _create_audio()
    _show_start_screen()

func _unhandled_input(event: InputEvent) -> void:
    if not playing or paused_by_user:
        return
    if event.is_action_pressed("pause_game"):
        _pause()
        get_viewport().set_input_as_handled()
    if event.is_action_pressed("attack"):
        _attack()
    if event.is_action_pressed("skill"):
        _skill()
    if event.is_action_pressed("dash"):
        _dash()
    if event.is_action_pressed("interact"):
        _interact()
    if event.is_action_pressed("heal"):
        _heal()
    if event is InputEventScreenDrag:
        if event.position.x > get_viewport().get_visible_rect().size.x * 0.43 and event.position.y < get_viewport().get_visible_rect().size.y * 0.77:
            cam_yaw -= event.relative.x * 0.004
            cam_tilt = clampf(cam_tilt + event.relative.y * 0.003,-0.40,0.45)
    if event is InputEventMouseMotion and Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT):
        cam_yaw -= event.relative.x * 0.005
        cam_tilt = clampf(cam_tilt + event.relative.y * 0.004,-0.40,0.45)

func _physics_process(delta: float) -> void:
    if not playing or paused_by_user or hero == null:
        return
    var input_axis = Vector2(Input.get_axis("move_left","move_right"),Input.get_axis("move_forward","move_backward"))
    if joystick != null and joystick.vector.length() > input_axis.length():
        input_axis = joystick.vector
    if input_axis.length() > 1.0:
        input_axis = input_axis.normalized()
    var right = cam.global_basis.x
    var forward = -cam.global_basis.z
    right.y = 0.0
    forward.y = 0.0
    var direction = right.normalized() * input_axis.x + forward.normalized() * -input_axis.y
    if direction.length() > 1.0:
        direction = direction.normalized()
    hero.movement = Vector2(direction.x,direction.z)
    _camera_follow(delta)
    autosave_timer += delta
    if autosave_timer >= 20.0:
        autosave_timer = 0.0
        _save_game()

func _process(delta: float) -> void:
    if hero == null:
        return
    if notice_timer > 0.0:
        notice_timer -= delta
        if notice_timer <= 0.0:
            notice_label.text = ""
    if playing:
        hp_label.text = "VIDA  %d / %d" % [hero.hp,hero.max_hp]
        fatigue_label.text = "FADIGA  %d/%d   •   VONTADE  %d/%d" % [hero.fatigue,hero.max_fatigue,hero.willpower,hero.max_willpower]
        stats_label.text = "%s | %s    •    F%d  H%d  V%d  M%d" % [hero.race_name,hero.role_name,int(hero.attrs["f"]),int(hero.attrs["h"]),int(hero.attrs["v"]),int(hero.attrs["m"])]
        quest_label.text = _quest_text()
        var nearby_npc = hero.global_position.distance_to(npc_pos) < 4.1
        var nearby_portal = hero.global_position.distance_to(gate_pos) < 4.5
        interact_button.text = "FALAR" if nearby_npc and phase == 0 else ("SELAR" if nearby_portal and phase >= 3 else "AÇÃO")
        heal_button.modulate = Color.WHITE if hero.willpower >= 2 and hero.hp < hero.max_hp else Color(0.65,0.65,0.7)

func _camera_follow(delta: float) -> void:
    var camera_direction = Vector3(sin(cam_yaw),0.0,cos(cam_yaw))
    var look_point = hero.global_position + Vector3(0,1.3,0)
    var target = look_point + camera_direction * 7.6 + Vector3(0.0,3.9 + cam_tilt * 5.0,0.0)
    cam.global_position = cam.global_position.lerp(target,minf(1.0,delta * 7.0))
    cam.look_at(look_point + Vector3(0,0.4,0),Vector3.UP)

func _material(hex: String, emissive: bool = false) -> StandardMaterial3D:
    var mat = StandardMaterial3D.new()
    mat.albedo_color = Color(hex)
    mat.roughness = 0.91
    if emissive:
        mat.emission_enabled = true
        mat.emission = Color(hex)
        mat.emission_energy_multiplier = 2.0
    return mat

func _mesh(parent: Node3D, mesh: Mesh, pos: Vector3, material: Material) -> MeshInstance3D:
    var node = MeshInstance3D.new()
    node.mesh = mesh
    node.position = pos
    node.material_override = material
    parent.add_child(node)
    return node

func _box(parent: Node3D, pos: Vector3, dimensions: Vector3, material: Material, collision: bool = false) -> MeshInstance3D:
    var mesh = BoxMesh.new()
    mesh.size = dimensions
    var node = _mesh(parent,mesh,pos,material)
    if collision:
        var blocker = StaticBody3D.new()
        blocker.position = pos
        blocker.collision_layer = 1
        blocker.collision_mask = 0
        parent.add_child(blocker)
        var shape = BoxShape3D.new()
        shape.size = dimensions
        var cs = CollisionShape3D.new()
        cs.shape = shape
        blocker.add_child(cs)
    return node

func _cylinder(parent: Node3D, pos: Vector3, radius: float, height: float, material: Material, top: float = -1.0, sides: int = 7) -> MeshInstance3D:
    var mesh = CylinderMesh.new()
    mesh.bottom_radius = radius
    mesh.top_radius = radius if top < 0.0 else top
    mesh.height = height
    mesh.radial_segments = sides
    mesh.rings = 1
    return _mesh(parent,mesh,pos,material)

func _ball(parent: Node3D, pos: Vector3, radius: float, material: Material) -> MeshInstance3D:
    var mesh = SphereMesh.new()
    mesh.radius = radius
    mesh.height = radius * 2.0
    mesh.radial_segments = 8
    mesh.rings = 4
    return _mesh(parent,mesh,pos,material)

func _create_world() -> void:
    var env_node = WorldEnvironment.new()
    var env = Environment.new()
    env.background_mode = Environment.BG_COLOR
    env.background_color = Color("141826")
    env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
    env.ambient_light_color = Color("747b8f")
    env.ambient_light_energy = 0.66
    env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
    env.fog_enabled = true
    env.fog_density = 0.012
    env_node.environment = env
    add_child(env_node)
    var moonlight = DirectionalLight3D.new()
    moonlight.rotation_degrees = Vector3(-47,-23,0)
    moonlight.light_color = Color("b0b6cf")
    moonlight.light_energy = 0.85
    moonlight.shadow_enabled = false
    add_child(moonlight)
    var ground_mat = _material("263a34")
    _box(self,Vector3(0,-0.55,0),Vector3(82,1,82),ground_mat,true)
    var road = _material("62584f")
    _box(self,Vector3(0,-0.034,-10),Vector3(4.1,0.07,56),road)
    for j in range(16):
        _box(self,Vector3(rng.randf_range(-1.7,1.7),0.015,rng.randf_range(-34,12)),Vector3(rng.randf_range(0.4,1.0),0.05,rng.randf_range(0.3,1.2)),_material("72655b"))
    var rock = _material("4c5356")
    var rock2 = _material("393f45")
    for i in range(40):
        var z = rng.randf_range(-35,34)
        var x = rng.randf_range(-35,35)
        if absf(x) < 6 and z < 14 and z > -34:
            continue
        var w = rng.randf_range(0.55,2.9)
        _box(self,Vector3(x,w * 0.22,z),Vector3(w,w * 0.45,w * 0.8),rock if i % 2 else rock2)
    for i in range(64):
        var x = rng.randf_range(-36,36)
        var z = rng.randf_range(-36,36)
        if absf(x) < 6.0 and z > -33.0 and z < 15.0:
            continue
        if absf(x - npc_pos.x) < 8 and absf(z - npc_pos.z) < 8:
            continue
        _tree(Vector3(x,0,z),rng.randf_range(0.7,1.6))
    for i in range(45):
        var x = rng.randf_range(-34,34)
        var z = rng.randf_range(-32,34)
        if absf(x) < 3.0 and z > -30 and z < 10:
            continue
        _ball(self,Vector3(x,0.32,z),rng.randf_range(0.28,0.65),_material("354e3c") if i % 3 else _material("4a4d39"))
    for i in range(2):
        _hut(Vector3(-9.0 + i * 17.0,0.0,4.0 + i * 3.0))
    _village()
    _ruins()
    _portal()
    for x in [-40.0,40.0]:
        _box(self,Vector3(x,1,0),Vector3(6,3,90),rock,true)
    for z in [-40.0,40.0]:
        _box(self,Vector3(0,1,z),Vector3(90,3,6),rock,true)

func _tree(pos: Vector3, scale_value: float) -> void:
    var tree = Node3D.new()
    tree.position = pos
    tree.scale = Vector3.ONE * scale_value
    add_child(tree)
    _cylinder(tree,Vector3(0,1.0,0),0.18,2.1,_material("493b32"),0.12,5)
    _cylinder(tree,Vector3(0,2.1,0),1.55,2.5,_material("243e38"),0.0,5)
    _cylinder(tree,Vector3(0,3.15,0),1.1,2.25,_material("30493b"),0.0,5)

func _hut(pos: Vector3) -> void:
    var house = Node3D.new()
    house.position = pos
    add_child(house)
    _box(house,Vector3(0,1.25,0),Vector3(5.0,2.5,4.5),_material("6e5847"),true)
    _cylinder(house,Vector3(0,3.3,0),3.9,2.0,_material("3f3034"),0,4)
    _box(house,Vector3(0,1.1,2.28),Vector3(1.22,2.1,0.10),_material("30272b"))
    for x in [-2.05,2.05]:
        _cylinder(house,Vector3(x,1.34,2.38),0.15,2.67,_material("3e3030"))

func _village() -> void:
    var fire = Node3D.new()
    fire.position = Vector3(-1.8,0,3.5)
    add_child(fire)
    _cylinder(fire,Vector3(0,0.1,0),0.95,0.25,_material("3e3534"))
    for i in range(6):
        var a = i * TAU / 6.0
        _box(fire,Vector3(cos(a) * 0.42,0.27,sin(a) * 0.42),Vector3(0.20,0.35,0.70),_material("6a4632"))
    _cylinder(fire,Vector3(0,0.60,0),0.35,0.85,_material("de7a36",true),0,5)
    var fire_light = OmniLight3D.new()
    fire_light.position = Vector3(-1.8,1.3,3.5)
    fire_light.light_color = Color("f1884f")
    fire_light.light_energy = 1.8
    fire_light.omni_range = 9.0
    fire_light.shadow_enabled = false
    add_child(fire_light)
    var npc = Node3D.new()
    npc.position = npc_pos
    add_child(npc)
    _cylinder(npc,Vector3(0,0.55,0),0.39,1.1,_material("514e68"),0.30)
    _ball(npc,Vector3(0,1.38,0),0.25,_material("b8a48c"))
    _cylinder(npc,Vector3(0,1.53,0),0.35,0.4,_material("1f242d"),0.05)
    var caption = Label3D.new()
    caption.text = "HASAM • CRONISTA"
    caption.position.y = 2.2
    caption.font_size = 28
    caption.pixel_size = 0.008
    caption.modulate = Color("e8ca87")
    caption.billboard = BaseMaterial3D.BILLBOARD_ENABLED
    caption.no_depth_test = true
    npc.add_child(caption)

func _ruins() -> void:
    var stone = _material("5b5d64")
    for z in [-22.0,-29.0]:
        for x in [-7.0,7.0]:
            _cylinder(self,Vector3(x,1.9,z),0.72,3.8,stone,0.69,6)
            _cylinder(self,Vector3(x,3.8,z),1.03,0.24,_material("434750"),1.03,6)
    _box(self,Vector3(0,0.16,-30),Vector3(11,0.32,6),_material("53505b"))
    _box(self,Vector3(-5.4,0.35,-27.5),Vector3(0.8,0.7,4),_material("6a5c60"))
    _box(self,Vector3(5.4,0.35,-27.5),Vector3(0.8,0.7,4),_material("6a5c60"))

func _portal() -> void:
    portal_ring = Node3D.new()
    portal_ring.position = gate_pos + Vector3(0,2.95,0)
    add_child(portal_ring)
    var gate_mesh = TorusMesh.new()
    gate_mesh.inner_radius = 1.65
    gate_mesh.outer_radius = 2.05
    gate_mesh.rings = 12
    gate_mesh.ring_segments = 22
    var ring = _mesh(portal_ring,gate_mesh,Vector3.ZERO,_material("a64a68",true))
    ring.rotation_degrees.x = 90
    var core = _ball(portal_ring,Vector3.ZERO,1.6,_material("392238"))
    core.scale = Vector3(0.92,0.90,0.15)
    var gate_light = OmniLight3D.new()
    gate_light.light_color = Color("ab466d")
    gate_light.light_energy = 1.25
    gate_light.omni_range = 9.0
    portal_ring.add_child(gate_light)

func _create_camera() -> void:
    cam = Camera3D.new()
    cam.current = true
    cam.fov = 66.0
    cam.near = 0.08
    cam.far = 95.0
    cam.position = Vector3(0,5,12)
    add_child(cam)

func _create_audio() -> void:
    effect_player = AudioStreamPlayer.new()
    effect_player.volume_db = -8
    add_child(effect_player)
    ambient_player = AudioStreamPlayer.new()
    ambient_player.volume_db = -17
    add_child(ambient_player)
    var sound = load("res://assets/ambient.wav")
    if sound != null:
        if sound is AudioStreamWAV:
            sound.loop_mode = AudioStreamWAV.LOOP_FORWARD
        ambient_player.stream = sound
        ambient_player.play()

func _sfx(name: String) -> void:
    var source = load("res://assets/%s.wav" % name)
    if source != null:
        effect_player.stream = source
        effect_player.play()

func _create_ui() -> void:
    var layer = CanvasLayer.new()
    add_child(layer)
    ui = Control.new()
    ui.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    ui.mouse_filter = Control.MOUSE_FILTER_IGNORE
    layer.add_child(ui)
    var header = ColorRect.new()
    header.color = Color(0.04,0.07,0.12,0.72)
    header.anchor_right = 1.0
    header.offset_bottom = 102.0
    header.mouse_filter = Control.MOUSE_FILTER_IGNORE
    ui.add_child(header)
    var top_title = _label(ui,"T E N E B R I A   •   E C O S   D E   R U T U R A M",20,Color("e2bc81"))
    top_title.position = Vector2(28,10)
    hp_label = _label(ui,"VIDA",21,Color("eeb7a8"))
    hp_label.position = Vector2(30,40)
    fatigue_label = _label(ui,"FADIGA",15,Color("c6ccd6"))
    fatigue_label.position = Vector2(30,69)
    quest_label = _label(ui,"MISSAO",18,Color("ecd2ad"))
    quest_label.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
    quest_label.anchor_left = 1.0
    quest_label.anchor_right = 1.0
    quest_label.offset_left = -760
    quest_label.offset_right = -28
    quest_label.offset_top = 47
    quest_label.offset_bottom = 94
    quest_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
    var btn_pause = _button(ui,"II",Vector2(-66,14),Vector2(52,51),Callable(self,"_pause"),16)
    btn_pause.anchor_left = 1.0
    btn_pause.anchor_right = 1.0
    btn_pause.offset_left = -70
    btn_pause.offset_right = -18
    joystick = JOYSTICK.new()
    joystick.anchor_top = 1.0
    joystick.anchor_bottom = 1.0
    joystick.offset_left = 31
    joystick.offset_right = 222
    joystick.offset_top = -223
    joystick.offset_bottom = -32
    ui.add_child(joystick)
    _button_bottom("ATACAR",-184,-194,142,80,Callable(self,"_attack"),20)
    _button_bottom("TÉCNICA",-346,-148,143,75,Callable(self,"_skill"),18)
    _button_bottom("ESQUIVA",-192,-99,132,66,Callable(self,"_dash"),17)
    interact_button = _button_bottom("AÇÃO",-340,-63,132,58,Callable(self,"_interact"),16)
    heal_button = _button_bottom("CURAR",-488,-89,120,55,Callable(self,"_heal"),16)
    stats_label = _label(ui,"",14,Color("d5c5b6"))
    stats_label.anchor_top = 1.0
    stats_label.anchor_bottom = 1.0
    stats_label.offset_left = 29
    stats_label.offset_right = 775
    stats_label.offset_top = -27
    stats_label.offset_bottom = -4
    notice_label = _label(ui,"",23,Color("ffe3ab"))
    notice_label.anchor_left = 0.10
    notice_label.anchor_right = 0.9
    notice_label.anchor_top = 0.64
    notice_label.anchor_bottom = 0.64
    notice_label.offset_bottom = 75
    notice_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    notice_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
    _create_start_overlay()
    _create_pause_overlay()

func _label(parent: Node, message: String, font_size: int, color: Color) -> Label:
    var lbl = Label.new()
    lbl.text = message
    lbl.add_theme_font_size_override("font_size",font_size)
    lbl.add_theme_color_override("font_color",color)
    lbl.add_theme_color_override("font_shadow_color",Color(0.0,0.0,0.0,0.85))
    lbl.add_theme_constant_override("shadow_offset_x",1)
    lbl.add_theme_constant_override("shadow_offset_y",2)
    lbl.mouse_filter = Control.MOUSE_FILTER_IGNORE
    parent.add_child(lbl)
    return lbl

func _button(parent: Node, caption: String, pos: Vector2, dimensions: Vector2, action: Callable, font_size: int = 18) -> Button:
    var bt = Button.new()
    bt.text = caption
    bt.position = pos
    bt.size = dimensions
    bt.add_theme_font_size_override("font_size",font_size)
    bt.add_theme_color_override("font_color",Color("f9e9d0"))
    var normal = StyleBoxFlat.new()
    normal.bg_color = Color(0.23,0.21,0.25,0.82)
    normal.border_color = Color(0.78,0.59,0.39,0.85)
    normal.set_border_width_all(2)
    normal.set_corner_radius_all(14)
    var pressed = normal.duplicate() as StyleBoxFlat
    pressed.bg_color = Color("825344")
    var hover = normal.duplicate() as StyleBoxFlat
    hover.bg_color = Color("50414a")
    bt.add_theme_stylebox_override("normal",normal)
    bt.add_theme_stylebox_override("pressed",pressed)
    bt.add_theme_stylebox_override("hover",hover)
    bt.pressed.connect(action)
    parent.add_child(bt)
    return bt

func _button_bottom(caption: String,x: float,y: float,w: float,h: float,action: Callable, font_size: int = 18) -> Button:
    var bt = _button(ui,caption,Vector2.ZERO,Vector2(w,h),action,font_size)
    bt.anchor_left = 1.0
    bt.anchor_right = 1.0
    bt.anchor_top = 1.0
    bt.anchor_bottom = 1.0
    bt.offset_left = x
    bt.offset_right = x+w
    bt.offset_top = y
    bt.offset_bottom = y+h
    return bt

func _create_start_overlay() -> void:
    title_layer = ColorRect.new()
    title_layer.color = Color(0.035,0.045,0.075,0.95)
    title_layer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    ui.add_child(title_layer)
    var panel = VBoxContainer.new()
    panel.anchor_left = 0.23
    panel.anchor_right = 0.77
    panel.anchor_top = 0.12
    panel.anchor_bottom = 0.91
    panel.add_theme_constant_override("separation",12)
    title_layer.add_child(panel)
    var ttl = _label(panel,"T E N E B R I A",47,Color("e6c49a"))
    ttl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    var sub = _label(panel,"ECOS DE RUTURAM • PRÓLOGO EM OBSCURE",19,Color("b9a7ac"))
    sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    var story = _label(panel,"Uma cicatriz se abriu nas ruínas. Há fragmentos de Astral espalhados pela terra, e a presença de Ruturam voltou a despertar.",17,Color("ded4d1"))
    story.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
    story.custom_minimum_size.y = 74
    story.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    _label(panel,"ESCOLHA SUA CLASSE",16,Color("e3c68f"))
    menu_class = OptionButton.new()
    menu_class.add_item("Espadachim Oriental")
    menu_class.add_item("Guerreiro")
    menu_class.add_theme_font_size_override("font_size",21)
    menu_class.custom_minimum_size.y = 48
    panel.add_child(menu_class)
    _label(panel,"ESCOLHA SUA RAÇA",16,Color("e3c68f"))
    menu_race = OptionButton.new()
    menu_race.add_item("Humano")
    menu_race.add_item("Anão")
    menu_race.add_item("Abominu")
    menu_race.add_theme_font_size_override("font_size",21)
    menu_race.custom_minimum_size.y = 48
    panel.add_child(menu_race)
    var start = _button(panel,"INICIAR AVENTURA",Vector2.ZERO,Vector2(380,57),Callable(self,"_start_new"),22)
    start.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    var resume = _button(panel,"CONTINUAR JOGO SALVO",Vector2.ZERO,Vector2(380,54),Callable(self,"_resume"),20)
    resume.name = "Resume"
    resume.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    var hint = _label(panel,"Arraste a área direita para olhar • joystick à esquerda • toque nos botões para lutar",13,Color("b8b5c1"))
    hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    hint.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART

func _create_pause_overlay() -> void:
    pause_layer = ColorRect.new()
    pause_layer.color = Color(0.03,0.04,0.06,0.85)
    pause_layer.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    ui.add_child(pause_layer)
    var panel = VBoxContainer.new()
    panel.anchor_left = 0.3
    panel.anchor_right = 0.7
    panel.anchor_top = 0.28
    panel.anchor_bottom = 0.8
    panel.add_theme_constant_override("separation",15)
    pause_layer.add_child(panel)
    var txt = _label(panel,"PAUSA • TENEBRIA",34,Color("e5be8b"))
    txt.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    var resume = _button(panel,"RETOMAR",Vector2.ZERO,Vector2(300,58),Callable(self,"_unpause"),21)
    resume.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    var save = _button(panel,"SALVAR PARTIDA",Vector2.ZERO,Vector2(300,58),Callable(self,"_save_game"),20)
    save.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    var exit = _button(panel,"MENU PRINCIPAL",Vector2.ZERO,Vector2(300,58),Callable(self,"_return_menu"),20)
    exit.size_flags_horizontal = Control.SIZE_EXPAND_FILL
    pause_layer.hide()

func _show_start_screen() -> void:
    playing = false
    paused_by_user = false
    title_layer.show()
    pause_layer.hide()
    var resume = title_layer.find_child("Resume",true,false) as Button
    if resume != null:
        resume.disabled = not FileAccess.file_exists(SAVE_FILE)

func _start_new() -> void:
    _begin(menu_class.get_item_text(menu_class.selected),menu_race.get_item_text(menu_race.selected),false)

func _resume() -> void:
    var file = ConfigFile.new()
    if file.load(SAVE_FILE) != OK:
        _notice("Não foi possível carregar o jogo salvo")
        return
    _begin(str(file.get_value("hero","class","Espadachim Oriental")),str(file.get_value("hero","race","Humano")),true)

func _begin(role: String,race: String,from_save: bool) -> void:
    if hero == null:
        hero = HERO.new()
        hero.position = Vector3(0,0,6)
        add_child(hero)
        hero.defeated.connect(_on_defeat)
    hero.configure(race,role)
    hero.restore()
    selected_role_name = role
    race_name = race
    phase = 0
    kills = 0
    relics = 0
    boss_defeated = false
    boss_seen = false
    if from_save:
        var file = ConfigFile.new()
        if file.load(SAVE_FILE) == OK:
            phase = int(file.get_value("quest","phase",0))
            kills = int(file.get_value("quest","kills",0))
            relics = int(file.get_value("quest","relics",0))
            boss_defeated = bool(file.get_value("quest","boss_defeated",false))
            hero.hp = clampi(int(file.get_value("hero","hp",hero.max_hp)),1,hero.max_hp)
            hero.fatigue = clampi(int(file.get_value("hero","fatigue",hero.max_fatigue)),0,hero.max_fatigue)
            hero.willpower = clampi(int(file.get_value("hero","willpower",hero.max_willpower)),0,hero.max_willpower)
            var saved_position = file.get_value("hero","pos",Vector3(0,0,6))
            if saved_position is Vector3:
                hero.position = saved_position
    _reset_enemies()
    cam_yaw = 0.0
    cam.global_position = hero.position + Vector3(0,5,8)
    title_layer.hide()
    pause_layer.hide()
    paused_by_user = false
    playing = true
    _notice("Procure Hasam junto à fogueira" if phase == 0 else "A jornada continua em Obscure")

func _reset_enemies() -> void:
    for foe in foes:
        if is_instance_valid(foe):
            foe.queue_free()
    foes.clear()
    for place in [Vector3(-4,0,-13),Vector3(5,0,-15),Vector3(-4,0,-20),Vector3(5,0,-24),Vector3(2,0,-19)]:
        _spawn_foe(place,false)
    if phase >= 2 and phase < 3 and not boss_defeated:
        _spawn_boss()

func _spawn_foe(place: Vector3,is_boss: bool) -> void:
    var enemy: TenebriaFoe = FOE.new()
    enemy.boss = is_boss
    enemy.hero = hero
    enemy.position = place
    add_child(enemy)
    enemy.eliminated.connect(_on_enemy_eliminated)
    enemy.wounded_player.connect(_on_player_hit)
    foes.append(enemy)

func _spawn_boss() -> void:
    if boss_seen or boss_defeated:
        return
    boss_seen = true
    _spawn_foe(Vector3(0,0,-24),true)
    _notice("O Guardião de Ruturam protege a fenda!",4.8)

func _on_enemy_eliminated(enemy: TenebriaFoe) -> void:
    if enemy.boss:
        boss_defeated = true
        phase = 3
        _notice("Guardião vencido! Aproxime-se da fenda e sele o portal.",5)
        _sfx("victory")
    else:
        kills += 1
        relics += 1
        _sfx("collect")
        if phase == 1 and kills >= 3:
            phase = 2
            _notice("Três fragmentos recuperados! A fenda despertou.",5)
            _spawn_boss()
        else:
            _notice("Incarna vencido • Fragmento de Astral recuperado (%d)" % relics)
    _save_game()

func _on_player_hit(amount: int) -> void:
    if not playing or paused_by_user or hero == null:
        return
    hero.damage(amount)
    _sfx("hurt")
    _notice("Você sofreu %d de dano!" % amount,1.2)

func _on_defeat() -> void:
    _notice("Você caiu. A chama de Obscure ainda resiste.",4)
    _save_game()
    var timer = get_tree().create_timer(2.0)
    timer.timeout.connect(_revive)

func _revive() -> void:
    if hero != null:
        hero.restore()
        _notice("Você retornou ao acampamento de Hasam")

func _nearest(max_distance: float) -> TenebriaFoe:
    if hero == null:
        return null
    var closest: TenebriaFoe = null
    var nearest_distance = max_distance
    for enemy in foes:
        if not is_instance_valid(enemy) or not enemy.live:
            continue
        var distance = hero.global_position.distance_to(enemy.global_position)
        if distance < nearest_distance:
            closest = enemy
            nearest_distance = distance
    return closest

func _attack() -> void:
    if not _can_act() or hero.action_cooldown > 0.0:
        return
    hero.action_cooldown = 0.60
    hero.attack_anim = 0.42
    _sfx("swing")
    var target = _nearest(2.75)
    if target == null:
        _notice("Seu golpe cortou apenas a névoa",0.8)
        return
    _face_target(target)
    var dice = rng.randi_range(1,20) + int(hero.attrs["f"])
    var defense = 10 + (4 if target.boss else 2)
    if dice < defense:
        _notice("Ataque falhou (D20: %d)" % dice,0.9)
        return
    var damage = rng.randi_range(1,6) + int(hero.attrs["f"])
    if hero.race_name == "Abominu":
        damage += 1
    target.take_damage(damage)
    _sfx("hit")
    _notice("Acerto! %d de dano (D20: %d)" % [damage,dice],1)

func _skill() -> void:
    if not _can_act() or hero.action_cooldown > 0.0:
        return
    if hero.fatigue < 3:
        _notice("Fadiga insuficiente para a técnica")
        return
    var target = _nearest(4.1)
    if target == null:
        _notice("Aproxime-se de um inimigo para usar a técnica")
        return
    hero.fatigue -= 3
    hero.action_cooldown = 1.3
    hero.attack_anim = 0.42
    _face_target(target)
    var roll = rng.randi_range(1,20) + int(hero.attrs["f"]) + 2
    if roll < 10 + (4 if target.boss else 2):
        _notice("A técnica não acertou • D20: %d" % roll)
        _sfx("swing")
        return
    var bonus = rng.randi_range(2,8) if hero.role_name == "Espadachim Oriental" else rng.randi_range(1,6)
    var damage = rng.randi_range(1,6) + int(hero.attrs["f"]) + bonus
    target.take_damage(damage)
    _sfx("hit")
    _notice(("ESPADA ANCESTRAL" if hero.role_name == "Espadachim Oriental" else "GOLPE DECISIVO") + " • %d de dano" % damage,1.4)

func _face_target(target: TenebriaFoe) -> void:
    var direction = target.global_position - hero.global_position
    direction.y = 0.0
    if direction.length() > 0.1:
        hero.rotation.y = atan2(-direction.x,-direction.z)

func _dash() -> void:
    if not _can_act():
        return
    if hero.dash():
        _sfx("swing")
    else:
        _notice("Esquiva indisponível ou fadiga insuficiente")

func _heal() -> void:
    if not _can_act():
        return
    if hero.heal():
        _sfx("heal")
        _notice("Alívio temporário • +12 de vida")
        _save_game()
    else:
        _notice("É preciso ter 2 pontos de Vontade e ferimentos")

func _interact() -> void:
    if not _can_act():
        return
    if hero.global_position.distance_to(npc_pos) < 4.1:
        if phase == 0:
            phase = 1
            _notice("HASAM: Os Incarnas avançam. Derrote três e recupere fragmentos de Astral.",6)
            _save_game()
        else:
            _notice("HASAM: Ruturam nunca foi totalmente esquecida. Confie no seu aço.",4)
    elif hero.global_position.distance_to(gate_pos) < 4.6:
        if phase < 2:
            _notice("A fenda está selada por runas. Reúna três fragmentos.")
        elif phase == 2:
            _notice("Derrote o Guardião antes de tentar fechar a fenda!")
        elif phase == 3:
            phase = 4
            _sfx("victory")
            _notice("A fenda foi selada. Você salvou a Vigília de Obscure!",8)
            _save_game()
        else:
            _notice("Missão concluída. A luz ainda resiste em Obscure.",4)
    else:
        _notice("Não há nada para interagir por perto",1.2)

func _can_act() -> bool:
    return playing and not paused_by_user and hero != null and hero.alive

func _quest_text() -> String:
    match phase:
        0: return "PRÓLOGO  •  Encontre Hasam junto à fogueira"
        1: return "MISSÃO  •  Derrote Incarnas e obtenha Astral (%d/3)" % mini(kills,3)
        2: return "MISSÃO  •  Enfrente o Guardião de Ruturam"
        3: return "MISSÃO  •  Volte à fenda e sele o portal"
        _: return "VITÓRIA  •  A fenda foi fechada. Retorne quando quiser."

func _notice(message: String, duration: float = 2.5) -> void:
    if notice_label != null:
        notice_label.text = message
        notice_timer = duration

func _pause() -> void:
    if not playing or paused_by_user:
        return
    paused_by_user = true
    pause_layer.show()

func _unpause() -> void:
    paused_by_user = false
    pause_layer.hide()

func _return_menu() -> void:
    _save_game()
    _show_start_screen()
    if hero != null:
        hero.movement = Vector2.ZERO

func _save_game() -> void:
    if hero == null:
        return
    var config = ConfigFile.new()
    config.set_value("hero","class",hero.role_name)
    config.set_value("hero","race",hero.race_name)
    config.set_value("hero","hp",hero.hp if hero.alive else hero.max_hp)
    config.set_value("hero","fatigue",hero.fatigue)
    config.set_value("hero","willpower",hero.willpower)
    config.set_value("hero","pos",hero.position if hero.alive else Vector3(0,0,6))
    config.set_value("quest","phase",phase)
    config.set_value("quest","kills",kills)
    config.set_value("quest","relics",relics)
    config.set_value("quest","boss_defeated",boss_defeated)
    var result = config.save(SAVE_FILE)
    if result != OK:
        _notice("Não foi possível salvar a partida")
