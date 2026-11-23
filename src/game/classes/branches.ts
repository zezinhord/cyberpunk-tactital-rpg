import type {ClassId,ClassSkill,ClassRole,ClassEffect,ClassVisual} from "./registry.ts";

/** Três especializações por classe. Cada uma tem uma técnica base já existente
 * e um aprimoramento adquirível, com efeitos executados pelo motor de combate.
 * As técnicas iniciais e avançadas anteriores preservam os mesmos IDs de save.
 */
interface PathConfig {
 name:string; description:string; root:string;
 upgrade:{name:string;description:string;role:ClassRole;target:"self"|"enemy";
  cost:number;range:number;visual:ClassVisual;effects:readonly ClassEffect[]};
}
const paths:Record<ClassId,readonly [PathConfig,PathConfig,PathConfig]>={
 solo:[
 {name:"Armamento",description:"Controle de tiro e aberturas ofensivas.",root:"solo-ruptura",upgrade:{name:"Rajada Calculada",description:"Prepara mira e dano para o próximo disparo.",role:"offense",target:"self",cost:4,range:0,visual:"hit",effects:[{type:"nextAccuracy",amount:3},{type:"nextDamage",amount:2}]}},
 {name:"Reflexos",description:"Reação e retirada sob fogo.",root:"solo-marca",upgrade:{name:"Vetores de Evasão",description:"Proteção instantânea e reposicionamento.",role:"mobility",target:"self",cost:4,range:0,visual:"move",effects:[{type:"guard",amount:2,turns:1},{type:"movement",amount:3}]}},
 {name:"Combate Próximo",description:"Pressão corpo a corpo e desarme.",root:"solo-furia",upgrade:{name:"Golpe de Desarme",description:"Dano próximo e redução do ataque hostil.",role:"offense",target:"enemy",cost:6,range:1,visual:"hit",effects:[{type:"damage",amount:8},{type:"enemyAttack",amount:2,turns:2}]}},
 ],
 netrunner:[
 {name:"Invasão",description:"Interceptar comunicações e drones.",root:"netrunner-intrusao",upgrade:{name:"Quebra de Chave",description:"Pacote de ruptura com interferência eletrônica.",role:"control",target:"enemy",cost:5,range:4,visual:"emp",effects:[{type:"damage",amount:6},{type:"jam",turns:1}]}},
 {name:"Sabotagem",description:"Corromper sistemas de defesa.",root:"netrunner-sobrecarga",upgrade:{name:"Bit Corrompido",description:"Reduz ataque e blindagem do alvo.",role:"control",target:"enemy",cost:5,range:4,visual:"emp",effects:[{type:"enemyArmor",amount:3,turns:2},{type:"enemyAttack",amount:2,turns:2}]}},
 {name:"Controle de Rede",description:"Conter dispositivos e protocolos.",root:"netrunner-apagao",upgrade:{name:"Lacre de Rede",description:"Imobiliza ação hostil e limita ofensiva.",role:"control",target:"enemy",cost:6,range:4,visual:"emp",effects:[{type:"jam",turns:2},{type:"enemyAttack",amount:3,turns:2}]}},
 ],
 tecnico:[
 {name:"Engenharia",description:"Blindagem e manutenção de campanha.",root:"tecnico-recalibracao",upgrade:{name:"Blindagem Modular",description:"Recupera reserva e instala proteção.",role:"support",target:"self",cost:3,range:0,visual:"repair",effects:[{type:"guard",amount:4,turns:2},{type:"energy",amount:3}]}},
 {name:"Dispositivos",description:"Dispositivos de contenção elétrica.",root:"tecnico-reparo",upgrade:{name:"Rede de Bobinas",description:"Descarga em um drone e bloqueio da ação.",role:"control",target:"enemy",cost:5,range:4,visual:"emp",effects:[{type:"damage",amount:4},{type:"jam",turns:1}]}},
 {name:"Modificações",description:"Reconfigurar o armamento durante o combate.",root:"tecnico-modulo",upgrade:{name:"Overclock de Campo",description:"Recarrega circuitos e potencializa o próximo disparo.",role:"support",target:"self",cost:4,range:0,visual:"repair",effects:[{type:"energy",amount:4},{type:"nextDamage",amount:3}]}},
 ],
 medtech:[
 {name:"Cura",description:"Estabilização e restauração vital.",root:"medtech-triagem",upgrade:{name:"Hemostasia Neural",description:"Tratamento de trauma com grande recuperação.",role:"support",target:"self",cost:5,range:0,visual:"repair",effects:[{type:"heal",amount:11}]}},
 {name:"Implantes",description:"Fortalecimento de interface cibernética.",root:"medtech-estimulante",upgrade:{name:"Proteção Neural",description:"Protege o implante e restaura energia.",role:"defense",target:"self",cost:4,range:0,visual:"shield",effects:[{type:"guard",amount:4,turns:2},{type:"energy",amount:3}]}},
 {name:"Suporte",description:"Aprimorar o desempenho clínico da equipe.",root:"medtech-protocolo",upgrade:{name:"Dose de Combate",description:"Recupera vida e melhora o próximo acerto.",role:"support",target:"self",cost:5,range:0,visual:"repair",effects:[{type:"heal",amount:8},{type:"nextAccuracy",amount:2}]}},
 ],
 rockerboy:[
 {name:"Inspiração",description:"Reforçar a resistência.",root:"rockerboy-levante",upgrade:{name:"Hino de Resistência",description:"Mobilização que protege e amplia dano.",role:"support",target:"self",cost:4,range:0,visual:"shield",effects:[{type:"guard",amount:3,turns:2},{type:"nextDamage",amount:4}]}},
 {name:"Influência",description:"Abrir oportunidades com presença pública.",root:"rockerboy-mobilizar",upgrade:{name:"Voz Amplificada",description:"Desorganiza a reação do adversário.",role:"control",target:"enemy",cost:4,range:4,visual:"emp",effects:[{type:"enemyAttack",amount:3,turns:2},{type:"nextAccuracy",amount:2}]}},
 {name:"Desestabilização",description:"Perturbar comunicações e moral hostil.",root:"rockerboy-resistencia",upgrade:{name:"Microfonia Hostil",description:"Ruído de alta intensidade que interrompe ações.",role:"control",target:"enemy",cost:6,range:3,visual:"emp",effects:[{type:"damage",amount:5},{type:"jam",turns:1}]}},
 ],
 midia:[
 {name:"Investigação",description:"Leitura forense de pontos vulneráveis.",root:"midia-denuncia",upgrade:{name:"Leitura Forense",description:"Eleva a precisão e expõe a blindagem.",role:"control",target:"enemy",cost:4,range:4,visual:"emp",effects:[{type:"nextAccuracy",amount:3},{type:"enemyArmor",amount:2,turns:2}]}},
 {name:"Exposição",description:"Vazamentos que enfraquecem a proteção.",root:"midia-raio",upgrade:{name:"Vazamento Verificado",description:"Enfraquece fortemente a defesa do alvo.",role:"control",target:"enemy",cost:4,range:4,visual:"emp",effects:[{type:"enemyArmor",amount:4,turns:2}]}},
 {name:"Informação",description:"Desorientação por dados contraditórios.",root:"midia-evidencia",upgrade:{name:"Narrativa Quebrada",description:"Impede reação hostil após revelação crítica.",role:"control",target:"enemy",cost:6,range:4,visual:"emp",effects:[{type:"enemyAttack",amount:3,turns:2},{type:"jam",turns:1}]}},
 ],
 corporativo:[
 {name:"Recursos",description:"Reservas e suprimentos de contingência.",root:"corporativo-protocolo",upgrade:{name:"Acionar Reserva",description:"Recupera recursos e ergue barreira temporária.",role:"support",target:"self",cost:3,range:0,visual:"repair",effects:[{type:"energy",amount:5},{type:"guard",amount:3,turns:2}]}},
 {name:"Negociação",description:"Pressão institucional e concessões.",root:"corporativo-reforco",upgrade:{name:"Pressão Contratual",description:"Inibe a ofensiva do adversário.",role:"control",target:"enemy",cost:4,range:4,visual:"emp",effects:[{type:"enemyAttack",amount:4,turns:2}]}},
 {name:"Estratégia",description:"Retiradas com segurança privada.",root:"corporativo-auditoria",upgrade:{name:"Protocolo de Retirada",description:"Movimento planejado e proteção.",role:"defense",target:"self",cost:5,range:0,visual:"shield",effects:[{type:"movement",amount:4},{type:"guard",amount:3,turns:2}]}},
 ],
 policial:[
 {name:"Supressão",description:"Reduzir a capacidade ofensiva hostil.",root:"policial-contencao",upgrade:{name:"Tiro de Advertência",description:"Ataque moderado e supressão de reação.",role:"control",target:"enemy",cost:4,range:3,visual:"hit",effects:[{type:"damage",amount:6},{type:"enemyAttack",amount:2,turns:2}]}},
 {name:"Proteção",description:"Posicionamento e cobertura.",root:"policial-restricao",upgrade:{name:"Escudo de Linha",description:"Proteção reforçada no avanço.",role:"defense",target:"self",cost:4,range:0,visual:"shield",effects:[{type:"guard",amount:5,turns:2}]}},
 {name:"Controle Tático",description:"Impedir movimentos e respostas hostis.",root:"policial-interdicao",upgrade:{name:"Imobilização",description:"Dano controlado e interrupção da ação.",role:"control",target:"enemy",cost:6,range:2,visual:"emp",effects:[{type:"damage",amount:4},{type:"jam",turns:1}]}},
 ],
 nomade:[
 {name:"Sobrevivência",description:"Resistência e recuperação em trânsito.",root:"nomade-rota",upgrade:{name:"Rastro de Suprimentos",description:"Recupera vida e energia a partir das reservas.",role:"support",target:"self",cost:4,range:0,visual:"repair",effects:[{type:"heal",amount:7},{type:"energy",amount:2}]}},
 {name:"Mobilidade",description:"Flancos, atalhos e deslocamento.",root:"nomade-arrancada",upgrade:{name:"Desvio de Rota",description:"Reabre caminhos e melhora a mira.",role:"mobility",target:"self",cost:4,range:0,visual:"move",effects:[{type:"movement",amount:5},{type:"nextAccuracy",amount:2}]}},
 {name:"Comboio",description:"Manobras de escolta e evacuação; veículos reais dependem de sistema futuro.",root:"nomade-visada",upgrade:{name:"Manobra de Escolta",description:"Avança protegendo a retirada.",role:"mobility",target:"self",cost:5,range:0,visual:"move",effects:[{type:"movement",amount:3},{type:"guard",amount:3,turns:2}]}},
 ],
 marginal:[
 {name:"Furtividade",description:"Cobertura e desaparecimento urbano.",root:"marginal-esquiva",upgrade:{name:"Cortina de Fumaça",description:"Proteção rápida e reposicionamento.",role:"mobility",target:"self",cost:4,range:0,visual:"shield",effects:[{type:"guard",amount:3,turns:2},{type:"movement",amount:3}]}},
 {name:"Improvisação",description:"Ataques com materiais disponíveis.",root:"marginal-sombra",upgrade:{name:"Arma de Ocasião",description:"Dano inesperado no curto alcance.",role:"offense",target:"enemy",cost:5,range:2,visual:"hit",effects:[{type:"damage",amount:8},{type:"nextAccuracy",amount:1}]}},
 {name:"Combate Urbano",description:"Controle de becos e rotas de fuga.",root:"marginal-golpe",upgrade:{name:"Ponto de Fuga",description:"Recupera fôlego e reposiciona-se.",role:"mobility",target:"self",cost:4,range:0,visual:"move",effects:[{type:"movement",amount:4},{type:"energy",amount:3}]}},
 ],
 fixador:[
 {name:"Contatos",description:"Favores e comunicação clandestina.",root:"fixador-favor",upgrade:{name:"Acionar Favores",description:"Ativa reserva energética por rede de contatos.",role:"support",target:"self",cost:3,range:0,visual:"repair",effects:[{type:"energy",amount:6}]}},
 {name:"Contrabando",description:"Acesso a armamento e componentes discretos.",root:"fixador-contato",upgrade:{name:"Carga Discreta",description:"Suprimento ofensivo contra alvo distante.",role:"offense",target:"enemy",cost:5,range:4,visual:"hit",effects:[{type:"damage",amount:7}]}},
 {name:"Suporte Operacional",description:"Recursos de campo e cobertura.",root:"fixador-recursos",upgrade:{name:"Reserva Operacional",description:"Kit de primeiros socorros e proteção.",role:"support",target:"self",cost:5,range:0,visual:"repair",effects:[{type:"heal",amount:8},{type:"guard",amount:2,turns:2}]}},
 ],
};

