// Perguntas frequentes.
//
// Ficam num módulo à parte porque são usadas em dois lugares: a seção visível
// (Faq.astro) e o JSON-LD do tipo FAQPage que a home publica. Duplicar o texto
// nos dois significaria, mais cedo ou mais tarde, responder uma coisa na tela e
// outra para o Google.

export interface Pergunta {
  pergunta: string;
  resposta: string;
}

export const faq: Pergunta[] = [
  {
    pergunta: "Vocês cobram por token ou por mensagem?",
    resposta:
      "Não. A mensalidade é fechada. Não importa se o mês teve cem ou mil conversas, o valor da sua conta continua o mesmo.",
  },
  {
    pergunta: "Meu número corre risco de ser banido?",
    resposta:
      "A conexão é feita pela API oficial da Meta, de quem somos parceiros. Isso deixa o número muito mais estável do que as soluções que ligam o WhatsApp por fora.",
  },
  {
    pergunta: "O agente entende áudio?",
    resposta:
      "Sim. O cliente pode mandar mensagem de voz normalmente. O agente entende o que foi dito e responde de acordo.",
  },
  {
    pergunta: "Dá para integrar com os sistemas que a gente já usa?",
    resposta:
      "Sim. A plataforma tem API aberta, então dá para conectar com CRM, agenda e o que mais fizer parte da sua operação.",
  },
  {
    pergunta: "Como eu fico sabendo quando aparece um lead importante?",
    resposta:
      "Configuramos automações que avisam no WhatsApp pessoal do dono ou do gerente quando surge algo que precisa de decisão humana, como pedido de desconto ou negociação fora do padrão.",
  },
  {
    pergunta: "E se eu tiver dúvida depois que o agente estiver rodando?",
    resposta:
      "Você tem o suporte da plataforma e vídeos de cada módulo, para consultar na hora em que a dúvida aparecer.",
  },
];
