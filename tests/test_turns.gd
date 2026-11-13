extends SceneTree
const Combat = preload("res://scripts/systems/turn_combat.gd")

func _initialize() -> void:
 var engine=Combat.new()
 var allies: Array[Dictionary]=[{"id":"heroi","name":"Heroi","role":"Guerreiro","hp":60,"f":5,"h":3,"v":3,"m":2,"move":8,"fatigue":8,"will":5,"weapon_die":8,"potions":2}]
 var enemies: Array[Dictionary]=[{"id":"inimigo","name":"Errante","role":"Errante","hp":15,"f":2,"h":2,"v":1,"m":1,"move":5,"weapon_die":4}]
 engine.start(allies,enemies,123456)
 assert(engine.running)
 assert(engine.actors.size()==2)
 var limit:=0
 while engine.running and limit<150:
  limit+=1
  var actor: Dictionary=engine.current()
  if actor.is_empty():
   break
  if str(actor["side"])=="enemy":
   engine.enemy_step()
  else:
   var goal:=Vector2i(4,0)
   if actor["position"]!=goal and not bool(actor["move_used"]):
    var p: Vector2i=actor["position"]
    engine.move_to(Vector2i(mini(4,p.x+3),p.y))
   if not engine.action("attack","inimigo"):
    engine.action("guard")
  if engine.running:
   engine.next_turn()
 assert(engine.result=="victory","Combat should finish with victory, got "+engine.result)
 assert(engine.round_number>=1)
 assert(engine.log_lines.size()>0)
 print("PASS combate por turnos, iniciativa, alcance, IA e resultado")
 quit(0)
