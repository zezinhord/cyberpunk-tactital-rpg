/** Carimba a versão REAL do pacote Android gerado pelo Capacitor.
 * O default Gradle 0.6.9-alpha.1/691 foi mantido incorretamente até 0.8.1.
 * Não mexe nos salvamentos, ID da aplicação ou assinatura de APK.
 */
import {readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
const {version}=JSON.parse(readFileSync(resolve("package.json"),"utf8"));
const m=/^(\d+)\.(\d+)\.(\d+)(?:-rc\.(\d+))?$/.exec(version);
if(!m)throw new Error("Versão não suportada para pacote Android: "+version);
const major=Number(m[1]),minor=Number(m[2]),patch=Number(m[3]),rc=m[4]===undefined?99:Number(m[4]);
if(minor>99||patch>99||rc>99)throw new Error("Versão excede o formato Android");
const versionCode=major*1_000_000+minor*10_000+patch*100+rc;
const path=resolve("android/app/build.gradle");
const original=readFileSync(path,"utf8");
if(!/versionCode\s+\d+/.test(original)||!/versionName\s+["'][^"']+["']/.test(original))
 throw new Error("Build Gradle não contém os campos de versão esperados");
const updated=original.replace(/versionCode\s+\d+/,"versionCode "+versionCode)
 .replace(/versionName\s+["'][^"']+["']/,"versionName \""+version+"\"");
writeFileSync(path,updated);
console.log("Android: versionCode="+versionCode+", versionName="+version);
