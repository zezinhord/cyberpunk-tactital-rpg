extends Node2D
## Render 2D isometrico procedural. Nenhum modelo 3D, GPU modesta.
const DATA = preload("res://iso/content.gd")
const TW: float=74.0
const TH: float=38.0
const SIZE := Vector2i(38,36)

var region_id: String="vigilia"
var hero_race: String="Humano"
var hero_class: String="Guerreiro"
var player_tile: Vector2=Vector2(18,19)
var npcs: Array[Dictionary]=[]
var enemies: Array[Dictionary]=[]
var objects: Array[Dictionary]=[]
var companions: Array[Dictionary]=[]
var found: Dictionary={}
var defeated: Dictionary={}
var combat_mode: bool=false
var battle_actors: Array[Dictionary]=[]
var focus_tile:=Vector2i(-1,-1)
var zone_time: float=0.0
var weather_phase: float=0.0
var current_steps: Array[Vector2i]=[]
var redrawn: float=0.0

func configure(region: String,hero_tile: Vector2,removed: Dictionary,dead: Dictionary,party: Array[Dictionary]) -> void:
 region_id=region
 player_tile=hero_tile
 found=removed
 defeated=dead
 npcs.clear()
 for npc in DATA.NPCS.get(region,[]):
  npcs.append(npc.duplicate(true))
 objects=DATA.generate_objects(region)
 enemies=DATA.generate_encounters(region)
 companions.clear()
 for ally in party:
  companions.append(ally.duplicate(true))
 combat_mode=false
 current_steps.clear()
 focus_tile=Vector2i(-1,-1)
 queue_redraw()

func set_battle(actors: Array[Dictionary]) -> void:
 combat_mode=true
 battle_actors=actors
 queue_redraw()

func end_battle() -> void:
 combat_mode=false
 battle_actors.clear()
 queue_redraw()

func set_player(tile: Vector2) -> void:
 player_tile=tile
 queue_redraw()

func tile_to_world(tile: Vector2) -> Vector2:
 return Vector2((tile.x-tile.y)*TW*0.5,(tile.x+tile.y)*TH*0.5)

func world_to_tile(p: Vector2) -> Vector2i:
 var a: float=p.x/(TW*0.5)
 var b: float=p.y/(TH*0.5)
 return Vector2i(roundi((a+b)*0.5),roundi((b-a)*0.5))

func in_bounds(p: Vector2i) -> bool:
 return p.x>=1 and p.y>=1 and p.x<SIZE.x-1 and p.y<SIZE.y-1

func walkable(p: Vector2i) -> bool:
 return in_bounds(p)

func path_to(from: Vector2i,to: Vector2i) -> Array[Vector2i]:
 var out: Array[Vector2i]=[]
 if not walkable(to): return out
 var queue: Array[Vector2i]=[from]
 var visited: Dictionary={from:true}
 var previous: Dictionary={}
 var head:=0
 while head<queue.size() and head<1800:
  var p: Vector2i=queue[head]
  head+=1
  if p==to: break
  for step in [Vector2i(1,0),Vector2i(-1,0),Vector2i(0,1),Vector2i(0,-1)]:
   var q: Vector2i=p+step
   if walkable(q) and not visited.has(q):
    visited[q]=true
    previous[q]=p
    queue.append(q)
 if not visited.has(to): return out
 var p: Vector2i=to
 while p!=from and out.size()<150:
  out.push_front(p)
  p=previous[p]
 return out

func entity_at(tile: Vector2i,from_tile: Vector2i) -> Dictionary:
 var nearest_dist:=999
 var found_entity: Dictionary={}
 for obj in objects:
  if found.has(str(obj["id"])):continue
  var p:=Vector2i(int(obj["at"][0]),int(obj["at"][1]))
  if p==tile and nearest_dist>0:
   found_entity={"kind":"object","entry":obj}
   nearest_dist=0
 for npc in npcs:
  var p:=Vector2i(int(npc["at"][0]),int(npc["at"][1]))
  if p==tile:
   found_entity={"kind":"npc","entry":npc}
   nearest_dist=0
 for foe in enemies:
  if defeated.has(str(foe["id"])):continue
  var p:=Vector2i(int(foe["at"][0]),int(foe["at"][1]))
  if p==tile:
   found_entity={"kind":"enemy","entry":foe}
   nearest_dist=0
 for door in DATA.REGIONS[region_id]["exits"]:
  var p:=Vector2i(int(door["at"][0]),int(door["at"][1]))
  if p==tile:
   found_entity={"kind":"exit","entry":door}
 return found_entity