export interface ClassBranch {id:string;name:string;description:string;skillIds:readonly [string,string,string]}
export const CLASS_BRANCHES:Readonly<Record<ClassId,readonly ClassBranch[]>>=
 Object.fromEntries(Object.entries(paths).map(([classId,config])=>[
   classId,config.map((item,index)=>({id:classId+"-branch-"+index,
     name:item.name,description:item.description,
     skillIds:[item.root,classId+"-branch-skill-"+index,classId+"-master-skill-"+index]}))
 ])) as unknown as Record<ClassId,readonly ClassBranch[]>;

export const BRANCH_CLASS_SKILLS:Readonly<Record<string,ClassSkill>>=
 Object.fromEntries(Object.entries(paths).flatMap(([classId,config])=>
   config.map((item,index)=>{
     const id=classId+"-branch-skill-"+index;
     const skill:ClassSkill={id,classId:classId as ClassId,
       name:item.upgrade.name,description:item.upgrade.description,
       role:item.upgrade.role,target:item.upgrade.target,cost:item.upgrade.cost,
       cooldown:3+Math.floor(index/2),range:item.upgrade.range,area:0,
       minimumLevel:4+index,effects:item.upgrade.effects,visual:item.upgrade.visual,
       maxRank:3,rankNote:"Até grau 3: especialização intermediária de maestria."};
     return [id,skill] as const;
   })
 )) as Record<string,ClassSkill>;

