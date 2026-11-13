extends RefCounted
## Nucleo de combate por turnos; independe de cenas, HUD e assets.
## Livro: combate pp.177-181; regras digitais novas sinalizadas em docs/rules_matrix.md.
signal event_logged(text: String)

var rng := RandomNumberGenerator.new()
var actors: Array[Dictionary] = []
var queue: Array[Dictionary] = []
var current_index: int = -1
var round_number: int = 0
var running: bool = false
var result: String = ""
var log_lines: Array[String] = []

func start(allies: Array[Dictionary], hostiles: Array[Dictionary], seed_value: int = 0) -> void:
 rng.seed = seed_value if seed_value > 0 else Time.get_ticks_msec()
 actors.clear()
 queue.clear()
 log_lines.clear()
 for i in range(allies.size()):
  var a := allies[i].duplicate(true)
  a["side"] = "ally"
  a["position"] = Vector2i(0,i*2)
  _init_actor(a)
  actors.append(a)
 for i in range(hostiles.size()):
  var a := hostiles[i].duplicate(true)
  a["side"] = "enemy"
  a["position"] = Vector2i(5,i*2)
  _init_actor(a)
  actors.append(a)
 running = true
 result = ""
 round_number = 0
 _next_round()

func _init_actor(a: Dictionary) -> void:
 a["max_hp"] = int(a.get("hp",12))
 a["guard"] = false
 a["move_used"] = false
 a["action_used"] = false
 a["statuses"] = {}
 a["fatigue"] = int(a.get("fatigue",4))
 a["will"] = int(a.get("will",3))
 a["equipment_defense"] = int(a.get("equipment_defense",0))
 a["weapon_die"] = int(a.get("weapon_die",6))
 a["weapon_bonus"] = int(a.get("weapon_bonus",0))
 a["speed"] = maxi(1,int(a.get("move",6)))
 a["f"] = int(a.get("f",2))
 a["h"] = int(a.get("h",2))
 a["v"] = int(a.get("v",2))
 a["m"] = int(a.get("m",1))

func _next_round() -> void:
 round_number += 1
 for actor in actors:
  if int(actor["hp"]) <= 0:
   continue
  actor["move_used"] = false
  actor["action_used"] = false
  actor["guard"] = false
  actor["initiative"] = rng.randi_range(1,20)+int(actor["h"])+int(actor["m"])
  var status: Dictionary = actor["statuses"]
  if status.has("bleed"):
   actor["hp"] = maxi(0,int(actor["hp"])-2)
   status["bleed"] = int(status["bleed"])-1
   if int(status["bleed"]) <= 0:
    status.erase("bleed")
 queue.clear()
 for actor in actors:
  if int(actor["hp"]) > 0:
   queue.append(actor)
 queue.sort_custom(func(a: Dictionary,b: Dictionary) -> bool: return int(a["initiative"]) > int(b["initiative"]))
 current_index = 0
 _check_finish()
 _write("Rodada %d. Iniciativa: %s" % [round_number, ", ".join(_names())])

func _names() -> Array[String]:
 var result_names: Array[String] = []
 for actor in queue:
  result_names.append(str(actor.get("name","?")))
 return result_names

func current() -> Dictionary:
 if not running or current_index < 0 or current_index >= queue.size():
  return {}
 return queue[current_index]

func targets(side: String) -> Array[Dictionary]:
 var out: Array[Dictionary] = []
 for actor in actors:
  if str(actor["side"]) == side and int(actor["hp"]) > 0:
   out.append(actor)
 return out

func occupied(pos: Vector2i, except_id: String) -> bool:
 for a in actors:
  if str(a["id"]) != except_id and int(a["hp"]) > 0 and a["position"] == pos:
   return true
 return false

func move_to(pos: Vector2i) -> bool:
 var actor := current()
 if actor.is_empty() or actor["move_used"] or actor["action_used"]:
  return false
 if pos.x < 0 or pos.x > 6 or pos.y < 0 or pos.y > 5:
  return false
 if occupied(pos,str(actor["id"])):
  return false
 var start_pos: Vector2i = actor["position"]
 if absi(pos.x-start_pos.x)+absi(pos.y-start_pos.y) > maxi(1,int(actor["speed"])/2):
  return false
 actor["position"] = pos
 actor["move_used"] = true
 _write("%s movimentou-se." % actor["name"])
 return true