func nearest_interactable(hero: Vector2i,max_distance: int=2) -> Dictionary:
 var nearest: Dictionary={}
 var dist:=max_distance+1
 for npc in npcs:
  var pos:=Vector2i(int(npc["at"][0]),int(npc["at"][1]))
  var d:=absi(pos.x-hero.x)+absi(pos.y-hero.y)
  if d<dist:
   dist=d
   nearest={"kind":"npc","entry":npc}
 for obj in objects:
  if found.has(str(obj["id"])):continue
  var pos:=Vector2i(int(obj["at"][0]),int(obj["at"][1]))
  var d:=absi(pos.x-hero.x)+absi(pos.y-hero.y)
  if d<dist:
   dist=d
   nearest={"kind":"object","entry":obj}
 for foe in enemies:
  if defeated.has(str(foe["id"])):continue
  var pos:=Vector2i(int(foe["at"][0]),int(foe["at"][1]))
  var d:=absi(pos.x-hero.x)+absi(pos.y-hero.y)
  if d<dist:
   dist=d
   nearest={"kind":"enemy","entry":foe}
 for door in DATA.REGIONS[region_id]["exits"]:
  var pos:=Vector2i(int(door["at"][0]),int(door["at"][1]))
  var d:=absi(pos.x-hero.x)+absi(pos.y-hero.y)
  if d<dist:
   dist=d
   nearest={"kind":"exit","entry":door}
 return nearest

func _process(delta: float) -> void:
 weather_phase+=delta
 redrawn+=delta
 if redrawn>=0.12:
  redrawn=0.0
  queue_redraw()

func _stable_noise(x: int,y: int,seed: int=0) -> int:
 var n: int=(x*92837111+y*689287499+str(region_id).length()*113+seed*971) & 2147483647
 n=(n^(n>>12))*152471 & 2147483647
 return n & 1023

func _hex(c: String) -> Color:
 return Color("#"+c)

func _diamond(p: Vector2,scale_size: float=1.0) -> PackedVector2Array:
 return PackedVector2Array([
  p+Vector2(0,-TH*.5*scale_size),p+Vector2(TW*.5*scale_size,0),
  p+Vector2(0,TH*.5*scale_size),p+Vector2(-TW*.5*scale_size,0)
 ])

func _base_tile(x: int,y: int) -> Color:
 var reg: Dictionary=DATA.REGIONS[region_id]
 var col: Color=_hex(str(reg["color"]))
 var noise: float=float(_stable_noise(x,y))/1023.0
 col=col.lightened((noise-.5)*.18)
 var road: bool=(absf(float(x-18))<2.2 or absf(float(y-18))<2.2) or absf(float(x-y))<1.3
 match str(reg["biome"]):
  "town":
   if road:col=_hex("565052").lightened((noise-.5)*.1)
  "forest":
   if road:col=_hex("455046")
   elif noise>.82:col=_hex("293a32")
  "swamp":
   if noise>.84:col=_hex("283c40")
   elif road:col=_hex("4f4c42")
  "crypt":
   if (x+y)%7==0:col=_hex("50505b")
  "fortress":
   if (x%9==0 or y%9==0):col=_hex("61565b")
  "abyss":
   if noise>.75:col=_hex("593b54")
 return col