/** Terceiro nó de cada uma das 33 especializações.
 * Desbloqueado a partir dos níveis 7/8/9, sem aumentar o nível máximo
 * nem modificar IDs, ranks, custos ou saves das 66 técnicas anteriores.
 */
type MasterConfig={
 name:string;description:string;role:ClassRole;target:"self"|"enemy";
 cost:number;range:number;visual:ClassVisual;effects:readonly ClassEffect[];
};
const master=(name:string,description:string,role:ClassRole,target:"self"|"enemy",
 cost:number,range:number,visual:ClassVisual,effects:readonly ClassEffect[]):MasterConfig=>
 ({name,description,role,target,cost,range,visual,effects});
const mastery:Record<ClassId,readonly [MasterConfig,MasterConfig,MasterConfig]>={
 solo:[
 master("Supressão Cruzada","Tiro intenso que expõe a blindagem e abre uma vantagem precisa.","offense","enemy",7,4,"hit",[{type:"damage",amount:10},{type:"enemyArmor",amount:2,turns:2}]),
 master("Instinto de Sobrevivência","Evasão rápida combina proteção reforçada com deslocamento adicional.","mobility","self",6,0,"move",[{type:"guard",amount:5,turns:2},{type:"movement",amount:4}]),
 master("Desarme Definitivo","Ataque de alcance curto compromete a reação e a força do alvo.","offense","enemy",8,1,"hit",[{type:"damage",amount:12},{type:"enemyAttack",amount:3,turns:2}]),
 ],
 netrunner:[
 master("Protocolo Raiz","Intrusão de interface provoca pane severa e interrompe controle hostil.","control","enemy",7,5,"emp",[{type:"damage",amount:7},{type:"jam",turns:2}]),
 master("Contaminação de Kernel","Enfraquece blindagem digital e ofensiva do inimigo simultaneamente.","control","enemy",7,5,"emp",[{type:"enemyArmor",amount:4,turns:2},{type:"enemyAttack",amount:4,turns:2}]),
 master("Silêncio de Rede","Suprime ações do alvo e introduz ruído no seu protocolo de tiro.","control","enemy",8,5,"emp",[{type:"jam",turns:2},{type:"enemyAttack",amount:3,turns:2}]),
 ],
 tecnico:[
 master("Armadura Reciclada","Uma oficina portátil instala reforço e recarrega os circuitos de campo.","defense","self",5,0,"shield",[{type:"guard",amount:6,turns:2},{type:"energy",amount:4}]),
 master("Malha de Indução","Bobinas de contenção danificam e bloqueiam dispositivos hostis.","control","enemy",7,4,"emp",[{type:"damage",amount:8},{type:"jam",turns:1}]),
 master("Reconfiguração Profunda","Redireciona potência ao próximo disparo e recupera a reserva energética.","support","self",6,0,"repair",[{type:"energy",amount:6},{type:"nextDamage",amount:4},{type:"nextAccuracy",amount:2}]),
 ],
 medtech:[
 master("Regeneração de Emergência","Atendimento de trauma restaura Vida e protege o paciente contra novos impactos.","support","self",7,0,"repair",[{type:"heal",amount:13},{type:"guard",amount:2,turns:2}]),
 master("Neurointerface Estável","Recupera energia cibernética e protege as conexões implantadas.","defense","self",6,0,"shield",[{type:"energy",amount:5},{type:"guard",amount:5,turns:2}]),
 master("Dardo Hemostático","Neutraliza o ataque do inimigo com uma injeção de contenção.","control","enemy",7,3,"hit",[{type:"damage",amount:8},{type:"enemyAttack",amount:3,turns:2}]),
 ],
 rockerboy:[
 master("Voz da Assembleia","O discurso sustenta a defesa da equipe e melhora a próxima precisão.","support","self",6,0,"shield",[{type:"guard",amount:4,turns:2},{type:"nextAccuracy",amount:4}]),
 master("Eco da Rebelião","A interferência rítmica compromete o sistema ofensivo da sentinela.","control","enemy",7,4,"emp",[{type:"enemyAttack",amount:4,turns:2},{type:"jam",turns:1}]),
 master("Palco de Resistência","A performance devolve energia, coragem defensiva e mobilidade.","support","self",7,0,"move",[{type:"energy",amount:5},{type:"movement",amount:3},{type:"guard",amount:3,turns:2}]),
 ],
 midia:[
 master("Arquivo Não Censurado","Provas expostas danificam o alvo e comprometem sua blindagem.","control","enemy",7,5,"emp",[{type:"damage",amount:8},{type:"enemyArmor",amount:3,turns:2}]),
 master("Contrainformação","Desorienta os sensores e anula temporariamente uma ação hostil.","control","enemy",6,5,"emp",[{type:"jam",turns:1},{type:"enemyAttack",amount:5,turns:2}]),
 master("Relato Irrefutável","Causa exposição crítica e prepara uma nova ofensiva precisa.","offense","enemy",7,4,"hit",[{type:"damage",amount:9},{type:"nextAccuracy",amount:3}]),
 ],
 corporativo:[
 master("Cláusula de Defesa","Seguro de emergência ativa barreira e transfere energia de reserva.","defense","self",6,0,"shield",[{type:"guard",amount:6,turns:2},{type:"energy",amount:3}]),
 master("Auditoria Integral","Documento de risco reduz a blindagem e o potencial ofensivo do alvo.","control","enemy",7,5,"emp",[{type:"enemyArmor",amount:4,turns:2},{type:"enemyAttack",amount:3,turns:2}]),
 master("Logística Prioritária","Aciona crédito energético e prepara o golpe seguinte com melhor alcance.","support","self",6,0,"repair",[{type:"energy",amount:7},{type:"nextDamage",amount:3},{type:"nextAccuracy",amount:2}]),
 ],
 policial:[
 master("Cercamento Tático","Contenção de precisão impede retaliação do alvo próximo.","control","enemy",7,3,"hit",[{type:"damage",amount:9},{type:"enemyAttack",amount:4,turns:2}]),
 master("Escudo Cidadão","Defesa móvel protege a retirada sem sacrificar o deslocamento.","defense","self",6,0,"shield",[{type:"guard",amount:6,turns:2},{type:"movement",amount:2}]),
 master("Mandado de Interdição","Interrompe o protocolo hostil e reduz suas respostas ofensivas.","control","enemy",8,3,"emp",[{type:"damage",amount:6},{type:"jam",turns:2}]),
 ],
 nomade:[
 master("Reserva de Longa Rota","Um suprimento de caravana restaura a Vida e recarrega a autonomia.","support","self",6,0,"repair",[{type:"heal",amount:10},{type:"energy",amount:4}]),
 master("Caminho Invisível","Reorienta o trajeto com movimento elevado e proteção pontual.","mobility","self",6,0,"move",[{type:"movement",amount:6},{type:"guard",amount:3,turns:2}]),
 master("Escolta do Horizonte","Uma manobra ofensiva abre caminho e reduz a capacidade do perseguidor.","offense","enemy",7,4,"hit",[{type:"damage",amount:8},{type:"enemyAttack",amount:2,turns:2}]),
 ],
 marginal:[
 master("Sombra de Concreto","Evasão em becos dificulta ataques e amplia drasticamente o deslocamento.","mobility","self",6,0,"move",[{type:"guard",amount:5,turns:2},{type:"movement",amount:5}]),
 master("Golpe Improvisado","Arma local surpreende o alvo e expõe sua proteção por um curto período.","offense","enemy",7,2,"hit",[{type:"damage",amount:11},{type:"enemyArmor",amount:2,turns:2}]),
 master("Rota de Escape","A fuga improvisada restabelece energia e protege contra perseguição.","mobility","self",6,0,"move",[{type:"movement",amount:5},{type:"energy",amount:4},{type:"guard",amount:2,turns:2}]),
 ],
 fixador:[
 master("Teia de Favores","A rede de contatos entrega recursos imediatos e protege a negociação.","support","self",6,0,"repair",[{type:"energy",amount:7},{type:"guard",amount:2,turns:2}]),
 master("Entrega de Alto Risco","Uma remessa clandestina causa dano à distância e abre a blindagem.","offense","enemy",7,5,"hit",[{type:"damage",amount:10},{type:"enemyArmor",amount:2,turns:2}]),
 master("Último Recurso","Rede de resgate restauradora recupera Vida e libera os próximos movimentos.","support","self",7,0,"repair",[{type:"heal",amount:9},{type:"energy",amount:4},{type:"movement",amount:2}]),
 ],
};
export const MASTER_BRANCH_SKILLS:Readonly<Record<string,ClassSkill>>=
 Object.fromEntries(Object.entries(mastery).flatMap(([classId,config])=>
  config.map((item,index)=>{
   const id=classId+"-master-skill-"+index;
   const skill:ClassSkill={id,classId:classId as ClassId,
    name:item.name,description:item.description,role:item.role,target:item.target,
    cost:item.cost,range:item.range,visual:item.visual,effects:item.effects,
    cooldown:4+Math.floor(index/2),area:0,minimumLevel:7+index,
    maxRank:2,rankNote:"Domínio avançado da especialização."};
   return [id,skill] as const;
  })
 )) as Record<string,ClassSkill>;
