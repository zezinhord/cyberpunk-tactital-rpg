extends RefCounted
## Gravacao atomica com backup da ultima versao. Mantem compatibilidade do app Android.
const PATH="user://tenebria_iso_v2.cfg"
const VERSION=2
var last_error: String=""

func exists() -> bool:
 return FileAccess.file_exists(PATH) or FileAccess.file_exists(PATH+".bak")

func save_state(snapshot: Dictionary) -> bool:
 if snapshot.is_empty() or not snapshot.has("player"):
  last_error="Estado invalido: falta protagonista"
  return false
 var config:=ConfigFile.new()
 config.set_value("meta","version",VERSION)
 config.set_value("meta","format","tenebria_iso_v2")
 config.set_value("game","snapshot",snapshot.duplicate(true))
 var abs_path: String=ProjectSettings.globalize_path(PATH)
 var tmp: String=abs_path+".tmp"
 var err: Error=config.save(tmp)
 if err!=OK:
  last_error="Falha ao escrever arquivo temporario (%d)." % int(err)
  return false
 var verify:=ConfigFile.new()
 if verify.load(tmp)!=OK or int(verify.get_value("meta","version",-1))!=VERSION:
  last_error="Verificacao do arquivo temporario falhou"
  return false
 if FileAccess.file_exists(abs_path):
  DirAccess.copy_absolute(abs_path,abs_path+".bak")
 var renamed: Error=DirAccess.rename_absolute(tmp,abs_path)
 if renamed!=OK:
  last_error="Nao foi possivel finalizar a gravacao (%d)." % int(renamed)
  return false
 last_error=""
 return true

func load_state() -> Dictionary:
 for path in [PATH,PATH+".bak"]:
  var config:=ConfigFile.new()
  if config.load(path)!=OK:continue
  if int(config.get_value("meta","version",-1))!=VERSION:continue
  var record: Variant=config.get_value("game","snapshot",{})
  if typeof(record)!=TYPE_DICTIONARY:continue
  var data: Dictionary=record
  if data.has("player") and data.has("region") and data.has("inventory"):
   last_error=""
   return data.duplicate(true)
 last_error="Nenhum save isometrico valido encontrado"
 return {}

func clear() -> void:
 for path in [PATH,PATH+".bak",PATH+".tmp"]:
  if FileAccess.file_exists(path):
   DirAccess.remove_absolute(ProjectSettings.globalize_path(path))