func _draw() -> void:
 if combat_mode:
  _draw_combat()
  return
 var region: Dictionary=DATA.REGIONS[region_id]
 for total in range(SIZE.x+SIZE.y):
  for x in range(SIZE.x):
   var y: int=total-x
   if y<0 or y>=SIZE.y:continue
   var center:=tile_to_world(Vector2(x,y))
   var pts:=_diamond(center)
   draw_colored_polygon(pts,_base_tile(x,y))
   if x==0 or y==0 or x==SIZE.x-1 or y==SIZE.y-1:
    draw_polyline(PackedVector2Array([pts[0],pts[1],pts[2],pts[3],pts[0]]),_hex("191b22"),1.0)
   elif (x+y)%7==0:
    draw_line(center+Vector2(-12,3),center+Vector2(-5,7),Color(0.88,0.79,0.68,0.035),1.0)
 for total in range(SIZE.x+SIZE.y+3):
  for x in range(SIZE.x):
   var y: int=total-x
   if y<2 or y>=SIZE.y-2:continue
   var n: int=_stable_noise(x,y)
   var clear: bool=(absf(float(x-18))<2.2 or absf(float(y-18))<2.2) or absf(float(x-y))<1.2
   if not clear and n>978 and region_id!="cripta":
    _draw_tree(tile_to_world(Vector2(x,y)),n)
   elif not clear and n>922 and n<932:
    _draw_stone(tile_to_world(Vector2(x,y)),n)
   if region_id=="vigilia" and (x==8 or x==30) and y>=9 and y<=25 and y%6==0:
    _draw_house(tile_to_world(Vector2(x,y)),n)
   if region_id in ["fortaleza","cripta"] and (x==7 or x==30) and y%9==0 and y>5 and y<30:
    _draw_pillar(tile_to_world(Vector2(x,y)))
   if region_id=="ruturam" and n>980:
    _draw_flame(tile_to_world(Vector2(x,y)),1.0)
 var things: Array[Dictionary]=[]
 for obj in objects:
  if found.has(str(obj["id"])):continue
  things.append({"sort":int(obj["at"][0])+int(obj["at"][1]),"tile":Vector2(int(obj["at"][0]),int(obj["at"][1])),"kind":"object","entry":obj})
 for npc in npcs:
  things.append({"sort":int(npc["at"][0])+int(npc["at"][1]),"tile":Vector2(int(npc["at"][0]),int(npc["at"][1])),"kind":"npc","entry":npc})
 for enemy in enemies:
  if defeated.has(str(enemy["id"])):continue
  things.append({"sort":int(enemy["at"][0])+int(enemy["at"][1]),"tile":Vector2(int(enemy["at"][0]),int(enemy["at"][1])),"kind":"enemy","entry":enemy})
 for door in region["exits"]:
  things.append({"sort":int(door["at"][0])+int(door["at"][1]),"tile":Vector2(int(door["at"][0]),int(door["at"][1])),"kind":"exit","entry":door})
 for i in range(companions.size()):
  var displacement:=Vector2(0,1.4+i*.8)
  things.append({"sort":int(player_tile.x+player_tile.y)+1+i,"tile":player_tile+displacement,"kind":"companion","entry":companions[i]})
 things.append({"sort":int(player_tile.x+player_tile.y),"tile":player_tile,"kind":"hero","entry":{}})
 things.sort_custom(func(a: Dictionary,b: Dictionary)->bool:return int(a["sort"])<int(b["sort"]))
 for thing in things:
  var pos: Vector2=tile_to_world(thing["tile"])
  match str(thing["kind"]):
   "object":_draw_object(pos,thing["entry"])
   "npc":_draw_actor(pos,str(thing["entry"]["look"]),str(thing["entry"]["name"]),false)
   "enemy":
    var kind: String=str(thing["entry"]["name"])
    var look: String=str(DATA.ENEMY_TYPES[kind]["look"])
    _draw_actor(pos,look,kind,true)
   "exit":
    _draw_portal(pos,str(thing["entry"]["to"]))
   "hero":
    _draw_actor(pos,"hero","VOCÊ",false)
   "companion":
    var role: String=str(thing["entry"].get("class","Mago"))
    _draw_actor(pos,"mage" if role=="Mago" else ("cleric" if role=="Sacerdote" else "guard"),str(thing["entry"].get("name","Aliado")),false)
 if focus_tile.x>=0:
  var f:=tile_to_world(Vector2(focus_tile))
  var poly:=_diamond(f,0.85)
  draw_polyline(PackedVector2Array([poly[0],poly[1],poly[2],poly[3],poly[0]]),Color("dcc184"),2.0)
 for step in current_steps:
  draw_circle(tile_to_world(Vector2(step))+Vector2(0,5),3.0,Color("b3cfb1",0.5))
 _draw_screen_vignette_text()

