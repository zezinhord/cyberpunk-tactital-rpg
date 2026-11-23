/** Cinematic introductions to characters already named by Nova Arcádia.
 * A single short establishing beat is prepended to the FIRST real conversation.
 * No mission is created or resolved here, and no character's motives change.
 */
export interface ContactCinematicIntro{
 cinematicId:string;speaker:string;role:string;portrait:string;text:string;
}
const CONTACTS:Readonly<Record<string,{name:string;text:string}>>={
 amara:{name:"Dra. Amara Solis",
  text:"Na clínica comunitária da Baixada, os prontuários permanecem à vista. A médica cruza dados de atendimento com relatos que os arquivos oficiais não explicam."},
 helena:{name:"Helena Voss",
  text:"O nome de Helena Voss acompanha documentos da direção da Helix. Entre credenciais e barreiras de segurança, as informações chegam sempre filtradas."},
 elias:{name:"Elias Renner",
  text:"O nome de Elias Renner surge em meio aos conflitos de Nova Arcádia. A conversa pode esclarecer fatos, mas as decisões do protagonista continuam em aberto."},
 mara:{name:"Mara Veyra",
  text:"Nas passagens do Subsolo, sobreviventes e contatos comunitários dividem caminhos que não aparecem nos mapas corporativos. Mara Veyra é uma das vozes desse território."},
 dorian:{name:"Dorian Kade",
  text:"O nome de Dorian Kade atravessa os registros e encontros da cidade. A cena conserva o ponto de vista do protagonista, sem antecipar intenções ou alianças."},
 nilo:{name:"Nilo",
  text:"Peças reaproveitadas, ferramentas e registros de manutenção dão forma ao trabalho de Nilo. A oficina é também um lugar de encontro para quem conhece a Baixada."},
 joana:{name:"Joana",
  text:"As conversas da Baixada circulam por corredores e áreas comuns. Joana conhece as consequências locais dos acontecimentos, não todas as respostas."},
 rosa:{name:"Rosa",
  text:"Em Ferrugem, depoimentos sobre a indústria e seus turnos de trabalho se transformam em provas. Rosa participa dessa investigação sem decidir pelo protagonista."},
};
export const CINEMATIC_CONTACT_IDS=Object.keys(CONTACTS);
export function firstContactCinematic(speaker:string):ContactCinematicIntro|null{
 const name=speaker.toLocaleLowerCase("pt-BR").normalize("NFD")
  .replace(/[\u0300-\u036f]/g,"").trim();
 const key=Object.keys(CONTACTS).find(id=>
  name===id||name.endsWith(" "+id)||name.startsWith(id+" ")||
  name.includes(" "+id+" "));
 if(!key)return null;
 const contact=CONTACTS[key]!;
 return {cinematicId:"first-contact:"+key,speaker:contact.name,
  role:"PRIMEIRO CONTATO · CENA DRAMÁTICA",portrait:"◆",text:contact.text};
}
