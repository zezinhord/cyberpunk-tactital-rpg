/** Faixas CC0 verificadas nas páginas dos autores. A importação offline
 * salva apenas as que puder baixar e transcodificar. Não usar NCS sem licença.
 */
import type {RadioDistrict,RadioMood} from "./soundscapes.ts";
export type RadioStyle="auto"|"cyberpunk"|"tropical"|"original";
export interface CuratedTrack{
 id:string;name:string;artist:string;style:"cyberpunk"|"tropical";
 url:string;districts:readonly RadioDistrict[];moods:readonly RadioMood[];
 license:"CC0-1.0";source:string;
}
export const CURATED_TRACKS:readonly CuratedTrack[]=[
  {
    "id": "ai-fight",
    "name": "AI Fight",
    "artist": "Alexander Ehlers (tricksntraps)",
    "style": "cyberpunk",
    "url": "/assets/music/ai-fight.ogg",
    "districts": [
      "ferrugem",
      "setor-zero",
      "aurea"
    ],
    "moods": [
      "confronto",
      "perseguicao"
    ],
    "license": "CC0-1.0",
    "source": "https://opengameart.org/content/t-t-free-cyberpunk-pack-2"
  },
  {
    "id": "new-factory",
    "name": "New Factory",
    "artist": "Alexander Ehlers (tricksntraps)",
    "style": "cyberpunk",
    "url": "/assets/music/new-factory.ogg",
    "districts": [
      "ferrugem",
      "aurea"
    ],
    "moods": [
      "exploracao",
      "investigacao",
      "contatos"
    ],
    "license": "CC0-1.0",
    "source": "https://opengameart.org/content/t-t-free-cyberpunk-pack-2"
  },
  {
    "id": "night-club-chill",
    "name": "Night Club Chill",
    "artist": "Alexander Ehlers (tricksntraps)",
    "style": "cyberpunk",
    "url": "/assets/music/night-club-chill.ogg",
    "districts": [
      "prisma",
      "subsolo",
      "baixada"
    ],
    "moods": [
      "contatos",
      "exploracao",
      "abertura"
    ],
    "license": "CC0-1.0",
    "source": "https://opengameart.org/content/t-t-free-cyberpunk-pack-2"
  },
  {
    "id": "strange-experiments",
    "name": "Strange Experiments",
    "artist": "Alexander Ehlers (tricksntraps)",
    "style": "cyberpunk",
    "url": "/assets/music/strange-experiments.ogg",
    "districts": [
      "setor-zero",
      "aurea",
      "subsolo"
    ],
    "moods": [
      "investigacao",
      "memorias",
      "revelacao"
    ],
    "license": "CC0-1.0",
    "source": "https://opengameart.org/content/t-t-free-cyberpunk-pack-2"
  },
  {
    "id": "the-casino",
    "name": "The Casino",
    "artist": "Alexander Ehlers (tricksntraps)",
    "style": "cyberpunk",
    "url": "/assets/music/the-casino.ogg",
    "districts": [
      "prisma",
      "aurea"
    ],
    "moods": [
      "contatos",
      "exploracao",
      "abertura"
    ],
    "license": "CC0-1.0",
    "source": "https://opengameart.org/content/t-t-free-cyberpunk-pack-2"
  },
  {
    "id": "through-sewers",
    "name": "Through the Sewers",
    "artist": "Alexander Ehlers (tricksntraps)",
    "style": "cyberpunk",
    "url": "/assets/music/through-sewers.ogg",
    "districts": [
      "subsolo",
      "baixada"
    ],
    "moods": [
      "perseguicao",
      "investigacao",
      "confronto"
    ],
    "license": "CC0-1.0",
    "source": "https://opengameart.org/content/t-t-free-cyberpunk-pack-2"
  },
  {
    "id": "funky-house",
    "name": "Funky House",
    "artist": "Of Far Different Nature",
    "style": "tropical",
    "url": "/assets/music/funky-house.ogg",
    "districts": [
      "baixada",
      "prisma",
      "periferia"
    ],
    "moods": [
      "exploracao",
      "contatos",
      "abertura"
    ],
    "license": "CC0-1.0",
    "source": "https://opengameart.org/content/funky-house"
  },
  {
    "id": "tropical-loop",
    "name": "Tropical Loop",
    "artist": "wipics",
    "style": "tropical",
    "url": "/assets/music/tropical-loop.ogg",
    "districts": [
      "baixada",
      "periferia",
      "prisma"
    ],
    "moods": [
      "exploracao",
      "contatos",
      "perseguicao"
    ],
    "license": "CC0-1.0",
    "source": "https://opengameart.org/content/tropical-loop"
  },
  {
    "id": "bossa-nova",
    "name": "8bit Bossa",
    "artist": "Joth",
    "style": "tropical",
    "url": "/assets/music/bossa-nova.ogg",
    "districts": [
      "baixada",
      "prisma"
    ],
    "moods": [
      "contatos",
      "exploracao",
      "memorias"
    ],
    "license": "CC0-1.0",
    "source": "https://opengameart.org/content/bossa-nova"
  },
  {
    "id": "tropical-fantasy",
    "name": "Tropical Fantasy",
    "artist": "Spring Spring",
    "style": "tropical",
    "url": "/assets/music/tropical-fantasy.ogg",
    "districts": [
      "periferia",
      "baixada"
    ],
    "moods": [
      "exploracao",
      "abertura",
      "contatos"
    ],
    "license": "CC0-1.0",
    "source": "https://opengameart.org/content/tropical-fantasy"
  },
  {
    "id": "pondering-cosmos",
    "name": "Pondering the Cosmos",
    "artist": "Ruskerdax",
    "style": "cyberpunk",
    "url": "/assets/music/pondering-cosmos.ogg",
    "districts": [
      "setor-zero",
      "aurea",
      "subsolo"
    ],
    "moods": [
      "investigacao",
      "revelacao",
      "memorias"
    ],
    "license": "CC0-1.0",
    "source": "https://opengameart.org/content/pondering-the-cosmos"
  },
  {
    "id": "feel-good-island",
    "name": "Feel Good Island Loop",
    "artist": "Brandon Morris / AntumDeluge",
    "style": "tropical",
    "url": "/assets/music/feel-good-island.ogg",
    "districts": [
      "periferia",
      "baixada"
    ],
    "moods": [
      "contatos",
      "memorias",
      "exploracao"
    ],
    "license": "CC0-1.0",
    "source": "https://opengameart.org/content/feel-good-island-loop"
  }
] as const;
export function isRadioStyle(x:unknown):x is RadioStyle{
 return x==="auto"||x==="cyberpunk"||x==="tropical"||x==="original";
}
/** Seleção sem rede, testável fora do navegador; recentes nunca são repetidas.
 * Em modo auto, contexto local e gênero pesam mais que a faixa procedural.
 */
