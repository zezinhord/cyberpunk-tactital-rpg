extends SceneTree
## Integra cena, criador, inventario, combate e salvamento.
const MAIN = preload("res://scenes/main.tscn")

func _initialize() -> void:
 _run.call_deferred()

func _run() -> void:
 var game: Variant = MAIN.instantiate()
 root.add_child(game)
 await process_frame
 assert(game.title_layer != null)
 game._start_new()
 assert(game.creator_layer.visible)
 game._confirm_character()
 assert(game.playing)
 assert(game.hero != null)
 assert(game.hero.role_name == "Guerreiro")
 assert(game.hero.attrs["f"]+game.hero.attrs["h"]+game.hero.attrs["v"]+game.hero.attrs["m"] == 8)
 assert(game.foes.size() > 0)
 assert(game.inventory.has("Espada gasta"))
 assert(game.inventory.has("Cota de malha"))
 assert(int(game.inventory.get("Machado de ferro",0)) == 0)
 game._equip("Machado de ferro")
 assert(game.equipment["weapon"] == "Espada gasta")
 game.phase = 1
 var enemy: Variant = game.foes[0]
 game._begin_battle(enemy)
 assert(game.combat_active)
 assert(not game.hero.is_physics_processing())
 assert(game.combat.actors.size() >= 2)
 assert(game.combat.running)
 game.combat.result = "defeat"
 game.combat.running = false
 game._conclude_battle()
 game._save_game()
 assert(FileAccess.file_exists("user://tenebria_eco_save.cfg"))
 game._show_start_screen()
 assert(game.title_layer.visible)
 game._resume()
 assert(game.playing)
 assert(game.hero != null)
 assert(game.hero.race_name == "Humano")
 assert(game.level == 1)
 print("PASS integracao cena 3D, criador, turno, inventario, save/load")
 game.queue_free()
 quit(0)