func _draw_screen_vignette_text() -> void:
 # Atmosfera: particulas em tela transformadas para coordenadas do mapa.
 for i in range(40):
  var shift: float=weather_phase*4.0
  var px:float=sin(float(i)*31.7+shift*.02)*900.0
  var py:float=cos(float(i)*21.8+shift*.03)*550.0
  draw_circle(Vector2(px,py),0.7,Color(0.82,0.79,0.72,0.07))

func _draw_tree(p: Vector2,seed: int) -> void:
 var height: float=42.0+float(seed%29)
 draw_ellipse_shadow(p,20.0,7.0)
 draw_line(p,p+Vector2(-5,-height),_hex("252329"),5.0)
 for k in range(4):
  var branch: Vector2=p+Vector2(-4,-height*.25-float(k)*height*.16)
  draw_line(branch,branch+Vector2((-1 if k%2==0 else 1)*(18+k*3),-17),_hex("25262c"),2.6)
 var col:Color=_hex("293a36") if region_id in ["bosque","vigilia"] else _hex("34343d")
 draw_circle(p+Vector2(-4,-height),19.0,col)
 draw_circle(p+Vector2(-15,-height+8),13.0,col.darkened(.1))
 draw_circle(p+Vector2(11,-height+5),13.0,col.lightened(.05))
 draw_circle(p+Vector2(-9,-height-12),9.0,Color(0.54,0.65,0.58,0.1))

func _draw_stone(p: Vector2,seed: int) -> void:
 draw_ellipse_shadow(p,15,5)
 var col:=_hex("595760")
 draw_colored_polygon(PackedVector2Array([p+Vector2(-14,-2),p+Vector2(-4,-17),p+Vector2(12,-13),p+Vector2(17,-2)]),col)
 draw_line(p+Vector2(-4,-17),p+Vector2(3,-3),col.lightened(.21),1.5)

func draw_ellipse_shadow(p: Vector2,rx: float,ry: float) -> void:
 draw_set_transform(p,0.0,Vector2(1.0,ry/maxf(1.0,rx)))
 draw_circle(Vector2.ZERO,rx,Color(0.03,0.03,0.05,0.35))
 draw_set_transform(Vector2.ZERO)

func _draw_house(p: Vector2,seed: int) -> void:
 draw_ellipse_shadow(p+Vector2(0,3),40,13)
 var brick:=_hex("55484b")
 draw_colored_polygon(PackedVector2Array([p+Vector2(-35,-12),p+Vector2(0,-28),p+Vector2(31,-10),p+Vector2(31,11),p+Vector2(0,26),p+Vector2(-35,9)]),brick)
 draw_colored_polygon(PackedVector2Array([p+Vector2(-42,-25),p+Vector2(0,-53),p+Vector2(37,-27),p+Vector2(0,-7)]),_hex("302d38"))
 draw_line(p+Vector2(-42,-25),p+Vector2(0,-53),_hex("9a7160"),2.4)
 draw_rect(Rect2(p+Vector2(5,-7),Vector2(12,17)),_hex("23242a"))
 draw_rect(Rect2(p+Vector2(-24,-11),Vector2(10,9)),_hex("9a7549"))
 draw_circle(p+Vector2(13,1),2.3,_hex("d7ad74"))

func _draw_pillar(p: Vector2) -> void:
 draw_ellipse_shadow(p,15,6)
 draw_rect(Rect2(p+Vector2(-8,-45),Vector2(16,46)),_hex("54515b"))
 draw_colored_polygon(PackedVector2Array([p+Vector2(-12,-46),p+Vector2(0,-56),p+Vector2(14,-45),p+Vector2(2,-38)]),_hex("847579"))
 draw_line(p+Vector2(-7,-42),p+Vector2(-7,-6),_hex("79717b"),2)

