extends SceneTree
const C = preload("res://scripts/rules/catalog.gd")

func _initialize() -> void:
 assert(C.RACES.size()==27, "Catalogo deve ter 27 racas")
 assert(C.CLASSES.size()==27, "Catalogo deve ter 27 classes")
 for race in C.RACES:
  var data: Dictionary=C.RACES[race]
  assert(data["cap"].size()==4)
  assert(int(data["move"])>0)
 assert(C.valid_attributes("Humano",{"f":2,"h":2,"v":2,"m":2}))
 assert(not C.valid_attributes("Humano",{"f":0,"h":3,"v":3,"m":2}))
 assert(not C.valid_attributes("Humano",{"f":7,"h":1,"v":1,"m":1}))
 var values: Dictionary=C.starting_stats({"f":2,"h":2,"v":2,"m":2},"Humano",["Corajoso","Item Herdado"])
 assert(values["fatigue"]==4)
 assert(values["will"]==6)
 assert(values["defense"]==12)
 assert(C.equipment_defense({"armor":"Cota de malha","shield":"Escudo de madeira"})==3)
 print("PASS catalogo (27/27), limites, qualidades e equipamentos")
 quit(0)
