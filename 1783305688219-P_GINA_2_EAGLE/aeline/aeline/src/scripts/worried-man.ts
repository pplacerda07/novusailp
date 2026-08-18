// Worried Man — figura que anda no lugar, usada na seção de contraste com o chatbot.
//
// PORTE DE GSAP 2 PARA GSAP 3
// O componente original veio escrito na API antiga (TweenMax/TimelineMax) e
// carregava o GSAP 2.1.3 por CDN. O projeto usa GSAP 3.15 do npm, onde:
//   · TweenMax e TimelineMax não existem mais → gsap.to / gsap.timeline
//   · BezierPlugin foi removido           → MotionPathPlugin
//   · as easings viraram string           → Sine.easeInOut vira "sine.inOut"
//   · _gsTransform saiu                   → gsap.getProperty()
//
// Duas mudanças de comportamento, deliberadas:
//   1. O original chamava TweenMax.globalTimeScale(1.42), que aceleraria TODAS as
//      animações da página, inclusive as do resto do site. Aqui o timeScale é
//      aplicado só na timeline deste componente.
//   2. Os seletores do original eram globais ('.foot', '.headBob'). Aqui tudo é
//      consultado dentro do próprio SVG, para não pegar elementos de outra seção.

import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(MotionPathPlugin, ScrollTrigger);

const raiz = document.querySelector<SVGSVGElement>("[data-worried-man]");

if (raiz) {
  const q = gsap.utils.selector(raiz);
  const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Pose de repouso: com movimento reduzido a figura fica parada, em pé.
  gsap.set(q(".foot"), { x: 343, y: 450, transformOrigin: "80% 50%" });
  gsap.set(q(".shadow"), { transformOrigin: "50% 50%" });
  gsap.set(q(".hand"), { transformOrigin: "50% 100%" });
  gsap.set(raiz, { visibility: "visible" });

  if (!reduzido) {
    // Caminho fechado que cada pé percorre: sobe, avança e volta ao ponto inicial.
    const caminho = [
      { x: 343, y: 450 },
      { x: 401, y: 414 },
      { x: 424, y: 427 },
      { x: 422, y: 449 },
      { x: 343, y: 450 },
    ];

    // O trajeto roda em tempo linear numa timeline pausada, e o que ganha
    // aceleração é a POSIÇÃO NO TEMPO dessa timeline (footTempo abaixo). Esse
    // truque do original é o que dá a cadência de passo: rápido no impulso,
    // lento na volta.
    const trajeto = (alvo: string) =>
      gsap.timeline({ paused: true }).to(q(alvo), {
        duration: 2,
        ease: "none",
        motionPath: { path: caminho, curviness: 1, autoRotate: false },
      });

    const trajetoL = trajeto(".footL");
    const trajetoR = trajeto(".footR");

    const tempo = (tl: gsap.core.Timeline) =>
      gsap.timeline({ repeat: -1 }).to(tl, {
        time: tl.duration(),
        duration: 2,
        ease: "sine.inOut",
      });

    const rotacao = (alvo: string) =>
      gsap
        .timeline({ repeat: -1 })
        .to(q(alvo), { rotation: 30, duration: 0.4, ease: "sine.in" })
        .to(q(alvo), { rotation: -35, duration: 0.6, ease: "sine.in" })
        .to(q(alvo), { rotation: 0, duration: 0.5, ease: "power4.out" })
        .to({}, { duration: 0.5 });

    const torso = gsap
      .timeline({ repeat: -1 })
      .to(q(".upperBody"), { y: 20, duration: 0.5, ease: "sine.inOut", repeat: 1, yoyo: true })
      .to(q(".shadow"), { scaleX: 1.1, duration: 0.5, ease: "sine.inOut", repeat: 1, yoyo: true }, 0);

    const cabeca = gsap
      .timeline({ repeat: -1 })
      .to(q(".headBob"), { y: 7, duration: 0.5, ease: "sine.inOut", repeat: 3, yoyo: true });

    const perna = (t: gsap.core.Timeline, r: gsap.core.Timeline) =>
      gsap.timeline({ repeat: -1 }).add([t, r]);

    const principal = gsap
      .timeline()
      .add(perna(tempo(trajetoL), rotacao(".footL")), 0)
      .add(perna(tempo(trajetoR), rotacao(".footR")), 1)
      .add(torso, 0.75)
      .add(cabeca, 0.85)
      .seek(100)
      .timeScale(1.42);

    // A figura anda em laço infinito. Fora da tela isso é trabalho jogado fora,
    // então a timeline pausa quando a seção não está visível.
    ScrollTrigger.create({
      trigger: raiz,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => (self.isActive ? principal.play() : principal.pause()),
    });
  }

  // ── Balões: alterna entre a fase do chatbot e a do agente a cada 5s ──────
  // Os dois textos já estão no HTML; o atributo data-fase decide qual aparece,
  // e o CSS faz o crossfade. Com movimento reduzido a alternância não roda e a
  // fase 0 fica fixa, que é o problema que a seção está descrevendo.
  const baloes = document.querySelector<HTMLElement>(".wm-bubbles");
  if (baloes && !reduzido) {
    let fase = 0;
    let timer: number | undefined;

    const alternar = () => {
      fase = fase === 0 ? 1 : 0;
      baloes.setAttribute("data-fase", String(fase));
    };

    // Só conta tempo enquanto a seção está na tela: sem isso o visitante chega
    // na seção no meio de uma fase, ou pior, sempre na mesma.
    const observador = new IntersectionObserver(
      ([entrada]) => {
        window.clearInterval(timer);
        if (entrada.isIntersecting) {
          timer = window.setInterval(alternar, 5000);
        }
      },
      { threshold: 0.25 },
    );
    observador.observe(baloes);
  }
}
