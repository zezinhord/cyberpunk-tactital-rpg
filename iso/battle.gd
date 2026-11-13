extends RefCounted
## Motor independente: turno, IA, estado, grid, habilidades, recursos, queda.
## Livro: D20+F/H, iniciativa H+M, defesa 10+V+armadura, fadiga F+V, vontade M+H.
const DATA = preload("res://iso/content.gd")
var actors: Array[Dictionary]=[]
var order: Array[Dictionary]=[]
var index: int=0
var round_number: int=0
var rng:=RandomNumberGenerator.new()
var result: String=""
var logs: Array[String]=[]
var enemy_profile: String=""
var active: bool=false
var rewards: Dictionary={}
var hazard_tiles: Array[Vector2i]=[Vector2i(3,1),Vector2i(4,4),Vector2i(2,5)]
var last_target: String=""
var phase: int=1

func _log(message: String) -> void:
 logs.append(message)
 if logs.size()>80:logs.pop_front()
 print("[COMBATE] "+message)

func begin(allies: Array[Dictionary],hostiles: Array[Dictionary],seed_value: int=0) -> void:
 rng.seed=seed_value if seed_value>0 else Time.get_ticks_msec()
 actors.clear()
 order.clear()
 logs.clear()
 result=""
 round_number=0
 phase=1
 active=true
 rewards={"xp":0,"gold":0,"drops":{}}
 var n:=0
 for a in allies:
  var actor: Dictionary=a.duplicate(true)
  actor["side"]="ally"
  actor["position"]=Vector2i(0,2+n)
  _normalize(actor)
  actors.append(actor)
  n+=1
 n=0
 for e in hostiles:
  var actor: Dictionary=e.duplicate(true)
  actor["side"]="enemy"
  actor["position"]=Vector2i(6,1+n*2)
  if n>2:actor["position"]=Vector2i(7,2+(n-3)*2)
  _normalize(actor)
  actors.append(actor)
  rewards["xp"]=int(rewards["xp"])+int(actor.get("xp_reward",1))
  rewards["gold"]=int(rewards["gold"])+int(actor.get("gold_reward",3))
  n+=1
 _next_round()

func _normalize(a: Dictionary) -> void:
 a["hp"]=maxi(1,int(a.get("hp",12)))
 a["max_hp"]=maxi(int(a.get("max_hp",a["hp"])),int(a["hp"]))
 a["fatigue"]=int(a.get("fatigue",4))
 a["will"]=int(a.get("will",3))
 a["max_fatigue"]=int(a.get("fatigue",4))
 a["max_will"]=int(a.get("will",3))
 a["f"]=int(a.get("f",2))
 a["h"]=int(a.get("h",2))
 a["v"]=int(a.get("v",2))
 a["m"]=int(a.get("m",2))
 a["die"]=int(a.get("die",6))
 a["range"]=int(a.get("range",1))
 a["armor"]=int(a.get("armor",0))
 a["bonus"]=int(a.get("bonus",0))
 a["move"]=int(a.get("move",6))
 a["statuses"]=a.get("statuses",{}).duplicate(true)
 a["spent_action"]=false
 a["spent_move"]=false
 a["guard"]=false
 a["skills"]=a.get("skills",{}).duplicate(true)
 a["potions"]=int(a.get("potions",0))

func current() -> Dictionary:
 if not active or index>=order.size() or index<0:return {}
 return order[index]

func alive(side: String) -> Array[Dictionary]:
 var group: Array[Dictionary]=[]
 for a in actors:
  if str(a["side"])==side and int(a["hp"])>0:group.append(a)
 return group

func get_actor(id: String) -> Dictionary:
 for a in actors:
  if str(a["id"])==id:return a
 return {}

func _next_round() -> void:
 round_number+=1
 order.clear()
 for a in actors:
  if int(a["hp"])<=0:continue
  var effects: Dictionary=a["statuses"]
  if int(effects.get("bleed",0))>0:
   a["hp"]=maxi(0,int(a["hp"])-2)
   effects["bleed"]=int(effects["bleed"])-1
   _log("%s perde 2 PV por sangramento." % a["name"])
  if int(effects.get("burn",0))>0:
   a["hp"]=maxi(0,int(a["hp"])-3)
   effects["burn"]=int(effects["burn"])-1
   _log("%s sofre 3 PV de queimadura." % a["name"])
  if int(effects.get("weak",0))>0:effects["weak"]=int(effects["weak"])-1
  a["spent_action"]=false
  a["spent_move"]=false
  a["guard"]=false
  a["initiative"]=rng.randi_range(1,20)+int(a["h"])+int(a["m"])
  if int(a["hp"])>0:order.append(a)
 order.sort_custom(func(a: Dictionary,b: Dictionary)->bool:return int(a["initiative"])>int(b["initiative"]))
 index=0
 _check_end()
 _log("Rodada %d • iniciativa recalculada." % round_number)

