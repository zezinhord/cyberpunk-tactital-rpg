/** Modifica somente a variante de teste de pacote separado.
 * O app de 1GB e os salvamentos anteriores não são tocados. */
import {readFileSync,writeFileSync} from "node:fs";
// Pacote QA 0.9.1 isolado: a chave privada da QA 0.9.0 vive em outro escopo
// de cache do GitHub Actions. Nunca reutilizar o mesmo package ID com uma
// assinatura nova, pois isso impediria a atualização pelo Android.
const qaVariant=process.env.NA_QA_VARIANT==="v201"?"v201":
 process.env.NA_QA_VARIANT==="v200"?"v200":
 process.env.NA_QA_VARIANT==="v100"?"v100":
 process.env.NA_QA_VARIANT==="v091"?"v091":"v090";
// Nunca reusar o identificador do QA 0.9.1 com certificado de outra branch.
const packageId=qaVariant==="v201"?"com.cyberpunk.tacticalrpg.qa201":
 qaVariant==="v200"?"com.cyberpunk.tacticalrpg.qa200":
 qaVariant==="v100"?"com.cyberpunk.tacticalrpg.qa100":
 qaVariant==="v091"?"com.cyberpunk.tacticalrpg.qa091":
 "com.cyberpunk.tacticalrpg.qa";
const appLabel=qaVariant==="v201"?"Nova Arcádia 2.0":
 qaVariant==="v200"?"Nova Arcádia 2.0 QA":
 qaVariant==="v100"?"Nova Arcádia Final QA":
 qaVariant==="v091"?"Nova Arcádia QA 0.9.1":"Nova Arcádia QA";
const gradle="android/app/build.gradle";
const original=readFileSync(gradle,"utf8");
const pattern=/\bapplicationId\s+["']com\.cyberpunk\.tacticalrpg["']/g;
if([...original.matchAll(pattern)].length!==1)throw Error("ApplicationId inesperado");
if(!original.includes("NOVA_ARCADIA_PERSISTENT_DEBUG_SIGNING"))
 throw Error("A variante paralela exige assinatura persistente");
writeFileSync(gradle,original.replace(pattern,
 'applicationId "'+packageId+'"'),"utf8");
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
 /(<string name="app_name">)[^<]*(<\/string>)/,"$1"+appLabel+"$2").replace(
 /(<string name="title_activity_main">)[^<]*(<\/string>)/,
 "$1"+appLabel+"$2"),"utf8");
console.log("QA separado: "+packageId+", MainActivity explícita.");
