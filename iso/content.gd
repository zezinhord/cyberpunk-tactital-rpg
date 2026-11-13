extends RefCounted
## Conteudo do jogo - enredo, encontros, itens e regioes originais; nomes de racas e classes do livro.
const BOOK = preload("res://scripts/rules/catalog.gd")
const PLAYABLE_RACES = ["Humano","Anão","Elfo","Abominu","Darklin","Draconiano"]
const PLAYABLE_CLASSES = ["Guerreiro","Espadachim Oriental","Bárbaro","Mago","Patrulheiro","Sacerdote"]
const REGION_IDS = ["vigilia","bosque","pantano","cripta","fortaleza","ruturam"]
const REGIONS = {
 "vigilia":{"name":"VIGÍLIA DAS CINZAS","subtitle":"O último lampião antes do vazio","biome":"town","color":"3a4146","danger":1,
  "exits":[{"at":[36,19],"to":"bosque","spawn":[3,19]},{"at":[19,34],"to":"pantano","spawn":[19,3]},{"at":[2,18],"to":"cripta","spawn":[34,18]}]},
 "bosque":{"name":"BOSQUE DAS VIÚVAS","subtitle":"Árvores enraizadas em nomes esquecidos","biome":"forest","color":"293c3b","danger":2,
  "exits":[{"at":[2,19],"to":"vigilia","spawn":[33,19]},{"at":[36,19],"to":"fortaleza","spawn":[3,19]}]},
 "pantano":{"name":"PÂNTANO DE FERRO","subtitle":"Onde a água conserva o grito","biome":"swamp","color":"3b4943","danger":2,
  "exits":[{"at":[19,2],"to":"vigilia","spawn":[19,31]},{"at":[36,17],"to":"cripta","spawn":[3,18]}]},
 "cripta":{"name":"CRIPTA DO PACTO","subtitle":"A pedra guarda mais do que ossos","biome":"crypt","color":"353640","danger":3,
  "exits":[{"at":[36,18],"to":"vigilia","spawn":[3,18]},{"at":[2,18],"to":"pantano","spawn":[33,17]},{"at":[19,34],"to":"fortaleza","spawn":[19,3]}]},
 "fortaleza":{"name":"FORTALEZA DOS SEM-ROSTO","subtitle":"Coroas que não protegem ninguém","biome":"fortress","color":"493d43","danger":4,
  "exits":[{"at":[2,19],"to":"bosque","spawn":[33,19]},{"at":[19,2],"to":"cripta","spawn":[19,31]},{"at":[36,19],"to":"ruturam","spawn":[3,19]}]},
 "ruturam":{"name":"LIMIAR DE RUTURAM","subtitle":"O mundo depois da última promessa","biome":"abyss","color":"49313c","danger":5,
  "exits":[{"at":[2,19],"to":"fortaleza","spawn":[33,19]}]}
}
const NPCS = {
 "vigilia":[
  {"id":"hasam","name":"Hasam, o Vigia","at":[17,16],"look":"elder"},
  {"id":"maera","name":"Maera, a Exilada","at":[14,20],"look":"mage"},
  {"id":"oswin","name":"Oswin, o Mercador","at":[23,16],"look":"trader"},
  {"id":"ilyra","name":"Ilyra, Sacerdotisa","at":[12,15],"look":"cleric"},
  {"id":"sentinela","name":"Sentinela Doran","at":[26,21],"look":"guard"},
  {"id":"peregrina","name":"A Peregrina","at":[10,25],"look":"poor"},
  {"id":"escriba","name":"Escriba Arven","at":[21,24],"look":"scholar"}
 ],
 "bosque":[
  {"id":"caçadora","name":"Caçadora Nerys","at":[20,18],"look":"hunter"},
  {"id":"espirito","name":"Eco da Viúva","at":[10,14],"look":"spirit"}
 ],
 "pantano":[
  {"id":"alquimista","name":"Alquimista Havel","at":[17,20],"look":"alchemist"},
  {"id":"prisioneiro","name":"Prisioneiro Ferido","at":[28,15],"look":"poor"}
 ],
 "cripta":[
  {"id":"monge","name":"Monge Cego","at":[19,14],"look":"elder"}
 ],
 "fortaleza":[
  {"id":"capitao","name":"Capitão Edrik","at":[13,19],"look":"guard"},
  {"id":"sombria","name":"Dama do Véu","at":[29,23],"look":"mage"}
 ],
 "ruturam":[
  {"id":"voz","name":"Voz do Abismo","at":[18,16],"look":"spirit"}
 ]
}
const ENEMY_TYPES = {
 "Errante":{"hp":12,"f":2,"h":1,"v":1,"m":1,"die":4,"xp":1,"gold":3,"look":"husk"},
 "Incarna Ferrão":{"hp":17,"f":3,"h":2,"v":2,"m":1,"die":6,"xp":2,"gold":5,"look":"insect"},
 "Cão do Túmulo":{"hp":14,"f":3,"h":3,"v":1,"m":1,"die":4,"xp":2,"gold":3,"look":"hound"},
 "Cultista":{"hp":15,"f":1,"h":3,"v":2,"m":4,"die":6,"xp":2,"gold":7,"look":"cult"},
 "Cavaleiro Oco":{"hp":28,"f":4,"h":2,"v":4,"m":1,"die":8,"xp":3,"gold":9,"look":"knight"},
 "Arqueiro Sombrio":{"hp":18,"f":2,"h":4,"v":2,"m":2,"die":6,"xp":2,"gold":7,"look":"archer"},
 "Profanado":{"hp":21,"f":3,"h":2,"v":3,"m":2,"die":6,"xp":3,"gold":7,"look":"husk"},
 "Aranha do Véu":{"hp":14,"f":2,"h":4,"v":2,"m":1,"die":4,"xp":2,"gold":6,"look":"insect"},
 "Golem de Ferrugem":{"hp":37,"f":5,"h":1,"v":5,"m":1,"die":8,"xp":4,"gold":14,"look":"golem"},
 "Mago Impuro":{"hp":20,"f":1,"h":3,"v":2,"m":5,"die":8,"xp":4,"gold":12,"look":"mage"},
 "Guardião das Chaves":{"hp":64,"f":5,"h":3,"v":5,"m":3,"die":10,"xp":8,"gold":38,"look":"boss"},
 "Arauto de Ruturam":{"hp":86,"f":5,"h":5,"v":6,"m":6,"die":10,"xp":10,"gold":80,"look":"boss"}
}
const REGION_ENEMIES = {
 "vigilia":["Errante","Errante","Cão do Túmulo"],
 "bosque":["Aranha do Véu","Cão do Túmulo","Cultista","Arqueiro Sombrio"],
 "pantano":["Profanado","Incarna Ferrão","Golem de Ferrugem","Cultista"],
 "cripta":["Errante","Cavaleiro Oco","Profanado","Mago Impuro"],
 "fortaleza":["Cavaleiro Oco","Arqueiro Sombrio","Mago Impuro","Golem de Ferrugem"],
 "ruturam":["Incarna Ferrão","Mago Impuro","Cavaleiro Oco","Profanado"]
}
const BOSS_REGIONS = {"cripta":"Guardião das Chaves","ruturam":"Arauto de Ruturam"}
# PV da tabela de classe: valor base (sem Fisico) e PVS por nivel.
const CLASS_HP = {
 "Guerreiro":[12,5],"Espadachim Oriental":[12,5],"Bárbaro":[14,5],
 "Mago":[6,3],"Patrulheiro":[10,5],"Sacerdote":[8,3]
}
# Tres habilidades/categoria: 1a inspirada/derivada do livro; demais digitalizacoes ou propostas do jogo.
# "source" distingue livro e adaptacao; custo de ponto inicial 1 ou 2.
const SKILLS = {
 "Guerreiro":[
 {"id":"decisivo","name":"Golpe Decisivo","cost":2,"energy":"fatigue","range":1,"die":4,"effect":"damage","price":2,"source":"livro"},
 {"id":"guarda","name":"Guarda de Ferro","cost":1,"energy":"fatigue","range":0,"die":0,"effect":"guard","price":1,"source":"adaptação"},
 {"id":"ruptura","name":"Ruptura","cost":2,"energy":"fatigue","range":1,"die":6,"effect":"bleed","price":2,"source":"adaptação"}],
 "Espadachim Oriental":[
 {"id":"ancestral","name":"Espada Ancestral","cost":1,"energy":"will","range":1,"die":4,"effect":"damage","price":2,"source":"livro"},
 {"id":"postura","name":"Postura Ancestral","cost":1,"energy":"fatigue","range":0,"die":0,"effect":"guard","price":2,"source":"livro"},
 {"id":"lamina","name":"Lâmina Dupla","cost":2,"energy":"fatigue","range":1,"die":6,"effect":"damage","price":1,"source":"adaptação"}],
 "Bárbaro":[
 {"id":"massivo","name":"Ataque Massivo","cost":2,"energy":"fatigue","range":1,"die":4,"effect":"damage","price":2,"source":"livro"},
 {"id":"frenesi","name":"Frenesi","cost":2,"energy":"fatigue","range":0,"die":0,"effect":"guard","price":1,"source":"livro"},
 {"id":"intimidar","name":"Uivo de Guerra","cost":1,"energy":"will","range":2,"die":0,"effect":"weaken","price":2,"source":"adaptação"}],
 "Mago":[
 {"id":"pyros","name":"Esfera de Pyros","cost":3,"energy":"will","range":5,"die":8,"effect":"fire","price":2,"source":"livro"},
 {"id":"véu","name":"Véu Arcano","cost":2,"energy":"will","range":0,"die":0,"effect":"guard","price":1,"source":"adaptação"},
 {"id":"raio","name":"Raio Onírico","cost":2,"energy":"will","range":5,"die":6,"effect":"weaken","price":2,"source":"adaptação"}],
 "Patrulheiro":[
 {"id":"caca","name":"Disparo Marcado","cost":2,"energy":"fatigue","range":5,"die":6,"effect":"damage","price":2,"source":"adaptação"},
 {"id":"armadilha","name":"Flecha de Caça","cost":2,"energy":"fatigue","range":5,"die":4,"effect":"bleed","price":1,"source":"adaptação"},
 {"id":"foco","name":"Concentração","cost":1,"energy":"will","range":0,"die":0,"effect":"guard","price":2,"source":"adaptação"}],
 "Sacerdote":[
 {"id":"prece","name":"Prece de Cura","cost":2,"energy":"will","range":5,"die":8,"effect":"heal","price":2,"source":"adaptação"},
 {"id":"ódio","name":"Ódio na Lâmina","cost":2,"energy":"will","range":1,"die":6,"effect":"damage","price":2,"source":"livro"},
 {"id":"selo","name":"Selo da Fé","cost":1,"energy":"will","range":0,"die":0,"effect":"guard","price":1,"source":"adaptação"}]
}
const QUALITIES = ["Corajoso","Corpulento","Item Herdado","Erudito"]
const QUESTS = [
 {"id":"principal","title":"O Selo dos Sem-Nome","description":"Hasam pede que você investigue a fratura entre Obscure e Ruturam.", "main":true},
 {"id":"ervas","title":"Ervas para os Feridos","description":"Reúna cinco ervas cinzentas e entregue a Ilyra."},
 {"id":"peregrina","title":"A Última Atadura","description":"Socorra a Peregrina na Vigília, ou guarde o material."},
 {"id":"maera","title":"A Exilada","description":"Converse com Maera e decida se aceita sua ajuda."},
 {"id":"ossos","title":"Vozes nos Ossos","description":"Recolha três ossos inscritos das ruínas da Cripta."},
 {"id":"ferro","title":"A Dívida do Ferreiro","description":"Entregue quatro lingotes de ferro antigo ao mercador."},
 {"id":"cacadora","title":"Pegadas de Sangue","description":"Derrote duas Aranhas do Véu no Bosque."},
 {"id":"prisioneiro","title":"O Homem sem Crime","description":"Decida o destino do prisioneiro do Pântano."},
 {"id":"escriba","title":"Páginas Queimadas","description":"Encontre três pergaminhos perdidos para Arven."},
 {"id":"santuario","title":"A Capela Silenciosa","description":"Purifique o santuário do Bosque."},
 {"id":"guarnicao","title":"Os Que Ficaram","description":"Derrote três cavaleiros na Fortaleza."},
 {"id":"cripta","title":"O Guardião do Juramento","description":"Enfrente o guardião da Cripta e recupere a primeira chave."},
 {"id":"corrompidos","title":"A Mancha no Espelho","description":"Estude marcas de corrupção e sobreviva ao Limiar."},
 {"id":"final","title":"Quem Merece a Verdade","description":"Determine o destino do pacto no coração de Ruturam."}
]
const CODEX = {
 "origem":"Obscure continua existindo entre vestígios de guerras, cataclismos e conflitos entre mortais e entidades. Esta narrativa digital é ficção original ambientada nesse cenário.",
 "ruturam":"Ruturam não é apenas um lugar distante. Na adaptação, sua presença se infiltra em juramentos e memórias.",
 "astral":"Fragmentos Astral têm significado místico no mundo de Tenebria. Nesta aventura são também provas de um pacto esquecido.",
 "hasam":"Hasam guarda a Vigília por razões que não ousa revelar. Sua promessa foi feita antes de o povoado existir.",
 "maera":"Maera fugiu da corte de um rei esquecido. O preço de sua liberdade ainda a persegue.",
 "ilyra":"Ilyra vê no sacrifício uma escolha, nunca uma moeda.",
 "era":"Os aldeões contam os anos por invernos sem sol. A ruína não começou numa só guerra.",
 "culto":"A fé pode proteger uma comunidade, mas também servir a quem deseja controlar o medo.",
 "velho_ferro":"O ferro dos pântanos mantém impressões que a água não apaga.",
 "sem_rosto":"A fortaleza foi construída para homens que juraram nunca revelar o próprio rosto.",
 "luz":"Um santuário intacto pode ser sinal de esperança ou de algo que aprendeu a se esconder.",
 "epilogo":"Nenhuma escolha apaga o que foi feito. Toda paz é uma decisão que precisa ser repetida."
}
const ITEM_LIST = [
 ["Espada Curta","weapon",6,0,0,8,"Lâmina comum."],
 ["Katana Antiga","weapon",8,1,0,25,"Ferro vindo dos monastérios."],
 ["Machado do Ermo","weapon",8,2,0,28,"Lâmina pesada."],
 ["Arco de Teixo","weapon",6,1,0,20,"Alcance 5."],
 ["Bastão Rúnico","weapon",4,1,0,20,"Foco de conjuração."],
 ["Maça de Bronze","weapon",6,1,0,22,"Aço dos penitentes."],
 ["Espada do Vigia","weapon",8,2,0,60,"Herança de Hasam."],
 ["Lança do Pântano","weapon",8,1,0,30,"Forjada em ferro escuro."],
 ["Machado da Cripta","weapon",10,2,0,78,"Lâmina resgatada."],
 ["Arco da Viúva","weapon",8,2,0,80,"Feito de madeira amaldiçoada."],
 ["Lâmina Astral","weapon",12,3,0,200,"Brilha ao aproximar-se do Limiar."],
 ["Cajado de Ilyra","weapon",6,2,0,85,"Um símbolo de esperança."],
 ["Manto Roto","armor",0,0,1,6,"Proteção de tecido."],
 ["Gibão de Couro","armor",0,0,2,20,"Armadura leve."],
 ["Cota Enferrujada","armor",0,0,3,42,"Armadura pesada pelo tempo."],
 ["Armadura do Vigia","armor",0,0,4,80,"Armadura da Vigília."],
 ["Couraça dos Sem-Rosto","armor",0,0,5,130,"Marcada pelo juramento."],
 ["Manto das Cinzas","armor",0,0,3,95,"Veste um sobrevivente."],
 ["Escudo de Madeira","shield",0,0,1,12,"Escudo reparado."],
 ["Escudo Solar","shield",0,0,2,65,"Bronze gravado."],
 ["Escudo do Pacto","shield",0,0,3,150,"O ferro não esquece."],
 ["Anel de Osso","accessory",0,1,0,30,"Pequena energia latente."],
 ["Selo da Vigília","accessory",0,1,1,65,"O emblema do posto."],
 ["Olho de Ruturam","accessory",0,2,0,170,"Observa quem o carrega."],
 ["Atadura","consumable",0,0,0,4,"Recupera 1D6+2 PV."],
 ["Poção de Vontade","consumable",0,0,0,18,"Recupera 1D4 Vontade."],
 ["Poção de Fadiga","consumable",0,0,0,14,"Recupera 1D4 Fadiga."],
 ["Elixir Antigo","consumable",0,0,0,90,"Cura PV e um estado negativo."],
 ["Erva Cinzenta","material",0,0,0,2,"Cresce entre brasas frias."],
 ["Ferro Antigo","material",0,0,0,5,"Material de forja."],
 ["Osso Inscrito","material",0,0,0,8,"Marcas anteriores ao túmulo."],
 ["Papel Queimado","material",0,0,0,3,"Parte de um registro."],
 ["Água de Santuário","material",0,0,0,10,"Água recolhida na capela."],
 ["Cinza Viva","material",0,0,0,12,"Resíduo de rituais."],
 ["Presa de Incarna","material",0,0,0,9,"Matéria alterada."],
 ["Chave Velada","quest",0,0,0,0,"Abre o coração da fratura."],
 ["Fragmento Astral","quest",0,0,0,0,"Evidência do antigo pacto."]
]
const RECIPES = [
 {"title":"Atadura x2","needs":{"Erva Cinzenta":2},"gives":{"Atadura":2}},
 {"title":"Poção de Fadiga","needs":{"Erva Cinzenta":2,"Água de Santuário":1},"gives":{"Poção de Fadiga":1}},
 {"title":"Poção de Vontade","needs":{"Cinza Viva":2,"Água de Santuário":1},"gives":{"Poção de Vontade":1}},
 {"title":"Lança do Pântano","needs":{"Ferro Antigo":4,"Presa de Incarna":1},"gives":{"Lança do Pântano":1}},
 {"title":"Anel de Osso","needs":{"Osso Inscrito":3,"Cinza Viva":1},"gives":{"Anel de Osso":1}}
]
const COMPANIONS = {
 "maera":{"name":"Maera","class":"Mago","race":"Elfo","hp":17,"f":1,"h":3,"v":2,"m":4},
 "doran":{"name":"Doran","class":"Guerreiro","race":"Humano","hp":25,"f":3,"h":2,"v":3,"m":1},
 "ilyra":{"name":"Ilyra","class":"Sacerdote","race":"Humano","hp":20,"f":1,"h":2,"v":2,"m":4}
}

