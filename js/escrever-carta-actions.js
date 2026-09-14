(function () {
  var THANK_YOU_URL = "obrigado.html";
  var state = readState();
  var selectedAmount = 35;
  var mode = "temas";
  var currentPix = null;
  var statusTimer = null;

  function readState() {
    try {
      return JSON.parse(localStorage.getItem("templodeluz_quiz_state") || "{}");
    } catch (error) {
      return {};
    }
  }

  function firstName(value, fallback) {
    var name = (value || "").trim();
    return name ? name.split(/\s+/)[0] : fallback;
  }

  function textIncludes(element, text) {
    return (element.textContent || "").toLowerCase().indexOf(text.toLowerCase()) !== -1;
  }

  function formatMoney(value) {
    return "R$ " + value.toFixed(2).replace(".", ",");
  }

  function packageInfo(amount) {
    amount = Number(amount);
    if (amount >= 59.99) {
      return {
        title: "Pacote Sagrado Templo VIP",
        short: "Tudo incluso + Prioridade",
        description: "Inclui tudo com prioridade sagrada: 5 respostas, leitura de cartas, oráculo do futuro, amarração amorosa de 3 a 7 dias, leitura da mão e acompanhamento direto no chat com a taróloga Milena.",
        tracking: "Leitura Amorosa - Pacote VIP - R$60"
      };
    }
    if (amount >= 54.99) {
      return {
        title: "Leitura Completa com Terceira Pessoa",
        short: "Mão + 3ª Pessoa",
        description: "Inclui amarração amorosa, leitura da palma da mão, investigação profunda sobre terceira pessoa/amante e revelação de sentimentos ocultos.",
        tracking: "Leitura Amorosa - Terceira Pessoa - R$55"
      };
    }
    if (amount >= 44.99) {
      return {
        title: "Amarração Amorosa com Leitura de Mão",
        short: "Amarração + Mão",
        description: "Inclui 5 respostas, abertura da amarração amorosa de 3 a 7 dias e leitura da mão para ver linhas de destino e aproximação afetiva.",
        tracking: "Leitura Amorosa - Amarracao e Mao - R$45"
      };
    }
    if (amount >= 34.99) {
      return {
        title: "Amarração Amorosa com 5 Respostas",
        short: "Amarração + 5 resps (Mais Escolhida)",
        description: "A opção mais indicada e viável do Templo: inclui 5 respostas diretas e o ritual de amarração amorosa de 3 a 7 dias para desbloquear caminhos e aproximar quem você ama.",
        tracking: "Leitura Amorosa - Amarracao Indicada - R$35"
      };
    }
    if (amount >= 24.99) {
      return {
        title: "Leitura Amorosa com Oráculo",
        short: "5 respostas + oráculo",
        description: "Inclui 5 respostas no chat, leitura de cartas e 30 dias de oráculo do futuro para acompanhar sentimentos, bloqueios e próximos movimentos.",
        tracking: "Leitura Amorosa - 5 Respostas Oraculo - R$25"
      };
    }
    return {
      title: "Leitura Amorosa Essencial",
      short: "3 respostas e carta",
      description: "Entrada solidária no Templo: inclui 3 respostas objetivas e leitura de carta amorosa para revelar o ponto principal entre vocês agora.",
      tracking: "Leitura Amorosa - 3 Respostas Carta - R$15"
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

  function digits(value) {
    return (value || "").replace(/\D/g, "");
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"}[char];
    });
  }

  function qrUrl(payload) {
    return "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" + encodeURIComponent(payload);
  }

  function readTracking() {
    if (window.TemploTracking && window.TemploTracking.read) {
      return window.TemploTracking.read();
    }
    return {};
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

  function setAmountButtonSelected(button, active) {
    button.className = "tdl-amount rounded-xl border p-2.5 text-center " + (
      active
        ? "border-[#7f1d1d] bg-[#7f1d1d] text-white shadow-md"
        : "border-stone-200 bg-white text-stone-900"
    );
  }

  function letterText() {
    var ente = firstName(state.ente, "minha pessoa amada");
    if (mode === "livre") {
      var free = document.getElementById("tdl-letter-free");
      if (free && free.value.trim()) return free.value.trim();
    }
    var selected = Array.prototype.slice.call(document.querySelectorAll("[data-letter-theme].is-selected"));
    if (!selected.length) {
      return "Quero que a taróloga Milena abra as cartas sobre " + ente + " e revele sentimentos, bloqueios, terceira pessoa e o melhor caminho amoroso para mim.";
    }
    return selected.map(function (button) {
      return button.getAttribute("data-snippet");
    }).join("\n\n");
  }

  function thankYouUrl(extra) {
    var params = new URLSearchParams();
    if (extra) params.set("pedido", extra);
    return THANK_YOU_URL + (params.toString() ? "?" + params.toString() : "");
  }

  function openEditor(startMode) {
    mode = startMode || "temas";
    renderEditor();
  }

  function closeOverlay() {
    var overlay = document.getElementById("tdl-overlay");
    if (overlay) overlay.remove();
    document.body.style.overflow = "";
    if (statusTimer) clearInterval(statusTimer);
    statusTimer = null;
  }

  function shell(content) {
    closeOverlay();
    document.body.style.overflow = "hidden";
    var overlay = document.createElement("div");
    overlay.id = "tdl-overlay";
    overlay.className = "fixed inset-0 z-[260] flex items-end justify-center bg-black/85 backdrop-blur-md sm:items-center sm:p-4";
    overlay.innerHTML = '<div class="fixed inset-0" data-close-overlay></div><div class="relative z-10 max-h-[96dvh] w-full overflow-y-auto rounded-t-[32px] border border-amber-200/60 bg-white p-4 sm:max-w-[560px] sm:rounded-[32px] sm:p-6 shadow-2xl">' +
      '<button type="button" data-close-overlay aria-label="Fechar" class="absolute right-4 top-4 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-stone-100 text-sm font-bold text-stone-600 hover:bg-stone-200">×</button>' +
      content +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelectorAll("[data-close-overlay]").forEach(function (item) {
      item.addEventListener("click", closeOverlay);
    });
  }

  function renderEditor() {
    var nome = state.nome || "";
    var ente = state.ente || "";
    var today = new Date().toLocaleDateString("pt-BR");
    shell(
      '<div class="pt-1 text-center">' +
        '<span class="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3.5 py-1 text-[10.5px] font-black uppercase tracking-wider text-red-950">🕊️ Altar de Tarot do Mapa Amoroso Sagrado</span>' +
        '<h2 class="mt-3 font-display text-2xl font-black text-[#2b0f0f]">Oriente Sua Leitura de Tarot Amoroso</h2>' +
        '<p class="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-stone-600">Escolha o foco da consulta ou escreva com suas palavras o que você quer que a taróloga Milena veja nas cartas.</p>' +
      '</div>' +
      '<div class="mt-4 grid grid-cols-2 gap-1.5 rounded-2xl bg-stone-100 p-1">' +
        '<button type="button" data-mode="temas" class="tdl-mode rounded-xl px-3 py-2 text-xs font-black">🔮 1. Escolher Focos</button>' +
        '<button type="button" data-mode="livre" class="tdl-mode rounded-xl px-3 py-2 text-xs font-black">✍️ 2. Explicar Livre</button>' +
      '</div>' +
      '<div class="mt-4 grid grid-cols-2 gap-2.5">' +
        '<label class="text-[10.5px] font-bold uppercase tracking-wider text-stone-600">Seu Nome<input id="tdl-user-name" class="mt-1 h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-xs font-medium outline-none focus:border-[#7f1d1d]" value="' + nome.replace(/"/g, "&quot;") + '" placeholder="Seu nome"></label>' +
        '<label class="text-[10.5px] font-bold uppercase tracking-wider text-stone-600">Pessoa consultada<input id="tdl-loved-name" class="mt-1 h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-xs font-medium outline-none focus:border-[#7f1d1d]" value="' + ente.replace(/"/g, "&quot;") + '" placeholder="Nome dele(a)"></label>' +
      '</div>' +
      '<div id="tdl-theme-box" class="mt-5 space-y-2.5">' +
        theme("terceira", "👁️", "Terceira Pessoa ou Amante", "Descobrir se existe outra pessoa, influência externa ou energia atrapalhando vocês.", "Quero que as cartas revelem se existe terceira pessoa, amante ou influência externa interferindo entre nós.") +
        theme("sentimento", "❤️", "Sentimentos Ocultos", "Entender se ainda existe amor, desejo, saudade ou frieza verdadeira.", "Quero saber o que essa pessoa ainda sente por mim e o que ela não consegue demonstrar.") +
        theme("volta", "🔁", "Volta e Amarração do Amor", "Ver se vocês podem voltar e qual caminho espiritual abre aproximação.", "Quero saber se existe caminho para voltarmos e se a amarração amorosa pode abrir aproximação entre nós.") +
      '</div>' +
      '<div id="tdl-free-box" class="mt-5 hidden"><textarea id="tdl-letter-free" rows="7" class="min-h-[150px] w-full rounded-2xl border border-stone-200 bg-stone-50 p-3.5 text-xs leading-relaxed outline-none focus:border-[#7f1d1d]" placeholder="Conte o que está acontecendo entre vocês e o que você mais precisa descobrir nas cartas..."></textarea></div>' +
      '<div class="mt-5 rounded-3xl border border-[#d4af37]/40 bg-[#fffaf0] p-5 shadow-sm">' +
        '<div class="border-b border-[#c5a059]/30 pb-3 text-left"><strong class="font-display text-sm uppercase text-[#2e1a54]">🕊️ Templo da Luz Amorosa</strong><span class="float-right text-[11px] font-semibold text-[#4a3b1d]">' + today + '</span></div>' +
        '<p class="mt-4 font-handwriting text-xl font-bold text-[#18233c]">Consulta amorosa sobre <span id="tdl-preview-ente">' + (ente || "Pessoa Amada") + '</span>,</p>' +
        '<div id="tdl-preview-text" class="mt-4 min-h-[170px] whitespace-pre-wrap font-handwriting text-[19px] leading-[1.65] text-[#1b2744]"></div>' +
        '<div class="mt-5 border-t border-[#c5a059]/30 pt-4 text-left"><p class="font-handwriting text-lg text-[#18233c]">Minha intenção para esta leitura,</p><p id="tdl-preview-name" class="font-handwriting text-2xl font-bold text-[#2e1a54]">' + (nome || "Seu Nome") + '</p><p class="mt-2 text-right text-xs font-bold italic text-[#2e1a54]">Taróloga Milena Medeiros</p></div>' +
      '</div>' +
      '<div class="mt-4 space-y-2">' +
        '<button type="button" id="tdl-send-letter" class="w-full rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black uppercase tracking-wider text-white shadow-lg">Enviar Intenção para a Taróloga</button>' +
        '<div class="grid grid-cols-2 gap-2"><button type="button" id="tdl-copy-letter" class="rounded-xl border border-stone-200 bg-white py-2.5 text-xs font-semibold text-stone-700">Copiar Intenção</button><button type="button" id="tdl-print-letter" class="rounded-xl border border-stone-200 bg-white py-2.5 text-xs font-semibold text-stone-700">Salvar / Imprimir</button></div>' +
      '</div>'
    );
    wireEditor();
  }

  function theme(id, icon, title, desc, snippet) {
    return '<button type="button" data-letter-theme="' + id + '" data-snippet="' + snippet.replace(/"/g, "&quot;") + '" class="tdl-theme w-full rounded-2xl border border-stone-200 bg-stone-50 p-3.5 text-left text-stone-700">' +
      '<span class="mr-2 text-xl">' + icon + '</span><strong class="text-xs text-stone-900">' + title + '</strong><p class="ml-8 mt-1 text-[11px] leading-relaxed text-stone-500">' + desc + '</p></button>';
  }

  function wireEditor() {
    var nameInput = document.getElementById("tdl-user-name");
    var enteInput = document.getElementById("tdl-loved-name");
    var freeInput = document.getElementById("tdl-letter-free");
    var themeBox = document.getElementById("tdl-theme-box");
    var freeBox = document.getElementById("tdl-free-box");

    function sync() {
      state.nome = nameInput.value.trim();
      state.ente = enteInput.value.trim();
      localStorage.setItem("templodeluz_quiz_state", JSON.stringify(state));
      themeBox.classList.toggle("hidden", mode !== "temas");
      freeBox.classList.toggle("hidden", mode !== "livre");
      document.getElementById("tdl-preview-name").textContent = state.nome || "Seu Nome";
      document.getElementById("tdl-preview-ente").textContent = state.ente || "Pessoa Amada";
      document.getElementById("tdl-preview-text").textContent = letterText();
      document.querySelectorAll(".tdl-mode").forEach(function (button) {
        button.className = "tdl-mode rounded-xl px-3 py-2 text-xs font-black " + (button.getAttribute("data-mode") === mode ? "bg-white text-[#7f1d1d] shadow-sm" : "text-stone-500");
      });
    }

    document.querySelectorAll(".tdl-mode").forEach(function (button) {
      button.addEventListener("click", function () {
        mode = button.getAttribute("data-mode");
        themeBox.classList.toggle("hidden", mode !== "temas");
        freeBox.classList.toggle("hidden", mode !== "livre");
        sync();
      });
    });

    document.querySelectorAll(".tdl-theme").forEach(function (button) {
      button.addEventListener("click", function () {
        button.classList.toggle("is-selected");
        button.classList.toggle("border-amber-300");
        button.classList.toggle("bg-amber-50");
        sync();
      });
    });

    [nameInput, enteInput, freeInput].forEach(function (input) {
      if (input) input.addEventListener("input", sync);
    });

    document.getElementById("tdl-send-letter").addEventListener("click", renderContribution);
    document.getElementById("tdl-copy-letter").addEventListener("click", function () {
      navigator.clipboard && navigator.clipboard.writeText(letterText());
      this.textContent = "Copiado com Sucesso!";
    });
    document.getElementById("tdl-print-letter").addEventListener("click", function () {
      window.print();
    });
    sync();
  }

  function renderContribution() {
    shell(
      '<div class="pt-1 text-center">' +
        '<span class="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3.5 py-1 text-[10.5px] font-black uppercase tracking-wider text-red-950">🔮 Liberação da Consulta Amorosa</span>' +
        '<div class="mx-auto mt-4 w-full max-w-[370px] overflow-hidden rounded-3xl border-2 border-amber-300 bg-stone-50 p-1.5 shadow-md"><img src="assets/milena-oratorio-CEt81hb9.jpeg" alt="Taróloga Milena Medeiros no altar de tarot" class="aspect-square w-full rounded-[20px] object-cover object-center"></div>' +
        '<h2 class="mt-3.5 font-display text-2xl font-black leading-snug text-stone-900">Libere sua sessão de tarot amoroso</h2>' +
        '<p class="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-stone-600">A sua intenção já foi preparada. Agora você pode liberar a sessão para Milena abrir as cartas sobre sentimentos, terceira pessoa, volta ou amarração amorosa.</p>' +
      '</div>' +
      '<div id="tdl-selected-package" class="mt-3.5 rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 via-white to-amber-50 p-3.5 text-left shadow-sm">' +
        '<p class="text-[12px] leading-relaxed text-[#78350f]">🕯️ <strong>' + packageInfo(selectedAmount).title + ':</strong> ' + packageInfo(selectedAmount).description + '</p>' +
        '<div class="mt-2.5 border-t border-amber-200 pt-2"><div class="mb-1 flex justify-between text-[11px] font-bold text-amber-950"><span>Atendimentos amorosos preparados hoje</span><span class="text-emerald-700">R$ 3.532,70 (41,6%)</span></div><div class="h-2.5 rounded-full bg-amber-100 p-0.5"><div class="h-full w-[41.6%] rounded-full bg-gradient-to-r from-amber-500 to-emerald-600"></div></div><div class="mt-1 flex justify-between text-[9.5px] font-semibold text-stone-500"><span>Última liberação: há 9 min</span><span>Horários limitados para hoje</span></div></div>' +
      '</div>' +
      '<div class="mt-4"><div class="mb-2 flex items-center justify-between"><span class="text-xs font-black text-stone-900">Escolha sua liberação da leitura:</span><span class="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">A partir de R$ 15,00</span></div>' +
        '<div class="grid grid-cols-3 gap-2">' +
          amountButton(15) + amountButton(25) + amountButton(35, true) + amountButton(45) + amountButton(55) + amountButton(60) +
        '</div></div>' +
      '<div class="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-xs font-extrabold text-emerald-800">PIX Instantâneo Seguro</div>' +
      '<div id="tdl-pix-form" class="mt-4 space-y-2.5">' +
        '<label class="block text-[10.5px] font-bold uppercase tracking-wider text-stone-600">Seu nome <span class="font-medium normal-case tracking-normal text-stone-400">(opcional)</span><input id="tdl-payer-name" class="mt-1 h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-xs font-medium outline-none focus:border-emerald-600" value="' + escapeHtml(state.nome || "") + '" placeholder="Seu nome"></label>' +
        '<label class="block text-[10.5px] font-bold uppercase tracking-wider text-stone-600">WhatsApp com DDD <span class="font-medium normal-case tracking-normal text-stone-400">(opcional)</span><input id="tdl-payer-phone" inputmode="tel" class="mt-1 h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-xs font-medium outline-none focus:border-emerald-600" placeholder="(11) 99999-9999"></label>' +
        '<p id="tdl-pix-error" class="hidden rounded-xl border border-red-200 bg-red-50 p-2 text-[11px] font-bold text-red-700"></p>' +
      '</div>' +
      '<div id="tdl-pix-result" class="mt-4 hidden rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 text-center"></div>' +
      '<button type="button" id="tdl-checkout" class="utmify-initiate-checkout mt-3 w-full rounded-2xl bg-emerald-600 px-4 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg">Gerar PIX da Leitura de ' + formatMoney(selectedAmount) + ' ›</button>' +
      '<button type="button" id="tdl-skip-donation" class="mt-3 w-full rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-stone-700">Acessar atendimento sem liberar agora →</button>' +
      '<p class="mt-1.5 text-center text-[10.5px] font-medium text-stone-400">🤍 Se não puder liberar agora, sua intenção fica salva para continuar no atendimento.</p>'
    );
    wireContribution();
  }

  function amountButton(value, selected) {
    var info = packageInfo(value);
    return '<button type="button" data-amount="' + value + '" class="tdl-amount rounded-xl border p-2.5 text-center ' + (selected ? "border-[#7f1d1d] bg-[#7f1d1d] text-white shadow-md" : "border-stone-200 bg-white text-stone-900") + '"><span class="block text-base font-black">R$ ' + value + '</span><span class="mt-0.5 block text-[9.5px] font-semibold leading-tight">' + info.short + '</span></button>';
  }

  function updateSelectedPackage() {
    var box = document.getElementById("tdl-selected-package");
    var checkout = document.getElementById("tdl-checkout");
    var info = packageInfo(selectedAmount);
    if (box) {
      var p = box.querySelector("p");
      if (p) p.innerHTML = "🕯️ <strong>" + escapeHtml(info.title) + ":</strong> " + escapeHtml(info.description);
    }
    if (checkout) checkout.textContent = "Gerar PIX da Leitura de " + formatMoney(selectedAmount) + " ›";
  }

  function wireContribution() {
    var checkout = document.getElementById("tdl-checkout");
    document.querySelectorAll("[data-amount]").forEach(function (button) {
      button.addEventListener("click", function () {
        selectedAmount = Number(button.getAttribute("data-amount"));
        document.querySelectorAll("[data-amount]").forEach(function (item) {
          setAmountButtonSelected(item, false);
        });
        setAmountButtonSelected(button, true);
        updateSelectedPackage();
      });
    });
    updateSelectedPackage();
    checkout.addEventListener("click", createPix);
    document.getElementById("tdl-payer-phone").addEventListener("input", function () {
      var value = digits(this.value).slice(0, 11);
      if (value.length > 6) this.value = "(" + value.slice(0, 2) + ") " + value.slice(2, value.length - 4) + "-" + value.slice(-4);
      else if (value.length > 2) this.value = "(" + value.slice(0, 2) + ") " + value.slice(2);
      else this.value = value;
    });
    document.getElementById("tdl-skip-donation").addEventListener("click", function () {
      window.location.href = "contato/";
    });
  }

  function showPixError(message) {
    var box = document.getElementById("tdl-pix-error");
    if (!box) return;
    box.textContent = message;
    box.classList.remove("hidden");
  }

  function hidePixError() {
    var box = document.getElementById("tdl-pix-error");
    if (box) box.classList.add("hidden");
  }

  function setCheckoutLoading(isLoading) {
    var checkout = document.getElementById("tdl-checkout");
    if (!checkout) return;
    checkout.disabled = isLoading;
    checkout.textContent = isLoading ? "Gerando sua chave PIX..." : "Gerar PIX da Leitura de " + formatMoney(selectedAmount) + " ›";
  }

  function createPix() {
    var name = (document.getElementById("tdl-payer-name").value || state.nome || "").trim();
    var phone = digits(document.getElementById("tdl-payer-phone").value);
    if (phone.length > 0 && phone.length < 10) {
      showPixError("Se quiser informar WhatsApp, coloque com DDD. Se não tiver, deixe em branco.");
      return;
    }
    hidePixError();
    setCheckoutLoading(true);
    var info = packageInfo(selectedAmount);
    trackCheckoutEvent(selectedAmount, info.tracking);
    fetch("create-pix.php", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        amount: selectedAmount,
        name: name,
        phone: phone,
        ente: state.ente || "",
        letter: info.title + " - " + info.description + "\n\nIntenção: " + letterText(),
        tracking: readTracking()
      })
    })
      .then(function (response) { return response.json().then(function (body) { return {ok: response.ok, body: body}; }); })
      .then(function (result) {
        if (!result.ok || !result.body.ok) throw new Error(result.body.error || "Não foi possível gerar o PIX.");
        currentPix = result.body;
        renderPixResult(result.body);
        watchPayment(result.body);
      })
      .catch(function (error) {
        showPixError(error.message || "Não foi possível gerar o PIX agora.");
      })
      .finally(function () {
        setCheckoutLoading(false);
      });
  }

  function renderPixResult(pix) {
    var box = document.getElementById("tdl-pix-result");
    if (!box) return;
    box.classList.remove("hidden");
    box.innerHTML =
      '<div class="mx-auto inline-block rounded-2xl border-2 border-emerald-400 bg-white p-3 shadow-md"><img src="' + qrUrl(pix.pix_payload) + '" alt="QR Code PIX" width="220" height="220"></div>' +
      '<button type="button" id="tdl-copy-pix" class="mt-3 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg">Copiar Código PIX Copia e Cola</button>' +
      '<textarea id="tdl-pix-code" readonly class="mt-2 h-20 w-full rounded-xl border border-emerald-200 bg-white p-2 text-[10px] text-stone-600">' + escapeHtml(pix.pix_payload) + '</textarea>' +
      '<p id="tdl-payment-status" class="mt-2 rounded-xl border border-blue-200 bg-blue-50 p-2 text-[11px] font-bold text-blue-800">PIX gerado. Após pagar no banco, mantenha esta tela aberta por alguns segundos.</p>';
    document.getElementById("tdl-copy-pix").addEventListener("click", function () {
      var code = document.getElementById("tdl-pix-code");
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
          var box = document.getElementById("tdl-payment-status");
          if (!box) return;
          if (status.paid) {
            clearInterval(statusTimer);
            statusTimer = null;
            box.className = "mt-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-[11px] font-bold text-emerald-800";
            box.textContent = "Pagamento confirmado. Encaminhando para o atendimento...";
            setTimeout(function () {
              window.location.href = thankYouUrl(pix.external_id);
            }, 1800);
          } else {
            box.textContent = "Aguardando confirmação do PIX... status atual: " + paymentStatusLabel(status.status);
          }
        })
        .catch(function () {});
    }, 3500);
  }

  function handleEntryClick(event) {
    var target = event.target.closest("button, [role='button'], a");
    if (!target) return;
    if (textIncludes(target, "Ver Mapa Amoroso com Temas") || textIncludes(target, "Ver Leitura com Focos")) {
      event.preventDefault();
      openEditor("temas");
    }
    if (textIncludes(target, "Abrir Folha para Escrever") || textIncludes(target, "Abrir Campo para Escrever")) {
      event.preventDefault();
      openEditor("livre");
    }
  }

  document.addEventListener("click", handleEntryClick, true);

  window.addEventListener("load", function () {
    Array.prototype.slice.call(document.querySelectorAll("[role='button']")).forEach(function (card) {
      if (textIncludes(card, "Ver Mapa Amoroso com Temas") || textIncludes(card, "Ver Leitura com Focos")) {
        card.onclick = function (event) {
          event.preventDefault();
          openEditor("temas");
        };
      }
      if (textIncludes(card, "Abrir Folha para Escrever") || textIncludes(card, "Abrir Campo para Escrever")) {
        card.onclick = function (event) {
          event.preventDefault();
          openEditor("livre");
        };
      }
    });
  });
})();


