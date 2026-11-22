/** Apply real Android fullscreen to the Capacitor Activity, not CSS only.
 * Reassert after focus, screen locks, task switches and permission/document
 * overlays. User/system swipe gestures may still reveal transient system bars;
 * an Android app cannot permanently disable the system notification shade.
 */
import {readFile,writeFile,readdir} from "node:fs/promises";
import path from "node:path";
async function activityIn(dir){
 for(const item of await readdir(dir,{withFileTypes:true})){
  const p=path.join(dir,item.name);
  if(item.isDirectory()){const found=await activityIn(p);if(found)return found;}
  else if(item.isFile()&&item.name==="MainActivity.java")return p;
 }
 return null;
}
const file=await activityIn("android/app/src/main/java");
if(!file)throw Error("MainActivity.java ausente do projeto Capacitor");
const original=await readFile(file,"utf8");
const match=/public\s+class\s+MainActivity\s+extends\s+BridgeActivity\s*\{\s*\}/s;
if(!match.test(original))throw Error("MainActivity.java modificada fora do template esperado");
const imports=[
 "import android.os.Bundle;","import android.os.Build;",
 "import android.util.Log;","import android.view.View;",
 "import android.view.Window;","import android.view.WindowManager;",
 "import android.view.WindowInsets;","import android.view.WindowInsetsController;"
].join("\n");
const native=`public class MainActivity extends BridgeActivity {
    private static final String IMMERSIVE_TAG = "NovaArcadiaImmersive";
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enterImmersiveMode();
        scheduleImmersiveRecheck();
    }
    @Override
    public void onResume() {
        super.onResume();
        enterImmersiveMode();
        scheduleImmersiveRecheck();
    }
    @Override
    protected void onPostResume() {
        super.onPostResume();
        enterImmersiveMode();
        scheduleImmersiveRecheck();
    }
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            enterImmersiveMode();
            scheduleImmersiveRecheck();
        }
    }
    private void scheduleImmersiveRecheck() {
        final View root = getWindow().getDecorView();
        root.postDelayed(() -> {
            if (isFinishing() || isDestroyed() || !root.hasWindowFocus()) return;
            enterImmersiveMode();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                WindowInsets insets = root.getRootWindowInsets();
                if (insets != null) Log.i(IMMERSIVE_TAG,
                    "statusVisible=" + insets.isVisible(WindowInsets.Type.statusBars()) +
                    " navigationVisible=" + insets.isVisible(WindowInsets.Type.navigationBars()));
            }
        }, 250L);
    }
    private void enterImmersiveMode() {
        final Window window = getWindow();
        window.clearFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN);
        window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams params = window.getAttributes();
            params.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            window.setAttributes(params);
        }
        final View root = window.getDecorView();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false);
            WindowInsetsController controller = window.getInsetsController();
            if (controller != null) {
                controller.setSystemBarsBehavior(
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                controller.hide(WindowInsets.Type.statusBars() |
                    WindowInsets.Type.navigationBars());
            }
        } else {
            root.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |
                View.SYSTEM_UI_FLAG_FULLSCREEN |
                View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        }
    }
}`;
let source=original.replace(/package\s+[\w.]+\s*;/,
 decl=>decl+"\n\n"+imports).replace(match,native);
if(source===original||!source.includes("NovaArcadiaImmersive"))throw Error("Falha ao gerar MainActivity imersiva");
await writeFile(file,source,"utf8");
const styles="android/app/src/main/res/values/styles.xml";
let xml=await readFile(styles,"utf8");
for(const name of ["AppTheme.NoActionBar","AppTheme.NoActionBarLaunch"]){
 const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
 const pattern=new RegExp('(<style\\s+[^>]*name=["\\\']'+escaped+'["\\\'][^>]*>)');
 if(!pattern.test(xml))throw Error("Estilo de Activity não localizado: "+name);
 xml=xml.replace(pattern,match=>match+
  '\n        <item name="android:windowFullscreen">true</item>');
}
await writeFile(styles,xml,"utf8");
console.log("Android fullscreen nativo: FLAG_FULLSCREEN + WindowInsetsController, retomada/foco, estilos launch e main.");
