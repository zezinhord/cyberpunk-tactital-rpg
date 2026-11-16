/** Testa o JS que será avaliado no Chromium, antes de compilar o APK.
 * Node VM valida strings literais de Runtime.evaluate, sem TypeScript AST.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const filenames=["scripts/capture-baixada-visual.mjs","scripts/test-android-cold-boot.mjs"];
let checked=0;
for(const file of filenames){
 const source=readFileSync(file,"utf8");
 const pattern=/\b(?:evaluate|evalJS)\s*\(\s*('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")\s*\)/g;
 for(const match of source.matchAll(pattern)){
  const literal=match[1];
  const line=source.slice(0,match.index).split("\n").length;
  try{
   const js=new Script(literal,{filename:file+":"+line}).runInNewContext();
   assert.equal(typeof js,"string");
   new Script(js,{filename:file+":"+line+" (Runtime.evaluate)"});
   checked++;
  }catch(error){
   throw new Error("JS invalido enviado ao Chromium "+file+":"+line+" — "+String(error));
  }
 }
}
assert.ok(checked>=20,"Poucas expressoes de Chromium encontradas: "+checked);
console.log("QA CDP: "+checked+" expressoes JavaScript parseadas antes da compilacao.");