func action(action_id: String, target_id: String = "") -> bool:
 var actor := current()
 if actor.is_empty() or actor["action_used"] or int(actor["hp"]) <= 0:
  return false
 var target := get_actor(target_id)
 if action_id in ["attack","skill"] and target.is_empty():
  return false
 if action_id == "guard":
  actor["guard"] = true
  actor["action_used"] = true
  _write("%s adotou guarda." % actor["name"])
 elif action_id == "potion":
  if int(actor.get("potions",0)) <= 0 or int(actor["hp"]) >= int(actor["max_hp"]):
   return false
  actor["potions"] = int(actor["potions"])-1
  var healing: int = rng.randi_range(1,4)
  actor["hp"] = mini(int(actor["max_hp"]),int(actor["hp"])+healing)
  actor["action_used"] = true
  _write("%s curou %d PV." % [actor["name"],healing])
 elif action_id in ["attack","skill"]:
  if str(actor["side"]) == str(target["side"]):
   return false
  var distance: int = _distance(actor,target)
  var r: int = 6 if str(actor.get("role","")) == "Mago" or str(actor.get("weapon","")) == "Arco de teixo" else 1
  if action_id == "skill" and str(actor.get("role","")) == "Mago":
   r = 6
  if distance > r:
   _write("Alvo fora do alcance (%d/%d)." % [distance,r])
   return false
  if action_id == "skill" and not _skill_ready(actor):
   return false
  var hit := true
  var roll: int = 0
  var attack_stat: int = int(actor["h"]) if r > 1 else int(actor["f"])
  if action_id == "skill" and str(actor.get("role","")) == "Mago":
   attack_stat = int(actor["m"])
  var advantage: bool = action_id == "skill" and str(actor.get("role","")) in ["Guerreiro","Espadachim Oriental"]
  if not (action_id == "skill" and str(actor.get("role","")) == "Mago"):
   roll = rng.randi_range(1,20)
   if advantage:
    roll = maxi(roll,rng.randi_range(1,20))
   hit = roll != 1 and (roll == 20 or roll+attack_stat >= defense(target))
  actor["action_used"] = true
  if not hit:
   _write("%s errou %s. D20=%d+%d contra Defesa %d." % [actor["name"],target["name"],roll,attack_stat,defense(target)])
   _consume_skill(actor,action_id)
   return true
  _consume_skill(actor,action_id)
  var damage: int = rng.randi_range(1,int(actor["weapon_die"]))+attack_stat+int(actor["weapon_bonus"])
  if action_id == "skill":
   match str(actor.get("role","")):
    "Mago":
     damage = rng.randi_range(1,4)+rng.randi_range(1,4)+int(actor["m"])
    "Guerreiro","Bárbaro":
     damage += rng.randi_range(1,4)
    "Espadachim Oriental":
     actor["statuses"]["enchanted"] = rng.randi_range(1,4)
  if action_id == "skill" and str(actor.get("race","")) == "Abominu":
   damage += 1
  if action_id != "skill" and int(actor["statuses"].get("enchanted",0)) > 0:
   damage += 1
  _hit(target,maxi(1,damage),actor)
  _write("%s atingiu %s com %s (%d de dano; D20=%d)." % [actor["name"],target["name"],action_id,damage,roll])
  if action_id == "skill" and str(actor.get("role","")) == "Mago":
   for other in targets("enemy" if str(actor["side"])=="ally" else "ally"):
    if other != target and _distance(other,target) <= 2:
     _hit(other,maxi(1,damage),actor)
     _write("Esfera de Pyros atingiu tambem %s." % other["name"])
 else:
  return false
 _check_finish()
 return true

func _skill_ready(actor: Dictionary) -> bool:
 var role: String = str(actor.get("role",""))
 if role == "Mago":
  return int(actor["will"]) >= 3
 if role in ["Guerreiro","Bárbaro"]:
  return int(actor["fatigue"]) >= 2
 return role == "Espadachim Oriental"

func _consume_skill(actor: Dictionary, action_id: String) -> void:
 if action_id != "skill":
  return
 if str(actor.get("role","")) == "Mago":
  actor["will"] = int(actor["will"])-3
 elif str(actor.get("role","")) in ["Guerreiro","Bárbaro"]:
  actor["fatigue"] = int(actor["fatigue"])-2

func _hit(target: Dictionary, damage: int, source: Dictionary) -> void:
 target["hp"] = maxi(0,int(target["hp"])-damage)
 if int(target["hp"]) == 0:
  _write("%s caiu." % target["name"])
 if str(source.get("role","")) == "Guardião" and int(target["hp"]) > 0 and rng.randf() < 0.25:
  target["statuses"]["bleed"] = 2

func defense(actor: Dictionary) -> int:
 return 10+int(actor["v"])+int(actor["equipment_defense"])+(2 if actor["guard"] else 0)

func _distance(a: Dictionary,b: Dictionary) -> int:
 var p: Vector2i = a["position"]
 var q: Vector2i = b["position"]
 return absi(p.x-q.x)+absi(p.y-q.y)

func get_actor(actor_id: String) -> Dictionary:
 for actor in actors:
  if str(actor["id"]) == actor_id:
   return actor
 return {}

func next_turn() -> void:
 if not running:
  return
 current_index += 1
 while current_index < queue.size() and int(queue[current_index]["hp"]) <= 0:
  current_index += 1
 _check_finish()
 if not running:
  return
 if current_index >= queue.size():
  _next_round()

func enemy_step() -> void:
 var actor := current()
 if actor.is_empty() or str(actor["side"]) != "enemy":
  return
 var options := targets("ally")
 if options.is_empty():
  _check_finish()
  return
 options.sort_custom(func(a: Dictionary,b: Dictionary) -> bool: return _distance(actor,a) < _distance(actor,b))
 var target: Dictionary = options[0]
 var dist := _distance(actor,target)
 var ability_range := 6 if str(actor.get("role","")) == "Arauto" else 1
 if dist > ability_range:
  var p: Vector2i = actor["position"]
  var q: Vector2i = target["position"]
  var next_pos := p
  for step in range(mini(maxi(1,int(actor["speed"])/2),dist-ability_range)):
   var candidate := next_pos
   if next_pos.x != q.x:
    candidate.x += 1 if next_pos.x < q.x else -1
   elif next_pos.y != q.y:
    candidate.y += 1 if next_pos.y < q.y else -1
   if occupied(candidate,str(actor["id"])):
    break
   next_pos = candidate
  move_to(next_pos)
 if _distance(actor,target) <= ability_range:
  if int(actor["hp"]) < int(actor["max_hp"])/2 and str(actor.get("role","")) == "Guardião":
   action("guard")
  else:
   action("attack",str(target["id"]))
 else:
  action("guard")

func _check_finish() -> void:
 if targets("enemy").is_empty():
  result = "victory"
  running = false
  _write("Vitoria.")
 elif targets("ally").is_empty():
  result = "defeat"
  running = false
  _write("Derrota.")

func _write(message: String) -> void:
 log_lines.append(message)
 if log_lines.size() > 50:
  log_lines.pop_front()
 event_logged.emit(message)
