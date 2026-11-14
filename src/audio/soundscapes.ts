/** Catálogo de áudio original de Nova Arcádia.
 * A liberação Android inclui 7 distritos × 8 situações de 108s cada.
 * URL apenas de identificadores fechados; as faixas são empacotadas no APK
 * durante o build e carregadas individualmente sob demanda.
 */
export const RADIO_DISTRICTS=[
 {id:"baixada",label:"Baixada",description:"Canal, becos, feira e cooperativa"},
 {id:"ferrugem",label:"Ferrugem",description:"Forno, sucata e resistência"},
 {id:"aurea",label:"Áurea",description:"Torres, vidro e controle corporativo"},
 {id:"subsolo",label:"Subsolo",description:"Túneis, mercado clandestino e abrigo"},
 {id:"setor-zero",label:"Setor Zero",description:"Zona interditada e sinais apagados"},
 {id:"prisma",label:"Prisma",description:"Neon, entretenimento e protestos"},
 {id:"periferia",label:"Periferia",description:"Rotas exteriores e comunidades móveis"},
] as const;
export const RADIO_MOODS=[
 {id:"abertura",label:"Prólogo"},
 {id:"exploracao",label:"Exploração"},
 {id:"contatos",label:"Contatos"},
 {id:"investigacao",label:"Investigação"},
 {id:"perseguicao",label:"Perseguição"},
 {id:"confronto",label:"Confronto"},
 {id:"memorias",label:"Memórias"},
 {id:"revelacao",label:"Revelação"},
] as const;
export type RadioDistrict=(typeof RADIO_DISTRICTS)[number]["id"];
export type RadioMood=(typeof RADIO_MOODS)[number]["id"];
export interface Song{
 district:RadioDistrict;mood:RadioMood;name:string;url:string;
}
export function isRadioDistrict(value:unknown):value is RadioDistrict{
 return typeof value==="string"&&RADIO_DISTRICTS.some(x=>x.id===value);
}
export function isRadioMood(value:unknown):value is RadioMood{
 return typeof value==="string"&&RADIO_MOODS.some(x=>x.id===value);
}
export function getSong(district:RadioDistrict,mood:RadioMood):Song{
 const area=RADIO_DISTRICTS.find(x=>x.id===district)!;
 const cue=RADIO_MOODS.find(x=>x.id===mood)!;
 return {district,mood,name:area.label+" · "+cue.label,
  url:"/assets/soundscapes/"+district+"/"+mood+".ogg"};
}
export const SONG_LIBRARY:readonly Song[]=RADIO_DISTRICTS.flatMap(
 d=>RADIO_MOODS.map(m=>getSong(d.id,m.id)));
export const SONG_COUNT=SONG_LIBRARY.length;
export const SONG_LENGTH_SECONDS=108;
