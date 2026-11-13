/** Exige que o APK debug seja assinado com a chave persistida no CI,
 * em vez de depender de um caminho implícito da versão atual do AGP.
 */
import {readFile,writeFile} from "node:fs/promises";
const path="android/app/build.gradle";
const text=await readFile(path,"utf8");
if(!text.includes("com.android.application")||!text.includes("android {"))
 throw new Error("build.gradle não corresponde ao template Capacitor esperado.");
const marker="// NOVA_ARCADIA_PERSISTENT_DEBUG_SIGNING";
if(text.includes(marker))throw new Error("Configuração de assinatura já aplicada.");
// Todas as versões anteriores geradas pelo template usavam versionCode 1.
// Uma versão maior permite atualização in-place quando o certificado coincide.
const versionCode=/\bversionCode\s+\d+\b/;
const versionName=/\bversionName\s+["'][^"']+["']/;
if(!versionCode.test(text)||!versionName.test(text))
 throw new Error("Campos versionCode/versionName ausentes no template Android.");
const versioned=text.replace(versionCode,"versionCode 685")
  .replace(versionName,'versionName "0.6.8-alpha.5"');
const block=`
\n${marker}
// Chave de desenvolvimento, nunca uma chave privada de produção.
def novaArcadiaDebugKey = new File(System.getProperty("user.home"), ".android/debug.keystore")
if (!novaArcadiaDebugKey.isFile()) {
    throw new GradleException("Chave Android persistente não encontrada: " + novaArcadiaDebugKey)
}
android.signingConfigs.debug.storeFile = novaArcadiaDebugKey
android.signingConfigs.debug.storePassword = "android"
android.signingConfigs.debug.keyAlias = "androiddebugkey"
android.signingConfigs.debug.keyPassword = "android"
android.buildTypes.debug.signingConfig = android.signingConfigs.debug
`;
await writeFile(path,versioned+block,"utf8");
console.log("Android: assinatura debug vinculada explicitamente à chave persistente do runner.");
