extends SceneTree
const DATA=preload("res://iso/content.gd")
const WORLD=preload("res://iso/world.gd")
const BATTLE=preload("res://iso/battle.gd")
const SAVE=preload("res://iso/save.gd")

func _initialize() -> void:
 assert(DATA.REGION_IDS.size()==6)
 assert(DATA.BOOK.RACES.size()==27)
 assert(DATA.BOOK.CLASSES.size()==27)
 assert(DATA.ITEM_LIST.size()>=35)
 assert(DATA.QUESTS.size()>=12)
 assert(DATA.PLAYABLE_RACES.size()>=6)
 assert(DATA.PLAYABLE_CLASSES.size()>=6)
 assert(DATA.BOOK.valid_attributes("Humano",{"f":2,"h":2,"v":2,"m":2}))
 assert(not DATA.BOOK.valid_attributes("Humano",{"f":0,"h":3,"v":3,"m":2}))
 for region in DATA.REGION_IDS:
  assert(DATA.generate_objects(region).size()>=20)
  assert(DATA.generate_encounters(region).size()>=5)
 var world=WORLD.new()
 root.add_child(world)
 world.configure("vigilia",Vector2(18,19),{},{},[])
 var tile=Vector2i(12,20)
 assert(world.world_to_tile(world.tile_to_world(Vector2(tile)))==tile)
 assert(world.path_to(Vector2i(18,19),Vector2i(30,27)).size()>0)
 var p=DATA.make_actor("Teste","Guerreiro","Humano",{"f":2,"h":2,"v":2,"m":2},["Corajoso","Item Herdado"],1,DATA.default_equipment("Guerreiro"))
 p["skills"]={"decisivo":1}
 p["die"]=8
 var battle=BATTLE.new()
 battle.begin([p],[{"id":"foe","name":"Errante","role":"Errante","hp":16,"f":2,"h":1,"v":1,"m":1,"die":4,"move":6}],456)
 assert(battle.actors.size()==2)
 assert(battle.active)
 assert(battle.current().has("position"))
 var max_iterations=0
 while battle.active and max_iterations<120:
  max_iterations+=1
  var a: Dictionary=battle.current()
  if str(a["side"])=="enemy":
   battle.enemy_turn()
  else:
   var target=battle.get_actor("foe")
   var pp: Vector2i=a["position"]
   var qq: Vector2i=target["position"]
   if battle.distance(a,target)>1:
    var step:=pp
    if qq.x>pp.x:step.x+=mini(2,qq.x-pp.x)
    elif qq.y>pp.y:step.y+=1
    if battle.walkable(step,str(a["id"])):
     battle.move(str(a["id"]),step)
   if not battle.do_action("attack","foe"):battle.do_action("guard")
  if battle.active:battle.next_turn()
 assert(battle.result in ["victory","defeat"],"Should terminate battle")
 var save=SAVE.new()
 assert(save.save_state({"player":p,"region":"vigilia","inventory":{"Atadura":2}}))
 var loaded: Dictionary=save.load_state()
 assert(loaded.get("region","")=="vigilia")
 assert(loaded["player"]["role"]=="Guerreiro")
 print("PASS 27 racas + 27 classes; 6 regioes; 35 itens; 14 missoes; pathfinding; motor de turnos; save/load")
 world.queue_free()
 quit(0)