static func item_catalog() -> Dictionary:
 var out: Dictionary = {}
 for row in ITEM_LIST:
  out[str(row[0])]={"slot":str(row[1]),"die":int(row[2]),"bonus":int(row[3]),"defense":int(row[4]),"price":int(row[5]),"desc":str(row[6])}
 return out

static func default_equipment(role: String) -> Dictionary:
 match role:
  "Mago": return {"weapon":"Bastão Rúnico","armor":"Manto Roto","shield":"","accessory":""}
  "Sacerdote": return {"weapon":"Maça de Bronze","armor":"Manto Roto","shield":"Escudo de Madeira","accessory":""}
  "Patrulheiro": return {"weapon":"Arco de Teixo","armor":"Gibão de Couro","shield":"","accessory":""}
  "Bárbaro": return {"weapon":"Machado do Ermo","armor":"Manto Roto","shield":"","accessory":""}
  "Espadachim Oriental": return {"weapon":"Katana Antiga","armor":"Gibão de Couro","shield":"","accessory":""}
  _: return {"weapon":"Espada Curta","armor":"Gibão de Couro","shield":"Escudo de Madeira","accessory":""}

static func make_actor(actor_name: String, role: String, race: String, attrs: Dictionary, qualities: Array, level: int, equipment: Dictionary) -> Dictionary:
 var base: Array=CLASS_HP.get(role,[10,4])
 var f: int=int(attrs.get("f",2))
 var h: int=int(attrs.get("h",2))
 var v: int=int(attrs.get("v",2))
 var m: int=int(attrs.get("m",2))
 var hp: int=int(base[0])+f+maxi(0,level-1)*(f+int(base[1]))
 var stats: Dictionary={"id":"hero","name":actor_name,"role":role,"race":race,"hp":hp,"max_hp":hp,"f":f,"h":h,"v":v,"m":m,
  "fatigue":f+v,"will":m+h,"move":int(BOOK.RACES[race]["move"]),"defense":10+v,"level":level,"xp":0,"qualities":qualities.duplicate(),
  "gear":equipment.duplicate(true),"skills":{},"statuses":{},"corruption":0}
 if "Corajoso" in qualities: stats["will"]+=2
 if "Corpulento" in qualities: stats["fatigue"]+=1
 return stats