func _draw_flame(p: Vector2,scale: float) -> void:
 var flicker:float=sin(weather_phase*3.0+p.x)*4.0
 draw_circle(p+Vector2(0,-18),18.0*scale,Color("b5426a",0.10))
 draw_colored_polygon(PackedVector2Array([p+Vector2(-9,0)*scale,p+Vector2(-3,-23)*scale,p+Vector2(4+flicker,-38)*scale,p+Vector2(10,0)*scale]),_hex("a64a71"))
 draw_colored_polygon(PackedVector2Array([p+Vector2(-4,0)*scale,p+Vector2(0,-21)*scale,p+Vector2(4,0)*scale]),_hex("e3a479"))

func _draw_object(p: Vector2,entry: Dictionary) -> void:
 var kind: String=str(entry["kind"])
 match kind:
  "forage":
   draw_ellipse_shadow(p,13,5)
   var col:=_hex("8caa84") if str(entry["name"])=="Erva Cinzenta" else _hex("b3a07d")
   draw_line(p+Vector2(0,-1),p+Vector2(-3,-17),col,3)
   for i in range(3):
    draw_circle(p+Vector2((i-1)*7,-10+(i%2)*5),5,col)
  "chest":
   draw_ellipse_shadow(p,20,6)
   draw_colored_polygon(PackedVector2Array([p+Vector2(-15,-9),p+Vector2(0,-16),p+Vector2(19,-8),p+Vector2(19,7),p+Vector2(-15,7)]),_hex("674c3e"))
   draw_line(p+Vector2(-14,-10),p+Vector2(18,-7),_hex("c6a370"),3)
   draw_rect(Rect2(p+Vector2(2,-7),Vector2(6,11)),_hex("d6b47a"))
  "shrine":
   _draw_pillar(p)
   draw_circle(p+Vector2(0,-36),15,Color("cab587",0.19))
   draw_circle(p+Vector2(0,-36),5,_hex("dbc29e"))
  "lore":
   _draw_stone(p,915)
   draw_line(p+Vector2(-4,-11),p+Vector2(8,-4),_hex("d0a07f"),2)
   draw_line(p+Vector2(-3,-7),p+Vector2(4,-14),_hex("d0a07f"),2)

func _draw_portal(p: Vector2,to_region: String) -> void:
 draw_ellipse_shadow(p,24,8)
 draw_arc(p+Vector2(0,-15),23,PI,TAU,18,_hex("ad8f8a"),4.0)
 draw_circle(p+Vector2(0,-14),19,Color(0.5,0.2,0.42,0.14))
 draw_line(p+Vector2(-5,-32),p+Vector2(5,-32),_hex("e2b88e"),2.0)
 draw_string(ThemeDB.fallback_font,p+Vector2(-31,-46),"PASSAGEM",HORIZONTAL_ALIGNMENT_LEFT,-1,10,_hex("e0c093"))

