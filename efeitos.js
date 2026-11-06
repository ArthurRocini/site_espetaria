"use strict";

// A página continua visível e utilizável sem JavaScript ou sem animações.
(() => {
  const movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)");
  const animacoes = new Set();
  const controle = document.getElementById("alternar-efeitos");
  const cabecalho = document.querySelector(".cabecalho");
  const molduraFoto = document.querySelector(".arte-brasa");
  const fotoPrincipal = molduraFoto.querySelector("img");
  const chaveEfeitos = "garagem36-efeitos";
  const entradasPendentes = new Set(document.querySelectorAll(
    ".inicio-grid > *, .secao-cabecalho, .resumo-pedido, .sobre-grid > *, .localizacao h2, .mapa-container"
  ));
  let observadorEntrada = null;
  let quadroRolagem = null;

  // Respeita o sistema até a pessoa escolher; preserva essa escolha ao atualizar.
  try {
    const escolhaSalva = sessionStorage.getItem(chaveEfeitos);
    if (escolhaSalva === "ativos" || escolhaSalva === "inativos") {
      document.documentElement.dataset.efeitos = escolhaSalva;
    }
  } catch {
    // A página também funciona quando o navegador bloqueia o armazenamento.
  }

  // Rolagem nativa preservada: somente a foto ganha um deslocamento de até 16px.
  function atualizarRolagem() {
    quadroRolagem = null;
    cabecalho.classList.toggle("rolando", window.scrollY > 16);
    const limites = molduraFoto.getBoundingClientRect();
    let deslocamento = 0;
    if (efeitosAtivos() && limites.bottom > 0 && limites.top < window.innerHeight) {
      const progresso = (window.innerHeight / 2 - limites.top - limites.height / 2)
        / ((window.innerHeight + limites.height) / 2);
      deslocamento = Math.max(-16, Math.min(16, progresso * 16));
    }
    fotoPrincipal.style.setProperty("--deslocamento-rolagem", `${deslocamento.toFixed(2)}px`);
  }

  function agendarRolagem() {
    if (quadroRolagem === null) quadroRolagem = requestAnimationFrame(atualizarRolagem);
  }

  window.addEventListener("scroll", agendarRolagem, { passive: true });
  window.addEventListener("resize", agendarRolagem, { passive: true });

  function efeitosAtivos() {
    const escolha = document.documentElement.dataset.efeitos;
    return escolha ? escolha === "ativos" : !movimentoReduzido.matches;
  }

  function atualizarControle() {
    const ativos = efeitosAtivos();
    controle.textContent = ativos ? "Desativar efeitos" : "Ativar efeitos";
    controle.setAttribute("aria-pressed", String(ativos));
    if (!ativos) animacoes.forEach(animacao => animacao.cancel());
    if (ativos && observadorEntrada) {
      observadorEntrada.disconnect();
      entradasPendentes.forEach(elemento => observadorEntrada.observe(elemento));
    }
    agendarRolagem();
  }

  controle.hidden = false;
  atualizarControle();
  controle.addEventListener("click", () => {
    document.documentElement.dataset.efeitos = efeitosAtivos() ? "inativos" : "ativos";
    try {
      sessionStorage.setItem(chaveEfeitos, document.documentElement.dataset.efeitos);
    } catch {
      // A escolha continua válida nesta página, mesmo sem armazenamento.
    }
    atualizarControle();
  });

  function animar(elemento, quadros, opcoes) {
    if (!efeitosAtivos() || typeof elemento.animate !== "function") return;
    const animacao = elemento.animate(quadros, opcoes);
    animacoes.add(animacao);
    animacao.addEventListener("finish", () => animacoes.delete(animacao), { once: true });
    animacao.addEventListener("cancel", () => animacoes.delete(animacao), { once: true });
    return animacao;
  }

  if ("IntersectionObserver" in window) {
    observadorEntrada = new IntersectionObserver(entradas => {
      entradas.forEach(entrada => {
        if (!entrada.isIntersecting) return;
        const animacao = animar(entrada.target, [
          { opacity: 0, transform: "translateY(24px)" },
          { opacity: 1, transform: "translateY(0) scale(1)" }
        ], {
          duration: 650,
          fill: "backwards",
          easing: "cubic-bezier(.2,.65,.3,1)"
        });
        if (animacao) {
          entradasPendentes.delete(entrada.target);
          observadorEntrada.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.08 });

    entradasPendentes.forEach(elemento => observadorEntrada.observe(elemento));
  }

  movimentoReduzido.addEventListener("change", atualizarControle);
})();
