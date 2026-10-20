/* Bonavita Lavanderia — interações do protótipo */
(() => {
  const WHATS = "5547996604333";
  const root = document.documentElement;
  root.classList.add("js");

  /* Cabeçalho com sombra ao rolar + barra mobile */
  const header = document.querySelector("[data-header]");
  const mobileBar = document.querySelector("[data-mobile-bar]");
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 8);
    mobileBar && mobileBar.classList.toggle("is-visible", y > 480);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Menu mobile */
  const toggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-nav]");
  const setMenu = (open) => {
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  };
  toggle.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));

  /* Link ativo conforme a seção visível */
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const sections = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => spy.observe(s));

  /* Animações de entrada */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min((i % 4) * 70, 210)}ms`;
      io.observe(el);
    });
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* Status "aberto agora" — horário publicado: seg–sex 8h30–18h30, sáb 8h30–12h30 */
  const HOURS = { 1: [510, 1110], 2: [510, 1110], 3: [510, 1110], 4: [510, 1110], 5: [510, 1110], 6: [510, 750] };
  const fmt = (m) => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}`;
  const status = document.querySelector("[data-status]");
  const updateStatus = () => {
    if (!status) return;
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo", weekday: "short", hour: "numeric", minute: "numeric", hour12: false,
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    const now = (parseInt(get("hour"), 10) % 24) * 60 + parseInt(get("minute"), 10);
    const today = HOURS[day];
    const title = status.querySelector("[data-status-title]");
    const text = status.querySelector("[data-status-text]");
    if (today && now >= today[0] && now < today[1]) {
      status.classList.add("is-open");
      title.textContent = "Aberto agora";
      text.textContent = `Atendimento até as ${fmt(today[1])}`;
    } else {
      status.classList.remove("is-open");
      let next = day, guard = 0;
      do { next = (next + 1) % 7; guard++; } while (!HOURS[next] && guard < 7);
      const opensToday = today && now < today[0];
      const names = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
      title.textContent = "Fechado no momento";
      text.textContent = opensToday
        ? `Abre hoje às ${fmt(today[0])}`
        : `Abre ${next === (day + 1) % 7 ? "amanhã" : names[next]} às ${fmt(HOURS[next][0])}`;
    }
  };
  updateStatus();
  setInterval(updateStatus, 60000);

  /* Montador de pedido interativo: preview em tempo real e abertura do WhatsApp */
  const form = document.querySelector("[data-order]");
  if (form) {
    const bairro = form.querySelector("[data-bairro]");
    const previewEl = form.querySelector("[data-preview-text]");
    const submitLabel = form.querySelector("[data-submit-label]");
    const clearBtn = form.querySelector("[data-clear-items]");

    const syncMode = () => {
      const coleta = form.modo.value === "coleta";
      bairro.classList.toggle("is-hidden", !coleta);
    };

    const buildMessage = () => {
      const itens = [...form.querySelectorAll('input[name="itens"]:checked')].map((i) => i.value);
      const nome = form.nome ? form.nome.value.trim() : "";
      const coleta = form.modo.value === "coleta";
      const b = form.bairro ? form.bairro.value.trim() : "";

      let msg = `Olá, Bonavita!${nome ? ` Aqui é ${nome}.` : ""}`;
      msg += itens.length ? ` Gostaria de orçamento para lavar: ${itens.join(", ")}.` : " Gostaria de um orçamento para lavagem.";
      msg += coleta ? ` Gostaria do serviço de leva e traz${b ? ` para o bairro ${b}` : ""}.` : " Levarei as peças diretamente até a loja no Centro.";
      msg += " Poderiam me passar os valores e prazos disponíveis?";
      return { msg, count: itens.length };
    };

    const updatePreview = () => {
      syncMode();
      const { msg, count } = buildMessage();
      if (previewEl) {
        previewEl.textContent = `"${msg}"`;
      }
      if (submitLabel) {
        submitLabel.textContent = count > 0 
          ? `Abrir no WhatsApp (${count} item${count > 1 ? "s" : ""} selecionado${count > 1 ? "s" : ""})`
          : "Abrir no WhatsApp com mensagem pronta";
      }
    };

    form.addEventListener("input", updatePreview);
    form.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach((input) => {
      input.addEventListener("change", updatePreview);
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        form.querySelectorAll('input[name="itens"]').forEach((cb) => { cb.checked = false; });
        updatePreview();
      });
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const { msg } = buildMessage();
      window.open(`https://wa.me/${WHATS}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
    });

    // Conectar botões dos cards de serviços ao montador de pedido
    document.querySelectorAll("[data-select-service]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const serviceName = btn.getAttribute("data-select-service");
        const checkbox = form.querySelector(`input[name="itens"][value="${serviceName}"]`);
        if (checkbox) {
          checkbox.checked = true;
          updatePreview();
        }
        form.scrollIntoView({ behavior: "smooth", block: "center" });
        form.classList.add("pulse-highlight");
        setTimeout(() => form.classList.remove("pulse-highlight"), 1200);
      });
    });

    updatePreview();
  }

  /* Ano no rodapé */
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