func _draw_actor(p: Vector2,look: String,label: String,hostile: bool=false) -> void:
 draw_ellipse_shadow(p,18,5)
 var head:=_hex("b29b8f")
 var body:=_hex("56536b")
 var steel:=_hex("8c96a2")
 var face:float=0.0
 match look:
  "hero":
   body=_hex("384e65")
   head=_hex("bca38e")
   match hero_race:
    "Anão":
     body=_hex("687275")
     head=_hex("be9c83")
    "Elfo":
     body=_hex("465d69")
     head=_hex("c4b7ac")
    "Abominu":
     body=_hex("777788")
     head=_hex("d4c3c4")
    "Darklin":
     body=_hex("4b415f")
     head=_hex("8e7a95")
    "Draconiano":
     body=_hex("415b66")
     head=_hex("7da4a2")
  "elder":body=_hex("807466")
  "trader":body=_hex("897252")
  "mage":body=_hex("63537f")
  "cleric":body=_hex("d8c3a3")
  "guard":body=_hex("626f70")
  "hunter":body=_hex("576e59")
  "alchemist":body=_hex("7c8161")
  "scholar":body=_hex("715f6a")
  "poor":body=_hex("666065")
  "spirit":body=Color("789bac",0.72)
  "husk":body=_hex("5c4f58");head=_hex("91928e")
  "cult":body=_hex("56374c")
  "hound":body=_hex("514e54");head=_hex("76736f")
  "insect":body=_hex("684b6f")
  "knight":body=_hex("444452");head=_hex("9d9697")
  "archer":body=_hex("495762")
  "golem":body=_hex("656269")
  "boss":body=_hex("71394e");head=_hex("b4a1a1")
 draw_line(p+Vector2(-7,-7),p+Vector2(-9,0),_hex("252b36"),5.0)
 draw_line(p+Vector2(7,-7),p+Vector2(8,0),_hex("252b36"),5.0)
 var chest:=PackedVector2Array([p+Vector2(-13,-33),p+Vector2(13,-33),p+Vector2(15,-6),p+Vector2(-15,-6)])
 draw_colored_polygon(chest,body)
 draw_colored_polygon(PackedVector2Array([p+Vector2(-10,-33),p+Vector2(-5,-45),p+Vector2(10,-39),p+Vector2(14,-32)]),body.darkened(.23))
 draw_circle(p+Vector2(0,-43),10,head)
 draw_line(p+Vector2(-12,-33),p+Vector2(-19,-13),body.lightened(.2),5.0)
 draw_line(p+Vector2(12,-33),p+Vector2(16,-15),body.lightened(.1),5.0)
 if look in ["hero","knight","guard","boss","husk"]:
  draw_line(p+Vector2(16,-15),p+Vector2(27,-47),steel,3.0)
  draw_line(p+Vector2(12,-30),p+Vector2(27,-30),_hex("ad8b63"),3.0)
 if look in ["mage","cleric","alchemist","spirit"]:
  draw_line(p+Vector2(-20,-8),p+Vector2(-24,-54),_hex("a79885"),3.0)
  draw_circle(p+Vector2(-24,-55),5.5,_hex("c49dbd"))
 if look in ["husk","boss","insect"]:
  draw_circle(p+Vector2(-4,-45),2.2,_hex("ea557c"))
  draw_circle(p+Vector2(4,-45),2.2,_hex("ea557c"))
 else:
  draw_circle(p+Vector2(-4,-43),1.4,_hex("33353c"))
  draw_circle(p+Vector2(4,-43),1.4,_hex("33353c"))
 if look in ["insect","boss"]:
  draw_line(p+Vector2(-7,-52),p+Vector2(-18,-67),body.lightened(.35),3.0)
  draw_line(p+Vector2(7,-52),p+Vector2(18,-67),body.lightened(.35),3.0)
 if look=="hound":
  draw_circle(p+Vector2(-11,-27),8,head)
  draw_circle(p+Vector2(12,-19),7,head)
 if look=="golem":
  draw_rect(Rect2(p+Vector2(-16,-49),Vector2(32,38)),body)
  draw_rect(Rect2(p+Vector2(-5,-41),Vector2(10,4)),_hex("d26d7d"))
 if look=="hero":
  draw_line(p+Vector2(-14,-8),p+Vector2(14,-8),_hex("d4ab70"),3)
  match hero_race:
   "Anão":
    draw_colored_polygon(PackedVector2Array([p+Vector2(-8,-38),p+Vector2(0,-23),p+Vector2(8,-38)]),_hex("73574d"))
    draw_rect(Rect2(p+Vector2(-12,-54),Vector2(24,7)),_hex("87989e"))
   "Elfo":
    draw_colored_polygon(PackedVector2Array([p+Vector2(-9,-47),p+Vector2(-25,-52),p+Vector2(-9,-41)]),head)
    draw_colored_polygon(PackedVector2Array([p+Vector2(9,-47),p+Vector2(25,-52),p+Vector2(9,-41)]),head)
    draw_line(p+Vector2(-6,-54),p+Vector2(7,-57),_hex("d9dade"),4)
   "Abominu":
    draw_colored_polygon(PackedVector2Array([p+Vector2(-12,-48),p+Vector2(0,-56),p+Vector2(0,-7),p+Vector2(-12,-6)]),_hex("dbd4d8"))
    draw_circle(p+Vector2(-4,-43),2.2,_hex("d94c70"))
    draw_circle(p+Vector2(4,-43),2.2,_hex("8fd6d1"))
   "Darklin":
    draw_line(p+Vector2(-7,-50),p+Vector2(-16,-63),_hex("9b79be"),4)
    draw_line(p+Vector2(7,-50),p+Vector2(16,-63),_hex("9b79be"),4)
    draw_circle(p+Vector2(0,-32),5.0,Color("9c5eb8",.27))
   "Draconiano":
    draw_colored_polygon(PackedVector2Array([p+Vector2(-11,-49),p+Vector2(-19,-62),p+Vector2(-3,-52)]),_hex("9bc8bd"))
    draw_colored_polygon(PackedVector2Array([p+Vector2(11,-49),p+Vector2(19,-62),p+Vector2(3,-52)]),_hex("9bc8bd"))
    for j in range(3):
     draw_line(p+Vector2(-10+j*9,-32),p+Vector2(-10+j*9,-15),_hex("6bb2a7"),2)
  match hero_class:
   "Mago","Sacerdote":
    draw_line(p+Vector2(-17,-16),p+Vector2(-20,-65),_hex("b9a5a5"),3)
    draw_circle(p+Vector2(-20,-65),5,_hex("ad7cb2"))
   "Patrulheiro":
    draw_arc(p+Vector2(19,-28),13,-PI*.75,PI*.75,12,_hex("c7a77d"),3)
    draw_line(p+Vector2(10,-37),p+Vector2(26,-19),_hex("dacbb0"),1)
   "Bárbaro":
    draw_line(p+Vector2(18,-16),p+Vector2(18,-62),_hex("8c705e"),4)
    draw_rect(Rect2(p+Vector2(13,-62),Vector2(20,13)),_hex("94969c"))
 if hostile:
  draw_circle(p+Vector2(0,-59),3.5,_hex("ed6676"))
 var tag_color:=_hex("e8c99c") if look in ["hero","elder","trader","mage","cleric","guard","hunter","scholar","alchemist","poor","spirit"] else _hex("dc9294")
 draw_string(ThemeDB.fallback_font,p+Vector2(-minf(60.0,float(label.length()*3.0)),-72),label.substr(0,20),HORIZONTAL_ALIGNMENT_LEFT,-1,11,tag_color)

