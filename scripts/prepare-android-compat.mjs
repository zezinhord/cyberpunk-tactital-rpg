/** Modifica somente a variante de teste de pacote separado.
 * O app de 1GB e os salvamentos anteriores não são tocados. */
import {readFileSync,writeFileSync} from "node:fs";
const gradle="android/app/build.gradle";
const original=readFileSync(gradle,"utf8");
const pattern=/\bapplicationId\s+["']com\.cyberpunk\.tacticalrpg["']/g;
if([...original.matchAll(pattern)].length!==1)throw Error("ApplicationId inesperado");
if(!original.includes("NOVA_ARCADIA_PERSISTENT_DEBUG_SIGNING"))
 throw Error("A variante paralela exige assinatura persistente");
writeFileSync(gradle,original.replace(pattern,
 'applicationId "com.cyberpunk.tacticalrpg.qa"'),"utf8");
const manifestPath="android/app/src/main/AndroidManifest.xml";
const xml=readFileSync(manifestPath,"utf8");
if(!xml.includes('android:name=".MainActivity"'))
 throw Error("MainActivity ausente no manifesto Android");
writeFileSync(manifestPath,xml.replace('android:name=".MainActivity"',
 'android:name="com.cyberpunk.tacticalrpg.MainActivity"'),"utf8");
const labelPath="android/app/src/main/res/values/strings.xml";
const strings=readFileSync(labelPath,"utf8");
if(!strings.includes('<string name="app_name">'))
 throw Error("app_name ausente");
writeFileSync(labelPath,strings.replace(
 /(<string name="app_name">)[^<]*(<\/string>)/,"$1Nova Arcádia QA$2").replace(
 /(<string name="title_activity_main">)[^<]*(<\/string>)/,
 "$1Nova Arcádia QA$2"),"utf8");
console.log("QA separado: com.cyberpunk.tacticalrpg.qa, MainActivity explícita.");
