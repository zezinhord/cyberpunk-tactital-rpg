extends SceneTree
const SCENE=preload("res://scenes/iso_main.tscn")
func _initialize() -> void:
 run.call_deferred()
func validate(condition: bool,message: String) -> bool:
 if condition:
  print("PASS: "+message)
  return true
 push_error("FAIL: "+message)
 quit(1)
 return false
func run() -> void:
 var game=SCENE.instantiate()
 root.add_child(game)
 await process_frame
 if not validate(game.title_layer!=null,"menu principal"):return
 if not validate(game.world!=null,"mundo 2D isometrico"):return
 game._show_creator()
 if not validate(game.creator_race!=null,"criador de personagem"):return
 game._confirm_creator()
 if not validate(game.playing,"novo jogo"):return
 if not validate(game.player["role"]=="Guerreiro","classe aplicada"):return
 if not validate(game._hero_defense()>10,"equipamento altera defesa"):return
 if not validate(game._save(),"save valido"):return
 game._interact()
 game._choose_hasam("proteger")
 if not validate(game.main_stage==1,"missao principal ativa"):return
 if not validate(game.world.enemies.size()>0,"encontros e inimigos carregados"):return
 var first=game.world.enemies[0]
 game._begin_fight(first)
 if not validate(game.in_battle,"combate iniciado"):return
 if not validate(game.combat.actors.size()>1,"inimigos na fila"):return
 game.combat.result="victory"
 game.combat.active=false
 for foe in game.combat.actors:
  if foe.get("side","")=="enemy":foe["hp"]=0
 game._finish_battle()
 if not validate(not game.in_battle,"combate encerrado"):return
 if not validate(game.defeated.has(str(first["id"])),"inimigo derrotado persiste"):return
 if not validate(game._save(),"persistencia final"):return
 var new_game=SCENE.instantiate()
 root.add_child(new_game)
 await process_frame
 new_game._continue_game()
 if not validate(new_game.playing,"partida carregada"):return
 if not validate(new_game.defeated.has(str(first["id"])),"inimigo nao respawnou"):return
 if not validate(new_game.player["role"]=="Guerreiro","progressao preservada"):return
 print("PASS integracao menu, criador, exploracao, quest, batalha, inventario e save")
 new_game.queue_free()
 game.queue_free()
 quit(0)
