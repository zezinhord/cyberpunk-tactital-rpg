/** RC20 accessibility preferences: persisted local to the device, no
 * separate game edition. Respects previous reduce-motion setting used by
 * the cinematic engine and avoids touching character save slots.
 */
export const ACCESSIBILITY_KEY="cyberpunk-tactical-rpg.accessibility.v1";
const LEGACY_MOTION_KEY="cyberpunk-tactical-rpg.settings.reduce-motion.v1";
export interface AccessibilityPreferences{
 version:1;largeText:boolean;highContrast:boolean;reduceMotion:boolean;
}
export const DEFAULT_ACCESSIBILITY:Readonly<AccessibilityPreferences>={
 version:1,largeText:false,highContrast:false,reduceMotion:false,
};
export function sanitizeAccessibility(raw:unknown):AccessibilityPreferences{
 if(!raw||typeof raw!=="object"||Array.isArray(raw))
  return {...DEFAULT_ACCESSIBILITY};
 const v=raw as Partial<AccessibilityPreferences>;
 return {
  version:1,
  largeText:v.largeText===true,
  highContrast:v.highContrast===true,
  reduceMotion:v.reduceMotion===true,
 };
}
export function readAccessibility():AccessibilityPreferences{
 try{
  const raw=globalThis.localStorage?.getItem(ACCESSIBILITY_KEY);
  const loaded=raw?sanitizeAccessibility(JSON.parse(raw)):
    {...DEFAULT_ACCESSIBILITY};
  // Older versions already supported a separate cinematic reduced-motion
  // preference. Respect it on migration.
  if(!raw&&globalThis.localStorage?.getItem(LEGACY_MOTION_KEY)==="true")
   loaded.reduceMotion=true;
  return loaded;
 }catch{return {...DEFAULT_ACCESSIBILITY};}
}
export function applyAccessibility(settings:AccessibilityPreferences):void{
 if(typeof document==="undefined")return;
 const root=document.documentElement;
 root.dataset.naContrast=settings.highContrast?"high":"default";
 root.dataset.naText=settings.largeText?"large":"default";
 root.dataset.naMotion=settings.reduceMotion?"reduced":"default";
}
export function saveAccessibility(settings:AccessibilityPreferences):boolean{
 try{
  const state=sanitizeAccessibility(settings);
  if(!globalThis.localStorage)return false;
  globalThis.localStorage.setItem(ACCESSIBILITY_KEY,JSON.stringify(state));
  globalThis.localStorage.setItem(LEGACY_MOTION_KEY,
    state.reduceMotion?"true":"false");
  applyAccessibility(state);
  return true;
 }catch{return false;}
}
