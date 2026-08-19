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
// TRÊS DECISÕES QUE EXISTEM POR CAUSA DE PROBLEMA REAL
//
// 1. Geometria medida uma vez, não a cada quadro.
//    A primeira versão chamava getBoundingClientRect() dentro do onUpdate, sobre
//    elementos que ele mesmo acabara de transformar, ~13 vezes por quadro. Ler
//    depois de escrever força recálculo de layout na hora, e a posição nova saía
//    da posição já transformada: descendo dava um resultado, subindo dava outro,
//    e os ícones ficavam tremendo. Agora medimos no refresh e o onUpdate só
//    escreve.
//
// 2. Clones dentro da seção, não no <body>.
//    Eram `position: fixed` pendurados no body. Ao passar da seção o trigger
//    para de atualizar e eles ficavam grudados na tela por cima do resto da
//    página. Dentro da seção, com position absolute, eles rolam junto e somem
//    sozinhos.
//
// 3. Escrita só quando o valor muda.
//    O onUpdate reescrevia cor de fundo, opacidade dos cinco trechos e o reset
//    dos ícones a cada quadro, mesmo sem nada ter mudado. Cada escrita dessas
//    custa recálculo de estilo. Agora o que é por fase é escrito na virada da
//    fase, e por quadro fica só o que realmente varia.
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

  const movel = () => window.innerWidth <= 767;

  // Os trechos aparecem fora de ordem: dá a sensação de texto se materializando
  // em vez de ser digitado.
  const ordem = trechos.map((el, i) => ({ el, i }));
  for (let i = ordem.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
  }

  const tamanhoFinal = () => (window.innerWidth <= 991 ? 26 : 60);

  // ── Cache de geometria (tudo relativo à seção) ────────────────────────────
  type Ponto = { x: number; y: number };
  let caixaIcones = { cx: 0, cy: 0, largura: 1 };
  let centroIcone: Ponto[] = [];
  let centroSlot: Ponto[] = [];
  let vw = 0;
  let vh = 0;

  // Todas as medidas vivem no mesmo sistema: coordenadas da janela com a seção
  // presa, ou seja, com o topo dela em 0.
  //
  // A sutileza que quebrou a versão anterior: `.sc-icons` é position: fixed, ou
  // seja, ancorada na janela e não na seção. Medir a posição dela em relação à
  // seção só faria sentido se a seção já estivesse presa no topo, mas o refresh
  // acontece com a seção ainda lá embaixo da página. O resultado era um
  // deslocamento enorme, e os clones voavam para fora da tela: eram os ícones
  // "sumidos".
  //
  // Então: o que é fixo entra em coordenada de janela direto, e o que vive
  // dentro da seção entra relativo à seção. Com a seção presa no topo, os dois
  // coincidem.
  const medir = () => {
    vw = window.innerWidth;
    vh = window.innerHeight;

    gsap.set(icones, { clearProps: "transform" });
    gsap.set(iconeEls, { clearProps: "transform" });

    const centro = (r: DOMRect): Ponto => ({
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
    });

    const rIcones = icones.getBoundingClientRect();
    const c = centro(rIcones);
    caixaIcones = {
      cx: c.x,
      cy: c.y,
      largura: iconeEls[0]?.getBoundingClientRect().width || 1,
    };
    centroIcone = iconeEls.map((el) => centro(el.getBoundingClientRect()));

    const base = secao.getBoundingClientRect();
    centroSlot = slots.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2 };
    });
  };

  // Onde um ícone para depois de a fileira inteira ser escalada e movida.
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
      c.style.position = "absolute";
      // Âncora no canto da seção: daí em diante quem posiciona é o transform.
      c.style.left = "0";
      c.style.top = "0";
      c.style.width = `${lado}px`;
      c.style.height = `${lado}px`;
      c.style.zIndex = "3";
      c.setAttribute("aria-hidden", "true");
      // Dentro da seção: quando ela sai da tela, os clones saem junto.
      secao.appendChild(c);
      return c;
    });
  };

  // ── Estado, para não reescrever o que não mudou ───────────────────────────
  let fase = -1;
  let corAtual = "";
  let trechosZerados = false;

  const pintar = (cor: string) => {
    if (corAtual === cor) return;
    corAtual = cor;
    secao.style.backgroundColor = cor;
  };

  const zerarTrechos = () => {
    if (trechosZerados) return;
    trechosZerados = true;
    gsap.set(trechos, { opacity: 0 });
  };

  const st = ScrollTrigger.create({
    trigger: secao,
    start: "top top",
    // 4 telas de scroll preso no desktop. O demo original usava 8, que segura o
    // visitante tempo demais numa seção só.
    // No celular caem para 2,5: cada tela presa é mais dedo de rolagem, e o
    // aparelho ainda tem que animar tudo isso com menos folga de processamento.
    // No celular 1,6 tela. Antes eram 2,5 e a sensação era de rolar muito para
    // pouca coisa acontecer, porque na tela pequena cada tela presa custa vários
    // deslizes de dedo.
    end: () => `+=${window.innerHeight * (movel() ? 1.6 : 4)}px`,
    pin: true,
    pinSpacing: true,
    // Scrub menor no celular: 1 significa um segundo para alcançar a posição do
    // dedo, o que ali vira sensação de atraso. 0.5 responde mais rápido e ainda
    // suaviza o suficiente.
    scrub: movel() ? 0.5 : 1,
    invalidateOnRefresh: true,
    // Um pin desloca tudo que vem abaixo dele na página. Os outros ScrollTriggers
    // do site nascem em animations.ts, num bundle separado, sem ordem garantida
    // de execução. refreshPriority alto faz este recalcular primeiro, para os
    // demais medirem já contando com o espaço que o pin ocupa.
    refreshPriority: 1,
    onRefresh: () => {
      limparClones();
      fase = -1;
      corAtual = "";
      trechosZerados = false;
      medir();
    },
    // Ao sair da seção pelos dois lados, descarta os clones. Sem isso eles
    // continuavam existindo à toa depois do efeito terminar.
    onLeave: limparClones,
    onLeaveBack: limparClones,
    onUpdate: (self) => {
      const p = self.progress;
      const escalaFinal = tamanhoFinal() / caixaIcones.largura;
      const base = -vh * 0.3;
      const dxCheio = vw / 2 - caixaIcones.cx;
      const dyCheio = vh / 2 - caixaIcones.cy;
      const lado = tamanhoFinal();

      if (p <= 0.3) {
        // Fase 1: cabeçalho sobe e some enquanto a fileira de ícones entra.
        if (fase !== 1) {
          fase = 1;
          limparClones();
          gsap.set(iconeEls, { x: 0 });
          gsap.set(icones, { x: 0, scale: 1, opacity: 1 });
        }
        pintar(BRANCO);
        zerarTrechos();

        const av = p / 0.3;
        const subida = base * av;
        const avCab = Math.min(1, p / 0.15);

        gsap.set(cabecalho, { y: -50 * avCab, opacity: 1 - avCab });
        gsap.set(icones, { y: subida });

        iconeEls.forEach((icone, i) => {
          const inicio = i * 0.1;
          const t = gsap.utils.clamp(0, 1, gsap.utils.mapRange(inicio, inicio + 0.5, 0, 1, av));
          gsap.set(icone, { y: -subida * (1 - t) });
        });
      } else if (p <= 0.6) {
        // Fase 2: ícones encolhem rumo ao centro e o fundo vira azul na metade.
        if (fase !== 2) {
          fase = 2;
          limparClones();
          gsap.set(cabecalho, { y: -50, opacity: 0 });
          gsap.set(iconeEls, { x: 0, y: 0 });
          gsap.set(icones, { opacity: 1 });
        }
        zerarTrechos();

        const av = (p - 0.3) / 0.3;
        pintar(av >= 0.5 ? AZUL : BRANCO);
        gsap.set(icones, {
          x: dxCheio * av,
          y: base + dyCheio * av,
          scale: 1 + (escalaFinal - 1) * av,
        });
      } else if (p <= 0.75) {
        // Fase 3: os ícones reais somem e clones voam até os slots, primeiro na
        // vertical e depois na horizontal.
        if (fase !== 3) {
          fase = 3;
          gsap.set(cabecalho, { y: -50, opacity: 0 });
          gsap.set(iconeEls, { x: 0, y: 0 });
          gsap.set(icones, {
            x: dxCheio,
            y: base + dyCheio,
            scale: escalaFinal,
            opacity: 0,
          });
          if (!clones.length) criarClones(lado);
        }
        pintar(AZUL);
        zerarTrechos();

        const av = (p - 0.6) / 0.15;
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
          // translate em vez de left/top: transform não dispara recálculo de
          // layout, só composição.
          c.style.transform = `translate(${x - lado / 2}px, ${y - lado / 2}px)`;
        });
      } else {
        // Fase 4: clones assentados nos slots e os trechos aparecem um a um.
        if (fase !== 4) {
          fase = 4;
          trechosZerados = false;
          gsap.set(cabecalho, { y: -100, opacity: 0 });
          gsap.set(icones, { opacity: 0 });
          if (!clones.length) criarClones(lado);
          clones.forEach((c, i) => {
            if (i >= centroSlot.length) return;
            c.style.transform = `translate(${centroSlot[i].x - lado / 2}px, ${centroSlot[i].y - lado / 2}px)`;
          });
        }
        pintar(AZUL);

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
    redimensionando = window.setTimeout(() => ScrollTrigger.refresh(), 150);
  });

  window.addEventListener("load", () => st.refresh());
}
