import type {ReactElement} from "react";
export type Emotion="neutral"|"concerned"|"resolute"|"suspicious"|"angry";
export type DialogueTone="community"|"corporate"|"hostile"|"system"|"eden";
type Profile={id:string;skin:string;hair:string;coat:string;accent:string;style:string;tone:DialogueTone};
const profiles:Record<string,Partial<Profile>>={
 amara:{skin:"#b88b6d",hair:"#c5b491",coat:"#d2e1da",accent:"#8cbdc0",style:"short"},
 joana:{skin:"#a67156",hair:"#2b1e2a",coat:"#6c6086",accent:"#e4b78b",style:"braids"},
 nilo:{skin:"#bd8362",hair:"#28231f",coat:"#71523c",accent:"#d59c60",style:"short"},
 saira:{skin:"#b9805b",hair:"#2d2125",coat:"#3f6d57",style:"bun"},
 teo:{skin:"#bd866b",hair:"#36302d",coat:"#42667a",style:"cap"},
 lia:{skin:"#aa7c65",hair:"#41343a",coat:"#a5bab8",style:"short"},
 ramon:{skin:"#95644e",hair:"#26292d",coat:"#616b59",style:"short"},
 duda:{skin:"#af8065",hair:"#2b2431",coat:"#a36e63",style:"cap"},
 iza:{skin:"#aa7a5d",hair:"#38272b",coat:"#625b68",style:"long"},
 tomas:{skin:"#8e654c",hair:"#252c2d",coat:"#526774",style:"short"},
 davi:{skin:"#b58566",hair:"#2c2934",coat:"#82705e",style:"short"},
 marta:{skin:"#9c6e5b",hair:"#302534",coat:"#68556c",style:"braids"},
 helena:{skin:"#b68a76",hair:"#423b47",coat:"#4a6173",style:"bun",tone:"corporate"},
 elias:{skin:"#9e7e6a",hair:"#333844",coat:"#485760",style:"short",tone:"corporate"},
 mara:{skin:"#9d7055",hair:"#262934",coat:"#4d5960",style:"hood"},
 celina:{skin:"#b18264",hair:"#2a2c40",coat:"#c1cfd0",style:"bun",tone:"corporate"},
 iuri:{skin:"#ae8064",hair:"#4c4b49",coat:"#788181",style:"short"},
 kai:{skin:"#bb8969",hair:"#45304f",coat:"#80577d",style:"undercut"},
 dara:{skin:"#976e58",hair:"#302826",coat:"#866b55",style:"long"},
 rosa:{skin:"#a77d61",hair:"#37312e",coat:"#6e7475",style:"short"},
 dorian:{skin:"#a17861",hair:"#282c30",coat:"#4b4a58",style:"hood"},
};
export function characterPortrait(speaker:string,role:string):Profile{
 const norm=speaker.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
 const found=Object.entries(profiles).find(([name])=>norm===name||norm.startsWith(name+" ")||norm.endsWith(" "+name)||norm.includes(" "+name+" "));
 if(found)return {id:found[0],skin:"#b48870",hair:"#31303a",coat:"#576774",accent:"#e2b885",style:"short",tone:"community",...found[1]};
 if(/eden|éden/i.test(speaker))return {id:"eden",skin:"#7dffb3",hair:"#7dffb3",coat:"#112d29",accent:"#7dffb3",style:"short",tone:"eden"};
 if(/terminal|console|sistema|rede|registro|arquivo|mural|quadro|central|unidade|escada|transporte/i.test(speaker+" "+role))
   return {id:"terminal",skin:"#e3bc85",hair:"#26333c",coat:"#2e454e",accent:"#ffd166",style:"short",
    tone:/sentinela|vigilância não autorizada|unidade v-09/i.test(speaker+" "+role)?"hostile":"system"};
 return {id:"citizen",skin:"#b48870",hair:"#31303a",coat:"#576774",accent:"#e2b885",style:"short",tone:"community"};
}
export function dialogueEmotion(text:string):Emotion{
 const t=text.toLocaleLowerCase("pt-BR");
 if(/ameaça|identificação pendente|bloqueado|alerta|atacar|armadilha/.test(t))return "angry";
 if(/não confio|não reconheço|estranho|inconclusiva|assinatura|ninguém quis/.test(t))return "suspicious";
 if(/apagado|desaparec|ferid|perd|medo|alag|não responde/.test(t))return "concerned";
 if(/prova|cópia|registros recuperados|vamos|preciso|siga|consegui|podemos/.test(t))return "resolute";
 return "neutral";
}
/** Arte de busto vetorial por personagem. Não é mais letra/imagem provisória ampliada. */
export default function NarrativePortrait({speaker,role,emotion}:{
 speaker:string;role:string;emotion:Emotion;
}):ReactElement{
 const p=characterPortrait(speaker,role);
 if(p.id==="eden")return <div className="na-portrait-scene eden" data-portrait-id="eden" role="img" aria-label="Sinal do Projeto Éden">
  <svg viewBox="0 0 190 228" aria-hidden="true">
   <rect width="190" height="228" fill="#0b2420"/>
   <circle cx="95" cy="111" r="72" fill="none" stroke="#7dffb3" strokeDasharray="5 9"/>
   <path d="M95 48 L152 80 L152 144 L95 176 L38 144 L38 80 Z" fill="#163a31" stroke="#7dffb3" strokeWidth="3"/>
   <text x="95" y="144" textAnchor="middle" fill="#7dffb3" fontSize="75" fontWeight="700">É</text>
  </svg></div>;
 if(p.id==="terminal")return <div className="na-portrait-scene terminal" data-portrait-id="terminal" role="img" aria-label="Terminal de dados">
  <svg viewBox="0 0 190 228" aria-hidden="true">
   <rect width="190" height="228" fill="#14242c"/>
   <rect x="23" y="35" width="144" height="150" rx="9" fill="#283e45" stroke="#ffd166" strokeWidth="3"/>
   <rect x="32" y="46" width="126" height="113" rx="4" fill="#101c24"/>
   <path d="M44 67 H134 M44 82 H106 M44 99 H141 M44 117 H88 M44 132 H120"
     stroke="#ffd166" strokeWidth="4" opacity=".7"/>
   <path d="M92 185 V196 H65 M92 196 H128" stroke="#8f9da4" strokeWidth="8"/>
   <circle cx="146" cy="148" r="4" fill="#ffd166"/>
  </svg></div>;
 const angry=emotion==="angry",sad=emotion==="concerned",doubt=emotion==="suspicious";
 return <div className="na-portrait-scene human" data-portrait-id={p.id} data-emotion={emotion}
   role="img" aria-label={"Retrato de "+speaker+", expressão "+emotion}>
   <svg viewBox="0 0 190 228" aria-hidden="true">
    <rect width="190" height="228" fill="#182b32"/>
    <path d="M0 182 L190 117 M0 211 L190 154" stroke={p.accent} strokeWidth="3" opacity=".18"/>
    <circle cx="95" cy="91" r="77" fill={p.accent} opacity=".08"/>
    <ellipse cx="95" cy="227" rx="89" ry="63" fill={p.coat}/>
    <path d="M25 228 L43 167 L71 151 L84 139 H106 L124 154 L146 167 L165 228Z" fill={p.coat} stroke="#17252e" strokeWidth="4"/>
    <path d="M79 140 L95 162 L110 140 L124 155 L96 197 L67 155Z" fill="#34464c"/>
    <path d="M83 122 H108 V154 L96 170 L83 154Z" fill={p.skin}/>
    {(p.style==="long"||p.style==="braids"||p.style==="hood")&&
     <path d="M52 82 Q46 31 96 30 Q145 31 143 83 L149 159 L123 173 L60 167 L42 150Z" fill={p.hair}/>}
    <path d="M57 80 Q59 38 94 36 Q130 38 135 80 L130 117 Q121 146 96 151 Q69 146 59 116Z"
      fill={p.skin} stroke="#775346" strokeWidth="1.2"/>
    <path d="M54 84 Q50 29 95 32 Q144 29 141 86 L127 71 Q98 61 80 67 L58 92Z" fill={p.hair}/>
    {p.style==="bun"&&<ellipse cx="140" cy="54" rx="16" ry="17" fill={p.hair}/>}
    {p.style==="cap"&&<path d="M45 66 Q93 22 144 67 L159 76 L54 75Z" fill={p.coat} stroke={p.accent} strokeWidth="2"/>}
    {p.style==="undercut"&&<path d="M54 70 L121 32 L142 45 L125 78Z" fill={p.accent} opacity=".64"/>}
    {p.style==="braids"&&<><path d="M58 86 L50 164 M132 84 L143 164" stroke={p.hair} strokeWidth="11"/>
      <path d="M55 103 L45 143 M136 100 L148 143" stroke={p.accent} strokeWidth="2" strokeDasharray="4 7"/></>}
    <path d={angry?"M72 90 L86 94 M106 94 L120 90":sad?"M72 94 L86 91 M106 91 L120 94":
      doubt?"M72 89 L86 92 M106 89 L120 86":"M72 92 H86 M106 92 H120"} stroke={p.hair} strokeWidth="3" strokeLinecap="round"/>
    <g className="na-portrait-eyes" stroke="#252c31" strokeWidth="3" strokeLinecap="round">
     <path d="M74 100 H84 M108 100 H118"/></g>
    <path d="M96 106 L92 121 H102" stroke="#925c4c" strokeWidth="2" fill="none"/>
    <path d={angry?"M82 133 H109":sad?"M82 139 Q95 125 109 139":
      emotion==="resolute"?"M83 132 H108":"M84 134 Q96 138 108 134"}
      fill="none" stroke="#743c3c" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M57 152 L43 182 M134 152 L148 182" stroke={p.accent} strokeWidth="3" strokeOpacity=".6"/>
    <path d="M46 212 H144" stroke={p.accent} strokeWidth="3" strokeOpacity=".8"/>
   </svg>
  </div>;
}
