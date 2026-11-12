extends CharacterBody3D
class_name TenebriaHero

signal defeated

var body_visual: Node3D
var blade: Node3D
var hp: int = 28
var max_hp: int = 28
var fatigue: int = 8
var max_fatigue: int = 8
var willpower: int = 4
var max_willpower: int = 4
var race_name: String = "Humano"
var role_name: String = "Espadachim Oriental"
var attrs: Dictionary = {"f":3,"h":2,"v":2,"m":1}
var facing: Vector3 = Vector3.FORWARD
var movement: Vector2 = Vector2.ZERO
var speed: float = 6.0
var dash_time: float = 0.0
var dash_cooldown: float = 0.0
var attack_anim: float = 0.0
var action_cooldown: float = 0.0
var stamina_recovery: float = 0.0
var walking_time: float = 0.0
var alive: bool = true

func _ready() -> void:
    name = "Aventureiro"
    collision_layer = 2
    collision_mask = 1
    var capsule = CapsuleShape3D.new()
    capsule.radius = 0.37
    capsule.height = 1.8
    var collider = CollisionShape3D.new()
    collider.shape = capsule
    collider.position.y = 0.95
    add_child(collider)
    body_visual = Node3D.new()
    add_child(body_visual)
    _build_avatar()

func configure(chosen_race: String, chosen_role: String) -> void:
    race_name = chosen_race
    role_name = chosen_role
    attrs = {"f":3,"h":2,"v":2,"m":1}
    if chosen_role == "Guerreiro":
        attrs = {"f":3,"h":1,"v":3,"m":1}
    if chosen_race == "Anão":
        attrs["v"] += 1
        speed = 5.2
    elif chosen_race == "Abominu":
        speed = 6.8
    else:
        speed = 6.0
    max_hp = 22 + int(attrs["f"]) * 2 + int(attrs["v"])
    hp = max_hp
    max_fatigue = int(attrs["f"]) + int(attrs["v"]) + 4
    fatigue = max_fatigue
    max_willpower = int(attrs["m"]) + 3
    willpower = max_willpower
    if body_visual != null:
        for child in body_visual.get_children():
            child.queue_free()
        _build_avatar()

func _material(color: Color, metallic: float = 0.0) -> StandardMaterial3D:
    var mat = StandardMaterial3D.new()
    mat.albedo_color = color
    mat.metallic = metallic
    mat.roughness = 0.66
    return mat

func _shape(parent: Node3D, mesh: Mesh, pos: Vector3, mat: Material, rot: Vector3 = Vector3.ZERO) -> MeshInstance3D:
    var node = MeshInstance3D.new()
    node.mesh = mesh
    node.position = pos
    node.rotation = rot
    node.material_override = mat
    parent.add_child(node)
    return node

func _box(parent: Node3D, pos: Vector3, scale: Vector3, mat: Material) -> MeshInstance3D:
    var mesh = BoxMesh.new()
    mesh.size = scale
    return _shape(parent, mesh, pos, mat)

