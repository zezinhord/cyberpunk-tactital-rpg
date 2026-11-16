/** Valida o código JS enviado a Runtime.evaluate antes de executar Chromium.
 * Em 0.7.7 dois seletores com aspas conflitantes passaram pelo parser Node,
 * mas falharam no browser: new vm.Script reproduz a validação da expressão.
 */
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
import ts from "typescript";
const scripts=["scripts/capture-baixada-visual.mjs","scripts/test-android-cold-boot.mjs"];
let checked=0;
for(const file of scripts){
 const source=ts.createSourceFile(file,readFileSync(file,"utf8"),
  ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 assert.equal(source.parseDiagnostics.length,0,"Invalid test script: "+file);
 function walk(node){
  if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&
     (node.expression.text==="evaluate"||node.expression.text==="evalJS")){
   const expr=node.arguments[0];
   if(expr&&(ts.isStringLiteral(expr)||ts.isNoSubstitutionTemplateLiteral(expr))){
    checked++;
    try{new Script(expr.text,{filename:file+" (Runtime.evaluate)"});}
    catch(error){
     const position=source.getLineAndCharacterOfPosition(expr.getStart(source));
     throw new Error(file+":"+(position.line+1)+" Chromium evaluation syntax: "+
       String(error)+"\nSource: "+expr.text);
    }
   }
  }
  ts.forEachChild(node,walk);
 }
 walk(source);
}
assert.ok(checked>=20,"Expected at least 20 evaluated browser scripts; checked "+checked);
console.log("QA CDP: "+checked+" browser expressions parse before cold-boot and screenshot tests.");
