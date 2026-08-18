// Animação da figura da seção de garantias: a pessoa está digitando, calma.
//
// É de propósito o oposto do Worried Man: lá a figura anda de um lado para o
// outro porque está esperando resposta; aqui ela trabalha. Por isso o movimento
// é curto e repetitivo (batidas das mãos) em vez de deslocamento.

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const svg = document.querySelector<SVGSVGElement>("[data-digitando]");

if (svg && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const q = gsap.utils.selector(svg);

  gsap.set(q(".tg-tronco"), { transformOrigin: "50% 100%" });
  gsap.set(q(".tg-sombra"), { transformOrigin: "50% 50%" });
  gsap.set(q(".tg-mao"), { transformOrigin: "50% 100%" });

  const tl = gsap.timeline({ repeat: -1 });

  // Mãos digitando: batidas curtas e fora de sincronia, senão parece palma.
  tl.to(q(".tg-mao-e"), { y: -4, duration: 0.16, ease: "power1.out", yoyo: true, repeat: 11 }, 0)
    .to(q(".tg-mao-d"), { y: -4, duration: 0.19, ease: "power1.out", yoyo: true, repeat: 9 }, 0.09);

  // Respiração: tronco e sombra juntos, bem sutis.
  tl.to(q(".tg-tronco"), { scaleY: 1.015, duration: 1.9, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0)
    .to(q(".tg-sombra"), { scaleX: 1.04, duration: 1.9, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0);

  // Cabeça: um assentir lento, como quem acompanha a tela.
  tl.to(q(".tg-cabeca"), { y: 3, duration: 1.25, ease: "sine.inOut", yoyo: true, repeat: 2 }, 0);

  // Laço infinito fora da tela é trabalho jogado fora.
  ScrollTrigger.create({
    trigger: svg,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => (self.isActive ? tl.play() : tl.pause()),
  });
}
