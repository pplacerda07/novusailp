// Cartões empilhados que giram e se despedem conforme o scroll.
//
// A seção fica presa e o progresso de 0 a 1 é dividido em fases, medidas em
// "svh" (alturas de tela) para o efeito durar o mesmo tanto em qualquer monitor:
//
//   0    → 80svh   os cartões sobem e a frase de impacto sai por cima
//   150svh          o baralho gira: a capa some e os quatro versos aparecem
//                   abertos em leque
//   220svh → fim    um a um, de trás para a frente, os cartões sobem e saem
//
// Total: 460svh. O componente de referência usava 700svh, o que somado às 4
// telas da seção de ícones deixaria 11 telas presas na mesma página.

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const secao = document.querySelector<HTMLElement>(".dc-section");
const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (secao && !reduzido) {
  const q = gsap.utils.selector(secao);
  const todos = q(".dc-card");
  const capa = q(".dc-card--frente");
  const versos = q(".dc-card--verso");
  const frase = q(".dc-frase");
  const total = versos.length;

  const ENTRADA_FIM = 80;
  const GIRO = 150;
  const SAIDA_INICIO = 220;
  const SAIDA_DURACAO = 60;
  const SVH_TOTAL = SAIDA_INICIO + total * SAIDA_DURACAO;

  const emProgresso = (svh: number) => svh / SVH_TOTAL;

  // Inclinações do leque: valores diferentes por cartão, senão eles ficam
  // empilhados em bloco e não se lê que são vários.
  const leque = [-10, -20, -5, 10];
  const saida = [-50, -60, -45, 50];

  // Cada cartão sai numa janela própria, de trás para a frente.
  const janelas = Array.from({ length: total }, (_, i) => {
    const ordem = total - 1 - i;
    return [
      emProgresso(SAIDA_INICIO + ordem * SAIDA_DURACAO),
      emProgresso(SAIDA_INICIO + (ordem + 1) * SAIDA_DURACAO),
    ];
  });

  gsap.set(capa, { rotationY: 0 });
  gsap.set(versos, { rotationY: -180 });

  let girado = false;

  const girar = () => {
    gsap.to(capa, { rotationY: 180, duration: 1, ease: "elastic.out(1,0.5)" });
    versos.forEach((c, i) => {
      gsap.to(c, { rotationY: 0, rotationZ: leque[i], duration: 1, ease: "elastic.out(1,0.5)" });
    });
  };

  const desgirar = () => {
    gsap.to(capa, { rotationY: 0, duration: 1, ease: "elastic.out(1,0.5)" });
    gsap.to(versos, { rotationY: -180, rotationZ: 0, duration: 1, ease: "elastic.out(1,0.5)" });
  };

  ScrollTrigger.create({
    trigger: secao,
    start: "top top",
    end: () => `+=${window.innerHeight * (SVH_TOTAL / 100)}px`,
    pin: true,
    pinSpacing: true,
    scrub: true,
    invalidateOnRefresh: true,
    // Segunda seção pinada da página. Como um pin desloca tudo que vem abaixo,
    // as duas precisam recalcular antes dos ScrollTriggers comuns.
    refreshPriority: 1,
    onUpdate: ({ progress }) => {
      const entrada = gsap.utils.clamp(
        0,
        1,
        gsap.utils.mapRange(0, emProgresso(ENTRADA_FIM), 0, 1, progress),
      );

      gsap.set(todos, { y: `${gsap.utils.mapRange(0, 1, 50, -50, entrada)}%` });
      gsap.set(frase, { y: `${gsap.utils.mapRange(0, 1, 0, -100, entrada)}%` });

      // O giro é um estado, não um valor contínuo: dispara uma vez ao cruzar o
      // ponto, e desfaz se a pessoa rolar de volta.
      if (progress > emProgresso(GIRO) && !girado) {
        girar();
        girado = true;
      } else if (progress <= emProgresso(GIRO) && girado) {
        desgirar();
        girado = false;
      }

      versos.forEach((c, i) => {
        const [ini, fim] = janelas[i];
        const p = gsap.utils.clamp(0, 1, gsap.utils.mapRange(ini, fim, 0, 1, progress));
        gsap.set(c, {
          y: `${gsap.utils.mapRange(0, 1, -50, -250, p)}%`,
          rotation: gsap.utils.mapRange(0, 1, leque[i], saida[i], p),
        });
      });
    },
  });
}
