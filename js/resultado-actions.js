(function () {
  var selectedAmount = 35;
  var statusTimer = null;
  var pixInitialized = false;
  var pixObserverTimer = null;

  function hasText(element, text) {
    return (element.textContent || "").toLowerCase().indexOf(text.toLowerCase()) !== -1;
  }

  function go(url) {
    window.location.href = url;
  }

  function digits(value) {
    return (value || "").replace(/\D/g, "");
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"}[char];
    });
  }

  function formatMoney(value) {
    return "R$ " + Number(value).toFixed(2).replace(".", ",");
  }

  function packageInfo(amount) {
    amount = Number(amount);
    if (amount >= 59.99) {
      return {
        title: "Pacote Sagrado Templo VIP",
        short: "Tudo incluso + Atendimento Prioritário",
        description: "Inclui tudo com prioridade sagrada: 5 respostas, leitura de cartas, oráculo do futuro, amarração amorosa de 3 a 7 dias, leitura da mão e acompanhamento direto no chat com a taróloga Milena.",
        tracking: "Pacote Sagrado VIP - R$60"
      };
    }
    if (amount >= 54.99) {
      return {
        title: "Leitura Completa com Terceira Pessoa",
        short: "Mão + Investigação de Rival",
        description: "Inclui amarração amorosa, leitura da palma da mão, investigação profunda sobre terceira pessoa/amante e revelação de sentimentos ocultos.",
        tracking: "Leitura Completa Terceira Pessoa - R$55"
      };
    }
    if (amount >= 44.99) {
      return {
        title: "Amarração Amorosa com Leitura de Mão",
        short: "Amarração + Leitura da mão",
        description: "Inclui 5 respostas, abertura da amarração amorosa de 3 a 7 dias e leitura da mão para ver linhas de destino e aproximação afetiva.",
        tracking: "Amarração e Leitura de Mão - R$45"
      };
    }
    if (amount >= 34.99) {
      return {
        title: "Amarração Amorosa com 5 Respostas",
        short: "Amarração + 5 respostas (Mais Escolhida)",
        description: "A opção mais indicada e viável do Templo: inclui 5 respostas diretas e o ritual de amarração amorosa de 3 a 7 dias para desbloquear caminhos e aproximar quem você ama.",
        tracking: "Amarração Amorosa Indicada - R$35"
      };
    }
    if (amount >= 24.99) {
      return {
        title: "Leitura Amorosa com Oráculo",
        short: "5 respostas + oráculo 30 dias",
        description: "Inclui 5 respostas objetivas no chat, leitura de cartas e acompanhamento com oráculo de 30 dias para verificar sentimentos e movimentos futuros.",
        tracking: "Leitura Amorosa com Oraculo - R$25"
      };
    }
    return {
      title: "Leitura Amorosa Essencial",
      short: "3 respostas + leitura de carta",
      description: "Entrada solidária no Templo: inclui 3 respostas diretas e leitura de carta para revelar o ponto principal entre vocês agora.",
      tracking: "Leitura Amorosa Essencial - R$15"
    };
  }

  function paymentStatusLabel(status) {
    var labels = {
      PENDING: "pendente",
      AUTHORIZED: "confirmado",
      FAILED: "falhou",
      CHARGEBACK: "em contestação",
      IN_DISPUTE: "em análise"
    };
    return labels[String(status || "PENDING").toUpperCase()] || String(status || "pendente").toLowerCase();
  }

  function qrUrl(payload) {
    return "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" + encodeURIComponent(payload);
  }

  function readState() {
    try {
      return JSON.parse(localStorage.getItem("templodeluz_quiz_state") || "{}");
    } catch (error) {
      return {};
    }
  }

  function readTracking() {
    if (window.TemploTracking && window.TemploTracking.read) {
      return window.TemploTracking.read();
    }
    return {};
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function scheduleTime() {
    var stored = localStorage.getItem("tdl_result_schedule_at");
    var date = stored ? new Date(stored) : null;
    if (!date || isNaN(date.getTime()) || date.getTime() < Date.now()) {
      date = new Date(Date.now() + 30 * 60 * 1000);
      localStorage.setItem("tdl_result_schedule_at", date.toISOString());
    }
    return pad(date.getHours()) + "h" + pad(date.getMinutes());
  }

  function replaceText(root, from, to) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      if ((node.nodeValue || "").indexOf(from) !== -1) {
        node.nodeValue = node.nodeValue.replace(new RegExp(from, "g"), to);
      }
    });
  }

  function hydrateResultSchedule() {
    var time = scheduleTime();
    replaceText(document.body, "18h52", time);
  }

  function trackCheckoutEvent(amount, productName) {
    if (window.TemploTracking && window.TemploTracking.trackInitiateCheckout) {
      window.TemploTracking.trackInitiateCheckout(amount, productName);
      return;
    }
    try {
      window.dispatchEvent(new CustomEvent("utmify:checkout", {
        detail: {currency: "BRL", value: amount, product: productName}
      }));
    } catch (error) {}
    try {
      if (window.fbq) window.fbq("track", "InitiateCheckout", {currency: "BRL", value: amount, content_name: productName});
    } catch (error) {}
    try {
      if (window.ttq) window.ttq.track("InitiateCheckout", {currency: "BRL", value: amount, content_name: productName});
    } catch (error) {}
  }

  function findPixSection() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll("button"));
    var mainButton = buttons.find(function (button) {
      return hasText(button, "Gerar Chave PIX");
    });
    var section = mainButton && mainButton.closest(".rounded-3xl");
    if (section && hasText(section, "Escolha o valor") && hasText(section, "Gerar Chave PIX")) return section;
    section = Array.prototype.slice.call(document.querySelectorAll("div")).find(function (item) {
      return hasText(item, "Escolha o valor") && hasText(item, "Gerar Chave PIX");
    });
    return section || (mainButton && mainButton.parentElement) || null;
  }

  function hideCreditCardOptions() {
    Array.prototype.slice.call(document.querySelectorAll("button, span, div, p")).forEach(function (item) {
      if (
        hasText(item, "Cartão") ||
        hasText(item, "Cartao") ||
        hasText(item, "Stripe") ||
        hasText(item, "Liberar com Cartão") ||
        hasText(item, "Liberar com Cartao")
      ) {
        var cardButton = item.closest("button");
        var block = cardButton || item;
        if (cardButton && hasText(cardButton, "Liberar com")) {
          block = cardButton.closest(".mt-4") || cardButton;
        }
        block.style.display = "none";
      }
    });

    Array.prototype.slice.call(document.querySelectorAll("p, span")).forEach(function (item) {
      if (hasText(item, "PIX ou Cartão")) {
        item.textContent = (item.textContent || "").replace("PIX ou Cartão", "PIX");
      }
    });
  }

  function getMainPixButton() {
    return Array.prototype.slice.call(document.querySelectorAll("button")).find(function (button) {
      return hasText(button, "Gerar Chave PIX");
    });
  }

  function amountFromButton(button) {
    var match = (button.textContent || "").match(/R\$\s*([0-9]+)/i);
    return match ? Number(match[1]) : null;
  }

  function setSelected(button, active) {
    button.classList.toggle("border-2", active);
    button.classList.toggle("border-emerald-500", active);
    button.classList.toggle("bg-emerald-50", active);
    button.classList.toggle("shadow-md", active);
    button.classList.toggle("scale-[1.02]", active);
    button.style.borderColor = active ? "#10b981" : "";
    button.style.background = active ? "#ecfdf5" : "";
  }

  function hasSixResultOptions(grid) {
    if (!grid) return false;
    return [15, 25, 35, 45, 55, 60].every(function (amount) {
      return !!grid.querySelector('[data-tdl-result-amount="' + amount + '"]');
    });
  }

  function resultOptionsHtml() {
    return [
      {amount: 15, label: "3 respostas", hint: "Leitura de carta"},
      {amount: 25, label: "Com oráculo", hint: "5 resps + oráculo 30d"},
      {amount: 35, label: "Amarração", hint: "5 resps + amarração", best: true},
      {amount: 45, label: "Leitura de mão", hint: "Amarração + mão"},
      {amount: 55, label: "Investigação", hint: "Mão + terceira pessoa"},
      {amount: 60, label: "Tudo incluso", hint: "Pacote Sagrado VIP", premium: true}
    ].map(function (item) {
      var classes = "group relative py-3 px-2 rounded-2xl text-center transition-all duration-200 cursor-pointer border bg-white text-[#3f1111] hover:border-slate-300 hover:bg-white";
      if (item.best) classes = "group relative py-3 px-2 rounded-2xl text-center transition-all duration-200 cursor-pointer border-2 border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-md";
      if (item.premium) classes = "group relative py-3 px-2 rounded-2xl text-center transition-all duration-200 cursor-pointer border-2 border-amber-500 bg-amber-50 text-amber-950 shadow-md";
      return '<button type="button" data-tdl-result-option="true" data-tdl-result-amount="' + item.amount + '" class="' + classes + '">' +
        (item.best ? '<span class="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-2 py-0.5 text-[8.5px] font-black uppercase text-white whitespace-nowrap">Mais vantajosa</span>' : '') +
        (item.premium ? '<span class="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-600 px-2 py-0.5 text-[8.5px] font-black uppercase text-white whitespace-nowrap">Completo</span>' : '') +
        '<span class="block text-[16px] font-black leading-tight tracking-tight">R$ ' + item.amount + '</span>' +
        '<span class="mt-0.5 block text-[10px] font-black leading-tight text-[#7f3f3f]">' + item.label + '</span>' +
        '<span class="mt-0.5 block text-[9.5px] font-medium leading-tight text-[#8a4a4a]">' + item.hint + '</span>' +
      '</button>';
    }).join("");
  }

  function findResultOptionsGrid(section) {
    if (!section) return null;
    var grids = Array.prototype.slice.call(section.querySelectorAll(".grid"));
    return grids.find(function (grid) {
      return hasText(grid, "R$ 15") && hasText(grid, "R$ 35") && hasText(grid, "R$ 60");
    }) || grids.find(function (grid) {
      return grid.querySelector('[data-tdl-result-amount]');
    }) || null;
  }

  function updateSummary(section) {
    var info = packageInfo(selectedAmount);
    var summary = section.querySelector("[data-tdl-package-summary]");
    if (!summary) {
      summary = Array.prototype.slice.call(section.querySelectorAll("div")).find(function (item) {
        return !item.closest("button") && hasText(item, "R$") && (
          hasText(item, "Leitura Amorosa") ||
          hasText(item, "Amarração Amorosa") ||
          hasText(item, "Pacote Sagrado") ||
          hasText(item, "Consagração")
        );
      });
      if (summary) summary.setAttribute("data-tdl-package-summary", "true");
    }

    if (summary) {
      summary.innerHTML =
        '<div class="flex flex-wrap items-center justify-between gap-2 mb-2">' +
          '<span class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wide border bg-amber-100 text-amber-950 border-amber-300">✨ ' + escapeHtml(info.short) + '</span>' +
          '<span class="text-[13px] font-black text-[#3f1111]">' + formatMoney(selectedAmount) + '</span>' +
        '</div>' +
        '<h4 class="text-[13.5px] font-extrabold text-[#2b0f0f] leading-snug">' + escapeHtml(info.title) + '</h4>' +
        '<p class="text-[12px] text-[#8a4a4a] mt-1 leading-relaxed">' + escapeHtml(info.description) + '</p>';
      summary.className = "mt-4 rounded-2xl border border-amber-300 bg-amber-50/50 p-4 text-left shadow-2xs transition-all duration-300";
    }

    var priceBoxes = Array.prototype.slice.call(section.querySelectorAll("div, span, strong")).filter(function (item) {
      return /^R\$\s*[0-9]+,00$/.test((item.textContent || "").trim());
    });
    priceBoxes.forEach(function (item) {
      if (item.closest("[data-tdl-package-summary]")) return;
      if (item.closest("button")) return;
      item.textContent = formatMoney(selectedAmount);
    });

    var button = getMainPixButton();
    if (button) {
      var span = button.querySelector("span:last-child") || button;
      span.textContent = "Gerar Chave PIX de " + formatMoney(selectedAmount);
    }
  }

  function wireResultPix() {
    var section = findPixSection();
    if (!section) return;
    section.setAttribute("data-tdl-pix-ready", "true");

    var grid = findResultOptionsGrid(section);
    if (!grid) {
      var anchor = Array.prototype.slice.call(section.querySelectorAll("span, div")).find(function (item) {
        return hasText(item, "Escolha o valor");
      });
      if (anchor) {
        grid = document.createElement("div");
        grid.className = "grid grid-cols-3 gap-2.5";
        var wrap = anchor.closest(".mt-6, .text-left") || anchor.parentElement;
        if (wrap) wrap.appendChild(grid);
      }
    }
    if (grid && !hasSixResultOptions(grid)) {
      grid.className = "grid grid-cols-3 gap-2.5";
      grid.innerHTML = resultOptionsHtml();
    }

    var amountButtons = Array.prototype.slice.call(section.querySelectorAll("button")).filter(function (button) {
      return amountFromButton(button) !== null && !hasText(button, "Gerar Chave PIX");
    });

    amountButtons.forEach(function (button) {
      var amount = amountFromButton(button);
      button.setAttribute("data-tdl-result-amount", String(amount));
      if ([15, 25, 35, 45, 55, 60].indexOf(amount) === -1) {
        button.style.display = "none";
        button.setAttribute("aria-hidden", "true");
      } else if (button.getAttribute("data-tdl-result-option") !== "true") {
        var label = button.querySelector("span:last-child") || button;
        if (amount === 15) label.textContent = "3 respostas + leitura de carta";
        if (amount === 25) label.textContent = "5 respostas + cartas + oráculo 30 dias";
        if (amount === 35) label.textContent = "5 respostas + amarração";
        if (amount === 45) label.textContent = "Amarração + leitura da mão";
        if (amount === 55) label.textContent = "Mão + investigação de terceira pessoa";
        if (amount === 60) {
          label.textContent = "Tudo incluso + prioridade";
          button.style.background = "linear-gradient(135deg, #fff7ed, #fef3c7)";
          button.style.borderColor = "#f59e0b";
        }
      }
    });

    amountButtons = Array.prototype.slice.call(section.querySelectorAll("[data-tdl-result-amount]"));
    amountButtons.forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        selectedAmount = Number(button.getAttribute("data-tdl-result-amount")) || 35;
        amountButtons.forEach(function (item) { setSelected(item, item === button); });
        updateSummary(section);
      }, true);
    });

    var other = Array.prototype.slice.call(section.querySelectorAll("button")).find(function (button) {
      return hasText(button, "Digitar Outro");
    });
    if (other) {
      other.style.display = "none";
      other.setAttribute("aria-hidden", "true");
    }

    if (!pixInitialized) selectedAmount = 35;
    pixInitialized = true;
    amountButtons.forEach(function (item) { setSelected(item, Number(item.getAttribute("data-tdl-result-amount") || amountFromButton(item)) === selectedAmount); });
    updateSummary(section);
  }

  function protectResultPixOptions() {
    if (!document.body || window.__tdlPixObserverReady) return;
    window.__tdlPixObserverReady = true;
    var observer = new MutationObserver(function () {
      clearTimeout(pixObserverTimer);
      pixObserverTimer = setTimeout(function () {
        var section = findPixSection();
        var grid = findResultOptionsGrid(section);
        if (!hasSixResultOptions(grid)) wireResultPix();
      }, 80);
    });
    observer.observe(document.body, {childList: true, subtree: true});
  }

  function hardFixResultPixOptions() {
    var section = findPixSection();
    if (!section) return;
    var grid = findResultOptionsGrid(section);
    if (!grid) return;
    if (!hasSixResultOptions(grid)) {
      grid.className = "grid grid-cols-3 gap-2.5";
      grid.innerHTML = resultOptionsHtml();
    }
    var buttons = Array.prototype.slice.call(grid.querySelectorAll("[data-tdl-result-amount]"));
    buttons.forEach(function (button) {
      setSelected(button, Number(button.getAttribute("data-tdl-result-amount")) === selectedAmount);
    });
    updateSummary(section);
  }

  function startHardFixLoop() {
    var runs = 0;
    var timer = setInterval(function () {
      runs += 1;
      hardFixResultPixOptions();
      if (runs >= 30) clearInterval(timer);
    }, 250);
  }

  function hydrateTestimonials() {
    var section = Array.prototype.slice.call(document.querySelectorAll("section")).find(function (item) {
      return hasText(item, "Relatos recebidos pelo Templo");
    });
    if (!section || section.getAttribute("data-tdl-testimonials-ready") === "true") return;
    section.setAttribute("data-tdl-testimonials-ready", "true");

    var title = Array.prototype.slice.call(section.querySelectorAll("h2")).find(function (item) {
      return hasText(item, "Antes de continuar");
    });
    if (title) title.textContent = "Antes de continuar, veja os depoimentos de quem já recebeu";

    var intro = Array.prototype.slice.call(section.querySelectorAll("p")).find(function (item) {
      return hasText(item, "Mensagens reais");
    });
    if (intro) intro.textContent = "Relatos reais enviados por pessoas que passaram pela consulta amorosa com a taróloga Milena.";

    var content = Array.prototype.slice.call(section.children).find(function (item) {
      return item.className && String(item.className).indexOf("p-4") !== -1;
    });
    if (!content) return;

    content.innerHTML =
      '<div class="grid gap-4">' +
        [1, 2, 3, 4, 5].map(function (number) {
          return '<div class="overflow-hidden rounded-2xl border border-[#fecaca] bg-white shadow-sm">' +
            '<img src="assets/depoimento-' + number + '.jpeg" alt="Depoimento real de leitura amorosa ' + number + '" loading="lazy" decoding="async" class="h-auto w-full block object-contain">' +
          '</div>';
        }).join("") +
      '</div>' +
      '<div class="mt-5 flex flex-wrap items-center justify-center gap-2 text-[10.5px] font-bold text-[#8a4a4a]">' +
        '<span class="rounded-full bg-[#fff1f2] px-3 py-1.5">Depoimentos reais</span>' +
        '<span class="rounded-full bg-[#fff1f2] px-3 py-1.5">Consultas amorosas</span>' +
        '<span class="rounded-full bg-[#fff1f2] px-3 py-1.5">Atendimento com Milena</span>' +
      '</div>';
  }

  function wireFaq() {
    var heading = Array.prototype.slice.call(document.querySelectorAll("h2, h3, p, strong")).find(function (item) {
      return hasText(item, "Dúvidas frequentes");
    });
    if (!heading) return;
    var section = heading.closest("section") || heading.parentElement;
    if (!section || section.getAttribute("data-tdl-faq-ready") === "true") return;
    section.setAttribute("data-tdl-faq-ready", "true");

    var answers = [
      "A leitura é conduzida pela taróloga Milena a partir do nome informado, da situação amorosa e da intenção que você escolheu no quiz.",
      "Depois da confirmação do PIX, você retorna para esta página e será enviada automaticamente para o chat para iniciar a sessão.",
      "O valor libera os materiais e o atendimento da sessão: vela, abertura das cartas, estrutura do chat e acompanhamento da taróloga.",
      "Você pode seguir pelo chat e ajustar a dúvida com Milena. A leitura é feita para dar clareza sobre o momento amoroso, não para forçar uma resposta pronta.",
      "Sim. Nome, dúvida, pessoa consultada e dados de pagamento ficam em sigilo e são usados apenas para liberar sua sessão."
    ];

    Array.prototype.slice.call(section.querySelectorAll("button")).forEach(function (button, index) {
      button.setAttribute("type", "button");
      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        var panel = button.nextElementSibling;
        if (!panel || panel.tagName.toLowerCase() !== "p") {
          panel = document.createElement("p");
          panel.className = "px-4 pb-4 text-[12.5px] leading-relaxed text-[#8a4a4a]";
          panel.textContent = answers[index] || answers[0];
          button.parentNode.insertBefore(panel, button.nextSibling);
        }
        var isOpen = panel.style.display !== "none";
        panel.style.display = isOpen ? "none" : "block";
        var marker = button.querySelector("span:last-child");
        if (marker) marker.textContent = isOpen ? "+" : "−";
      }, true);
    });
  }

  function closePaymentModal() {
    var overlay = document.getElementById("tdl-result-payment-modal");
    if (overlay) overlay.remove();
    document.body.style.overflow = "";
    if (statusTimer) clearInterval(statusTimer);
    statusTimer = null;
  }

  function renderPaymentModal() {
    closePaymentModal();
    var state = readState();
    var info = packageInfo(selectedAmount);
    var overlay = document.createElement("div");
    overlay.id = "tdl-result-payment-modal";
    overlay.className = "fixed inset-0 z-[280] overflow-y-auto bg-black/75 px-3 py-4 backdrop-blur-md sm:px-4 sm:py-6";
    overlay.innerHTML =
      '<div class="absolute inset-0" data-close-payment></div>' +
      '<div class="relative z-10 mx-auto my-2 w-full max-w-[440px] rounded-[24px] border border-red-100 bg-white p-4 text-left shadow-2xl sm:my-4 sm:rounded-[28px] sm:p-6">' +
        '<button type="button" data-close-payment aria-label="Fechar" class="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-3xl leading-none text-[#7f1d1d] hover:bg-red-100">×</button>' +
        '<div class="rounded-[28px] border border-red-100 bg-red-50/45 p-1.5">' +
          '<div class="rounded-[22px] bg-emerald-600 px-4 py-4 text-center text-[17px] font-black text-white shadow-sm">❖ PIX Instantâneo</div>' +
        '</div>' +
        '<div class="mt-5 rounded-[28px] border-2 border-red-100 bg-white p-5 shadow-[0_16px_45px_-28px_rgba(45,20,77,0.55)]">' +
          '<div class="flex items-start gap-4">' +
            '<span class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-2xl shadow-md ring-1 ring-red-100">🕯️</span>' +
            '<div class="min-w-0">' +
              '<p class="text-[10.5px] font-black uppercase tracking-[0.16em] text-emerald-700">Serviço adquirido</p>' +
              '<h3 class="mt-1 text-[20px] font-black uppercase leading-tight text-[#7f1d1d]">' + escapeHtml(info.title) + '</h3>' +
              '<p class="mt-3 text-[15px] leading-relaxed text-[#9a5a5a]">' + escapeHtml(info.description) + ' Esta liberação de <strong class="font-black text-[#7f1d1d]">' + formatMoney(selectedAmount) + '</strong> ativa seu atendimento amoroso com a taróloga Milena.</p>' +
              '<div class="mt-4 rounded-[24px] bg-emerald-50 p-4 text-[15px] font-black leading-relaxed text-emerald-900">✦ Sua sessão será liberada no chat automaticamente assim que o pagamento for confirmado.</div>' +
              '<div class="mt-3 rounded-[24px] bg-emerald-50 p-4 text-[15px] font-black leading-relaxed text-[#2a0b0b]">↩ Após pagar no app do seu banco, retorne para esta página. A confirmação envia você para o chat para começar a sessão; dentro do chat, se precisar, poderá escolher outro dia e horário com a taróloga.</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div id="tdl-result-modal-form" class="mt-5 space-y-3">' +
          '<label class="block text-[12px] font-black text-[#7f1d1d]">Nome completo do titular:<input id="tdl-result-payer-name" class="mt-2 h-14 w-full rounded-2xl border-2 border-red-200 px-4 text-base outline-none focus:border-emerald-500" value="' + escapeHtml(state.nome || "") + '" placeholder="Seu nome"></label>' +
          '<label class="block text-[12px] font-black text-[#7f1d1d]">Seu WhatsApp (com DDD):<input id="tdl-result-payer-phone" inputmode="tel" class="mt-2 h-14 w-full rounded-2xl border-2 border-red-200 px-4 text-base outline-none focus:border-emerald-500" value="' + escapeHtml(state.phone || state.telefone || "") + '" placeholder="(11) 99999-9999"></label>' +
          '<p id="tdl-result-modal-error" class="hidden rounded-xl border border-red-200 bg-red-50 p-2 text-[11px] font-bold text-red-700"></p>' +
        '</div>' +
        '<div id="tdl-result-modal-pix" class="mt-4 hidden rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-center"></div>' +
        '<button type="button" id="tdl-result-confirm-pix" class="utmify-initiate-checkout mt-4 w-full rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-5 py-4 text-sm font-black uppercase tracking-wide text-white shadow-xl shadow-emerald-600/25">❖ Confirmar PIX de ' + formatMoney(selectedAmount) + '</button>' +
        '<p class="mt-3 text-center text-[11px] text-[#9a5a5a]">🛡 Ambiente protegido com criptografia de ponta a ponta (SSL 256-bit)</p>' +
      '</div>';

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";
    overlay.querySelectorAll("[data-close-payment]").forEach(function (item) {
      item.addEventListener("click", closePaymentModal);
    });
    overlay.querySelector("#tdl-result-confirm-pix").addEventListener("click", createResultPix);
    overlay.querySelector("#tdl-result-payer-phone").addEventListener("input", function () {
      var value = digits(this.value).slice(0, 11);
      if (value.length > 6) this.value = "(" + value.slice(0, 2) + ") " + value.slice(2, value.length - 4) + "-" + value.slice(-4);
      else if (value.length > 2) this.value = "(" + value.slice(0, 2) + ") " + value.slice(2);
      else this.value = value;
    });
  }

  function showModalError(message) {
    var box = document.getElementById("tdl-result-modal-error");
    if (!box) return;
    box.textContent = message;
    box.classList.remove("hidden");
  }

  function hideModalError() {
    var box = document.getElementById("tdl-result-modal-error");
    if (box) box.classList.add("hidden");
  }

  function renderPixResult(pix) {
    var old = document.getElementById("tdl-result-pix-box");
    if (old) old.remove();

    var box = document.getElementById("tdl-result-modal-pix") || document.createElement("div");
    box.id = "tdl-result-pix-box";
    box.className = "mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-center";
    box.classList.remove("hidden");
    box.innerHTML =
      '<div class="mx-auto inline-block rounded-2xl border-2 border-emerald-400 bg-white p-3 shadow-md"><img src="' + qrUrl(pix.pix_payload) + '" alt="QR Code PIX" width="220" height="220"></div>' +
      '<button type="button" id="tdl-result-copy-pix" class="mt-3 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg">Copiar Código PIX Copia e Cola</button>' +
      '<textarea id="tdl-result-pix-code" readonly class="mt-2 h-20 w-full rounded-xl border border-emerald-200 bg-white p-2 text-[10px] text-stone-600">' + escapeHtml(pix.pix_payload) + '</textarea>' +
      '<p id="tdl-result-payment-status" class="mt-2 rounded-xl border border-blue-200 bg-blue-50 p-2 text-[11px] font-bold text-blue-800">PIX gerado. Após pagar no app do banco, volte para esta página. A confirmação envia você automaticamente para o chat da sua sessão.</p>';

    if (!box.parentElement) {
      document.getElementById("tdl-result-payment-modal").querySelector(".relative.z-10").appendChild(box);
    }

    document.getElementById("tdl-result-copy-pix").addEventListener("click", function () {
      var code = document.getElementById("tdl-result-pix-code");
      code.select();
      document.execCommand("copy");
      this.textContent = "Código PIX Copiado";
    });
    box.scrollIntoView({behavior: "smooth", block: "center"});
  }

  function watchPayment(pix) {
    if (statusTimer) clearInterval(statusTimer);
    statusTimer = setInterval(function () {
      fetch("check-purchase.php?external_id=" + encodeURIComponent(pix.external_id) + "&transaction_id=" + encodeURIComponent(pix.transaction_id))
        .then(function (response) { return response.json(); })
        .then(function (status) {
          var box = document.getElementById("tdl-result-payment-status");
          if (!box) return;
          if (status.paid) {
            clearInterval(statusTimer);
            statusTimer = null;
            box.className = "mt-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-[11px] font-bold text-emerald-800";
            box.textContent = "Pagamento confirmado. Encaminhando para o atendimento...";
            setTimeout(function () {
              go("obrigado.html?pedido=" + encodeURIComponent(pix.external_id));
            }, 1500);
          } else {
            box.textContent = "Aguardando confirmação do PIX... status atual: " + paymentStatusLabel(status.status);
          }
        })
        .catch(function () {});
    }, 3500);
  }

  function createResultPix(event) {
    var target = event.target.closest("button");
    event.preventDefault();
    event.stopPropagation();

    var state = readState();
    var nameInput = document.getElementById("tdl-result-payer-name");
    var phoneInput = document.getElementById("tdl-result-payer-phone");
    var name = ((nameInput && nameInput.value) || state.nome || "Cliente Templo da Luz Amorosa").trim();
    var phone = digits((phoneInput && phoneInput.value) || state.phone || state.telefone || "");
    if (phone.length > 0 && phone.length < 10) {
      showModalError("Se quiser informar WhatsApp, coloque com DDD. Se não tiver, deixe em branco.");
      return;
    }
    hideModalError();
    target.disabled = true;
    target.textContent = "Gerando PIX seguro...";
    var info = packageInfo(selectedAmount);
    try {
      state.pacote = { amount: selectedAmount, title: info.title, description: info.description };
      localStorage.setItem("templodeluz_quiz_state", JSON.stringify(state));
      localStorage.setItem("templo_luz_pacote_pago", JSON.stringify(state.pacote));
    } catch (error) {}
    trackCheckoutEvent(selectedAmount, info.tracking);

    fetch("create-pix.php", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        amount: selectedAmount,
        name: name,
        phone: phone,
        ente: state.ente || "",
        letter: info.title + " - " + info.description,
        tracking: readTracking()
      })
    })
      .then(function (response) { return response.json().then(function (body) { return {ok: response.ok, body: body}; }); })
      .then(function (result) {
        if (!result.ok || !result.body.ok) throw new Error(result.body.error || "Não foi possível gerar o PIX.");
        renderPixResult(result.body);
        watchPayment(result.body);
      })
      .catch(function (error) {
        showModalError(error.message || "Não foi possível gerar o PIX agora.");
      })
      .finally(function () {
        target.disabled = false;
        target.textContent = "❖ Confirmar PIX de " + formatMoney(selectedAmount);
      });
  }

  document.addEventListener("click", function (event) {
    var target = event.target.closest("button, a, [role='button']");
    if (!target) return;

    if (hasText(target, "Gerar Chave PIX")) {
      event.preventDefault();
      event.stopPropagation();
      renderPaymentModal();
      return;
    }

    var resultOption = target.closest("[data-tdl-result-amount]");
    if (resultOption) {
      event.preventDefault();
      event.stopPropagation();
      selectedAmount = Number(resultOption.getAttribute("data-tdl-result-amount")) || 35;
      var section = findPixSection();
      var grid = findResultOptionsGrid(section);
      Array.prototype.slice.call((grid || document).querySelectorAll("[data-tdl-result-amount]")).forEach(function (button) {
        setSelected(button, button === resultOption);
      });
      if (section) updateSummary(section);
      return;
    }

    if (hasText(target, "Consagrar Vela") || hasText(target, "Altar de Tarot (PIX)")) {
      event.preventDefault();
      event.stopPropagation();
      var pixSection = document.getElementById("pix-section") || findPixSection();
      if (pixSection) pixSection.scrollIntoView({behavior: "smooth", block: "start"});
      return;
    }

    if (
      hasText(target, "Falar com a Taróloga no WhatsApp") ||
      hasText(target, "Falar com a Medium no WhatsApp")
    ) {
      event.preventDefault();
      go("chamada-ao-vivo-milena.html?source=skipped&next=contato/&step=result");
      return;
    }

    if (
      hasText(target, "Acessar Mapa Amoroso") ||
      hasText(target, "Desejo registrar minha intenção") ||
      hasText(target, "Desejo preencher a intenção")
    ) {
      event.preventDefault();
      go("escrever-carta.html");
    }
  }, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      hydrateResultSchedule();
      hydrateTestimonials();
      hideCreditCardOptions();
      wireResultPix();
      protectResultPixOptions();
      startHardFixLoop();
      wireFaq();
    });
  } else {
    hydrateResultSchedule();
    hydrateTestimonials();
    hideCreditCardOptions();
    wireResultPix();
    protectResultPixOptions();
    startHardFixLoop();
    wireFaq();
  }
  window.addEventListener("load", hydrateTestimonials);
  window.addEventListener("load", wireResultPix);
  window.addEventListener("load", wireFaq);
  window.addEventListener("pageshow", hydrateResultSchedule);
  window.addEventListener("pageshow", hydrateTestimonials);
  window.addEventListener("pageshow", wireResultPix);
  window.addEventListener("pageshow", startHardFixLoop);
  window.addEventListener("pageshow", wireFaq);
  setTimeout(hydrateTestimonials, 800);
  setTimeout(wireResultPix, 800);
  setTimeout(hardFixResultPixOptions, 1600);
  setTimeout(wireFaq, 800);
})();
