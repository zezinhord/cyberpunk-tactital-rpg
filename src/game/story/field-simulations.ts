/** A Cidade Responde — 28 playable six-phase, evidence-led reconstruction
 * simulations. 168 consequential choices are replayable visually, but
 * rewards are granted only once, persisted independently per protagonist.
 * Never overwrite council, recovery or previous character saves.
 */
import {EXPANSION_ROOM_DESIGNS,type ExpansionInnerId} from "../districts/expansion-interiors.ts";
import {COUNCIL_IDS,type CouncilId} from "./district-councils.ts";
import type {RecoveryProgress} from "./recovery-network.ts";

export const SIMULATION_KEY="cyberpunk-tactical-rpg.field-simulations-v20.v1.";
export const SIMULATION_PHASES=6;
export const SIMULATION_FRAMES_PER_PHASE=4;
export const SIMULATION_FRAMES_PER_ROOM=24;
export const SIMULATION_REWARD_XP=96;
export interface SimulationProgress{
 version:1;
 /** 0..6 solved checkpoints per scene, by protagonist. */
 solved:Partial<Record<ExpansionInnerId,number>>;
}
export const EMPTY_SIMULATIONS:Readonly<SimulationProgress>={version:1,solved:{}};
export interface SimulationProblem{
 title:string;prompt:string;
 options:readonly [string,string,string];
 correct:0|1|2;
 hint:string;resolution:string;
}
const problems:Readonly<Record<CouncilId,readonly SimulationProblem[]>>={
 baixada:[
  {title:"Reserva que sumiu",prompt:"A rede pública afirma que o reservatório está vazio, mas o medidor mecânico ainda registra entrada de água. Onde inicia a investigação?",
   options:["Desligar a medição da comunidade","Confrontar hidrômetros, reservatórios e horários de corte","Entregar listas de residentes à companhia"],
   correct:1,hint:"Compare pelo menos duas fontes físicas independentes.",resolution:"Os registros mostram que a reserva existe, mas uma válvula a desviava."},
  {title:"Ordem fora de hora",prompt:"Uma ordem automática redirecionou a água durante a madrugada. Qual prova pode ligá-la à interrupção?",
   options:["Cruzamento do carimbo do comando com a queda de vazão","Depoimento isolado sem qualquer medição","Apagar o log para reiniciar a rede"],
   correct:0,hint:"A ligação precisa preservar sequência temporal verificável.",resolution:"O redirecionamento coincide com a queda de vazão e fica registrado."},
  {title:"Passagem bloqueada",prompt:"A rota até a caixa comunitária está obstruída por um painel de manutenção. Como reabrir o serviço?",
   options:["Ignorar o bloqueio e passar sobre os cabos energizados","Cortar o abastecimento da clínica para alimentar o painel","Desenergizar somente o painel isolado e usar acesso alternativo"],
   correct:2,hint:"Preserve a clínica e isole apenas o risco localizado.",resolution:"O painel é isolado e a rota até a caixa fica acessível."},
  {title:"Interferência corporativa",prompt:"Um operador tenta sobrescrever os hidrômetros recuperados antes da audiência. Como evitar alteração de prova?",
   options:["Substituir as medições por estimativas","Duplicar os registros offline e comparar a assinatura de ambos","Confiar no painel modificado"],
   correct:1,hint:"Uma cópia imutável permite identificar adulterações posteriores.",resolution:"Os dados ficam verificáveis sem divulgar nomes de moradores."},
  {title:"Proteção da manutenção",prompt:"A equipe encontra hostis perto da cisterna. Qual posição protege civis e mantém a rota de fuga?",
   options:["Usar a parede do reservatório como cobertura e manter a saída livre","Concentrar todos na única porta","Desligar a iluminação da enfermaria"],
   correct:0,hint:"Cobertura e evacuação importam mais que uma ofensiva apressada.",resolution:"A equipe protege a passagem sem comprometer o abastecimento."},
  {title:"Custódia da água",prompt:"A cooperativa recebeu o reparo, mas uma nova empresa exige acesso irrestrito à medição das casas. Qual limite adotar?",
   options:["Permitir acesso nominal permanente","Não registrar falhas de abastecimento","Publicar apenas vazão e incidentes, com fiscalização comunitária"],
   correct:2,hint:"Auditoria pública não exige vigiar o consumo individual.",resolution:"A gestão coletiva mantém a água rastreável e os moradores protegidos."},
 ],
 ferrugem:[
  {title:"Turnos fantasmas",prompt:"O painel apagou seis horas de trabalho. Qual fonte confronta os registros alterados?",
   options:["Assinaturas da urna e relógio local independente","O próprio painel que apagou os turnos","Previsão automática de produtividade"],
   correct:0,hint:"A prova precisa existir fora do circuito acusado.",resolution:"Os turnos são reconstituídos a partir de provas independentes."},
  {title:"Forno em risco",prompt:"O sistema insiste em aumentar a temperatura mesmo com a válvula de segurança em alerta.",
   options:["Acelerar a esteira para liberar carga","Isolar o aquecimento, aliviar pressão e verificar parada manual","Cortar sensores para silenciar alarme"],
   correct:1,hint:"Não confunda desligar alarmes com corrigir a ameaça.",resolution:"A pressão cai e a parada manual volta a responder."},
  {title:"Rota das cargas",prompt:"Uma carreta bloqueia a evacuação de operários perto do forno.",
   options:["Enviar civis pelo trajeto do metal líquido","Conter todos na zona de risco","Abrir corredor lateral, mantendo afastamento dos cilindros quentes"],
   correct:2,hint:"Preserve distância dos materiais aquecidos.",resolution:"O corredor lateral recebe evacuação segura."},
  {title:"Prova de fraude",prompt:"Uma transmissão afirma que a greve foi aprovada por robôs. Como verificar?",
   options:["Conferir votos físicos, quórum e carimbos de acesso","Apagar todas as atas","Aceitar o áudio corporativo como original"],
   correct:0,hint:"Procure votos e assinaturas antes de aceitar o resumo.",resolution:"A conferência revela credenciais humanas removidas."},
  {title:"Defesa da fundição",prompt:"Sentinelas avançam por uma passarela estreita na oficina.",
   options:["Avançar sem cobertura pelo centro","Bloquear a subida com cobertura e manter uma retirada lateral","Enclausurar operários na área do forno"],
   correct:1,hint:"Uma defesa eficaz prevê retirada.",resolution:"A passagem fica protegida sem sacrificar o acesso aos freios."},
  {title:"Retorno da produção",prompt:"O conselho precisa reiniciar a oficina sem que as horas de trabalho voltem a desaparecer.",
   options:["Aceitar apenas o relógio de produção","Eliminar todas as medições","Exigir dupla assinatura e direito de parada humana"],
   correct:2,hint:"Responsabilidade exige duas fontes e controle humano.",resolution:"A produção reabre sob registros auditáveis."},
 ],
 aurea:[
  {title:"Conta sanitária",prompt:"Uma verba clínica foi transferida para um fundo privado. Qual trilha contábil conservar?",
   options:["Versões anteriores, valores e assinaturas dos lançamentos","Apenas o saldo novo","Uma lista pública de diagnósticos"],
   correct:0,hint:"Um saldo sem histórico não mostra a origem de uma fraude.",resolution:"Os lançamentos revelam o desvio sem expor pacientes."},
  {title:"Triagem de urgência",prompt:"O sistema dá prioridade a credenciais corporativas mesmo diante de urgências graves.",
   options:["Negar atendimento sem cadastro","Acionar classificação clínica local e manter auditoria anônima","Publicar prontuários para justificar a triagem"],
   correct:1,hint:"Critério clínico não depende de vínculos empregatícios.",resolution:"A urgência médica volta a orientar a fila."},
  {title:"Vazamento de dados",prompt:"Os cabos misturam dados de auditoria e registros pessoais de pacientes.",
   options:["Unir as fibras para reduzir latência","Desligar o sistema de emergência","Separar a linha de auditoria com controle de acesso"],
   correct:2,hint:"O objetivo é continuidade sem exposição de dados.",resolution:"Dados sensíveis são isolados da infraestrutura pública."},
  {title:"Declaração oficial",prompt:"A Helix anuncia que nunca houve bloqueio de consultas. Que confronto documental é válido?",
   options:["Carimbos de triagem e histórico de falhas assinado","Somente discurso do porta-voz","Apagar reclamações antigas"],
   correct:0,hint:"Versões públicas devem ser confrontadas com vestígios materiais.",resolution:"O bloqueio fica demonstrado por registros independentes."},
  {title:"Segurança do arquivo",prompt:"Uma força privada tenta fechar o acesso dos pacientes ao mecanismo de retificação.",
   options:["Ceder todas as chaves à força privada","Manter uma rota segura até o balcão e defender o módulo de revisão","Esconder pacientes dentro da sala de energia"],
   correct:1,hint:"O acesso à contestação é parte do objetivo da defesa.",resolution:"A via de revisão permanece acessível."},
  {title:"Custódia dos registros",prompt:"Quem pode modificar um pagamento depois da investigação?",
   options:["Qualquer administrador, sem registro","Somente a Helix, em segredo","Uma dupla responsável com trilha de alterações independente"],
   correct:2,hint:"Nenhum ator deve ter poder de apagar o próprio rastro.",resolution:"A prestação de contas fica verificável por pacientes."},
 ],
 subsolo:[
  {title:"Ar sem cadastro",prompt:"O regulador condiciona o filtro a uma lista de residentes. Que medição é realmente necessária?",
   options:["Concentração de contaminantes e vazão de ar","A identidade biométrica de cada morador","O histórico de deslocamentos dos túneis"],
   correct:0,hint:"Um filtro responde à qualidade do ar.",resolution:"A ventilação é ajustada sem produzir cadastro de pessoas."},
  {title:"Túnel saturado",prompt:"O retorno de ar revela pressão inversa no corredor ocupado.",
   options:["Continuar a circulação até a máquina falhar","Isolar a seção e equalizar a pressão antes de abrir a passagem","Fechar todas as saídas indefinidamente"],
   correct:1,hint:"Diferencial de pressão precisa ser equalizado.",resolution:"O corredor volta a receber ar seguro."},
  {title:"Remédios clandestinos",prompt:"O estoque da enfermaria diminui após uma inspeção forçada.",
   options:["Divulgar nomes de pacientes","Entregar o depósito restante","Conferir retirada por lote e necessidade médica, sem cadastro nominal"],
   correct:2,hint:"A rastreabilidade pode seguir lotes, não pacientes.",resolution:"Os lotes desaparecidos são identificados com segurança."},
  {title:"Sensor invasivo",prompt:"Um medidor de pressão transmite rostos para fora do Subsolo.",
   options:["Desabilitar coleta de imagem, mantendo pressão e fluxo","Aumentar resolução das câmeras","Cortar o ar para evitar vigilância"],
   correct:0,hint:"A medição ambiental não exige vídeo.",resolution:"O sensor passa a transmitir somente dados de ar."},
  {title:"Cerco nas tubulações",prompt:"Drones inimigos bloqueiam o corredor principal e a enfermaria permanece ocupada.",
   options:["Atrair os drones para a enfermaria","Usar a curva de ventilação como cobertura e preservar o acesso médico","Desligar respiradores para distrair drones"],
   correct:1,hint:"Proteção de civis e manutenção da clínica precedem o combate.",resolution:"O túnel alternativo permite retirada sem interromper tratamento."},
  {title:"Autonomia subterrânea",prompt:"O novo acordo propõe receber peças em troca do mapeamento dos residentes.",
   options:["Aceitar o cadastro permanente","Abandonar o sistema de filtros","Negociar peças por indicadores agregados e prazo definido"],
   correct:2,hint:"Dados operacionais não implicam entregar trajetos pessoais.",resolution:"O Subsolo recebe suprimentos mantendo autonomia."},
 ],
 "setor-zero":[
  {title:"Módulo de isolamento",prompt:"A porta permanece travada apesar da autorização clínica de saída.",
   options:["Verificar o veto médico e o registro físico de abertura","Aumentar a pressão até romper a vedação","Seguir a antiga ordem automática"],
   correct:0,hint:"O direito de sair depende de um controle humano verificável.",resolution:"O veto clínico prevalece e a porta pode ser liberada."},
  {title:"Reator compartilhado",prompt:"Contenção e respiradores estão ligados ao mesmo circuito de emergência.",
   options:["Desligar todos os equipamentos","Separar a linha de suporte à vida e testar a redundância","Priorizar apenas as portas de confinamento"],
   correct:1,hint:"Separe segurança clínica de mecanismos coercitivos.",resolution:"A enfermaria mantém energia independente."},
  {title:"Pressão diferencial",prompt:"Um corredor mantém pressão alta enquanto pacientes são removidos.",
   options:["Abrir simultaneamente todas as portas","Remover todos os alarmes","Fechar o setor, equalizar e liberar uma passagem por vez"],
   correct:2,hint:"A equalização vem antes da abertura.",resolution:"A evacuação prossegue sem choque de pressão."},
  {title:"Memória clínica",prompt:"Registros de internação foram alterados para justificar isolamento prolongado.",
   options:["Comparar ordem, carimbo médico e revisão anterior","Divulgar nomes de pacientes","Aceitar a correção automática"],
   correct:0,hint:"A autenticidade depende do histórico e do contraditório.",resolution:"As alterações indevidas ficam registradas."},
  {title:"Defesa do veto",prompt:"Uma força corporativa tenta reconectar o módulo de contenção às ordens automáticas.",
   options:["Eliminar o veto humano","Defender o console físico de desligamento e manter evacuação aberta","Bloquear a enfermaria para protegê-la"],
   correct:1,hint:"Mantenha o desligamento sob responsabilidade médica.",resolution:"A equipe de saúde preserva poder de veto real."},
  {title:"Direito de revisão",prompt:"Após o reparo, qual regra impede novo confinamento administrativo?",
   options:["Confiar em uma senha corporativa","Destruir todos os registros","Revisão clínica independente, prazos e veto presencial"],
   correct:2,hint:"Responsabilidade exige revisão e limite temporal.",resolution:"O isolamento deixa de ser decisão sem contestação."},
 ],
 prisma:[
  {title:"Sinal cortado",prompt:"O transmissor é interrompido quando uma testemunha começa a falar.",
   options:["Usar a linha independente e registrar o corte editorial","Revelar o nome da testemunha","Aceitar o sinal patrocinado como prova"],
   correct:0,hint:"Preserve o depoimento e a identidade da fonte.",resolution:"O testemunho retorna ao ar com trilha dos cortes."},
  {title:"Registro da edição",prompt:"O painel atribui a censura a uma falha de energia, mas a potência permaneceu normal.",
   options:["Apagar o painel","Cruzamento de potência e sequência de comandos de edição","Publicar a lista de moradores que ligaram"],
   correct:1,hint:"A diferença entre falha elétrica e comando editorial fica nos registros.",resolution:"A intervenção editorial é comprovada sem expor fontes."},
  {title:"Palco em risco",prompt:"Equipamentos de iluminação bloqueiam a rota da plateia.",
   options:["Fechar as saídas para manter a gravação","Ignorar os cabos sobreaquecidos","Isolar a iluminação defeituosa e liberar a passagem lateral"],
   correct:2,hint:"Evacuação e segurança não podem ser sacrificadas à transmissão.",resolution:"O palco permanece operável com rota de evacuação."},
  {title:"Imagem adulterada",prompt:"Uma projeção substituiu as legendas originais da manifestação.",
   options:["Preservar as versões e registrar o que foi alterado","Apagar a cópia anterior","Impedir qualquer correção pública"],
   correct:0,hint:"História preserva versões e permite retificações transparentes.",resolution:"A materialidade da montagem fica acessível."},
  {title:"Ataque ao estúdio",prompt:"Sentinelas tentam cortar o canal ao vivo enquanto a equipe protege fontes.",
   options:["Concentrar civis diante do emissor","Usar passarelas laterais para proteger o comutador e retirar testemunhas","Revelar nomes para negociar trégua"],
   correct:1,hint:"Proteja o sinal e as pessoas simultaneamente.",resolution:"O sinal comunitário permanece ativo."},
  {title:"Direito de resposta",prompt:"O conselho discute quem pode solicitar uma correção depois da transmissão.",
   options:["Apenas patrocinadores","Somente técnicos da corporação","Qualquer pessoa atingida, com histórico público e proteção de dados"],
   correct:2,hint:"A correção pertence também a quem foi representado.",resolution:"A rádio adota retificação pública com respeito às fontes."},
 ],
 periferia:[
  {title:"Ambulância sem rota",prompt:"Um veículo de resgate foi recusado pela estação de carregamento automática.",
   options:["Dar prioridade temporária a emergências e registrar só o atendimento","Exigir histórico de viagens da família","Ignorar a solicitação até a manhã"],
   correct:0,hint:"Uma emergência pode ser validada sem rastrear o paciente.",resolution:"O resgate recebe energia sem cadastro permanente."},
  {title:"Irrigação defeituosa",prompt:"A bomba da estufa funciona sem água e pode queimar.",
   options:["Desativar toda a agricultura","Controlar a bomba pelo nível real da reserva e demanda hídrica","Aumentar o motor até a pressão subir"],
   correct:1,hint:"Uma bomba precisa reconhecer falta de água.",resolution:"A irrigação passa a responder ao reservatório."},
  {title:"Caravana perdida",prompt:"A ponte está parcialmente desabada. Qual rota reduz risco sem abandonar os suprimentos?",
   options:["Usar a ponte sem inspeção","Concentrar todas as cargas no desvio mais estreito","Inspecionar o suporte e selecionar o desvio com área de parada"],
   correct:2,hint:"Uma rota segura também precisa permitir parada e retorno.",resolution:"As caravanas chegam com materiais e pessoas a salvo."},
  {title:"Rastreio ilegal",prompt:"O posto mantém coordenadas de ambulâncias depois do atendimento.",
   options:["Apagar trajeto após o atendimento mantendo só indicadores de emergência","Publicar os históricos de todos os pacientes","Bloquear o rádio de resgate"],
   correct:0,hint:"Coordenar o socorro é diferente de armazenar rastreamento permanente.",resolution:"A comunicação continua e os trajetos são descartados."},
  {title:"Emboscada na estrada",prompt:"Hostis cercam uma caravana de suprimentos médicos perto do viaduto.",
   options:["Abandonar os veículos de socorro","Usar carros avariados como cobertura e retirar civis pelo acostamento","Atrair os disparos para a ambulância"],
   correct:1,hint:"Priorize a evacuação sem abandonar a cobertura.",resolution:"A passagem de emergência volta a ficar aberta."},
  {title:"Cuidado sem fronteira",prompt:"Uma corporação oferece escolta em troca de geolocalização ilimitada.",
   options:["Aceitar rastreamento permanente","Recusar qualquer assistência","Limitar telemetria à entrega com expiração e auditoria"],
   correct:2,hint:"O direito à ajuda não deve exigir vigilância indefinida.",resolution:"A rede de resgate permanece livre e auditável."},
 ],
};
const validRooms=new Set<string>(EXPANSION_ROOM_DESIGNS.map(x=>x.id));
function councilFromRoom(room:ExpansionInnerId):CouncilId{
 const region=COUNCIL_IDS.find(id=>room.startsWith(id+"-"));
 if(!region)throw new Error("Simulação sem distrito");
 return region;
}
export function problemsForRoom(room:ExpansionInnerId):readonly SimulationProblem[]{
 return problems[councilFromRoom(room)];
}
export function simulationPhase(state:SimulationProgress,room:ExpansionInnerId):number{
 return state.solved[room]??0;
}
export function simulationUnlocked(recovery:RecoveryProgress,room:ExpansionInnerId):boolean{
 return Boolean(recovery.outcomes[councilFromRoom(room)]);
}
export function validateSimulations(input:unknown):input is SimulationProgress{
 if(!input||typeof input!=="object"||Array.isArray(input))return false;
 const v=input as Record<string,unknown>;
 if(v.version!==1||Object.keys(v).some(k=>!["version","solved"].includes(k))||
  !v.solved||typeof v.solved!=="object"||Array.isArray(v.solved))return false;
 const entries=Object.entries(v.solved);
 return entries.length<=28&&entries.every(([room,num])=>validRooms.has(room)&&
  Number.isInteger(num)&&typeof num==="number"&&num>=1&&num<=SIMULATION_PHASES);
}
export function readSimulations(characterId:string):SimulationProgress{
 if(!characterId)return {version:1,solved:{}};
 try{
  const raw=globalThis.localStorage?.getItem(SIMULATION_KEY+characterId);
  const decoded:unknown=raw?JSON.parse(raw):null;
  return validateSimulations(decoded)?decoded:{version:1,solved:{}};
 }catch{return {version:1,solved:{}};}
}
export function saveSimulations(characterId:string,progress:SimulationProgress):boolean{
 if(!characterId||!validateSimulations(progress))return false;
 try{
  const db=globalThis.localStorage;if(!db)return false;
  db.setItem(SIMULATION_KEY+characterId,JSON.stringify(progress));return true;
 }catch{return false;}
}
export function answerSimulation(
 state:SimulationProgress,recovery:RecoveryProgress,room:ExpansionInnerId,
 phase:number,choice:number
):{ok:boolean;state:SimulationProgress;message:string;xp:number}{
 if(!validRooms.has(room)||!simulationUnlocked(recovery,room))
  return {ok:false,state,message:"Reconstrua o distrito antes de acessar a simulação de campo.",xp:0};
 const current=simulationPhase(state,room);
 if(current===SIMULATION_PHASES)return {ok:false,state,
  message:"O relatório de simulação foi concluído. A experiência não pode ser duplicada.",xp:0};
 if(phase!==current||!Number.isInteger(choice)||choice<0||choice>2)
  return {ok:false,state,message:"A sequência não corresponde ao registro de campo atual.",xp:0};
 const event=problemsForRoom(room)[current];
 if(choice!==event.correct)return {ok:false,state,message:event.hint,xp:0};
 const next=current+1;
 return {ok:true,state:{version:1,solved:{...state.solved,[room]:next}},
  message:event.resolution+(next===SIMULATION_PHASES?
   " O ciclo de simulação terminou: a equipe mantém um relatório tático verificável.":" Próxima fase liberada."),
  xp:next===SIMULATION_PHASES?SIMULATION_REWARD_XP:0};
}
