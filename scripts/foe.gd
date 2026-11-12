extends CharacterBody3D
class_name TenebriaFoe

signal eliminated(foe: TenebriaFoe)
signal wounded_player(amount: int)

var health: int = 14
var max_health: int = 14
var boss: bool = false
var hero: TenebriaHero
var anchor: Vector3 = Vector3.ZERO
var cooldown: float = 0.0
var stagger: float = 0.0
var aggression: float = 0.0
var moving_time: float = 0.0
var body_mesh: MeshInstance3D
var label3d: Label3D
var live: bool = true
var rng := RandomNumberGenerator.new()

func _ready() -> void:
    name = "Guardião de Ruturam" if boss else "Incarna Errante"
    rng.seed = int(absf(position.x * 371.0 + position.z * 911.0)) + 441
    health = 48 if boss else 14
    max_health = health
    collision_layer = 4
    collision_mask = 1
    var shape = CapsuleShape3D.new()
    shape.radius = 0.52 if boss else 0.34
    shape.height = 2.3 if boss else 1.6
    var hitbox = CollisionShape3D.new()
    hitbox.shape = shape
    hitbox.position.y = 1.08 if boss else 0.82
    add_child(hitbox)
    var skin = StandardMaterial3D.new()
    skin.albedo_color = Color("6b2939") if boss else Color("465158")
    skin.metallic = 0.1
    var glow = StandardMaterial3D.new()
    glow.albedo_color = Color("f06c5b")
    glow.emission_enabled = true
    glow.emission = Color("ae243e")
    glow.emission_energy_multiplier = 1.8
    var chest = CapsuleMesh.new()
    chest.radius = 0.65 if boss else 0.39
    chest.height = 1.75 if boss else 1.18
    body_mesh = MeshInstance3D.new()
    body_mesh.mesh = chest
    body_mesh.material_override = skin
    body_mesh.position.y = 1.28 if boss else 0.95
    add_child(body_mesh)
    var eyes = BoxMesh.new()
    eyes.size = Vector3(0.6 if boss else 0.35,0.10,0.1)
    var eye_node = MeshInstance3D.new()
    eye_node.mesh = eyes
    eye_node.position = Vector3(0,1.83 if boss else 1.27,-0.39 if boss else -0.28)
    eye_node.material_override = glow
    body_mesh.add_child(eye_node)
    label3d = Label3D.new()
    label3d.text = "GUARDIÃO" if boss else "INCARNA"
    label3d.position.y = 2.8 if boss else 2.1
    label3d.font_size = 30
    label3d.pixel_size = 0.0075
    label3d.modulate = Color("d8afa8")
    label3d.billboard = BaseMaterial3D.BILLBOARD_ENABLED
    label3d.no_depth_test = true
    add_child(label3d)
    anchor = global_position

func _physics_process(delta: float) -> void:
    if not live or hero == null or not hero.alive:
        return
    cooldown -= delta
    stagger -= delta
    aggression += delta
    var offset = hero.global_position - global_position
    offset.y = 0.0
    if offset.length() < (23.0 if boss else 13.0):
        if offset.length() > (2.15 if boss else 1.52) and stagger <= 0.0:
            var dir = offset.normalized()
            velocity.x = dir.x * (2.65 if boss else 2.25)
            velocity.z = dir.z * (2.65 if boss else 2.25)
            rotation.y = lerp_angle(rotation.y, atan2(-dir.x,-dir.z),delta * 7.0)
        else:
            velocity.x = move_toward(velocity.x,0,delta * 15)
            velocity.z = move_toward(velocity.z,0,delta * 15)
        if offset.length() < (2.3 if boss else 1.8) and cooldown <= 0.0 and stagger <= 0.0:
            cooldown = 1.75 if boss else 2.0
            var roll = rng.randi_range(1,20) + (5 if boss else 3)
            var defense = 10 + int(hero.attrs["v"]) + (2 if hero.role_name == "Guerreiro" else 1)
            if roll >= defense:
                wounded_player.emit(rng.randi_range(4,8) if boss else rng.randi_range(2,5))
    else:
        velocity.x = move_toward(velocity.x,0,delta * 7)
        velocity.z = move_toward(velocity.z,0,delta * 7)
    velocity.y = -1.0 if is_on_floor() else velocity.y - 18.0 * delta
    move_and_slide()
    moving_time += delta * 5.0
    body_mesh.position.y = (1.28 if boss else 0.95) + sin(moving_time) * 0.035

func take_damage(amount: int) -> void:
    if not live:
        return
    health -= amount
    stagger = 0.18
    if health <= 0:
        live = false
        eliminated.emit(self)
        queue_free()
