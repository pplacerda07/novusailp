// Efeito de scroll: a fileira de ícones sobe, encolhe até o centro, o fundo vira
// azul e cada ícone voa para dentro de uma frase que aparece pedaço por pedaço.
//
// Não é uma timeline: é um único ScrollTrigger com `pin` e um `onUpdate` que lê o
// progresso de 0 a 1 e posiciona tudo à mão. As quatro fases:
//
//   0    → 0.30  cabeçalho some, ícones sobem do rodapé
//   0.30 → 0.60  ícones encolhem rumo ao centro, fundo branco vira azul
//   0.60 → 0.75  clones dos ícones voam até os slots dentro do texto
//   0.75 → 1     os trechos de texto aparecem em ordem aleatória
//
// ─────────────────────────────────────────────────────────────────────────────
// GEOMETRIA MEDIDA UMA VEZ, NÃO A CADA QUADRO
//
// A primeira versão chamava getBoundingClientRect() dentro do onUpdate, sobre
// elementos que o próprio onUpdate acabara de transformar. Isso trazia dois
// problemas, os dois visíveis no celular:
//
//   1. Ler logo depois de escrever obriga o navegador a recalcular o layout na
//      hora, várias vezes por quadro. É o que derrubava o frame rate.
//   2. A posição nova era calculada a partir da posição já transformada, ou
//      seja, dependia do quadro anterior. Rolando para baixo dava um resultado,
//      rolando para cima dava outro, e os ícones ficavam subindo e descendo.
//
// Agora as medidas são tiradas uma vez, com os transforms limpos, e guardadas.
// O onUpdate só escreve.
// ─────────────────────────────────────────────────────────────────────────────

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

  const tamanhoFinal = () => (window.innerWidth <= 991 ? 30 : 60);

  // ── Cache de geometria ────────────────────────────────────────────────────
  type Ponto = { x: number; y: number };
  let caixaIcones = { cx: 0, cy: 0, largura: 1 };
  let centroIcone: Ponto[] = [];
  let centroSlot: Ponto[] = [];
  let vw = 0;
  let vh = 0;

  const medir = () => {
    vw = window.innerWidth;
    vh = window.innerHeight;

    // Limpa os transforms para medir a posição natural dos elementos.
    gsap.set(icones, { clearProps: "transform" });
    gsap.set(iconeEls, { clearProps: "transform" });

    const rIcones = icones.getBoundingClientRect();
    caixaIcones = {
      cx: rIcones.left + rIcones.width / 2,
      cy: rIcones.top + rIcones.height / 2,
      largura: iconeEls[0]?.getBoundingClientRect().width || 1,
    };
    centroIcone = iconeEls.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });

    // Os slots vivem dentro da seção. Enquanto ela está presa, fica fixa no topo
    // da janela, então a posição relativa à seção vale como posição na tela.
    const rSecao = secao.getBoundingClientRect();
    centroSlot = slots.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        x: r.left - rSecao.left + r.width / 2,
        y: r.top - rSecao.top + r.height / 2,
      };
    });
  };

  // Onde um ícone vai parar depois de a fileira inteira ser escalada e movida.
  // A origem do transform é o centro da fileira, então o ponto p vira
  // centro + escala * (p - centro) + deslocamento.
  const posDepois = (i: number, escala: number, dx: number, dy: number): Ponto => ({
    x: caixaIcones.cx + escala * (centroIcone[i].x - caixaIcones.cx) + dx,
    y: caixaIcones.cy + escala * (centroIcone[i].y - caixaIcones.cy) + dy,
  });

  let clones: HTMLElement[] = [];
  const limparClones = () => {
    clones.forEach((c) => c.remove());
    clones = [];
  };

  const criarClones = (lado: number) => {
    clones = iconeEls.map((icone) => {
      const c = icone.cloneNode(true) as HTMLElement;
      c.className = "sc-dup";
      // Fixed, e não absolute: a seção presa também é fixa, então os dois
      // compartilham o mesmo sistema de coordenadas e não é preciso somar a
      // rolagem da página a cada quadro.
      c.style.position = "fixed";
      c.style.width = `${lado}px`;
      c.style.height = `${lado}px`;
      c.style.zIndex = "3";
      c.style.willChange = "transform";
      c.setAttribute("aria-hidden", "true");
      document.body.appendChild(c);
      return c;
    });
  };

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
    onRefresh: () => {
      limparClones();
      medir();
    },
    onUpdate: (self) => {
      const p = self.progress;
      const escalaFinal = tamanhoFinal() / caixaIcones.largura;
      const base = -vh * 0.3;

      // Alvo do encolhimento: centro da janela.
      const dxCheio = vw / 2 - caixaIcones.cx;
      const dyCheio = vh / 2 - caixaIcones.cy;

      trechos.forEach((t) => gsap.set(t, { opacity: 0 }));

      if (p <= 0.3) {
        // Fase 1: cabeçalho sobe e some enquanto a fileira de ícones entra.
        const av = p / 0.3;
        const subida = base * av;
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
          const t = gsap.utils.clamp(0, 1, gsap.utils.mapRange(inicio, inicio + 0.5, 0, 1, av));
          gsap.set(icone, { x: 0, y: -subida * (1 - t) });
        });
      } else if (p <= 0.6) {
        // Fase 2: ícones encolhem rumo ao centro e o fundo vira azul na metade.
        const av = (p - 0.3) / 0.3;
        gsap.set(cabecalho, { transform: "translate(-50%, calc(-50% + -50px))", opacity: 0 });
        secao.style.backgroundColor = av >= 0.5 ? AZUL : BRANCO;

        limparClones();
        gsap.set(icones, {
          x: dxCheio * av,
          y: base + dyCheio * av,
          scale: 1 + (escalaFinal - 1) * av,
          opacity: 1,
        });
        iconeEls.forEach((icone) => gsap.set(icone, { x: 0, y: 0 }));
      } else if (p <= 0.75) {
        // Fase 3: os ícones reais somem e clones voam até os slots, primeiro na
        // vertical e depois na horizontal.
        const av = (p - 0.6) / 0.15;
        gsap.set(cabecalho, { transform: "translate(-50%, calc(-50% + -50px))", opacity: 0 });
        secao.style.backgroundColor = AZUL;

        gsap.set(icones, {
          x: dxCheio,
          y: base + dyCheio,
          scale: escalaFinal,
          opacity: 0,
        });
        iconeEls.forEach((icone) => gsap.set(icone, { x: 0, y: 0 }));

        const lado = tamanhoFinal();
        if (!clones.length) criarClones(lado);

        clones.forEach((c, i) => {
          if (i >= centroSlot.length) return;
          const de = posDepois(i, escalaFinal, dxCheio, base + dyCheio);
          const para = centroSlot[i];

          let x = de.x;
          let y = de.y;
          if (av <= 0.5) {
            y = de.y + (para.y - de.y) * (av / 0.5);
          } else {
            y = para.y;
            x = de.x + (para.x - de.x) * ((av - 0.5) / 0.5);
          }

          c.style.left = `${x - lado / 2}px`;
          c.style.top = `${y - lado / 2}px`;
          c.style.opacity = "1";
        });
      } else {
        // Fase 4: clones assentados nos slots e os trechos aparecem um a um.
        gsap.set(cabecalho, { transform: "translate(-50%, calc(-50% + -100px))", opacity: 0 });
        secao.style.backgroundColor = AZUL;
        gsap.set(icones, { opacity: 0 });

        const lado = tamanhoFinal();
        if (!clones.length) criarClones(lado);

        clones.forEach((c, i) => {
          if (i >= centroSlot.length) return;
          c.style.left = `${centroSlot[i].x - lado / 2}px`;
          c.style.top = `${centroSlot[i].y - lado / 2}px`;
          c.style.opacity = "1";
        });

        ordem.forEach((item, pos) => {
          const inicio = 0.75 + pos * 0.03;
          const t = gsap.utils.clamp(0, 1, gsap.utils.mapRange(inicio, inicio + 0.015, 0, 1, p));
          gsap.set(item.el, { opacity: t });
        });
      }
    },
  });

  // Resize de verdade (girar o aparelho, redimensionar a janela) precisa de nova
  // medição. A variação de altura da barra de endereço no iOS não entra aqui:
  // animations.ts liga ignoreMobileResize.
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
