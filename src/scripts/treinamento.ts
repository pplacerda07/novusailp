// Entrada da seção de treinamento: em vez de tudo aparecer junto, a seção se
// monta na frente de quem chega nela.
//
// Ordem: título → cartão → o painel se constrói de cima para baixo → os formatos
// entram pela esquerda, como arquivos sendo jogados dentro do painel → o texto e
// o botão fecham.
//
// Substitui os data-reveal / data-stagger genéricos que estavam no componente.
// Com eles, cada pedaço tinha um ScrollTrigger próprio e disparava no seu tempo,
// sem sequência nenhuma. Aqui é uma timeline só, com um gatilho só.
//
// Cuidados de performance, porque a seção tem uns 20 elementos animados:
//   · só transform e opacity, que a GPU compõe sem recalcular layout
//   · um único ScrollTrigger, com once: true (não fica recalculando no scroll)
//   · clearProps no fim, para não deixar 20 camadas de composição penduradas

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const secao = document.querySelector<HTMLElement>(".tr-section");
const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (secao && !reduzido) {
  const q = gsap.utils.selector(secao);

  const titulo = q(".tr-headline");
  const cartao = q(".tr-card");
  const fontes = q(".tr-fonte");
  const rodape = q(".tr-destaque, .tr-apoio, .tr-cta");

  // Peças do painel em ordem de documento: barra do topo, faixa de saudação,
  // os dois rótulos de seção e os seis cartões. É essa ordem que dá a sensação
  // de a interface estar sendo montada.
  const pecas = q(
    ".ui > .ui-top, .ui > .ui-saudacao, .ui > .ui-label, .ui-card",
  );

  const todos = [...titulo, ...cartao, ...fontes, ...rodape, ...pecas];

  const tl = gsap.timeline({
    defaults: { ease: "power2.out" },
    scrollTrigger: {
      trigger: secao,
      start: "top 72%",
      once: true,
    },
    onComplete: () => {
      // Devolve os elementos ao estado natural: sem transform inline, sem
      // camada de composição reservada.
      gsap.set(todos, { clearProps: "transform,opacity,visibility" });
    },
  });

  tl.from(titulo, { y: 26, autoAlpha: 0, duration: 0.55 })
    .from(cartao, { scale: 0.95, autoAlpha: 0, duration: 0.65 }, "-=0.25")
    // O painel se constrói de cima para baixo.
    .from(
      pecas,
      { y: 16, autoAlpha: 0, duration: 0.4, stagger: 0.055 },
      "-=0.35",
    )
    // Os formatos entram pela esquerda, um a um.
    .from(
      fontes,
      { x: -34, autoAlpha: 0, duration: 0.45, stagger: 0.085, ease: "back.out(1.5)" },
      "-=0.5",
    )
    .from(rodape, { y: 22, autoAlpha: 0, duration: 0.5, stagger: 0.11 }, "-=0.2");
}
