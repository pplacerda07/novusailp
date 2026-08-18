// Widget flutuante do WhatsApp: abre e fecha o cartão de conversa.
//
// Sem GSAP aqui de propósito. É um toggle de classe, e o movimento é uma
// transição de CSS: não faz sentido carregar uma engine de animação para isso.

const raiz = document.querySelector<HTMLElement>("[data-wa]");

if (raiz) {
  const botao = raiz.querySelector<HTMLButtonElement>("[data-wa-toggle]")!;
  const cartao = raiz.querySelector<HTMLElement>("[data-wa-card]")!;
  const fechar = raiz.querySelector<HTMLButtonElement>("[data-wa-fechar]")!;

  // O cartão nasce com o atributo hidden para não aparecer caso o JS falhe.
  // A partir daqui quem manda é a classe, então o atributo sai.
  cartao.hidden = false;

  let aberto = false;

  const definir = (novo: boolean) => {
    aberto = novo;
    raiz.classList.toggle("is-aberto", aberto);
    botao.setAttribute("aria-expanded", String(aberto));
    botao.setAttribute(
      "aria-label",
      aberto ? "Fechar conversa no WhatsApp" : "Abrir conversa no WhatsApp",
    );
  };

  definir(false);

  botao.addEventListener("click", () => definir(!aberto));
  fechar.addEventListener("click", () => {
    definir(false);
    botao.focus();
  });

  // Esc fecha e devolve o foco para o botão, senão quem navega por teclado
  // fica perdido no meio da página.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && aberto) {
      definir(false);
      botao.focus();
    }
  });

  // Clique fora fecha.
  document.addEventListener("click", (e) => {
    if (aberto && !raiz.contains(e.target as Node)) definir(false);
  });

  // Abertura automática: uma vez por visita, e só depois de a pessoa ter
  // passado um tempo na página. Abrir de cara, em toda navegação, é o que
  // transforma esse widget em incômodo.
  // Para desligar, basta remover este bloco.
  const CHAVE = "wa-popup-visto";
  const ESPERA = 12000;

  if (!sessionStorage.getItem(CHAVE)) {
    window.setTimeout(() => {
      if (!aberto) {
        definir(true);
        sessionStorage.setItem(CHAVE, "1");
      }
    }, ESPERA);
  }
}
