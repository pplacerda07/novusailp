// Efeito de scroll: a fileira de ícones sobe, encolhe até o centro, o fundo vira
// azul e cada ícone voa para dentro de uma frase que aparece pedaço por pedaço.
//
// Não é uma timeline: é um único ScrollTrigger com `pin` e um `onUpdate` que lê o
// progresso de 0 a 1 e posiciona tudo à mão. As quatro fases:
//   0    → 0.30  cabeçalho some, ícones sobem do rodapé
//   0.30 → 0.60  ícones encolhem rumo ao centro, fundo branco vira azul
//   0.60 → 0.75  clones dos ícones voam até os slots dentro do texto
//   0.75 → 1     os trechos de texto aparecem em ordem aleatória

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const secao = document.querySelector<HTMLElement>("[data-scroll-icons]");

// prefers-reduced-motion: o CSS já deixa a seção legível parada. Não montamos nada.
if (secao && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const icones = secao.querySelector<HTMLElement>(".sc-icons")!;
  const iconeEls = Array.from(secao.querySelectorAll<HTMLElement>(".sc-icon"));
  const trechos = Array.from(secao.querySelectorAll<HTMLElement>(".sc-seg"));
  const slots = Array.from(secao.querySelectorAll<HTMLElement>(".sc-slot"));
  const cabecalho = secao.querySelector<HTMLElement>(".sc-header")!;

  const BRANCO = "#FFFFFF";
  const AZUL = "#015EFD";

  // Os trechos aparecem fora de ordem: dá a sensação de texto se materializando
  // em vez de ser digitado.
  const ordem = trechos.map((el, i) => ({ el, i }));
  for (let i = ordem.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
  }

  let clones: HTMLElement[] = [];
  const limparClones = () => {
    clones.forEach((c) => c.remove());
    clones = [];
  };

  // Tamanho final do ícone (o que cabe dentro da linha de texto).
  const tamanhoFinal = () => (window.innerWidth <= 991 ? 30 : 60);

  const st = ScrollTrigger.create({
    trigger: secao,
    start: "top top",
    // 4 telas de scroll preso no desktop. O demo original usava 8, que segura o
    // visitante tempo demais numa seção só.
    // No celular caem para 2,5: cada tela presa é mais dedo de rolagem, e o
    // aparelho ainda tem que animar tudo isso com menos folga de processamento.
    end: () => `+=${window.innerHeight * (window.innerWidth <= 767 ? 2.5 : 4)}px`,
    pin: true,
    pinSpacing: true,
    scrub: 1,
    invalidateOnRefresh: true,
    // Um pin desloca tudo que vem abaixo dele na página. Os outros ScrollTriggers
    // do site nascem em animations.ts, num bundle separado, sem ordem garantida
    // de execução. refreshPriority alto faz este recalcular primeiro, para os
    // demais medirem já contando com o espaço que o pin ocupa.
    refreshPriority: 1,
    onUpdate: (self) => {
      const p = self.progress;
      const escala = tamanhoFinal() / (iconeEls[0]?.getBoundingClientRect().width || 1);

      trechos.forEach((t) => gsap.set(t, { opacity: 0 }));

      if (p <= 0.3) {
        // Fase 1: cabeçalho sobe e some enquanto a fileira de ícones entra.
        const av = p / 0.3;
        const subida = -window.innerHeight * 0.3 * av;

        const avCab = Math.min(1, p / 0.15);
        gsap.set(cabecalho, {
          transform: `translate(-50%, calc(-50% + ${-50 * avCab}px))`,
          opacity: 1 - avCab,
        });

        limparClones();
        secao.style.backgroundColor = BRANCO;
        gsap.set(icones, { x: 0, y: subida, scale: 1, opacity: 1 });

        iconeEls.forEach((icone, i) => {
          const inicio = i * 0.1;
          const bruto = gsap.utils.mapRange(inicio, inicio + 0.5, 0, 1, av);
          const t = Math.max(0, Math.min(1, bruto));
          gsap.set(icone, { x: 0, y: -subida * (1 - t) });
        });
      } else if (p <= 0.6) {
        // Fase 2: ícones encolhem rumo ao centro e o fundo vira azul na metade.
        const av = (p - 0.3) / 0.3;
        gsap.set(cabecalho, { transform: "translate(-50%, calc(-50% + -50px))", opacity: 0 });
        secao.style.backgroundColor = av >= 0.5 ? AZUL : BRANCO;

        limparClones();

        const r = icones.getBoundingClientRect();
        const dx = (window.innerWidth / 2 - (r.left + r.width / 2)) * av;
        const dy = (window.innerHeight / 2 - (r.top + r.height / 2)) * av;
        const base = -window.innerHeight * 0.3;

        gsap.set(icones, { x: dx, y: base + dy, scale: 1 + (escala - 1) * av, opacity: 1 });
        iconeEls.forEach((icone) => gsap.set(icone, { x: 0, y: 0 }));
      } else if (p <= 0.75) {
        // Fase 3: os ícones reais somem e clones absolutos voam até os slots,
        // primeiro na vertical e depois na horizontal.
        const av = (p - 0.6) / 0.15;
        gsap.set(cabecalho, { transform: "translate(-50%, calc(-50% + -50px))", opacity: 0 });
        secao.style.backgroundColor = AZUL;

        const r = icones.getBoundingClientRect();
        const dx = window.innerWidth / 2 - (r.left + r.width / 2);
        const dy = window.innerHeight / 2 - (r.top + r.height / 2);
        gsap.set(icones, {
          x: dx,
          y: -window.innerHeight * 0.3 + dy,
          scale: escala,
          opacity: 0,
        });
        iconeEls.forEach((icone) => gsap.set(icone, { x: 0, y: 0 }));

        const lado = tamanhoFinal();
        if (!clones.length) {
          clones = iconeEls.map((icone) => {
            const c = icone.cloneNode(true) as HTMLElement;
            c.className = "sc-dup";
            c.style.position = "absolute";
            c.style.width = `${lado}px`;
            c.style.height = `${lado}px`;
            c.style.zIndex = "3";
            c.setAttribute("aria-hidden", "true");
            document.body.appendChild(c);
            return c;
          });
        }

        clones.forEach((c, i) => {
          if (i >= slots.length) return;
          const de = iconeEls[i].getBoundingClientRect();
          const paraR = slots[i].getBoundingClientRect();
          const deX = de.left + de.width / 2 + window.scrollX;
          const deY = de.top + de.height / 2 + window.scrollY;
          const paraX = paraR.left + paraR.width / 2 + window.scrollX;
          const paraY = paraR.top + paraR.height / 2 + window.scrollY;

          let x = 0;
          let y = 0;
          if (av <= 0.5) {
            y = (paraY - deY) * (av / 0.5);
          } else {
            y = paraY - deY;
            x = (paraX - deX) * ((av - 0.5) / 0.5);
          }

          c.style.left = `${deX + x - lado / 2}px`;
          c.style.top = `${deY + y - lado / 2}px`;
          c.style.opacity = "1";
        });
      } else {
        // Fase 4: clones assentados nos slots e os trechos aparecem um a um.
        gsap.set(cabecalho, { transform: "translate(-50%, calc(-50% + -100px))", opacity: 0 });
        secao.style.backgroundColor = AZUL;
        gsap.set(icones, { opacity: 0 });

        const lado = tamanhoFinal();
        clones.forEach((c, i) => {
          if (i >= slots.length) return;
          const r = slots[i].getBoundingClientRect();
          c.style.left = `${r.left + r.width / 2 + window.scrollX - lado / 2}px`;
          c.style.top = `${r.top + r.height / 2 + window.scrollY - lado / 2}px`;
          c.style.opacity = "1";
        });

        ordem.forEach((item, pos) => {
          const inicio = 0.75 + pos * 0.03;
          const bruto = gsap.utils.mapRange(inicio, inicio + 0.015, 0, 1, p);
          gsap.set(item.el, { opacity: Math.max(0, Math.min(1, bruto)) });
        });
      }
    },
  });

  // Os clones são posicionados em coordenadas absolutas de página e não se
  // recalculam sozinhos. No resize eles são descartados e o ScrollTrigger
  // remedido, senão ficam desalinhados até o próximo scroll.
  let redimensionando: number | undefined;
  window.addEventListener("resize", () => {
    window.clearTimeout(redimensionando);
    redimensionando = window.setTimeout(() => {
      limparClones();
      ScrollTrigger.refresh();
    }, 150);
  });

  window.addEventListener("load", () => st.refresh());
}
