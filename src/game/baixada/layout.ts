/** Planta isométrica da Baixada 0.6.7a.
 * Coordenadas do grid 20x16: fonte única para arte, interação e colisões.
 * A planta de circulação é intencionalmente mais importante que a decoração.
 */
export interface Tile { readonly x: number; readonly y: number }
export type BuildingStyle = "housing" | "clinic" | "workshop" | "market" | "canal" | "utility" | "factory" | "depot" | "community";
export interface BuildingSpec {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly depth: number;
  readonly height: number;
  readonly wall: number;
  readonly roof: number;
  readonly accent: number;
  readonly style: BuildingStyle;
  readonly sign?: string;
}

export const GRID_WIDTH = 33;
export const GRID_HEIGHT = 30;
export const PLAYER_START: Tile = { x: 6, y: 9 };

/** Entradas e NPCs preservados nas mesmas células da campanha anterior. */
export const ACTOR_TILES = {
  vendedor: { x: 4, y: 6 },
  moradora: { x: 12, y: 6 },
  saira: { x: 16, y: 6 },
  "enter-clinic": { x: 9, y: 3 },
  "enter-workshop": { x: 3, y: 8 },
  "enter-canal-gallery": { x: 14, y: 13 },
  "terminal-canal": { x: 10, y: 12 },
  "patio-console": { x: 29, y: 13 },
  "patio-sentinel": { x: 30, y: 12 },
  "feira-corretor": { x: 11, y: 24 },
  "feira-ajuda": { x: 6, y: 25 },
  "feira-archive": { x: 17, y: 29 },
} as const satisfies Record<string, Tile>;

/** Sete volumes distintos; sem prédios de preenchimento sobre as vias principais. */
export const BUILDINGS: ReadonlyArray<BuildingSpec> = [
  { id:"moradia-03", x:1,y:0,width:3,depth:2,height:70,wall:0x795d52,roof:0x64584f,accent:0xcaa375,style:"housing" },
  { id:"clinica", x:8,y:0,width:3,depth:3,height:104,wall:0x536f6b,roof:0x547773,accent:0xd7c099,style:"clinic",sign:"CLÍNICA 24H" },
  { id:"oficina", x:0,y:8,width:3,depth:2,height:84,wall:0x845745,roof:0x655548,accent:0xdaaf78,style:"workshop",sign:"NILO / REPAROS" },
  { id:"residencial", x:10,y:8,width:3,depth:2,height:92,wall:0x74675e,roof:0x54645e,accent:0xb9a88c,style:"housing" },
  { id:"mercado", x:16,y:0,width:3,depth:3,height:78,wall:0x876759,roof:0x6b594f,accent:0xd1ae72,style:"market",sign:"PONTE / TROCAS" },
  { id:"moradias-canal", x:16,y:9,width:3,depth:3,height:88,wall:0x647068,roof:0x566a67,accent:0xb6b494,style:"canal" },
  { id:"caixa-agua", x:8,y:13,width:3,depth:2,height:72,wall:0x747b70,roof:0x67796d,accent:0xb5ac85,style:"utility" },
  // Setor industrial: Pátio do Reúso. Ruas conectadas sem preenchimento gratuito.
  { id:"galpao-bombas", x:21,y:1,width:3,depth:3,height:112,wall:0x68645a,roof:0x5a6664,accent:0xd4a05a,style:"factory",sign:"BOMBAS / 02" },
  { id:"cooperativa-reuso", x:27,y:1,width:4,depth:3,height:98,wall:0x82624f,roof:0x626d62,accent:0xe2b879,style:"depot",sign:"REÚSO / COOP" },
  { id:"oficina-industrial", x:21,y:9,width:3,depth:3,height:94,wall:0x715b4b,roof:0x665a4e,accent:0xdaaf78,style:"workshop",sign:"OFICINA 17" },
  { id:"reservatorio-sul", x:28,y:8,width:3,depth:3,height:121,wall:0x5b696b,roof:0x4b5c63,accent:0xb0b8a6,style:"utility" },
  { id:"deposito-triagem", x:25,y:15,width:4,depth:3,height:100,wall:0x755e55,roof:0x59615f,accent:0xe2a979,style:"depot",sign:"TRIAGEM / V-09" },
  { id:"galpao-fim", x:31,y:15,width:2,depth:3,height:91,wall:0x66534e,roof:0x5c5b59,accent:0xc39c75,style:"factory" },
  // Mercado dos Cabos: um setor COMERCIAL novo e caminhável na borda sul
  // da Baixada, ligado às ruas antigas pelas travessas x=6,12 e 18.
  { id:"feira-armazem", x:2,y:22,width:3,depth:3,height:83,wall:0x796354,roof:0x715f53,accent:0xd5b176,style:"depot",sign:"ENTREPOSTO" },
  { id:"feira-lanchonete", x:8,y:20,width:3,depth:2,height:71,wall:0x967451,roof:0x645d51,accent:0xf2c47b,style:"market",sign:"CAFÉ DA VIA" },
  { id:"feira-comunidade", x:13,y:23,width:4,depth:3,height:95,wall:0x6d776d,roof:0x5d716e,accent:0xe0ba7f,style:"community",sign:"CASA COMUM" },
  { id:"feira-antenna", x:19,y:21,width:3,depth:3,height:105,wall:0x756957,roof:0x656e68,accent:0xd3b47e,style:"utility",sign:"REDE LOCAL" },
  { id:"feira-bancas", x:7,y:27,width:4,depth:2,height:73,wall:0x967253,roof:0x756459,accent:0xf2c278,style:"market",sign:"TROCAS / CABOS" },
  { id:"feira-deposito", x:24,y:25,width:4,depth:3,height:86,wall:0x676a64,roof:0x586565,accent:0xccb48d,style:"depot",sign:"CARGAS / LESTE" },
];