export function curatedCandidates(district:RadioDistrict,mood:RadioMood,style:RadioStyle,
 available:ReadonlySet<string>):CuratedTrack[]{
 if(style==="original")return [];
 const byStyle=CURATED_TRACKS.filter(x=>available.has(x.id)&&
   (style==="auto"||x.style===style));
 const exact=byStyle.filter(x=>x.districts.includes(district)&&x.moods.includes(mood));
 if(exact.length>=2)return exact;
 const sameDistrict=byStyle.filter(x=>x.districts.includes(district));
 const sameMood=byStyle.filter(x=>x.moods.includes(mood));
 return [...new Map([...exact,...sameDistrict,...sameMood,...byStyle].map(x=>[x.id,x])).values()];
}
export function chooseWithoutRepetition<T extends {url:string}>(
 candidates:readonly T[],recent:readonly string[],random=0.5
):T|null{
 if(!candidates.length)return null;
 const fresh=candidates.filter(x=>!recent.includes(x.url));
 const pool=fresh.length?fresh:candidates.filter(x=>x.url!==recent[recent.length-1]);
 const options=pool.length?pool:candidates;
 const draw=Math.max(0,Math.min(0.999999,Number.isFinite(random)?random:0));
 return options[Math.floor(draw*options.length)]??null;
}
