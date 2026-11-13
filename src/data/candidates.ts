import { Candidate } from '../types/election';

export const CANDIDATES: Record<string, Candidate> = {
  '91': {
    id: '91',
    number: '91',
    name: 'Clara Nogueira',
    age: 38,
    profession: 'Engenheira de tráfego',
    focus: 'TRANSPORTE PÚBLICO',
    slogan: 'A cidade que anda.',
    bio: 'Engenheira de tráfego formada em universidade pública. Cresceu na periferia de Vila Esperança e passou a adolescência pegando dois ônibus lotados todos os dias para conseguir chegar à escola.',
    proposals: [
      'Tarifa zero nos ônibus municipais para estudantes e pessoas desempregadas.',
      'Implantação de faixas exclusivas de ônibus nas avenidas principais para reduzir tempo de trajeto.',
      'Aumentar o ISS (imposto sobre serviços) dos aplicativos de corrida e de entrega para 5%, o máximo permitido, e usar o dinheiro para pagar a tarifa zero dos estudantes e desempregados.'
    ],
    whoPays: 'Aumento do ISS para 5% (alíquota máxima) sobre empresas de aplicativos de corrida e entrega.',
    peopleQuestion: 'Se Uber e iFood ficarem mais caros, o motorista e o entregador não vão ganhar menos?',
    populationQuestion: 'Se a corrida fica mais cara e os pedidos caem, quem perde mais: a empresa, o cliente ou o motorista?'
  },
  '92': {
    id: '92',
    number: '92',
    name: 'Samuel Oliveira',
    age: 42,
    profession: 'Enfermeiro de posto de saúde',
    focus: 'SAÚDE BÁSICA',
    slogan: 'Cuidado perto de casa.',
    bio: 'Enfermeiro dedicado à saúde pública, coordenou por mais de 15 anos a equipe de um posto de saúde comunitário na periferia de Vila Esperança.',
    proposals: [
      'Postos de saúde abertos até as 22h em todos os bairros da cidade para atender quem trabalha durante o dia.',
      'Prazo máximo de 30 dias para consultas com especialistas e exames, com mutirões noturnos e fins de semana, contratando clínicas particulares se a rede pública não suprir.',
      'Proibir a venda e a oferta de refrigerante, salgadinho e outros ultraprocessados em todas as escolas da cidade, públicas e particulares, com multa para quem descumprir, e baratear frutas e lanches saudáveis.'
    ],
    whoPays: 'Multas sobre descumprimento nas escolas e remanejamento de verbas da saúde preventiva.',
    peopleQuestion: 'E se não der para cumprir o prazo de agendamento de consultas e exames em 30 dias? Qual seria a solução do candidato?',
    populationQuestion: 'E se não der para cumprir o prazo de agendamento de consultas e exames em 30 dias? Qual seria a solução do candidato?'
  },
  '93': {
    id: '93',
    number: '93',
    name: 'Osvaldo Ribeiro',
    age: 67,
    profession: 'Mestre de obras e líder comunitário',
    focus: 'CRECHES E BAIRROS',
    slogan: 'Nenhum bairro fica para trás.',
    bio: 'Mestre de obras aposentado e líder comunitário de longa data. Ajudou a construir dezenas de casas e escolas e fundou a primeira associação de moradores do seu bairro.',
    proposals: [
      'Construção e ampliação de creches de tempo integral em todo bairro, garantindo vaga para 100% das crianças.',
      'Mutirão de obras de saneamento básico, iluminação LED e praças comunitárias com prioridade máxima para a periferia.',
      'Adiar os projetos de reforma e embelezamento da avenida central e a ampliação do estádio municipal para realocar a verba nas creches e no saneamento.'
    ],
    whoPays: 'Remanejamento de recursos orçamentários, adiando a reforma da avenida central e estádio.',
    peopleQuestion: 'A avenida central é o cartão-postal da cidade e dá emprego ao comércio. Vale a pena deixar isso parado?'
  }
};

export const CANDIDATES_LIST: Candidate[] = Object.values(CANDIDATES);
