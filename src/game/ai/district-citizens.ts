/** Two real roaming citizens per district, driven by deterministic offline
 * schedules. Each step uses the canonical collision/path rules and never
 * modifies mission rewards, inventory or player saves.
 */
import {districtCanStep,districtWalkable,type DistrictId,type Tile}
 from "../districts/catalog.ts";
import type {NpcAttitude} from "./faction-reactivity.ts";
export interface DistrictCitizenSpec{
 id:string;name:string;role:string;texture:string;home:Tile;
 friendly:string;neutral:string;wary:string;
}
const citizens:Readonly<Record<DistrictId,readonly DistrictCitizenSpec[]>>={
 aurea:[
  {id:"lia",name:"Lia",role:"TÉCNICA DE REDES",texture:"npc-lia",home:{x:11,y:10},
   friendly:"O arquivo Helix está aberto para quem sabe perguntar.",
   neutral:"Mais uma auditoria passou pelas torres hoje.",
   wary:"A segurança está rastreando os acessos."},
  {id:"davi",name:"Davi",role:"MENSAGEIRO",texture:"npc-davi",home:{x:19,y:10},
   friendly:"Tenho acesso às rotas públicas de entrega.",
   neutral:"A cidade funciona sobre prazos que ninguém vê.",
   wary:"Não posso ser visto conversando aqui."},
 ],
 subsolo:[
  {id:"marta",name:"Marta",role:"ARTICULADORA",texture:"npc-marta",home:{x:11,y:10},
   friendly:"A rede de apoio já ouviu falar de você.",
   neutral:"Cada túnel tem alguém mantendo as luzes acesas.",
   wary:"A comunidade precisa de cautela."},
  {id:"ramon",name:"Ramon",role:"RECUPERADOR",texture:"npc-ramon",home:{x:19,y:10},
   friendly:"Se precisar atravessar, conheço um caminho seguro.",
   neutral:"Peças trocadas, água contada, trabalho contínuo.",
   wary:"Hoje não é dia de perguntas."},
 ],
 "setor-zero":[
  {id:"teo",name:"Téo",role:"VIGILANTE DE ARQUIVOS",texture:"npc-teo",home:{x:11,y:10},
   friendly:"Nem todos os registros foram apagados.",
   neutral:"A quarentena mudou, a memória ainda resiste.",
   wary:"Este setor está em alerta. Afaste-se dos terminais."},
  {id:"duda",name:"Duda",role:"TÉCNICA DE CAMPO",texture:"npc-duda",home:{x:19,y:10},
   friendly:"Há uma passagem ainda energizada.",
   neutral:"Reatores em vigília, sinais sem remetente.",
   wary:"Os sensores vão marcar sua presença."},
 ],
 prisma:[
  {id:"saira",name:"Saira",role:"VENDEDORA",texture:"npc-saira",home:{x:11,y:10},
   friendly:"A cena independente não esquece quem ajuda.",
   neutral:"Luzes novas, contratos antigos.",
   wary:"Melhor não abrir o microfone perto da Helix."},
  {id:"iza",name:"Iza",role:"ARTISTA",texture:"npc-iza",home:{x:19,y:10},
   friendly:"Alguns sinais precisam ser ouvidos, não comprados.",
   neutral:"Hoje o palco fala mais alto que os jornais.",
   wary:"As câmeras seguem os rostos conhecidos."},
 ],
 periferia:[
  {id:"joana",name:"Joana",role:"BATEDORA",texture:"npc-joana",home:{x:11,y:10},
   friendly:"As caravanas ainda protegem quem cumpre a palavra.",
   neutral:"A estrada traz notícias dos sete distritos.",
   wary:"É melhor acompanhar os rastros em silêncio."},
  {id:"tomas",name:"Tomás",role:"SOCORRISTA",texture:"npc-tomas",home:{x:19,y:10},
   friendly:"A clínica móvel tem suprimentos para emergência.",
   neutral:"Água, comida e cuidado não podem esperar.",
   wary:"Precisamos de segurança antes de abrir os abrigos."},
 ],
};
export function citizensForDistrict(id:DistrictId):readonly DistrictCitizenSpec[]{
 return citizens[id];
}
const directions:readonly Tile[]=[
 {x:1,y:0},{x:0,y:1},{x:-1,y:0},{x:0,y:-1},
];
const distance=(a:Tile,b:Tile)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
export function chooseDistrictCitizenStep(
 district:DistrictId,spec:DistrictCitizenSpec,position:Tile,
 player:Tile,tick:number,occupied:ReadonlySet<string>,
 attitude:NpcAttitude="neutral",
):Tile{
 if(!Number.isSafeInteger(tick)||tick<0||distance(position,player)>16)
  return position;
 // Low traffic off camera: skip distant agents on alternate ticks.
 if(distance(position,player)>9&&tick%2===1)return position;
 const legal=directions.map(d=>({x:position.x+d.x,y:position.y+d.y}))
  .filter(next=>districtCanStep(district,position,next)&&
   districtWalkable(district,next)&&!occupied.has(next.x+","+next.y)&&
   distance(next,spec.home)<=3&&!(
    Math.abs(next.x-player.x)+Math.abs(next.y-player.y)<2));
 if(legal.length===0)return position;
 const clockwise=legal[(tick+spec.id.length)%legal.length]!;
 if(attitude==="wary"&&distance(position,player)<=5){
  return legal.sort((a,b)=>distance(b,player)-distance(a,player)||
   distance(a,spec.home)-distance(b,spec.home))[0]??position;
 }
 // Always return home instead of wandering without bounds.
 if(distance(position,spec.home)>1&&tick%3===0){
  return legal.sort((a,b)=>distance(a,spec.home)-distance(b,spec.home))[0]??clockwise;
 }
 return clockwise;
}
export function districtCitizenSpeech(
 spec:DistrictCitizenSpec,attitude:NpcAttitude
):string{
 return attitude==="wary"?spec.wary:attitude==="friendly"?spec.friendly:spec.neutral;
}
