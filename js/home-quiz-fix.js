(function () {
  var isNavigating = false;

  function injectMotionStyles() {
    if (document.getElementById("tdl-motion-styles")) return;
    var style = document.createElement("style");
    style.id = "tdl-motion-styles";
    style.textContent = `
      @keyframes tdlSlideIn {
        from {
          opacity: 0;
          transform: translateX(28px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      }
      @keyframes tdlSlideOut {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(-24px);
        }
      }
      @keyframes tdlPop {
        0% { transform: scale(0.85); opacity: 0; }
        60% { transform: scale(1.15); }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes tdlGlow {
        0%, 100% { box-shadow: 0 0 15px rgba(245, 158, 11, 0.2); }
        50% { box-shadow: 0 0 25px rgba(245, 158, 11, 0.45); }
      }
      @keyframes tdlTarotFloat {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-6px) rotate(1.5deg); }
      }
      .tdl-motion-enter {
        animation: tdlSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .tdl-motion-exit {
        animation: tdlSlideOut 0.2s cubic-bezier(0.4, 0, 1, 1) forwards;
      }
      .tdl-pop-check {
        animation: tdlPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
      .tdl-tarot-card {
        animation: tdlTarotFloat 3s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }

  function findByText(selector, text) {
    var items = document.querySelectorAll(selector);
    for (var i = 0; i < items.length; i += 1) {
      if ((items[i].textContent || "").trim().toLowerCase().indexOf(text.toLowerCase()) !== -1) {
        return items[i];
      }
    }
    return null;
  }

  function getNameInput() {
    return document.querySelector('input[aria-label="Como podemos chamar você? (Seu nome)"]') ||
      document.querySelector('input[placeholder="Digite seu nome completo"]');
  }

  function state() {
    try {
      return JSON.parse(localStorage.getItem("templodeluz_quiz_state") || "{}");
    } catch (error) {
      return {};
    }
  }

  function setState(next) {
    var current = state();
    Object.keys(next).forEach(function (key) {
      current[key] = next[key];
    });
    try {
      localStorage.setItem("templodeluz_quiz_state", JSON.stringify(current));
    } catch (error) {}
  }

  function saveName(name) {
    setState({ nome: name });
  }

  function firstName(value, fallback) {
    var name = (value || "").trim();
    if (!name || name.length < 2) return fallback;
    return name.split(/\s+/)[0];
  }

  function goResult() {
    window.location.href = "resultado.html";
  }

  function footer() {
    return '<footer class="mt-10 border-t border-[#fee2e2] bg-[#f5effa] px-6 py-9 text-center text-[12px] leading-relaxed text-[#9a5a5a] font-normal"><div class="font-display text-base text-[#7f1d1d] font-bold tracking-tight">🕊️ Templo da Luz Amorosa</div><p class="mt-2.5 max-w-[360px] mx-auto text-[#8a4a4a] leading-relaxed">Templo da Luz Amorosa é um projeto de atendimento espiritual privado.</p><div class="mt-2 text-[11.5px] text-[#8a4a4a] font-medium space-y-0.5"><p>CNPJ 61.566.220/0001-71</p><p>Rua José Gonçalves Gomide, 144 — Vila Guilherme, São Paulo/SP — CEP 02075-001</p></div><div class="mx-auto my-4 h-px w-20 bg-[#fecaca]"></div><p class="text-[12px] text-[#8a4a4a]">Contato: <a class="font-semibold text-[#7f1d1d] hover:underline" href="mailto:tempodaluz@gmail.com">tempodaluz@gmail.com</a> · <a class="font-semibold text-[#7f1d1d] hover:underline" href="tel:+5519998316353">(19) 99831-6353</a></p><div class="mt-4 flex justify-center items-center gap-4 text-[12px] text-[#8a4a4a] font-medium"><a href="privacidade.html" class="hover:text-[#7f1d1d] underline decoration-[#fecaca] underline-offset-4 transition-colors">Política de Privacidade</a><span>•</span><a href="termos.html" class="hover:text-[#7f1d1d] underline decoration-[#fecaca] underline-offset-4 transition-colors">Termos de Uso</a></div><p class="mt-5 mx-auto max-w-[340px] text-[8.5px] leading-[1.4] text-[#b0a3b8] font-normal select-none">Este site não é parte, nem é endossado pelo Facebook, Instagram ou Meta Platforms, Inc. Todo o conteúdo aqui expresso é de inteira responsabilidade do Templo da Luz Amorosa. O Facebook e o Instagram são marcas registradas da Meta Platforms, Inc.</p></footer>';
  }

  function renderShell(step, total, eyebrow, title, subtitle, note, bodyHtml, backStep) {
    var percent = Math.max(1, Math.min(100, (step / total) * 100));
    var backBtn = backStep
      ? '<button type="button" data-tdl-back="' + backStep + '" aria-label="Voltar" class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#fecaca] bg-[#f9f6fc] text-base font-black text-[#7f1d1d] transition-colors hover:bg-[#f0e8f7]">‹</button>'
      : '';

    var html =
      '<div class="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-[#fbf9f5] text-[#2b0f0f] shadow-2xl border-x border-[#fee2e2]">' +
        '<main class="flex flex-1 flex-col">' +
          '<div class="sticky top-0 z-30 border-b border-[#fee2e2] bg-white/95 px-4 pt-3.5 pb-3 backdrop-blur-md shadow-xs sm:px-6">' +
            '<div class="mb-2 flex items-center justify-between text-xs">' +
              '<div class="flex min-w-0 items-center gap-2">' +
                backBtn +
                '<span class="flex min-w-0 items-center gap-1.5 truncate font-bold text-[#7f1d1d]"><span class="h-2 w-2 shrink-0 rounded-full bg-[#f59e0b] animate-pulse"></span>Sua conexão espiritual</span>' +
              '</div>' +
              '<span class="font-bold px-2.5 py-0.5 rounded-full bg-[#fff1f2] text-[#7f1d1d] border border-[#fecaca] text-[11px]">Etapa ' + step + ' de ' + total + '</span>' +
            '</div>' +
            '<div class="h-2 overflow-hidden rounded-full bg-[#f0e8f7] border border-[#fee2e2] p-0.5">' +
              '<div class="h-full rounded-full bg-gradient-to-r from-[#f59e0b] via-[#d97706] to-[#b45309] shadow-sm transition-[width] duration-400 ease-out" style="width:' + percent + '%"></div>' +
            '</div>' +
            '<p class="mt-2 text-center text-[11px] font-semibold italic text-[#b45309]">✨ ' + (step < total ? 'A energia amorosa está guiando o caminho — continue' : 'Suas cartas já estão no altar sagrado') + '</p>' +
          '</div>' +
          '<div id="tdl-step-container" class="tdl-motion-enter">' +
            '<div class="px-4 pt-7 pb-3 sm:px-6">' +
              '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fef3c7] border border-[#fde68a] text-[11px] font-bold tracking-[0.14em] text-[#92400e] uppercase mb-3 shadow-2xs">' + eyebrow + '</span>' +
              '<h2 class="font-display text-[24px] sm:text-[25px] leading-[1.25] font-extrabold text-[#2b0f0f] tracking-tight">' + title + '</h2>' +
              '<p class="mt-2 text-[14px] sm:text-[14.5px] text-[#8a4a4a] leading-relaxed font-normal">' + subtitle + '</p>' +
            '</div>' +
            '<div class="mx-4 mb-4 flex items-center gap-3 rounded-2xl border border-[#fee2e2] bg-[#fff1f2] px-4 py-3 shadow-2xs sm:mx-6">' +
              '<span class="text-2xl shrink-0">' + note.icon + '</span>' +
              '<p class="text-[12.5px] sm:text-[13px] font-medium italic leading-relaxed text-[#8a4a4a]">' + note.text + '</p>' +
            '</div>' +
            bodyHtml +
          '</div>' +
        '</main>' +
        footer() +
      '</div>';

    document.body.innerHTML = html;
    window.scrollTo({ top: 0, behavior: "smooth" });

    var back = document.querySelector("[data-tdl-back]");
    if (back) {
      back.addEventListener("click", function () {
        navigateToStep(back.getAttribute("data-tdl-back"));
      });
    }
  }

  function motionOption(label, hint, emoji, nextStep, key, value) {
    return (
      '<button type="button" data-tdl-choice="true" data-next="' + nextStep + '" data-key="' + key + '" data-value="' + value.replace(/"/g, "&quot;") + '" class="tdl-option-card group relative flex w-full cursor-pointer items-center gap-3 rounded-2xl border-2 px-3.5 py-4 text-left transition-all duration-200 sm:gap-4 sm:px-4 border-[#fee2e2] bg-white hover:border-[#f59e0b] hover:bg-[#fffdf9] hover:scale-[1.01] active:scale-[0.985] shadow-xs">' +
        '<div class="tdl-option-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fff1f2] border border-[#fee2e2] text-2xl group-hover:scale-110 transition-transform">' + emoji + '</div>' +
        '<div class="flex-1 min-w-0">' +
          '<span class="block text-[15px] sm:text-[15.5px] font-bold text-[#2b0f0f] leading-snug">' + label + '</span>' +
          '<span class="mt-0.5 block text-[12px] sm:text-[12.5px] text-[#9a5a5a] leading-normal font-normal">' + hint + '</span>' +
        '</div>' +
        '<div class="tdl-option-check flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[12px] font-black transition-all duration-200 border-[#fecaca] text-transparent group-hover:border-[#f59e0b]">✓</div>' +
      '</button>'
    );
  }

  function wireChoiceButtons() {
    document.querySelectorAll("[data-tdl-choice='true']").forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        if (isNavigating) return;
        isNavigating = true;

        // Feedback Motion Imediato
        button.classList.remove("border-[#fee2e2]", "bg-white");
        button.classList.add("border-emerald-500", "bg-emerald-50/70", "shadow-md", "scale-[1.015]");
        var icon = button.querySelector(".tdl-option-icon");
        if (icon) {
          icon.classList.add("bg-emerald-100", "border-emerald-300");
        }
        var check = button.querySelector(".tdl-option-check");
        if (check) {
          check.className = "tdl-option-check tdl-pop-check flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[12px] font-black border-emerald-600 bg-emerald-600 text-white shadow-xs";
        }

        var key = button.getAttribute("data-key");
        var value = button.getAttribute("data-value");
        var next = button.getAttribute("data-next");

        var payload = {};
        payload[key] = value;
        setState(payload);

        // Avanço suave após 220ms
        setTimeout(function () {
          var container = document.getElementById("tdl-step-container");
          if (container) {
            container.classList.remove("tdl-motion-enter");
            container.classList.add("tdl-motion-exit");
          }
          setTimeout(function () {
            isNavigating = false;
            navigateToStep(next);
          }, 180);
        }, 220);
      });
    });
  }

  function renderLoading() {
    var data = state();
    var nome = firstName(data.nome, "Você");
    var ente = firstName(data.ente, "Pessoa Amada");

    document.documentElement.style.background = "#fff1f2";
    document.body.style.background = "#fff1f2";

    var html =
      '<div class="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-gradient-to-b from-[#4c0b0b] via-[#2a0606] to-[#160303] text-white shadow-2xl border-x border-[#fee2e2]">' +
        '<main class="flex flex-1 flex-col items-center justify-center px-5 py-8 text-center">' +
          '<div class="w-full rounded-3xl border border-amber-400/30 bg-black/40 p-6 sm:p-7 shadow-2xl backdrop-blur-md">' +
            '<span class="inline-flex items-center gap-2 rounded-full border border-amber-300/50 bg-amber-400/10 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-amber-300 shadow-sm">' +
              '<span class="h-2 w-2 rounded-full bg-amber-300 animate-ping"></span>Altar de Tarot em Sintonia' +
            '</span>' +
            // Efeito Motion com Cartas de Tarot
            '<div class="my-6 flex items-center justify-center gap-3">' +
              '<div class="tdl-tarot-card flex h-24 w-16 items-center justify-center rounded-xl border-2 border-amber-400/70 bg-gradient-to-br from-[#7f1d1d] to-[#450a0a] text-2xl shadow-lg" style="animation-delay: 0s;">🃏</div>' +
              '<div class="tdl-tarot-card flex h-28 w-20 items-center justify-center rounded-xl border-2 border-amber-300 bg-gradient-to-br from-[#b45309] via-[#92400e] to-[#451a03] text-4xl shadow-xl scale-105" style="animation-delay: 0.3s;">🔮</div>' +
              '<div class="tdl-tarot-card flex h-24 w-16 items-center justify-center rounded-xl border-2 border-amber-400/70 bg-gradient-to-br from-[#7f1d1d] to-[#450a0a] text-2xl shadow-lg" style="animation-delay: 0.6s;">❤️</div>' +
            '</div>' +
            '<h1 class="font-display text-[23px] sm:text-[26px] font-black leading-tight text-white">' +
              'Milena está abrindo as cartas' +
            '</h1>' +
            '<p class="mt-2.5 text-[13px] leading-relaxed text-amber-100/90 font-medium">' +
              'Sintonizando o campo espiritual entre <strong>' + nome + '</strong> e <strong>' + ente + '</strong>...' +
            '</p>' +
            '<div class="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">' +
              '<div class="h-2.5 overflow-hidden rounded-full border border-amber-400/20 bg-stone-900">' +
                '<div id="tdl-loading-bar" class="h-full w-[12%] rounded-full bg-gradient-to-r from-[#f59e0b] via-[#eab308] to-[#10b981] transition-all duration-300 shadow-sm"></div>' +
              '</div>' +
              '<div class="mt-2 flex items-center justify-between text-[11px] font-bold text-amber-200">' +
                '<span id="tdl-loading-status">Conectando energia amorosa...</span>' +
                '<span id="tdl-loading-percent">12%</span>' +
              '</div>' +
              '<div class="mt-4 space-y-2 text-left text-[12px] font-semibold">' +
                '<div id="tdl-step-1" class="flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-white">' +
                  '<span class="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black">✓</span>' +
                  '<span>Abertura do campo amoroso</span>' +
                '</div>' +
                '<div id="tdl-step-2" class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-stone-300">' +
                  '<span id="tdl-icon-2" class="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold">2</span>' +
                  '<span>Verificando bloqueios e terceira pessoa</span>' +
                '</div>' +
                '<div id="tdl-step-3" class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-stone-300">' +
                  '<span id="tdl-icon-3" class="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold">3</span>' +
                  '<span>Preparando leitura e consagração da vela</span>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<p class="mt-4 text-[11px] text-zinc-400">🔒 Seus dados e sigilo permanecem 100% protegidos.</p>' +
          '</div>' +
        '</main>' +
      '</div>';

    document.body.innerHTML = html;

    var bar = document.getElementById("tdl-loading-bar");
    var percent = document.getElementById("tdl-loading-percent");
    var status = document.getElementById("tdl-loading-status");
    var step2 = document.getElementById("tdl-step-2");
    var step3 = document.getElementById("tdl-step-3");
    var icon2 = document.getElementById("tdl-icon-2");
    var icon3 = document.getElementById("tdl-icon-3");

    var progress = 12;
    var timer = setInterval(function () {
      progress += Math.floor(Math.random() * 14) + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(timer);
      }

      if (bar) bar.style.width = progress + "%";
      if (percent) percent.textContent = progress + "%";

      if (progress >= 45 && step2) {
        step2.className = "flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-white";
        if (icon2) {
          icon2.className = "flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black";
          icon2.textContent = "✓";
        }
        if (status) status.textContent = "Verificando sentimentos e caminho...";
      }

      if (progress >= 80 && step3) {
        step3.className = "flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-white";
        if (icon3) {
          icon3.className = "flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black";
          icon3.textContent = "✓";
        }
        if (status) status.textContent = "Leitura pronta! Abrindo atendimento...";
      }

      if (progress >= 100) {
        setTimeout(function () {
          goResult();
        }, 500);
      }
    }, 240); // Completa em ~2.2 segundos de forma dinâmica
  }

  function navigateToStep(stepName) {
    injectMotionStyles();
    try {
      history.pushState({ step: stepName }, "", window.location.pathname + "?step=" + encodeURIComponent(stepName));
    } catch (e) {}

    var data = state();
    var nome = firstName(data.nome, "você");
    var ente = firstName(data.ente, "essa pessoa");

    if (stepName === "ente") {
      var body =
        '<div class="px-5 pb-14 sm:px-6">' +
          '<div class="w-full">' +
            '<label class="mb-2 block text-[12px] font-bold tracking-[0.14em] text-[#7f1d1d] uppercase">Nome dele(a) ou como você o(a) conhece</label>' +
            '<input id="tdl-ente-input" type="text" placeholder="Digite o nome dele(a)" class="w-full rounded-2xl border-2 bg-white px-4 py-4 text-[16px] font-semibold text-[#2b0f0f] shadow-xs outline-none transition-all duration-200 placeholder:text-[#b87171] focus:border-[#f59e0b] focus:ring-2 focus:ring-[#f59e0b]/20 border-[#fecaca]" value="' + (data.ente || "") + '">' +
          '</div>' +
          '<div class="mt-5">' +
            '<button type="button" id="tdl-next-ente" class="animate-pulse-cta w-full cursor-pointer rounded-2xl px-6 py-[18px] text-[15.5px] font-extrabold tracking-[0.02em] uppercase transition-all duration-300 hover:scale-[1.015] active:scale-[0.985] shadow-lg bg-gradient-to-r from-[#f59e0b] via-[#d97706] to-[#b45309] text-white shadow-amber-500/25 border border-amber-400/50 hover:brightness-105">' +
              '<span class="flex items-center justify-center gap-2 drop-shadow-xs font-bold">💫 Conectar Intenção Amorosa</span>' +
            '</button>' +
          '</div>' +
          '<div class="mt-6 flex items-start gap-3.5 rounded-2xl border border-[#fde68a] bg-[#fefaf3] p-4 text-left shadow-2xs">' +
            '<span class="text-2xl shrink-0 p-1.5 bg-white rounded-xl border border-[#fde68a]">🕯️</span>' +
            '<div>' +
              '<strong class="block text-[13px] font-bold text-[#92400e]">Sigilo absoluto no Altar</strong>' +
              '<p class="text-[12px] text-[#6e5984] leading-relaxed mt-0.5 font-normal">A taróloga utiliza esse nome apenas para orientar a abertura das cartas e sintonizar a energia correta.</p>' +
            '</div>' +
          '</div>' +
        '</div>';

      renderShell(
        2,
        4,
        "🔮 Pessoa Consultada",
        nome + ", qual é o nome da pessoa que você deseja consultar?",
        "Escreva o nome ou apelido pelo qual você conhece essa pessoa para Milena direcionar a leitura.",
        { icon: "🔒", text: "Esse nome fica guardado em sigilo e orienta a revelação correta nas cartas." },
        body,
        "intro"
      );

      var input = document.getElementById("tdl-ente-input");
      if (input) {
        input.focus();
        input.addEventListener("keydown", function (e) {
          if (e.key === "Enter") {
            e.preventDefault();
            document.getElementById("tdl-next-ente").click();
          }
        });
      }

      document.getElementById("tdl-next-ente").addEventListener("click", function () {
        var val = (document.getElementById("tdl-ente-input").value || "").trim();
        if (!val) {
          input.focus();
          return;
        }
        setState({ ente: val });
        navigateToStep("relacao");
      });
      return;
    }

    if (stepName === "relacao") {
      var body =
        '<div class="flex flex-col gap-3 px-5 pb-14 sm:px-6">' +
          motionOption("Estamos afastados ou sem contato", "Existe distância, silêncio ou bloqueio entre vocês", "🌙", "intencao", "relacao", "Estamos afastados ou sem contato") +
          motionOption("Ainda conversamos, mas sinto frieza", "Há contato, mas você sente dúvida, demora ou afastamento", "💬", "intencao", "relacao", "Ainda conversamos mas está frio") +
          motionOption("Terminamos recentemente e quero voltar", "Você quer saber se existe caminho de reconciliação", "💔", "intencao", "relacao", "Terminamos e quero voltar") +
          motionOption("Desconfio de outra pessoa no caminho", "Quer saber se existe amante, rival ou interferência", "👁️", "intencao", "relacao", "Suspeita de terceira pessoa") +
          motionOption("Quero atrair e conquistar de vez", "Abrir caminhos para paixão, união e reconexão firme", "🔥", "intencao", "relacao", "Quero atrair e conquistar") +
        '</div>';

      renderShell(
        3,
        4,
        "💞 Situação Entre Vocês",
        "Qual opção mais se parece com o momento atual de vocês?",
        "Toque na opção mais próxima. Isso ajuda Milena a abrir as cartas no ponto certo da sua dor.",
        { icon: "🔮", text: "Toque na opção que seu coração reconhecer para avançar automaticamente." },
        body,
        "ente"
      );

      wireChoiceButtons();
      return;
    }

    if (stepName === "intencao") {
      var body =
        '<div class="flex flex-col gap-3 px-5 pb-14 sm:px-6">' +
          motionOption("Descobrir se ele(a) ainda me ama de verdade", "Entender sentimentos escondidos, saudade ou frieza", "❤️", "loading", "intencao", "Descobrir se ainda me ama") +
          motionOption("Saber se nós vamos voltar a ficar juntos", "Ver possibilidade real de retorno e próximos movimentos", "🔁", "loading", "intencao", "Saber se vamos voltar") +
          motionOption("Descobrir se existe terceira pessoa no caminho", "Afastar rival, amante ou influências externas que atrapalham", "👁️", "loading", "intencao", "Confirmar terceira pessoa") +
          motionOption("Fazer amarração amorosa para nos unir", "Abrir o caminho para reconciliação, desejo e amor firme", "🕯️", "loading", "intencao", "Amarração amorosa e volta") +
        '</div>';

      renderShell(
        4,
        4,
        "💌 Objetivo da Consulta",
        "O que o seu coração mais precisa descobrir nas cartas hoje?",
        "Essa intenção define o caminho exato que a taróloga Milena abrirá no altar agora.",
        { icon: "✨", text: "Ao selecionar sua intenção, o altar iniciará a abertura da sua leitura amorosa." },
        body,
        "relacao"
      );

      wireChoiceButtons();
      return;
    }

    if (stepName === "loading") {
      renderLoading();
      return;
    }

    if (stepName === "result") {
      goResult();
      return;
    }
  }

  function goToQuiz() {
    var input = getNameInput();
    var name = input ? input.value.trim() : "";

    if (input && !name) {
      input.focus();
      input.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (name) saveName(name);
    navigateToStep("ente");
  }

  // Monitora botão Voltar do navegador para navegar suavemente sem reload
  window.addEventListener("popstate", function (event) {
    var step = new URLSearchParams(window.location.search).get("step");
    if (step && step !== "intro") {
      navigateToStep(step);
    } else {
      window.location.href = window.location.pathname;
    }
  });

  // Intercepta cliques de início do Quiz na Home
  document.addEventListener("click", function (event) {
    var button = event.target.closest("button");
    if (!button) return;

    var text = (button.textContent || "").trim().toLowerCase();

    if (
      text.indexOf("revelar minha leitura") !== -1 ||
      text.indexOf("revelar minha carta") !== -1 ||
      text.indexOf("revelar minha leitura amorosa") !== -1 ||
      text.indexOf("iniciar leitura de tarot") !== -1
    ) {
      event.preventDefault();
      event.stopPropagation();
      goToQuiz();
    }
  }, true);

  // Enter no campo de nome
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Enter") return;
    var input = getNameInput();
    if (!input || event.target !== input) return;
    event.preventDefault();
    goToQuiz();
  }, true);

  // Se já carregar com ?step=... na URL, renderiza diretamente
  var initialStep = new URLSearchParams(window.location.search).get("step");
  if (initialStep && initialStep !== "intro") {
    navigateToStep(initialStep);
  } else {
    injectMotionStyles();
  }
})();
