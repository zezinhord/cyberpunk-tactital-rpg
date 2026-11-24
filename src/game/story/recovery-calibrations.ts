/** OPERAÇÃO RETOMADA: 21 authored, readable field-calibration puzzles.
 * Each puzzle is solved by selecting the correct technical intervention while
 * physically standing beside its machine in the matching interior.
 * Wrong options offer a hint without consuming resources or corrupting saves.
 */
import type {ExpansionInnerId} from "../districts/expansion-interiors.ts";
export interface RecoveryPuzzle{
 prompt:string;
 options:readonly [string,string,string];
 correct:0|1|2;
 explanation:string;
 hint:string;
}
export const RECOVERY_PUZZLES:Readonly<Partial<Record<ExpansionInnerId,RecoveryPuzzle>>>={
 "baixada-observatorio":{
  prompt:"As leituras da régua diferem do painel central. A chuva foi registrada, mas a água desapareceu antes da distribuição. Qual dado permite detectar o desvio?",
  options:["Apagar os valores antigos e reiniciar o hidrômetro",
           "Comparar vazão de entrada, nível da cisterna e registros comunitários",
           "Enviar a lista de moradores para a Helix recalcular a tarifa"],
  correct:1,
  explanation:"A discrepância entre entrada, reserva e entrega prova o desvio sem identificar moradores.",
  hint:"Uma leitura isolada não prova um desvio; confronte três medições independentes.",
 },
 "baixada-mercado-noturno":{
  prompt:"O comutador ainda energiza iluminação corporativa, mas as bancas ficaram no escuro. Que circuito deve ser isolado?",
  options:["Desviar a energia para a rede auxiliar da feira, mantendo proteção contra sobrecarga",
           "Ligá-lo diretamente à rede pública sem disjuntor",
           "Cortar todos os circuitos e encerrar a feira"],
  correct:0,
  explanation:"A linha de serviço comunitária volta a funcionar sem eliminar fusíveis ou segurança de quem trabalha.",
  hint:"A feira precisa de eletricidade com proteção, não de um curto-circuito ou um apagão.",
 },
 "baixada-passarela":{
  prompt:"O sensor continua registrando janelas privadas, embora a passarela precise de alertas de risco. Qual reparo preserva a privacidade?",
  options:["Publicar todo o vídeo de quem atravessa a passarela",
           "Manter a câmera voltada para residências em nome da segurança",
           "Isolar o módulo de imagem e conservar somente o aviso local de perigo"],
  correct:2,
  explanation:"O alerta de movimento permanece disponível sem gravar rostos ou interiores domésticos.",
  hint:"A solução deve preservar o aviso útil sem reconstruir a vigilância sobre as casas.",
 },
 "ferrugem-turnos":{
  prompt:"A contagem das horas diverge da presença dos trabalhadores. O relógio da bancada perdeu referência após a atualização. Como sincronizar?",
  options:["Adotar apenas a hora da fábrica, que foi alterada pela própria suspeita",
           "Confrontar o oscilador local com registros de acesso assinados em turnos anteriores",
           "Descartar o livro de ponto para evitar divergências"],
  correct:1,
  explanation:"A referência física independente permite recuperar a cronologia e auditar salários sem apagar evidências.",
  hint:"Se uma fonte pode ter sido alterada, ela não pode ser a única referência.",
 },
 "ferrugem-caldeira":{
  prompt:"A pressão aumenta e o fechamento automático impede evacuação. Qual é o primeiro conserto seguro?",
  options:["Desativar todos os medidores para que o alarme pare",
           "Forçar a produção até o sistema estabilizar",
           "Abrir a válvula redundante de alívio e testar o desligamento manual"],
  correct:2,
  explanation:"A pressão é reduzida antes de retomar a carga, e a equipe volta a ter parada de emergência.",
  hint:"Primeiro reduza a energia acumulada e preserve o desligamento humano.",
 },
 "ferrugem-sindicato":{
  prompt:"O painel declara que não houve quórum, mas a urna preserva assinaturas e votos. Como recuperar a conferência?",
  options:["Recontar assinaturas da urna física e comparar com a lista alterada no painel",
           "Aceitar a decisão automática porque ela parece recente",
           "Destruir a urna e refazer a votação sob supervisão exclusiva da Helix"],
  correct:0,
  explanation:"O painel passa a expor diferenças entre presença real e credenciais suprimidas.",
  hint:"Uma segunda fonte preservada fora do painel é essencial para conferir a votação.",
 },
 "aurea-contabilidade":{
  prompt:"A rotina de consolidação deslocou verbas de saúde. O extrato anterior à atualização e o lançamento novo não coincidem. Que reparo preserva a prova?",
  options:["Apagar o extrato anterior para evitar uma cobrança duplicada",
           "Criar uma trilha de diferenças assinadas antes de recalcular o destino dos pagamentos",
           "Autorizar automaticamente todos os lançamentos corporativos"],
  correct:1,
  explanation:"A diferença entre versões fica verificável, e a correção não apaga o histórico da fraude.",
  hint:"Recuperar valores sem preservar o antes e o depois elimina a possibilidade de auditoria.",
 },
 "aurea-triagem":{
  prompt:"O leitor de prioridade rejeita pacientes sem credencial corporativa. Qual alteração restaura o atendimento sem expor prontuários?",
  options:["Suspender atendimento a qualquer pessoa sem cadastro",
           "Tornar visíveis todos os diagnósticos para confirmar prioridade",
           "Liberar triagem médica local com registro anônimo de urgência e posterior revisão"],
  correct:2,
  explanation:"O atendimento retorna por gravidade, não por contrato; a trilha conserva apenas o indispensável.",
  hint:"A prioridade deve refletir necessidade médica, não salário ou vínculo corporativo.",
 },
 "aurea-cabos":{
  prompt:"O circuito da oficina mistura sinais de auditoria e dados clínicos pessoais. Como manter a comunicação sem vazar informações?",
  options:["Isolar a fibra sensível e abrir somente a linha de verificação com controle de acesso",
           "Unir as duas fibras para reduzir latência",
           "Desativar permanentemente toda a rede de emergência"],
  correct:0,
  explanation:"A rede de auditoria volta a funcionar sem transmitir dados clínicos privados.",
  hint:"A redundância exige separar os circuitos sensíveis, não misturá-los.",
 },
 "subsolo-ventilacao":{
  prompt:"A turbina foi reparada, mas a pressão entre túnel e abrigo oscila. Qual medição deve orientar a retomada?",
  options:["A identificação dos moradores que respiram o ar",
           "A diferença de pressão, o nível de contaminantes e o retorno de ar",
           "A quantidade de contas vencidas dos residentes"],
  correct:1,
  explanation:"O circuito volta a ventilar com segurança, sem criar cadastro nominal de moradores.",
  hint:"Vazão e qualidade do ar são dados técnicos; identidades não regulam uma turbina.",
 },
 "subsolo-enfermaria":{
  prompt:"O purificador autônomo exige prontuário nominal para liberar o filtro. Como remover essa dependência?",
  options:["Publicar todos os prontuários para provar a necessidade",
           "Fechar o purificador até a Helix aprovar novas credenciais",
           "Operar o filtro por níveis de contaminantes e confirmar o resultado sem identificar pacientes"],
  correct:2,
  explanation:"A enfermaria mantém ar seguro sem expor quem busca atendimento.",
  hint:"Uma máquina de ar precisa avaliar contaminantes, não os nomes das pessoas.",
 },
 "subsolo-arquivo":{
  prompt:"O rastreador mostra vazão irregular e a tubulação atravessa rotas clandestinas. Qual configuração conserta o vazamento sem mapear pessoas?",
  options:["Gravar somente pressão e fluxo dos segmentos, omitindo localização de usuários",
           "Instalar leitura biométrica nas entradas do túnel",
           "Desviar água de todas as moradias para a sala de controle"],
  correct:0,
  explanation:"A tubulação pode ser reparada sem criar um mapa de deslocamentos dos moradores.",
  hint:"O sistema precisa localizar defeitos de infraestrutura, não usuários.",
 },
 "setor-zero-enfermaria":{
  prompt:"O aparelho respiratório responde a ordens de contenção antigas. Qual condição clínica deve prevalecer?",
  options:["Executar toda ordem remota mesmo sem assinatura",
           "Permitir veto médico local antes de alterar suporte respiratório",
           "Reiniciar respiradores durante a troca de turno sem verificação"],
  correct:1,
  explanation:"A equipe de saúde passa a controlar alterações críticas e o suporte não depende de uma rotina opaca.",
  hint:"Segurança clínica requer que pessoas habilitadas possam impedir comandos perigosos.",
 },
 "setor-zero-despressurizacao":{
  prompt:"A porta da sala retém pressão diferente dos dois lados. Qual sequência evita ferimentos?",
  options:["Abrir todas as portas simultaneamente",
           "Forçar o pistão quando a diferença está no máximo",
           "Isolar o setor, equalizar lentamente e só então liberar a trava"],
  correct:2,
  explanation:"A equalização devolve acesso sem choque de pressão nem risco para os pacientes.",
  hint:"Antes de abrir uma porta pressurizada, elimine o diferencial.",
 },
 "setor-zero-reator":{
  prompt:"A alimentação hospitalar e os módulos de confinamento compartilham o reator. Como preservar tratamento e interromper contenção abusiva?",
  options:["Separar a alimentação clínica do circuito de confinamento e validar o isolamento",
           "Desligar a enfermaria para forçar o sistema a reiniciar",
           "Desativar o alarme do reator e manter tudo energizado"],
  correct:0,
  explanation:"Equipamentos de suporte à vida continuam ativos enquanto o ramo coercitivo fica isolado.",
  hint:"Os dois circuitos devem funcionar de maneira independente.",
 },
 "prisma-radio":{
  prompt:"O emissor da Rádio Livre tem potência, mas o canal de retorno está sendo silenciado. O que deve ser feito?",
  options:["Abrir acesso irrestrito à lista de todas as fontes",
           "Redirecionar a transmissão para a linha independente preservando a identidade de quem depôs",
           "Apagar o histórico de cortes para impedir novas disputas"],
  correct:1,
  explanation:"A transmissão retorna e registra intervenções externas sem revelar testemunhas.",
  hint:"Um canal livre não exige entregar a identidade das fontes a quem tentou censurá-las.",
 },
 "prisma-camarins":{
  prompt:"A controladora do palco interrompe gravações sempre que um patrocinador retira autorização. Qual lógica mantém o evento seguro?",
  options:["Desabilitar o sinal de emergência do palco",
           "Conceder ao patrocinador controle direto sobre as câmeras",
           "Separar controle técnico de segurança do direito de cortar o conteúdo editorial"],
  correct:2,
  explanation:"O palco mantém os avisos de evacuação, mas a censura corporativa perde o comando da transmissão.",
  hint:"A segurança do público e a escolha editorial não são a mesma função.",
 },
 "prisma-galeria":{
  prompt:"A projeção independente perdeu parte das legendas após uma atualização. Como restaurar a memória exibida?",
  options:["Confrontar a cópia local com a lista de versões e registrar qualquer correção",
           "Substituir o arquivo original pela versão corporativa mais recente",
           "Proibir toda retificação para proteger o registro histórico"],
  correct:0,
  explanation:"A galeria preserva versões, contexto e o direito dos autores de corrigir informações.",
  hint:"A autenticidade exige conservar versões, não congelar erros ou substituir arquivos sem registro.",
 },
 "periferia-garagem":{
  prompt:"O carregador auxiliar abastece apenas veículos autorizados pela cidade. Uma ambulância não consta da lista. Qual configuração reabre o socorro?",
  options:["Bloquear todas as baterias até a próxima auditoria",
           "Priorizar veículos de emergência com autorização local temporária e prazo de expiração",
           "Exigir o histórico completo de deslocamentos de cada passageiro"],
  correct:1,
  explanation:"Ambulâncias recuperam carga sem produzir rastreamento permanente.",
  hint:"Emergência deve ter acesso oportuno, com privilégio temporário, não vigilância vitalícia.",
 },
 "periferia-estufa":{
  prompt:"A irrigação da estufa opera mesmo quando o tanque fica vazio. Que variável deve comandar a bomba?",
  options:["O preço da água no painel corporativo",
           "O número de moradores cadastrados na estrada",
           "O nível físico da reserva e a necessidade das plantações, com desligamento por falta de água"],
  correct:2,
  explanation:"A bomba deixa de trabalhar a seco e a horta mantém irrigação sustentável.",
  hint:"A bomba depende da água disponível e da necessidade agrícola, não de dados pessoais.",
 },
 "periferia-posto":{
  prompt:"O rádio de ambulância envia localização de pacientes para o arquivo central. Como manter o resgate e reduzir exposição?",
  options:["Transmitir apenas posição operacional temporária e eliminar a rota após o atendimento",
           "Publicar o trajeto permanente de todas as ambulâncias",
           "Desligar o rádio durante emergências para evitar qualquer sinal"],
  correct:0,
  explanation:"O socorro continua coordenado, mas a localização não alimenta um cadastro permanente.",
  hint:"Uma posição de emergência pode ser útil sem constituir histórico duradouro de vigilância.",
 },
};
export function calibrationPuzzle(room:ExpansionInnerId):RecoveryPuzzle|null{
 return RECOVERY_PUZZLES[room]??null;
}
export function correctCalibration(room:ExpansionInnerId,answer:number):boolean{
 const puzzle=calibrationPuzzle(room);
 return Boolean(puzzle&&Number.isInteger(answer)&&answer===puzzle.correct);
}