/** Decoração deliberada: cada objeto ocupa uma célula visual e lógica.
 * Palmeiras só aparecem em bordas; postes não estão no eixo das ruas.
 */
export const PROPS = {
  marketStalls: [{ x: 16, y: 4 }, { x: 9, y: 24 }, { x: 15, y: 28 }],
  palms: [{ x: 5, y: 2 }, { x: 18, y: 8 }, { x: 5, y: 14 }, { x: 21, y: 18 }, { x: 4, y: 29 }],
  lamps: [{ x: 6, y: 5 }, { x: 15, y: 10 }, { x: 25, y: 6 }, { x: 32, y: 10 }, { x: 19, y: 28 }],
  bins: [{ x: 11, y: 5 }, { x: 15, y: 8 }, { x: 8, y: 11 }, { x: 31, y: 7 }, { x: 4, y: 28 }],
  crates: [{ x: 5, y: 8 }, { x: 12, y: 11 }, { x: 18, y: 7 }, { x: 27, y: 7 }, { x: 20, y: 15 }, { x: 26, y: 22 }],
} as const satisfies Record<string, ReadonlyArray<Tile>>;

/** Habitantes com rotas próprias; não são pontos sólidos permanentes. */
export const ROAMING_NPCS = [
  { id:"lia", name:"Lia", role:"OPERADORA DE BOMBAS",
    route:[{x:22,y:6},{x:23,y:6},{x:24,y:6},{x:24,y:7},{x:23,y:7}], pauseTicks:2 },
  { id:"ramon", name:"Ramon", role:"RECUPERADOR DE PEÇAS",
    route:[{x:26,y:12},{x:27,y:12},{x:28,y:12},{x:28,y:13},{x:27,y:13}], pauseTicks:1 },
  { id:"duda", name:"Duda", role:"MORADORA DO PÁTIO",
    route:[{x:22,y:15},{x:23,y:15},{x:23,y:16},{x:22,y:16}], pauseTicks:3 },
  { id:"iza", name:"Iza", role:"ENTREGADORA DA FEIRA",
    route:[{x:15,y:27},{x:16,y:27},{x:17,y:27},{x:17,y:28},{x:16,y:28}], pauseTicks:2 },
  { id:"tomas", name:"Tomás", role:"VOLUNTÁRIO DO ENTREPOSTO",
    route:[{x:4,y:26},{x:5,y:26},{x:5,y:27},{x:4,y:27}], pauseTicks:3 },
] as const;
export type RoamingNpcId = (typeof ROAMING_NPCS)[number]["id"];
export function isIndustrialSector(tile: Tile): boolean { return tile.x >= 20; }
export function isCommercialSector(tile: Tile): boolean { return tile.y >= 20 && tile.x < 23; }
export const SECTORS = [
  {id:"baixada",name:"Baixada Central",type:"residential",description:"Clínica, moradias e Canal Sul"},
  {id:"patio",name:"Pátio do Reúso",type:"industrial",description:"Cooperativa e infraestrutura comunitária"},
  {id:"feira",name:"Mercado dos Cabos",type:"commercial",description:"Feira, redes informais e casa comum"},
] as const;
export type SectorId=(typeof SECTORS)[number]["id"];
export function sectorAt(tile: Tile):SectorId {
  if(isCommercialSector(tile))return "feira";
  if(isIndustrialSector(tile))return "patio";
  return "baixada";
}
export function getSectorById(id:SectorId){return SECTORS.find(s=>s.id===id)!;}


export function cellKey(tile: Tile): string { return tile.x + "," + tile.y; }
export function isInside(tile: Tile): boolean {
  return tile.x >= 0 && tile.y >= 0 && tile.x < GRID_WIDTH && tile.y < GRID_HEIGHT;
}
export const BUILDING_CELLS: ReadonlySet<string> = (() => {
  const result = new Set<string>();
  for (const b of BUILDINGS) for (let x = b.x; x < b.x + b.width; x += 1) {
    for (let y = b.y; y < b.y + b.depth; y += 1) result.add(cellKey({ x, y }));
  }
  return result;
})();
export const ACTOR_CELLS: ReadonlySet<string> = new Set(Object.values(ACTOR_TILES).map(cellKey));
export const PROP_CELLS: ReadonlySet<string> = new Set(Object.values(PROPS).flatMap((tiles) => tiles.map(cellKey)));
export function isWalkable(tile: Tile): boolean {
  const key = cellKey(tile);
  return isInside(tile) && !BUILDING_CELLS.has(key) && !ACTOR_CELLS.has(key) && !PROP_CELLS.has(key);
}

/** Rua principal, ramais e passagens que o piso deve indicar de forma consistente. */
export function isStreet(tile: Tile): boolean {
  const { x, y } = tile;
  return y === 6 || (x === 7 && y >= 3 && y <= 11)
    || (y === 7 && x >= 3 && x <= 10)
    || (y === 12 && x >= 5 && x <= 32)
    || (x === 14 && y >= 4 && y <= 14)
    || (x === 24 && y >= 4 && y <= 19) || (x === 29 && y >= 4 && y <= 19)
    || (y === 14 && x >= 19 && x <= 32)
    // Circuito da Feira: travessas conectadas, calçadão e ruas de serviço.
    || (y === 19 && x >= 3 && x <= 29)
    || (x === 6 && y >= 19 && y <= 29)
    || (x === 12 && y >= 19 && y <= 29)
    || (x === 18 && y >= 19 && y <= 29)
    || (x === 22 && y >= 18 && y <= 29)
    || (x === 29 && y >= 18 && y <= 29)
    || (y === 26 && x >= 3 && x <= 32);
}
