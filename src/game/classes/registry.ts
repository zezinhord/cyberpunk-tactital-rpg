/** As 11 classes oficiais de Nova Arcádia. Independentes das seis origens.
 * Poderes e números desta primeira etapa são balanceamento inicial jogável.
 * Passivas, supers e especializações abaixo são METADADOS PLANEJADOS, sem efeito no motor.
 */
export const CLASS_IDS = [
  "solo","netrunner","tecnico","medtech","rockerboy","midia",
  "corporativo","policial","nomade","marginal","fixador",
] as const;
export type ClassId=(typeof CLASS_IDS)[number];
export type ClassRole="offense"|"defense"|"control"|"support"|"mobility";
export type ClassEffect =
 | {type:"damage";amount:number}
 | {type:"jam";turns:number}
 | {type:"heal";amount:number}
 | {type:"guard";amount:number;turns:number}
 | {type:"energy";amount:number}
 | {type:"movement";amount:number}
 | {type:"nextDamage";amount:number}
 | {type:"nextAccuracy";amount:number}
 | {type:"enemyArmor";amount:number;turns:number}
 | {type:"enemyAttack";amount:number;turns:number};
export type ClassVisual="emp"|"shield"|"repair"|"hit"|"move";
export interface ClassSkill {
  id:string; classId:ClassId; name:string; description:string;
  role:ClassRole; target:"self"|"enemy";
  cost:number; cooldown:number; range:number; area:number; minimumLevel:number;
  effects:readonly ClassEffect[]; visual:ClassVisual;
  maxRank:number; rankNote:string;
}
export interface CombatClass {
  id:ClassId; name:string; alias?:string; role:ClassRole;
  description:string; specialties:readonly string[];
  explorationFocus:string; strategicLimit:string;
  startingAbilities:readonly string[];
  /** Conceitos futuros — ainda não aplicam nenhuma regra. */
  plannedPassive:string; plannedUltimate:string; plannedProgression:string;
}
const classData:Record<ClassId,Omit<CombatClass,"id"|"startingAbilities">>={
  solo:{name:"Solo",role:"offense",description:"Combatente de reflexos e confronto direto.",
    specialties:["Agressão tática","Precisão","Sobrevivência em combate"],
    explorationFocus:"Confrontos e intimidação",strategicLimit:"Precisa se aproximar do alvo.",
    plannedPassive:"Reflexos ampliados",plannedUltimate:"Tempo de Reação",plannedProgression:"Especialista em armas ou guarda-costas"},
  netrunner:{name:"Netrunner",role:"control",description:"Especialista em intrusão de redes e interfaces neurais.",
    specialties:["Invasão","Controle de drones","Guerra eletrônica"],
    explorationFocus:"Acesso a terminais e sistemas de segurança",strategicLimit:"Depende de energia e alcance digital.",
    plannedPassive:"Leitura de protocolos",plannedUltimate:"Domínio da Rede",plannedProgression:"Intrusão ou sabotagem"},
  tecnico:{name:"Técnico",alias:"Techie / Engenheiro",role:"support",description:"Engenheiro de campo, reconfigura equipamentos sob pressão.",
    specialties:["Reparos","Improvisação","Dispositivos"],
    explorationFocus:"Reparar equipamentos e estruturas",strategicLimit:"Prepara recursos em vez de dano imediato.",
    plannedPassive:"Oficina portátil",plannedUltimate:"Autômato de Suporte",plannedProgression:"Mecatrônica ou fabricação"},
  medtech:{name:"Tecnólogo Médico",alias:"Medtech",role:"support",description:"Especialista em atendimento médico e implantes.",
    specialties:["Tratamento","Cirurgia de campo","Biotecnologia"],
    explorationFocus:"Tratar moradores e examinar implantes",strategicLimit:"Baixa pressão ofensiva.",
    plannedPassive:"Diagnóstico rápido",plannedUltimate:"Reanimação de Emergência",plannedProgression:"Trauma ou cibernética médica"},
  rockerboy:{name:"Garoto Roqueiro",alias:"Rockerboy",role:"support",description:"Agitador cultural capaz de inspirar resistência.",
    specialties:["Mobilização","Carisma","Performance"],
    explorationFocus:"Organizar moradores e influenciar grupos",strategicLimit:"Amplifica ações futuras em vez de ferir diretamente.",
    plannedPassive:"Voz da Rua",plannedUltimate:"Insurreição",plannedProgression:"Liderança ou propaganda"},
  midia:{name:"Mídia",alias:"Media",role:"control",description:"Investigador que transforma informação em vantagem.",
    specialties:["Investigações","Exposição","Análise"],
    explorationFocus:"Identificar provas e revelar informações ocultas",strategicLimit:"Sua vantagem depende do inimigo exposto.",
    plannedPassive:"Fontes confiáveis",plannedUltimate:"Vazamento em Massa",plannedProgression:"Investigação ou influência"},
  corporativo:{name:"Corporativo / Executivo",alias:"Corpo",role:"defense",description:"Executivo especialista em protocolos, recursos e proteção.",
    specialties:["Negociação","Proteção","Logística"],
    explorationFocus:"Acesso por credenciais e negociação institucional",strategicLimit:"Defesa eficiente, menor mobilidade.",
    plannedPassive:"Contatos de Segurança",plannedUltimate:"Garantia Corporativa",plannedProgression:"Influência ou segurança"},
  policial:{name:"Policial / Homem da Lei",alias:"Lawman",role:"control",description:"Agente de segurança treinado para contenção e abordagem.",
    specialties:["Contenção","Proteção civil","Investigação"],
    explorationFocus:"Procedimentos legais e controle de ameaças",strategicLimit:"Controle gradual, dano moderado.",
    plannedPassive:"Leitura de Cena",plannedUltimate:"Bloqueio de Área",plannedProgression:"Patrulha ou investigação"},
  nomade:{name:"Nômade",alias:"Nomad",role:"mobility",description:"Viajante e condutor que conhece rotas e fugas.",
    specialties:["Mobilidade","Rotas alternativas","Logística"],
    explorationFocus:"Reconhecer caminhos e facilitar travessias",strategicLimit:"Abre espaço, mas não causa dano direto.",
    plannedPassive:"Conhecimento de Percurso",plannedUltimate:"Comboio de Extração",plannedProgression:"Batedor ou piloto"},
  marginal:{name:"Marginal da Rua",alias:"Street Kid",role:"mobility",description:"Sobrevivente dos becos, especialista em evasão.",
    specialties:["Furtividade","Esquiva","Improviso"],
    explorationFocus:"Contatos locais e rotas clandestinas",strategicLimit:"Depende de posicionamento e proteção temporária.",
    plannedPassive:"Conhece o Beco",plannedUltimate:"Desaparecer no Concreto",plannedProgression:"Infiltração ou escaramuça"},
  fixador:{name:"Fixador",alias:"Fixer",role:"support",description:"Intermediário que converte contatos em recursos táticos.",
    specialties:["Negociação","Rede de favores","Suprimentos"],
    explorationFocus:"Negociar recursos e acessos",strategicLimit:"Prepara o golpe seguinte, sem dano direto.",
    plannedPassive:"Teia de Contatos",plannedUltimate:"Favor Irrecusável",plannedProgression:"Comércio ou inteligência"},
};
export const CLASS_SKILLS:Readonly<Record<string,ClassSkill>>={
  "solo-ruptura":{id:"solo-ruptura",classId:"solo",name:"Ruptura de Guarda",description:"Causa 7 de dano em alvo adjacente e concede 2 pontos de movimento.",role:"offense",target:"enemy",cost:4,cooldown:2,range:1,area:0,minimumLevel:1,effects:[{type:"damage",amount:7},{type:"movement",amount:2}],visual:"hit",maxRank:3,rankNote:"Melhora dano e reposicionamento."},
  "netrunner-intrusao":{id:"netrunner-intrusao",classId:"netrunner",name:"Intrusão de Sinal",description:"A até 4 células: causa 3 de dano eletrônico e bloqueia uma ação hostil.",role:"control",target:"enemy",cost:4,cooldown:3,range:4,area:0,minimumLevel:1,effects:[{type:"damage",amount:3},{type:"jam",turns:1}],visual:"emp",maxRank:3,rankNote:"Amplia duração da interferência."},
  "tecnico-recalibracao":{id:"tecnico-recalibracao",classId:"tecnico",name:"Recalibração de Campo",description:"Recupera 5 de energia e ganha +1 Defesa por uma ação hostil.",role:"support",target:"self",cost:2,cooldown:3,range:0,area:0,minimumLevel:1,effects:[{type:"energy",amount:5},{type:"guard",amount:1,turns:1}],visual:"repair",maxRank:3,rankNote:"Aprimora energia recuperada e proteção."},
  "medtech-triagem":{id:"medtech-triagem",classId:"medtech",name:"Triagem de Emergência",description:"Restaura até 8 de Vida e concede +1 Defesa por uma ação inimiga.",role:"support",target:"self",cost:3,cooldown:3,range:0,area:0,minimumLevel:1,effects:[{type:"heal",amount:8},{type:"guard",amount:1,turns:1}],visual:"repair",maxRank:3,rankNote:"Melhora tratamento e resistência."},
  "rockerboy-levante":{id:"rockerboy-levante",classId:"rockerboy",name:"Grito de Levante",description:"Inspira uma resposta ofensiva: próximo ataque básico +3 dano, +1 movimento.",role:"support",target:"self",cost:3,cooldown:3,range:0,area:0,minimumLevel:1,effects:[{type:"nextDamage",amount:3},{type:"movement",amount:1}],visual:"shield",maxRank:3,rankNote:"Aumenta o efeito de mobilização."},
  "midia-denuncia":{id:"midia-denuncia",classId:"midia",name:"Dossiê de Vulnerabilidade",description:"Expõe o alvo a até 4 células: -3 Defesa por 2 ações hostis.",role:"control",target:"enemy",cost:3,cooldown:3,range:4,area:0,minimumLevel:1,effects:[{type:"enemyArmor",amount:3,turns:2}],visual:"emp",maxRank:3,rankNote:"Amplia tempo da exposição."},
  "corporativo-protocolo":{id:"corporativo-protocolo",classId:"corporativo",name:"Protocolo de Contingência",description:"Ativa segurança privada: +4 Defesa por duas ações hostis e +1 energia.",role:"defense",target:"self",cost:4,cooldown:3,range:0,area:0,minimumLevel:1,effects:[{type:"guard",amount:4,turns:2},{type:"energy",amount:1}],visual:"shield",maxRank:3,rankNote:"Estende proteção e eficiência."},
  "policial-contencao":{id:"policial-contencao",classId:"policial",name:"Ordem de Contenção",description:"A até 3 células: causa 2 de dano e reduz o ataque inimigo em 3 por 2 ações.",role:"control",target:"enemy",cost:3,cooldown:2,range:3,area:0,minimumLevel:1,effects:[{type:"damage",amount:2},{type:"enemyAttack",amount:3,turns:2}],visual:"hit",maxRank:3,rankNote:"Melhora a supressão da ameaça."},
  "nomade-rota":{id:"nomade-rota",classId:"nomade",name:"Rota de Evasão",description:"Reabre o deslocamento: +4 movimentos e +1 energia.",role:"mobility",target:"self",cost:2,cooldown:2,range:0,area:0,minimumLevel:1,effects:[{type:"movement",amount:4},{type:"energy",amount:1}],visual:"move",maxRank:3,rankNote:"Amplia alcance da rota."},
  "marginal-esquiva":{id:"marginal-esquiva",classId:"marginal",name:"Esquiva de Beco",description:"Concede +3 Defesa na próxima ação hostil e +2 movimento.",role:"mobility",target:"self",cost:3,cooldown:2,range:0,area:0,minimumLevel:1,effects:[{type:"guard",amount:3,turns:1},{type:"movement",amount:2}],visual:"shield",maxRank:3,rankNote:"Aprimora a saída tática."},
  "fixador-favor":{id:"fixador-favor",classId:"fixador",name:"Favor de Última Hora",description:"Converte contatos em suprimentos: recupera 4 energia e +2 dano no próximo ataque.",role:"support",target:"self",cost:2,cooldown:3,range:0,area:0,minimumLevel:1,effects:[{type:"energy",amount:4},{type:"nextDamage",amount:2}],visual:"repair",maxRank:3,rankNote:"Melhora a logística de campo."},
};
export const PLAYABLE_CLASSES:Readonly<Record<ClassId,CombatClass>>=Object.fromEntries(
 CLASS_IDS.map(id=>[id,{id,...classData[id],
   startingAbilities:Object.values(CLASS_SKILLS).filter(s=>s.classId===id).map(s=>s.id)}])
) as Record<ClassId,CombatClass>;
export function getAllClasses():CombatClass[]{return CLASS_IDS.map(id=>PLAYABLE_CLASSES[id]);}
export function getClassById(id:ClassId):CombatClass{return PLAYABLE_CLASSES[id];}
export function isPlayableClass(id:unknown):id is ClassId {
 return typeof id==="string" && (CLASS_IDS as readonly string[]).includes(id);
}
export function getClassSkills(classId:string|null):ClassSkill[]{
 if(!isPlayableClass(classId))return [];
 return Object.values(CLASS_SKILLS).filter(s=>s.classId===classId);
}
export function getStartingClassAbilities(classId:ClassId):string[]{return [...PLAYABLE_CLASSES[classId].startingAbilities];}
