(function () {
  var selectedAmount = 150;

  function hasText(element, text) {
    return (element.textContent || "").toLowerCase().indexOf(text.toLowerCase()) !== -1;
  }

  function go(url) {
    window.location.href = url;
  }

  function goResult() {
    go("resultado.html");
  }

  function digits(value) {
    return (value || "").replace(/\D/g, "");
  }

  function formatMoney(value) {
    return "R$ " + Number(value).toFixed(2).replace(".", ",");
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

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (char) {
      return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"}[char];
    });
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

  function openPayment() {
    closePayment();
    var state = readState();
    var overlay = document.createElement("div");
    overlay.id = "tdl-chamada-payment";
    overlay.className = "fixed inset-0 z-[260] flex items-end justify-center bg-black/85 backdrop-blur-md sm:items-center sm:p-4";
    overlay.innerHTML =
      '<div class="fixed inset-0" data-close-payment></div>' +
      '<div class="relative z-10 max-h-[96dvh] w-full overflow-y-auto rounded-t-[32px] border border-amber-200/60 bg-white p-4 text-center shadow-2xl sm:max-w-[520px] sm:rounded-[32px] sm:p-6">' +
        '<button type="button" data-close-payment aria-label="Fechar" class="absolute right-4 top-4 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-stone-100 text-sm font-bold text-stone-600 hover:bg-stone-200">×</button>' +
        '<span class="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3.5 py-1 text-[10.5px] font-black uppercase tracking-wider text-red-950">🕯️ Premium completo</span>' +
        '<h2 class="mt-3 font-display text-2xl font-black leading-tight text-[#2b0f0f]">Liberar tudo com Milena</h2>' +
        '<p class="mx-auto mt-1.5 max-w-md text-[13px] leading-relaxed text-stone-600">São 3 sessões por WhatsApp com leitura da mão por videochamada, cartas amorosas, oráculo de 90 dias, amarração de 3 a 7 dias e liberdade para escolher o foco de cada sessão.</p>' +
        '<div class="mt-4 rounded-2xl border border-emerald-300 bg-emerald-50 p-4"><p class="text-xs font-bold uppercase tracking-wider text-emerald-800">Tudo incluso</p><strong class="mt-1 block text-3xl font-black text-[#7f1d1d]">' + formatMoney(selectedAmount) + '</strong><span class="mt-1 block text-[10px] font-black uppercase tracking-wider text-emerald-800">3 sessões completas</span></div>' +
        '<div id="tdl-chamada-form" class="mt-4 space-y-2.5 text-left">' +
          '<label class="block text-[10.5px] font-bold uppercase tracking-wider text-stone-600">Seu nome <span class="font-medium normal-case tracking-normal text-stone-400">(opcional)</span><input id="tdl-chamada-name" class="mt-1 h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-xs font-medium outline-none focus:border-emerald-600" value="' + escapeHtml(state.nome || "") + '" placeholder="Seu nome"></label>' +
          '<label class="block text-[10.5px] font-bold uppercase tracking-wider text-stone-600">WhatsApp com DDD <span class="font-medium normal-case tracking-normal text-stone-400">(opcional)</span><input id="tdl-chamada-phone" inputmode="tel" class="mt-1 h-10 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-xs font-medium outline-none focus:border-emerald-600" placeholder="(11) 99999-9999"></label>' +
          '<p id="tdl-chamada-error" class="hidden rounded-xl border border-red-200 bg-red-50 p-2 text-[11px] font-bold text-red-700"></p>' +
        '</div>' +
        '<div id="tdl-chamada-result" class="mt-4 hidden rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 text-center"></div>' +
        '<button type="button" id="tdl-chamada-pix" class="utmify-initiate-checkout mt-3 w-full rounded-2xl bg-emerald-600 px-4 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg">Ver QR Code PIX</button>' +
        '<button type="button" id="tdl-chamada-skip" class="mt-3 w-full bg-transparent text-[12px] font-bold text-[#9a5a5a] underline decoration-[#f59e0b]/60 underline-offset-4">Agora não, voltar para o resultado ›</button>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelectorAll("[data-close-payment]").forEach(function (item) {
      item.addEventListener("click", closePayment);
    });
    overlay.querySelector("#tdl-chamada-skip").addEventListener("click", function () {
      goResult();
    });
    overlay.querySelector("#tdl-chamada-pix").addEventListener("click", createPix);
  }

  function closePayment() {
    var overlay = document.getElementById("tdl-chamada-payment");
    if (overlay) overlay.remove();
  }

  function showError(message) {
    var box = document.getElementById("tdl-chamada-error");
    if (!box) return;
    box.textContent = message;
    box.classList.remove("hidden");
  }

  function createPix() {
    var state = readState();
    var button = document.getElementById("tdl-chamada-pix");
    var name = (document.getElementById("tdl-chamada-name").value || state.nome || "").trim();
    var phone = digits(document.getElementById("tdl-chamada-phone").value);
    if (phone.length > 0 && phone.length < 10) {
      showError("Se quiser informar WhatsApp, coloque com DDD. Se não tiver, deixe em branco.");
      return;
    }
    button.disabled = true;
    button.textContent = "Gerando PIX...";
    trackCheckoutEvent(selectedAmount, "Leitura Amorosa Premium - 3 sessões com videochamada");
    fetch("create-pix.php", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        amount: selectedAmount,
        name: name,
        phone: phone,
        ente: state.ente || "",
        letter: "Reserva de chamada ao vivo com a taróloga Milena.",
        package_override: {
          title: "Leitura Amorosa Premium - 3 sessões com videochamada",
          description: "Tudo incluso: 3 sessões pelo WhatsApp, leitura da mão por videochamada, 5 perguntas, cartas amorosas, oráculo de 90 dias e amarração de 3 a 7 dias",
          questions: 5,
          oraculo_days: 90,
          has_amarracao: true,
          has_videochamada: true,
          sessions: 3
        },
        tracking: readTracking()
      })
    })
      .then(function (response) { return response.json().then(function (body) { return {ok: response.ok, body: body}; }); })
      .then(function (result) {
        if (!result.ok || !result.body.ok) throw new Error(result.body.error || "Não foi possível gerar o PIX.");
        renderPix(result.body);
        watchPayment(result.body);
      })
      .catch(function (error) {
        showError(error.message || "Não foi possível gerar o PIX agora.");
      })
      .finally(function () {
        button.disabled = false;
        button.textContent = "Ver QR Code PIX";
      });
  }

  function renderPix(pix) {
    var box = document.getElementById("tdl-chamada-result");
    box.classList.remove("hidden");
    box.innerHTML =
      '<div class="mx-auto inline-block rounded-2xl border-2 border-emerald-400 bg-white p-3 shadow-md"><img src="' + qrUrl(pix.pix_payload) + '" alt="QR Code PIX" width="220" height="220"></div>' +
      '<button type="button" id="tdl-copy-chamada-pix" class="mt-3 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg">Copiar Código PIX Copia e Cola</button>' +
      '<textarea id="tdl-chamada-code" readonly class="mt-2 h-20 w-full rounded-xl border border-emerald-200 bg-white p-2 text-[10px] text-stone-600">' + escapeHtml(pix.pix_payload) + '</textarea>' +
      '<p id="tdl-chamada-status" class="mt-2 rounded-xl border border-blue-200 bg-blue-50 p-2 text-[11px] font-bold text-blue-800">PIX gerado. Após pagar no app do banco, volte para esta página. A confirmação abre o chat para iniciar sua sessão premium; dentro do chat, se precisar, você poderá escolher outro dia e horário com a taróloga.</p>';
    document.getElementById("tdl-copy-chamada-pix").addEventListener("click", function () {
      var code = document.getElementById("tdl-chamada-code");
      code.select();
      document.execCommand("copy");
      this.textContent = "Código PIX Copiado";
    });
  }

  function watchPayment(pix) {
    var timer = setInterval(function () {
      fetch("check-purchase.php?external_id=" + encodeURIComponent(pix.external_id) + "&transaction_id=" + encodeURIComponent(pix.transaction_id))
        .then(function (response) { return response.json(); })
        .then(function (status) {
          var box = document.getElementById("tdl-chamada-status");
          if (!box) return;
          if (status.paid) {
            clearInterval(timer);
            box.className = "mt-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-[11px] font-bold text-emerald-800";
            box.textContent = "Pagamento confirmado. Encaminhando para o atendimento...";
            setTimeout(function () { go("obrigado.html?pedido=" + encodeURIComponent(pix.external_id)); }, 1500);
          } else {
            box.textContent = "Aguardando confirmação do PIX... status atual: " + paymentStatusLabel(status.status);
          }
        })
        .catch(function () {});
    }, 3500);
  }

  document.addEventListener("click", function (event) {
    var target = event.target.closest("button, a, [role='button']");
    if (!target) return;

    if (hasText(target, "Agora não") || hasText(target, "continuar com minha carta")) {
      event.preventDefault();
      goResult();
      return;
    }

    if (hasText(target, "Quero reservar minha chamada")) {
      event.preventDefault();
      openPayment();
    }
  }, true);
})();