func move(id: String,destination: Vector2i) -> bool:
 var a: Dictionary=current()
 if a.is_empty() or str(a["id"])!=id:return false
 if bool(a["spent_action"]) or bool(a["spent_move"]):return false
 if not walkable(destination,id):return false
 var p: Vector2i=a["position"]
 var distance: int=absi(destination.x-p.x)+absi(destination.y-p.y)
 if distance<1 or distance>maxi(1,int(a["move"])/2):return false
 # Saltos em linha reta sem atravessar unidades; caminho do grid e validado no ponto final.
 a["position"]=destination
 a["spent_move"]=true
 _log("%s deslocou-se %d casas." % [a["name"],distance])
 return true

func walkable(destination: Vector2i,source_id: String="") -> bool:
 if destination.x<0 or destination.x>7 or destination.y<0 or destination.y>6:return false
 if destination in hazard_tiles:return false
 for a in actors:
  if str(a["id"])!=source_id and int(a["hp"])>0 and a["position"]==destination:return false
 return true

func distance(a: Dictionary,b: Dictionary) -> int:
 var pa: Vector2i=a.get("position",Vector2i.ZERO)
 var pb: Vector2i=b.get("position",Vector2i.ZERO)
 return absi(pa.x-pb.x)+absi(pa.y-pb.y)

func defense(a: Dictionary) -> int:
 return 10+int(a["v"])+int(a["armor"])+(2 if bool(a["guard"]) else 0)

func _dice(sides: int) -> int:
 return rng.randi_range(1,maxi(2,sides))

func _skill_for(a: Dictionary,skill_id: String) -> Dictionary:
 for skill in DATA.SKILLS.get(str(a.get("role","")),[]):
  if str(skill["id"])==skill_id:
   return skill
 return {}

func can_skill(a: Dictionary,skill_id: String) -> bool:
 if not a.get("skills",{}).has(skill_id):return false
 var s: Dictionary=_skill_for(a,skill_id)
 if s.is_empty():return false
 return int(a.get(str(s["energy"]),0))>=int(s["cost"])

func do_action(kind: String,target_id: String="",skill_id: String="") -> bool:
 var attacker: Dictionary=current()
 if attacker.is_empty() or bool(attacker["spent_action"]):return false
 var target: Dictionary=get_actor(target_id)
 if kind=="guard":
  attacker["guard"]=true
  attacker["spent_action"]=true
  _log("%s assume uma postura defensiva." % attacker["name"])
  return true
 if kind=="potion":
  if int(attacker["potions"])<=0 or int(attacker["hp"])>=int(attacker["max_hp"]):return false
  attacker["potions"]=int(attacker["potions"])-1
  var healed:=_dice(6)+2
  attacker["hp"]=mini(int(attacker["max_hp"]),int(attacker["hp"])+healed)
  attacker["spent_action"]=true
  _log("%s aplica uma atadura (+%d PV)." % [attacker["name"],healed])
  return true
 var skill: Dictionary={}
 if kind=="skill":
  if not can_skill(attacker,skill_id):return false
  skill=_skill_for(attacker,skill_id)
 var effect: String=str(skill.get("effect","damage"))
 if kind=="skill" and effect=="guard":
  attacker[str(skill["energy"])]=int(attacker[str(skill["energy"])])-int(skill["cost"])
  attacker["guard"]=true
  attacker["spent_action"]=true
  _log("%s ativa %s. Defesa fortalecida." % [attacker["name"],skill["name"]])
  return true
 if target.is_empty() or int(target.get("hp",0))<=0:return false
 var same_team: bool=str(target["side"])==str(attacker["side"])
 if kind=="skill" and effect=="heal":
  if not same_team:return false
 else:
  if same_team:return false
 var reach: int=int(attacker["range"]) if kind=="attack" else int(skill.get("range",1))
 if distance(attacker,target)>reach:return false
 if kind=="skill":
  attacker[str(skill["energy"])]=int(attacker[str(skill["energy"])])-int(skill["cost"])
 attacker["spent_action"]=true
 if kind=="skill" and effect=="heal":
  var amount: int=_dice(int(skill["die"]))+int(attacker["m"])
  target["hp"]=mini(int(target["max_hp"]),int(target["hp"])+amount)
  _log("%s usa %s em %s: +%d PV." % [attacker["name"],skill["name"],target["name"],amount])
  return true
 var ranged: bool=reach>1
 var attack_attribute: int=int(attacker["h"]) if ranged else int(attacker["f"])
 if kind=="skill" and str(attacker["role"]) in ["Mago","Sacerdote"]:
  attack_attribute=int(attacker["m"])
 var roll: int=_dice(20)
 if kind=="skill" and skill_id in ["decisivo","ancestral"]:
  roll=maxi(roll,_dice(20))
 var to_hit: int=roll+attack_attribute-int(attacker["statuses"].get("weak",0))
 var hit: bool=roll==20 or (roll!=1 and to_hit>=defense(target))
 if not hit:
  _log("%s errou %s (D20 %d + %d vs Defesa %d)." % [attacker["name"],target["name"],roll,attack_attribute,defense(target)])
  return true
 var damage: int=_dice(int(attacker["die"]))+attack_attribute+int(attacker["bonus"])
 if kind=="skill":
  damage+=_dice(int(skill.get("die",4))) if int(skill.get("die",0))>0 else 0
 if roll==20:damage+=_dice(4)
 damage=maxi(1,damage)
 target["hp"]=maxi(0,int(target["hp"])-damage)
 _log("%s acerta %s com %s: %d PV (D20 %d)." % [attacker["name"],target["name"],skill.get("name","ataque"),damage,roll])
 if kind=="skill":
  if effect=="bleed":target["statuses"]["bleed"]=2
  elif effect=="fire":target["statuses"]["burn"]=2
  elif effect=="weaken":target["statuses"]["weak"]=2
 if int(target["hp"])==0:_log("%s caiu." % target["name"])
 _check_end()
 return true

