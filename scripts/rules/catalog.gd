extends RefCounted
## Tenebria Revisado 3.0: catalogo de referencia. Nomes/limites/deslocamento sao do livro.
## Efeitos ainda sem suporte sao bloqueados no criador, jamais convertidos em poderes inventados.

const RACES := {
 "Abominu": {"cap":[5,4,5,6],"move":7}, "Anão":{"cap":[6,5,6,3],"move":6},
 "Ancestral caído":{"cap":[5,5,5,4],"move":8}, "Caminhante obscuro":{"cap":[3,5,5,5],"move":6},
 "Cria da noite":{"cap":[6,3,6,4],"move":8}, "Darklin":{"cap":[4,7,4,4],"move":10},
 "Draconiano":{"cap":[5,4,7,3],"move":7}, "Eco élfico":{"cap":[4,7,4,4],"move":8},
 "Elfo":{"cap":[4,7,4,4],"move":9}, "Fáerio":{"cap":[3,7,4,6],"move":9},
 "Floronic":{"cap":[7,3,4,6],"move":7}, "Forja de Rodania":{"cap":[8,4,5,3],"move":7},
 "Gnomo":{"cap":[5,4,4,7],"move":6}, "Humano":{"cap":[5,5,5,5],"move":8},
 "Meio-elfo":{"cap":[5,5,5,5],"move":7}, "Meio-incarna":{"cap":[4,4,6,6],"move":7},
 "Meio-iluminado":{"cap":[6,3,5,6],"move":9}, "Orgashin":{"cap":[10,5,5,1],"move":6},
 "Penitente":{"cap":[5,5,4,5],"move":9}, "Pequenino":{"cap":[3,6,5,3],"move":6},
 "Rakasha":{"cap":[6,7,4,3],"move":8}, "Roshakan":{"cap":[6,4,6,4],"move":8},
 "Satirino":{"cap":[6,4,6,4],"move":12}, "Vazaio":{"cap":[5,5,5,5],"move":8},
 "Vhanyres":{"cap":[6,5,5,4],"move":7}, "Zashin":{"cap":[6,5,6,3],"move":8},
 "Zetharin":{"cap":[5,5,5,5],"move":7}
}
const CLASSES := [
 "Assecla","Armadilheiro","Bárbaro","Bardo","Bruxo","Cavaleiro da Ordem","Cruzado",
 "Espadachim Oriental","Feiticeiro","Forjador Falso","Gladiador","Guerreiro","Hexacrow",
 "Ilusionista","Ladino","Manipulador da Matéria","Mago","Monge","Moldador de Elemento",
 "Necromante","Ninja Shugenja","Omnia","Patrulheiro","Sacerdote","Selvagem",
 "Sem Caminho","Torre Negra"
]
const PLAYABLE_RACES := ["Humano","Anão","Abominu","Elfo"]
const PLAYABLE_CLASSES := ["Guerreiro","Espadachim Oriental","Mago","Bárbaro"]
# Qualidades implementadas do capitulo QUALIDADES (pp.156-162 do PDF).
const QUALITIES := {
 "Corajoso":{"will":2,"description":"+2 de Vontade"},
 "Corpulento":{"fatigue":1,"description":"+1 de Fadiga; vantagem em forca fisica"},
 "Item Herdado":{"weapon_bonus":1,"description":"+1 dano na arma herdada (obra-prima)"},
 "Erudito":{"lore":1,"description":"Vantagem em testes de historia/Religiao/Natureza/Ocultismo/Planos"}
}
const ABILITIES := {
 "Guerreiro":{"name":"Golpe Decisivo","fatigue":2,"will":0,"page":109,"description":"Vantagem no acerto e +1D4 de dano"},
 "Espadachim Oriental":{"name":"Espada Ancestral","fatigue":0,"will":0,"page":97,"description":"Espada energizada, vantagem por 1D4 rodadas"},
 "Mago":{"name":"Esfera de Pyros","fatigue":0,"will":3,"page":124,"description":"2D4+Mental, area de 2 m, fogo"},
 "Bárbaro":{"name":"Ataque Massivo","fatigue":2,"will":0,"page":81,"description":"+1D4 corpo a corpo"}
}
const ENEMIES := {
 "Errante":{"hp":12,"f":2,"h":1,"v":2,"m":1,"move":5,"armor":0,"attack":4,"xp":1},
 "Portador do Ferrão":{"hp":15,"f":3,"h":2,"v":2,"m":1,"move":6,"armor":1,"attack":5,"xp":1},
 "Corrompido":{"hp":17,"f":2,"h":2,"v":3,"m":2,"move":4,"armor":0,"attack":4,"xp":1},
 "Arauto":{"hp":11,"f":1,"h":3,"v":1,"m":3,"move":6,"armor":0,"attack":5,"xp":1},
 "Guardião":{"hp":43,"f":5,"h":2,"v":4,"m":3,"move":5,"armor":2,"attack":7,"xp":3}
}
const ITEMS := {
 "Espada gasta":{"slot":"weapon","die":6,"bonus":0,"defense":0,"price":2,"desc":"Lamina comum desgastada."},
 "Machado de ferro":{"slot":"weapon","die":8,"bonus":0,"defense":0,"price":7,"desc":"Arma de combate proximo."},
 "Bastão de freixo":{"slot":"weapon","die":4,"bonus":0,"defense":0,"price":4,"desc":"Foco arcano e arma simples."},
 "Arco de teixo":{"slot":"weapon","die":6,"bonus":0,"defense":0,"price":6,"desc":"Arma de ataque a distancia."},
 "Gibão de couro":{"slot":"armor","die":0,"bonus":0,"defense":1,"price":8,"desc":"Protecao leve."},
 "Cota de malha":{"slot":"armor","die":0,"bonus":0,"defense":2,"price":16,"desc":"Protecao media."},
 "Escudo de madeira":{"slot":"shield","die":0,"bonus":0,"defense":1,"price":6,"desc":"Escudo."},
 "Atadura":{"slot":"consumable","die":0,"bonus":0,"defense":0,"price":3,"desc":"Recupera 1D4 PV fora de combate (adaptacao)."},
 "Fragmento Astral":{"slot":"quest","die":0,"bonus":0,"defense":0,"price":0,"desc":"Vestigio enigmatico das guerras antigas."},
 "Erva cinzenta":{"slot":"material","die":0,"bonus":0,"defense":0,"price":1,"desc":"Ingrediente coletado."}
}
static func valid_attributes(race: String, attrs: Dictionary) -> bool:
 if not RACES.has(race):
  return false
 var total := 0
 var caps: Array = RACES[race]["cap"]
 var keys := ["f","h","v","m"]
 for i in range(4):
  var value: int = int(attrs.get(keys[i],0))
  if value < 1 or value > int(caps[i]):
   return false
  total += value
 return total == 8

