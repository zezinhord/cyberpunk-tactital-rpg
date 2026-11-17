/** 112 arquivos originais e usados: 7 distritos × 4 contextos × 4 fases.
 * Cada clipe é carregado separadamente; nenhum atlas de áudio é decodificado. */
import type {RadioDistrict} from "./soundscapes.ts";
export const CITY_AUDIO_MODES=["street","rain","interior","alert"] as const;
export type CityAudioMode=(typeof CITY_AUDIO_MODES)[number];
export const CITY_AUDIO_PHASES=["aurora","turno","ocaso","vigilia"] as const;
export type CityAudioPhase=(typeof CITY_AUDIO_PHASES)[number];
export function cityAudioPhase(cycle:number,pressure:number):CityAudioPhase{
 const x=Number.isFinite(cycle)?Math.floor(cycle):0;
 const p=Number.isFinite(pressure)?Math.floor(pressure):0;
 return CITY_AUDIO_PHASES[((x+p)%4+4)%4]!;
}
export function expandedAmbiencePath(district:RadioDistrict,mode:CityAudioMode,phase:CityAudioPhase):string{
 return "/assets/ambient-expanded/"+district+"/"+mode+"/"+phase+".ogg";
}
export function originalAmbienceFallback(district:RadioDistrict,mode:CityAudioMode):string{
 return "/assets/ambient/"+district+"/"+mode+".ogg";
}
