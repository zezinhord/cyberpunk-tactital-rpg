extends SceneTree
const MAIN = preload("res://scenes/main.tscn")
func _initialize() -> void:
 _run.call_deferred()
func _check(condition: bool, name: String) -> bool:
 if condition:
  print("PASS: "+name)
  return true
 push_error("FALHA INTEGRACAO: "+name)
 quit(1)
 return false
func _run() -> void:
 print("INTEGRACAO: carregando mundo 3D")
 var game: Variant = MAIN.instantiate()
 root.add_child(game)
 await process_frame
 if not _check(game.title_layer!=null,"tela inicial"): return
 game._start_new()
 if not _check(game.creator_layer.visible,"criador aberto"): return
 game._confirm_character()
 if not _check(game.playing,"prologo iniciado"): return
 if not _check(game.hero!=null,"heroi criado"): return
 if not _check(game.foes.size()>0,"inimigos criados"): return
 if not _check(game.inventory.has("Espada gasta"),"equipamento inicial registrado"): return
 game._equip("Machado de ferro")
 if not _check(game.equipment["weapon"]=="Espada gasta","nao equipar item inexistente"): return
 game.phase=1
 print("INTEGRACAO: iniciar combate")
 var foe: Variant=game.foes[0]
 game._begin_battle(foe)
 if not _check(game.combat_active,"combate por turnos"): return
 if not _check(game.combat.actors.size()>=2,"atores na iniciativa"): return
 game.combat.result="defeat"
 game.combat.running=false
 game._conclude_battle()
 print("INTEGRACAO: verificar persistencia")
 game._save_game()
 if not _check(FileAccess.file_exists("user://tenebria_eco_save.cfg"),"arquivo salvo"): return
 game._show_start_screen()
 game._resume()
 if not _check(game.playing,"jogo carregado"): return
 if not _check(game.hero.race_name=="Humano","raca restaurada"): return
 print("PASS integracao geral")
 game.queue_free()
 quit(0)
