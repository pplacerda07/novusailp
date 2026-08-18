// Swiper init — depoimentos slider (home + any page with .section_depoimentos).
// Config: speed 700, loop false, slidesPerView 1→2(768)→3(992), spaceBetween 16→24,
// mousewheel forceToAxis, keyboard.
// Sob consulta arrows .slide_prev / .slide_next (not Swiper's default arrows).
// The service-detail slider (slider_two) has a single slide per service, so it needs no Swiper.

import Swiper from "swiper";
import { Navigation, Mousewheel, Keyboard, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";

// Always-on slider (depoimentos + blog teaser): spv 1→2(768)→3(992), speed 700,
// custom arrows .slide_prev / .slide_next. Blog uses the SAME config so it
// inherits the depoimentos render path (the slide is the card, image as a direct
// child) — no breakpoint destroy/re-init, no grid CSS to counteract.
function initSlider(sectionSelector: string) {
  document.querySelectorAll<HTMLElement>(sectionSelector).forEach((section) => {
    const el = section.querySelector<HTMLElement>(".swiper");
    if (!el) return;
    const swiper = new Swiper(el, {
      modules: [Navigation, Mousewheel, Keyboard],
      speed: 700,
      loop: false,
      slidesPerView: 1,
      spaceBetween: 16,
      mousewheel: { forceToAxis: true },
      keyboard: { enabled: true, onlyInViewport: true },
      breakpoints: {
        768: { slidesPerView: 2, spaceBetween: 24 },
        992: { slidesPerView: 3, spaceBetween: 24 },
      },
    });
    section.querySelectorAll(".slide_prev").forEach((b) => b.addEventListener("click", () => swiper.slidePrev()));
    section.querySelectorAll(".slide_next").forEach((b) => b.addEventListener("click", () => swiper.slideNext()));
  });
}

// Card sections that are a static layout on desktop (Servicos accordion, Especialidade
// bento) but should become a slider ONLY on tablet/mobile (≤991): 2-up at ≥768, 1-up
// below. Swiper is initialised ≤991 and destroyed ≥992 so the desktop layout (driven by
// CSS) owns the markup. Sob consulta arrows reuse the depoimentos style (.slide_prev /
// .slide_next), bound once so re-inits across breakpoint changes don't stack listeners.
function initBreakpointSlider(
  sectionSelector: string,
  hostSelector: string,
  arrowsClass: string,
  tabletPerView: number,
) {
  const section = document.querySelector<HTMLElement>(sectionSelector);
  if (!section) return;
  const el = section.querySelector<HTMLElement>(hostSelector);
  if (!el) return;

  let swiper: Swiper | null = null;
  const mq = window.matchMedia("(max-width: 991px)");

  const sync = () => {
    if (mq.matches && !swiper) {
      swiper = new Swiper(el, {
        modules: [Mousewheel, Keyboard],
        speed: 700,
        loop: false,
        slidesPerView: 1,
        spaceBetween: 16,
        mousewheel: { forceToAxis: true },
        keyboard: { enabled: true, onlyInViewport: true },
        breakpoints: {
          768: { slidesPerView: tabletPerView, spaceBetween: tabletPerView > 1 ? 24 : 16 },
        },
      });
    } else if (!mq.matches && swiper) {
      swiper.destroy(true, true);
      swiper = null;
    }
  };

  section.querySelectorAll(`${arrowsClass} .slide_prev`).forEach((b) =>
    b.addEventListener("click", () => swiper?.slidePrev()),
  );
  section.querySelectorAll(`${arrowsClass} .slide_next`).forEach((b) =>
    b.addEventListener("click", () => swiper?.slideNext()),
  );

  mq.addEventListener("change", sync);
  sync();
}

// Cross-fade slider (service-detail depoimentos, .section_testimonia): Swiper
// effect:"fade" crossFade, 500ms, loop, manual arrows (.w-slider-arrow-left/right).
// One slide visible; the rest stack absolutely and cross-fade. No autoplay.
function initFadeSlider(sectionSelector: string) {
  document.querySelectorAll<HTMLElement>(sectionSelector).forEach((section) => {
    const el = section.querySelector<HTMLElement>(".swiper");
    if (!el) return;
    const swiper = new Swiper(el, {
      modules: [EffectFade, Keyboard],
      effect: "fade",
      fadeEffect: { crossFade: true },
      speed: 500,
      loop: true,
      slidesPerView: 1,
      keyboard: { enabled: true, onlyInViewport: true },
    });
    section.querySelectorAll(".w-slider-arrow-left").forEach((b) => b.addEventListener("click", () => swiper.slidePrev()));
    section.querySelectorAll(".w-slider-arrow-right").forEach((b) => b.addEventListener("click", () => swiper.slideNext()));
  });
}

function initAll() {
  initSlider(".section_depoimentos");
  initFadeSlider(".section_testimonia");
  initSlider(".section_blog");
  initBreakpointSlider(".section_services", ".services_cards.swiper", ".is-services", 2);
  initBreakpointSlider(".section_expertise", ".expertise_cards.swiper", ".is-expertise", 1);
  initBreakpointSlider(".section_pricing", ".pricing_cards.swiper", ".is-pricing", 2);
  initBreakpointSlider(".sec_team", ".team_cards.swiper", ".is-team", 2);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAll);
} else {
  initAll();
}
