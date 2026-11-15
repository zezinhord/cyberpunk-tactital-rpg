import assert from "node:assert/strict";
import {readFileSync,statSync,existsSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {RADIO_DISTRICTS,RADIO_MOODS,SONG_LIBRARY,SONG_COUNT,
 SONG_LENGTH_SECONDS,getSong,isRadioDistrict,isRadioMood}
 from "../src/audio/soundscapes.ts";
const base="public/assets/soundscapes/";
assert.equal(RADIO_DISTRICTS.length,7,"Rádio deve ter sete distritos");
assert.equal(RADIO_MOODS.length,8,"Rádio deve ter oito situações");
assert.equal(SONG_COUNT,56);
assert.equal(SONG_LIBRARY.length,56);
assert.equal(new Set(SONG_LIBRARY.map(x=>x.url)).size,56);
assert.equal(isRadioDistrict("aurea"),true);
assert.equal(isRadioDistrict("../foo"),false);
assert.equal(isRadioMood("memorias"),true);
assert.equal(isRadioMood("download"),false);
const manifest=JSON.parse(readFileSync(base+"catalog.json","utf8"));
assert.equal(manifest.format,"nova-arcadia-original-soundtrack");
assert.equal(manifest.items.length,SONG_COUNT,"Faixas prometidas não foram geradas");
const sample=process.argv.includes("--sample");
assert.ok(!sample||manifest.items.length===1);
let total=0;
for(const song of manifest.items){
 const item=SONG_LIBRARY.find(x=>x.district===song.district&&x.mood===song.mood);
 assert.ok(item,"Trilha gerada não existe no rádio");
 assert.equal(song.url,item.url);
 assert.equal(song.license.includes("Original"),true);
 const path="public"+item.url;
 assert.ok(existsSync(path),"Faixa ausente no pacote "+path);
 const size=statSync(path).size;
 assert.equal(song.bytes,size,"Tamanho do manifesto inválido");
 assert.ok(size>1_000_000,"Faixa de áudio muito pequena: "+path);
 total+=size;
}
assert.equal(manifest.bytes,total,"Orçamento de trilhas incorreto");
if(!sample)assert.ok(total>=94_000_000&&total<=108_000_000,
 "O pack deve fornecer aprox. 96 MB de composições originais: "+total);
for(const song of [manifest.items[0],manifest.items.at(-1)]){
 const data=execFileSync("ffprobe",["-v","error","-show_entries",
  "format=duration,bit_rate","-of","json","public"+song.url],{encoding:"utf8"});
 const meta=JSON.parse(data).format;
 assert.ok(Math.abs(Number(meta.duration)-SONG_LENGTH_SECONDS)<=1,
  "Duração de áudio inválida: "+song.url+" = "+meta.duration);
 assert.ok(Number(meta.bit_rate)>115_000,"Qualidade de áudio insuficiente");
}
console.log("Rádio original: "+manifest.items.length+" trilhas, "+
 Math.round(total/1_000_000*100)/100+" MB, 7 distritos e 8 situações.");