static func starting_stats(attrs: Dictionary, race: String, qualities: Array) -> Dictionary:
 var f: int = int(attrs["f"])
 var h: int = int(attrs["h"])
 var v: int = int(attrs["v"])
 var m: int = int(attrs["m"])
 var fatigue := f + v
 var will := m + h
 for quality in qualities:
  var effect: Dictionary = QUALITIES.get(str(quality),{})
  fatigue += int(effect.get("fatigue",0))
  will += int(effect.get("will",0))
 # PVS fixos por classe nao estao implementados: PV provisoriamente F+12 (vide mapeamento).
 return {"hp":f+12,"fatigue":fatigue,"will":will,"initiative":h+m,"defense":10+v,"move":int(RACES[race]["move"])}

static func default_equipment(role: String) -> Dictionary:
 if role == "Mago":
  return {"weapon":"Bastão de freixo","armor":"Gibão de couro","shield":""}
 if role == "Bárbaro":
  return {"weapon":"Machado de ferro","armor":"Gibão de couro","shield":""}
 if role == "Espadachim Oriental":
  return {"weapon":"Espada gasta","armor":"Gibão de couro","shield":""}
 return {"weapon":"Espada gasta","armor":"Cota de malha","shield":"Escudo de madeira"}

static func equipment_defense(equipment: Dictionary) -> int:
 var total := 0
 for slot in ["armor","shield"]:
  var item: Dictionary = ITEMS.get(str(equipment.get(slot,"")),{})
  total += int(item.get("defense",0))
 return total