static func generate_encounters(region: String) -> Array[Dictionary]:
 var out: Array[Dictionary]=[]
 var kinds: Array=REGION_ENEMIES.get(region,[])
 for i in range(9 if region!="vigilia" else 5):
  var x: int=9+(i*7+str(region).length()*3)%23
  var y: int=7+(i*11+str(region).length())%24
  var name: String=str(kinds[i%kinds.size()])
  out.append({"id":region+"_foe_"+str(i),"name":name,"at":[x,y],"group":1+(i%3),"boss":false})
 if BOSS_REGIONS.has(region):
  out.append({"id":region+"_boss","name":BOSS_REGIONS[region],"at":[28,27],"group":1,"boss":true})
 return out

static func generate_objects(region: String) -> Array[Dictionary]:
 var out: Array[Dictionary]=[]
 var kinds: Array=["Erva Cinzenta","Ferro Antigo","Osso Inscrito","Papel Queimado","Cinza Viva","Presa de Incarna","Atadura"]
 for i in range(14):
  var x: int=6+(i*13+str(region).length()*3)%28
  var y: int=5+(i*17+str(region).length())%28
  out.append({"id":region+"_loot_"+str(i),"name":str(kinds[(i+str(region).length())%kinds.size()]),"at":[x,y],"kind":"forage"})
 for i in range(5):
  out.append({"id":region+"_chest_"+str(i),"name":"Baú Lacrado","at":[7+i*6,9+((i*5+11)%21)],"kind":"chest"})
 out.append({"id":region+"_shrine","name":"Santuário","at":[26,12],"kind":"shrine"})
 out.append({"id":region+"_lore","name":"Inscrição Antiga","at":[10,28],"kind":"lore"})
 return out

static func starter_items(role: String) -> Dictionary:
 var inv: Dictionary={"Atadura":4,"Poção de Fadiga":2,"Poção de Vontade":2}
 for item in default_equipment(role).values():
  if str(item)!="":inv[str(item)]=1
 return inv