func _draw_combat() -> void:
 # Tabuleiro isometrico proprio, sem cenas 3D na batalha.
 for depth in range(16):
  for x in range(8):
   var y: int=depth-x
   if y<0 or y>=7:continue
   var t:=Vector2(float(x-4),float(y-3))
   var p:=tile_to_world(t)
   var base:=_hex("55505b") if (x+y)%2==0 else _hex("48464f")
   draw_colored_polygon(_diamond(p),base)
   var points:=_diamond(p)
   draw_polyline(PackedVector2Array([points[0],points[1],points[2],points[3],points[0]]),_hex("726873"),1.2)
 for actor in battle_actors:
  if int(actor.get("hp",0))<=0:continue
  var pos: Vector2i=actor.get("position",Vector2i(0,0))
  var p: Vector2=tile_to_world(Vector2(float(pos.x-4),float(pos.y-3)))
  var hostile: bool=str(actor.get("side",""))=="enemy"
  var look: String="boss" if str(actor.get("role","")) in ["Guardião das Chaves","Arauto de Ruturam"] else ("husk" if hostile else ("hero" if str(actor.get("id",""))=="hero" else "mage"))
  _draw_actor(p,look,str(actor.get("name","")),hostile)
  draw_rect(Rect2(p+Vector2(-19,-79),Vector2(38,4)),_hex("20212d"))
  var hp_max: float=maxf(1.0,float(actor.get("max_hp",1)))
  draw_rect(Rect2(p+Vector2(-19,-79),Vector2(38.0*float(actor["hp"])/hp_max,4)),_hex("bb596a") if hostile else _hex("86b9a4"))
 draw_string(ThemeDB.fallback_font,Vector2(-125,-220),"TRIBUNAL DO AÇO  •  TURNOS",HORIZONTAL_ALIGNMENT_LEFT,-1,17,_hex("e4c48f"))
