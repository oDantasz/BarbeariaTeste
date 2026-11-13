// Mensagens mostradas ao cliente para cada código de erro do banco
const MESSAGES: Record<string, string> = {
  horario_ocupado: "Esse horário acabou de ser reservado por outra pessoa. Escolha outro.",
  fora_do_horario: "Esse horário fica fora do expediente da unidade. Escolha outro.",
  horario_passado: "Esse horário já passou. Escolha outro.",
  horario_distante: "Dá para agendar com até 60 dias de antecedência.",
  horario_invalido: "Escolha um dos horários da lista.",
  sem_servico: "Escolha pelo menos um serviço.",
  servico_invalido: "Um dos serviços escolhidos não está mais disponível. Revise a lista.",
  profissional_invalido: "Esse profissional não atende nesta unidade.",
  nome_invalido: "Digite seu nome.",
  telefone_invalido: "Digite o celular com DDD, por exemplo (11) 91234-5678.",
  limite_agendamentos: "Você já tem 3 horários marcados. Cancele um deles ou fale com a barbearia pelo WhatsApp.",
  nao_encontrado: "Não encontramos esse agendamento. Confira o link.",
  nao_cancelavel: "Esse agendamento já foi cancelado ou concluído.",
  cancelamento_tarde: "Pelo site, dá para cancelar até 2 horas antes. Fale com a barbearia pelo WhatsApp.",
  nao_autorizado: "Você não tem acesso a esse agendamento.",
};

export function messageFor(code: string) {
  return MESSAGES[code] ?? "Não foi possível concluir agora. Tente de novo em instantes.";
}

export function codeFromError(e: unknown): string {
  const msg = (e as { message?: string; code?: string })?.message ?? String(e);
  if (msg.includes("bookings_no_overlap")) return "horario_ocupado";
  const known = Object.keys(MESSAGES).find((k) => msg.includes(k));
  return known ?? "erro";
}
