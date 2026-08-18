// Contato de WhatsApp da Novus, num lugar só.
//
// O número aparece em seis CTAs diferentes do site. Espalhar a string por todos
// eles significa que trocar de número vira caça ao tesouro e um deles fica para
// trás. Aqui é uma linha.

/** Formato do wa.me: só dígitos, com código do país. 55 + DDD 67 + número. */
export const WHATSAPP_NUMERO = "556731980930";

/** Como o número aparece escrito para o visitante. */
export const WHATSAPP_EXIBICAO = "+55 67 3198-0930";

/** Mensagem que já vem digitada quando a conversa abre. */
export const WHATSAPP_MENSAGEM =
  "Olá, vim do site e fiquei interessado no agente de IA";

/**
 * Monta o link da conversa. Aceita uma mensagem própria para o caso de algum
 * CTA precisar de contexto diferente do padrão.
 */
export const whatsappLink = (mensagem: string = WHATSAPP_MENSAGEM) =>
  `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;