func _build_avatar() -> void:
    var cloth = _material(Color("28384a") if role_name == "Espadachim Oriental" else Color("5c413b"))
    var metal = _material(Color("9da9aa"), 0.67)
    var dark = _material(Color("161a24"))
    var skin = _material(Color("c99878"))
    var accent = _material(Color("a85360") if role_name == "Espadachim Oriental" else Color("c0a477"))
    _box(body_visual, Vector3(0,1.12,0), Vector3(0.8,0.84,0.44), cloth)
    _box(body_visual, Vector3(0,1.15,-0.24), Vector3(0.63,0.17,0.09), accent)
    _box(body_visual, Vector3(0,0.68,0), Vector3(0.70,0.15,0.45), dark)
    _box(body_visual, Vector3(-0.25,0.35,0), Vector3(0.24,0.68,0.30), cloth)
    _box(body_visual, Vector3(0.25,0.35,0), Vector3(0.24,0.68,0.30), cloth)
    _box(body_visual, Vector3(-0.48,1.18,0), Vector3(0.24,0.66,0.29), metal)
    _box(body_visual, Vector3(0.48,1.18,0), Vector3(0.24,0.66,0.29), metal)
    var head = SphereMesh.new()
    head.radius = 0.25
    head.height = 0.51
    _shape(body_visual, head, Vector3(0,1.79,0), skin)
    _box(body_visual, Vector3(0,1.99,0), Vector3(0.55,0.19,0.53), dark)
    blade = Node3D.new()
    blade.position = Vector3(0.64,0.97,-0.12)
    body_visual.add_child(blade)
    _box(blade, Vector3(0,0,0), Vector3(0.12,0.68,0.12), dark)
    _box(blade, Vector3(0,0.40,0), Vector3(0.35,0.07,0.13), accent)
    _box(blade, Vector3(0,1.0,0), Vector3(0.09,1.12,0.10), metal)
    if role_name == "Espadachim Oriental":
        _box(body_visual, Vector3(-0.62,1.0,0.26), Vector3(0.10,1.45,0.12), metal)
    if race_name == "Abominu":
        _box(body_visual, Vector3(-0.78,1.25,0.43), Vector3(0.8,0.92,0.13), _material(Color("d9d9e3")))
        _box(body_visual, Vector3(0.78,1.25,0.43), Vector3(0.8,0.92,0.13), dark)
    if race_name == "Anão":
        body_visual.scale = Vector3(1.12,0.77,1.12)
    else:
        body_visual.scale = Vector3.ONE

func _physics_process(delta: float) -> void:
    if not alive:
        return
    action_cooldown = maxf(0.0, action_cooldown - delta)
    dash_cooldown = maxf(0.0, dash_cooldown - delta)
    dash_time = maxf(0.0, dash_time - delta)
    attack_anim = maxf(0.0, attack_anim - delta)
    stamina_recovery += delta
    if stamina_recovery >= 2.8:
        stamina_recovery = 0.0
        fatigue = mini(max_fatigue, fatigue + 1)
    var direction = Vector3(movement.x,0,movement.y)
    if direction.length() > 0.12:
        direction = direction.normalized()
        facing = direction
        rotation.y = lerp_angle(rotation.y, atan2(-direction.x,-direction.z), minf(1.0,delta * 10.0))
        walking_time += delta * 9.0
    else:
        walking_time = 0.0
    var current_speed = speed * (2.8 if dash_time > 0.0 else 1.0)
    velocity.x = direction.x * current_speed
    velocity.z = direction.z * current_speed
    velocity.y = -1.0 if is_on_floor() else velocity.y - 18.0 * delta
    move_and_slide()
    position.x = clampf(position.x,-35,35)
    position.z = clampf(position.z,-35,35)
    body_visual.position.y = sin(walking_time) * 0.045 if direction.length() > 0.1 else 0.0
    if blade != null:
        blade.rotation.z = -sin((0.42 - attack_anim) * 13.0) * 1.2 if attack_anim > 0.0 else lerpf(blade.rotation.z, 0.0, minf(1.0,delta * 9.0))

func dash() -> bool:
    if dash_cooldown > 0.0 or fatigue < 2 or not alive:
        return false
    fatigue -= 2
    dash_time = 0.26
    dash_cooldown = 1.15
    return true

func damage(amount: int) -> void:
    if not alive or dash_time > 0.0:
        return
    hp = maxi(0,hp - amount)
    if hp == 0:
        alive = false
        defeated.emit()

func heal() -> bool:
    if willpower < 2 or hp >= max_hp or not alive:
        return false
    willpower -= 2
    hp = mini(max_hp,hp + 12)
    return true

func restore() -> void:
    alive = true
    hp = max_hp
    fatigue = max_fatigue
    willpower = max_willpower
    velocity = Vector3.ZERO
    position = Vector3(0,0,6)
