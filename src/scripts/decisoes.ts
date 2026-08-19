// Cartões empilhados que giram e se despedem conforme o scroll.
//
// A seção fica presa e o progresso de 0 a 1 é dividido em fases, medidas em
// "svh" (alturas de tela) para o efeito durar o mesmo tanto em qualquer monitor:
//
//   0    → 32svh   os cartões sobem e a frase de impacto sai por cima
//   60   → 84svh   o baralho gira: a capa some e os quatro versos aparecem
//                  abertos em leque
//   88svh → fim    um a um, de trás para a frente, os cartões sobem e saem
//
// ─────────────────────────────────────────────────────────────────────────────
// O GIRO ACOMPANHA O DEDO
//
// A versão anterior disparava o giro com um gsap.to de 1 segundo e ease
// elástica quando o progresso cruzava um limiar. Duas consequências ruins, as
// duas piores no celular, onde a seção presa dura menos de duas telas:
//
//   · O giro rodava no tempo dele, não no do dedo. Você parava de rolar e a
//     animação continuava sozinha; era a sensação de travar.
//   · Cruzando o limiar para frente e para trás, cada passagem começava um novo
//     tween de 1 segundo por cima do anterior.
//
// Agora a rotação é interpolada pelo progresso, como todo o resto: parou o
// dedo, parou a animação, e voltar desfaz na mesma proporção.
// ─────────────────────────────────────────────────────────────────────────────

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const secao = document.querySelector<HTMLElement>(".dc-section");
const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (secao && !reduzido) {
  const q = gsap.utils.selector(secao);
  const capa = q(".dc-card--frente");
  const versos = q(".dc-card--verso");
  const todos = q(".dc-card");
  const frase = q(".dc-frase");
  const total = versos.length;

  const movel = window.innerWidth <= 767;

  // No celular todas as fases encolhem na mesma proporção: o efeito continua
  // igual, só dura menos dedo de rolagem. 460svh viram 184svh.
  const f = movel ? 0.4 : 1;

  const ENTRADA_FIM = 80 * f;
  const GIRO_INICIO = 150 * f;
  const GIRO_FIM = 195 * f;
  const SAIDA_INICIO = 220 * f;
  const SAIDA_DURACAO = 60 * f;
  const SVH_TOTAL = SAIDA_INICIO + total * SAIDA_DURACAO;

  const emProgresso = (svh: number) => svh / SVH_TOTAL;

  // Inclinações do leque: valores diferentes por cartão, senão eles ficam
  // empilhados em bloco e não se lê que são vários.
  //
  // No celular são bem menores. Um cartão de 352px inclinado 20 graus ocupa uma
  // caixa de 481px de largura: numa tela de 440px sobrava um terço do cartão
  // para fora, que foi o que apareceu no teste.
  const escalaTilt = movel ? 0.6 : 1;
  const leque = [-10, -20, -5, 10].map((v) => v * escalaTilt);
  const saida = [-50, -60, -45, 50].map((v) => v * escalaTilt);

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

  ScrollTrigger.create({
    trigger: secao,
    start: "top top",
    end: () => `+=${window.innerHeight * (SVH_TOTAL / 100)}px`,
    pin: true,
    pinSpacing: true,
    // Ver a nota em scroll-icons.ts: em toque, prender por transform em vez de
    // position: fixed evita o Safari recompor a tela inteira a cada quadro.
    pinType: ScrollTrigger.isTouch === 1 ? "transform" : "fixed",
    // Com normalizeScroll ligado, o scroll já chega sincronizado com o quadro:
    // a suavização extra do scrub vira atraso perceptível. `true` acompanha o
    // dedo sem defasagem.
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

      // ENTRADA DE 100% A 0%, E NÃO DE 50% A -50%.
      //
      // O CSS antigo centralizava o cartão com `top: 50%` mais
      // `translate(-50%, 50%)`, ou seja, a posição base ficava meia altura ABAIXO
      // do centro, e o -50% do fim da entrada era o que trazia para o meio.
      // Ao trocar para `inset: 0` + `margin: auto` a base passou a ser o próprio
      // centro, mas a faixa de valores continuou a mesma: o -50% subia meia
      // altura a mais e o cartão parava colado no topo, com a metade de baixo da
      // seção vazia. Era o azul sobrando embaixo do cartão cortado.
      gsap.set(todos, { y: `${gsap.utils.mapRange(0, 1, 100, 0, entrada)}%` });
      gsap.set(frase, { y: `${gsap.utils.mapRange(0, 1, 0, -100, entrada)}%` });

      // Giro interpolado pelo progresso, sem tween de tempo.
      const giro = gsap.utils.clamp(
        0,
        1,
        gsap.utils.mapRange(emProgresso(GIRO_INICIO), emProgresso(GIRO_FIM), 0, 1, progress),
      );
      gsap.set(capa, { rotationY: 180 * giro });

      versos.forEach((c, i) => {
        const [ini, fim] = janelas[i];
        const p = gsap.utils.clamp(0, 1, gsap.utils.mapRange(ini, fim, 0, 1, progress));
        // A inclinação do leque só existe depois do giro, e a da saída continua
        // de onde o leque parou: uma corrente só, sem salto.
        const tiltLeque = leque[i] * giro;
        gsap.set(c, {
          rotationY: -180 + 180 * giro,
          // Mesma correção da entrada: a saída parte de 0 (centro), não de -50.
          y: `${gsap.utils.mapRange(0, 1, 0, -200, p)}%`,
          rotation: gsap.utils.mapRange(0, 1, tiltLeque, saida[i], p),
        });
      });
    },
  });
}
