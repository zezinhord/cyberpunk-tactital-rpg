import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
async function findActivity(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await findActivity(fullPath);
      if (nested) return nested;
    } else if (entry.isFile() && entry.name === "MainActivity.java") {
      return fullPath;
    }
  }
  return null;
}
const activityPath = await findActivity("android/app/src/main/java");
if (!activityPath) throw new Error("MainActivity.java não encontrada após cap add android.");
const source = await readFile(activityPath, "utf8");
const pattern = /public\s+class\s+MainActivity\s+extends\s+BridgeActivity\s*\{\s*\}/s;
if (!pattern.test(source)) {
  throw new Error("MainActivity.java diferente do modelo Capacitor esperado: alteração abortada.");
}
const imports = [
  "import android.os.Bundle;",
  "import android.os.Build;",
  "import android.view.View;",
  "import android.view.Window;",
  "import android.view.WindowManager;",
  "import android.view.WindowInsets;",
  "import android.view.WindowInsetsController;"
].join("\n");
const result = source.replace(
  /package\s+[\w.]+\s*;/,
  (declaration) => declaration + "\n\n" + imports,
).replace(pattern, "public class MainActivity extends BridgeActivity {\n    @Override\n    public void onCreate(Bundle savedInstanceState) {\n        super.onCreate(savedInstanceState);\n        enterImmersiveMode();\n    }\n\n    @Override\n    protected void onResume() {\n        super.onResume();\n        enterImmersiveMode();\n    }\n\n    @Override\n    public void onWindowFocusChanged(boolean hasFocus) {\n        super.onWindowFocusChanged(hasFocus);\n        if (hasFocus) enterImmersiveMode();\n    }\n\n    private void enterImmersiveMode() {\n        Window window = getWindow();\n        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {\n            WindowManager.LayoutParams params = window.getAttributes();\n            params.layoutInDisplayCutoutMode =\n                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;\n            window.setAttributes(params);\n        }\n        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {\n            window.setDecorFitsSystemWindows(false);\n            WindowInsetsController controller = window.getInsetsController();\n            if (controller != null) {\n                controller.setSystemBarsBehavior(\n                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE\n                );\n                controller.hide(WindowInsets.Type.systemBars());\n            }\n        } else {\n            window.getDecorView().setSystemUiVisibility(\n                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY |\n                View.SYSTEM_UI_FLAG_FULLSCREEN |\n                View.SYSTEM_UI_FLAG_HIDE_NAVIGATION |\n                View.SYSTEM_UI_FLAG_LAYOUT_STABLE |\n                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |\n                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION\n            );\n        }\n    }\n}");
if (result === source || !result.includes("enterImmersiveMode")) {
  throw new Error("Falha ao aplicar experiência imersiva à MainActivity.");
}
await writeFile(activityPath, result, "utf8");
console.log("Android: barras ocultas em modo imersivo; gestos preservados.");