func _check_end() -> void:
 if alive("ally").is_empty():
  result="defeat"
  active=false
  _log("O grupo foi derrotado.")
 elif alive("enemy").is_empty():
  result="victory"
  active=false
  _log("VITÓRIA: o grupo sobreviveu.")

func next_turn() -> void:
 if not active:return
 index+=1
 while index<order.size() and int(order[index]["hp"])<=0:
  index+=1
 if index>=order.size():_next_round()
 _check_end()

func enemy_turn() -> void:
 var a: Dictionary=current()
 if a.is_empty() or str(a["side"])!="enemy":return
 var options: Array[Dictionary]=alive("ally")
 if options.is_empty():_check_end();return
 options.sort_custom(func(x: Dictionary,y: Dictionary)->bool:
  var dx:int=distance(a,x)
  var dy:int=distance(a,y)
  return dx<dy if dx!=dy else int(x["hp"])<int(y["hp"]))
 var target: Dictionary=options[0]
 var use_range: int=int(a["range"])
 if int(a["hp"])<int(a["max_hp"])/3 and str(a.get("role","")) in ["Arauto de Ruturam","Guardião das Chaves"] and not bool(a["spent_action"]):
  a["guard"]=true
  a["spent_action"]=true
  _log("%s ergue uma barreira de ossos." % a["name"])
  return
 if distance(a,target)>use_range:
  var p: Vector2i=a["position"]
  var q: Vector2i=target["position"]
  var limit: int=maxi(1,int(a["move"])/2)
  for _n in range(limit):
   var d: Vector2i=p
   if p.x!=q.x:d.x+=1 if p.x<q.x else -1
   elif p.y!=q.y:d.y+=1 if p.y<q.y else -1
   if not walkable(d,str(a["id"])):break
   p=d
  if p!=a["position"]:
   move(str(a["id"]),p)
 if distance(a,target)<=use_range:
  do_action("attack",str(target["id"]))
 else:
  do_action("guard")

func boss_rage() -> void:
 # Fase final anunciada e ativada quando o chefe cai a 50% de PV.
 for a in alive("enemy"):
  if str(a.get("role","")) in ["Guardião das Chaves","Arauto de Ruturam"]:
   if int(a["hp"])<=int(a["max_hp"])/2 and int(a.get("rage",0))==0:
    a["rage"]=1
    a["f"]=int(a["f"])+2
    a["die"]=int(a["die"])+2
    _log("%s rompe o selo! Ataques fortalecidos." % a["name"])
    phase=2
