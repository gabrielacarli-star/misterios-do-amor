(function () {
  var selectedAmount = 35;

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
    if (window.TemploTracking && window.TemploTracking.read) return window.TemploTracking.read();
    return {};
  }

  function packageTitle(amount) {
    if (amount >= 59.99) return "Pacote Sagrado VIP - Tudo incluso + Atendimento Prioritário";
    if (amount >= 54.99) return "Leitura Completa - Amarração + Mão + Terceira Pessoa";
    if (amount >= 44.99) return "Amarração Amorosa com Leitura da Mão";
    if (amount >= 34.99) return "Amarração Amorosa - 5 perguntas e aproximação (Mais Escolhida)";
    if (amount >= 24.99) return "Leitura Amorosa com Oráculo de 30 dias";
    if (amount >= 14.99) return "Leitura Amorosa Essencial - 3 perguntas";
    return "Contribuição Simbólica Amorosa";
  }

  function track(amount) {
    var product = packageTitle(amount);
    if (window.TemploTracking && window.TemploTracking.trackInitiateCheckout) {
      window.TemploTracking.trackInitiateCheckout(amount, product);
      return;
    }
    try {
      window.dispatchEvent(new CustomEvent("utmify:checkout", {
        detail: {currency: "BRL", value: amount, product: product}
      }));
    } catch (error) {}
  }

  function closeModal() {
    var modal = document.getElementById("tdl-home-payment");
    if (modal) modal.remove();
  }

  function openModal(amount) {
    selectedAmount = amount;
    closeModal();
    var state = readState();
    var modal = document.createElement("div");
    modal.id = "tdl-home-payment";
    modal.className = "fixed inset-0 z-[260] flex items-end justify-center bg-black/80 backdrop-blur-md sm:items-center sm:p-4";
    modal.innerHTML =
      '<div class="fixed inset-0" data-close-home-payment></div>' +
      '<div class="relative z-10 max-h-[96dvh] w-full overflow-y-auto rounded-t-[30px] border border-red-100 bg-white p-5 text-center shadow-2xl sm:max-w-[470px] sm:rounded-[30px]">' +
        '<button type="button" data-close-home-payment aria-label="Fechar" class="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-2xl leading-none text-[#7f1d1d]">×</button>' +
        '<span class="inline-flex rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#92400e]">Contribuição selecionada</span>' +
        '<h2 class="mt-3 font-display text-2xl font-black text-[#2b0f0f]">' + packageTitle(selectedAmount) + '</h2>' +
        '<strong class="mt-2 block text-4xl font-black text-emerald-700">' + formatMoney(selectedAmount) + '</strong>' +
        '<div class="mt-4 space-y-2 text-left">' +
          '<label class="block text-[11px] font-bold uppercase tracking-wider text-[#7f1d1d]">Seu nome<input id="tdl-home-name" class="mt-1 h-12 w-full rounded-2xl border border-red-200 px-4 text-sm outline-none focus:border-emerald-500" value="' + escapeHtml(state.nome || "") + '" placeholder="Seu nome"></label>' +
          '<label class="block text-[11px] font-bold uppercase tracking-wider text-[#7f1d1d]">WhatsApp com DDD<input id="tdl-home-phone" inputmode="tel" class="mt-1 h-12 w-full rounded-2xl border border-red-200 px-4 text-sm outline-none focus:border-emerald-500" placeholder="(11) 99999-9999"></label>' +
          '<p id="tdl-home-error" class="hidden rounded-xl border border-red-200 bg-red-50 p-2 text-[11px] font-bold text-red-700"></p>' +
        '</div>' +
        '<div id="tdl-home-pix" class="mt-4 hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-3"></div>' +
        '<button type="button" id="tdl-home-create-pix" class="mt-4 w-full rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black uppercase text-white shadow-lg">Gerar PIX agora</button>' +
      '</div>';
    document.body.appendChild(modal);
    modal.querySelectorAll("[data-close-home-payment]").forEach(function (button) {
      button.addEventListener("click", closeModal);
    });
    modal.querySelector("#tdl-home-create-pix").addEventListener("click", createPix);
  }

  function showError(message) {
    var error = document.getElementById("tdl-home-error");
    if (!error) return;
    error.textContent = message;
    error.classList.remove("hidden");
  }

  function createPix() {
    var state = readState();
    var button = document.getElementById("tdl-home-create-pix");
    var name = (document.getElementById("tdl-home-name").value || state.nome || "").trim();
    var phone = digits(document.getElementById("tdl-home-phone").value);
    if (phone.length > 0 && phone.length < 10) {
      showError("Se informar WhatsApp, coloque com DDD.");
      return;
    }
    button.disabled = true;
    button.textContent = "Gerando PIX...";
    track(selectedAmount);
    fetch("create-pix.php", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        amount: selectedAmount,
        name: name,
        phone: phone,
        ente: state.ente || "",
        letter: "Contribuição feita pela home da Leitura Amorosa.",
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
        button.textContent = "Gerar PIX agora";
      });
  }

  function renderPix(pix) {
    var box = document.getElementById("tdl-home-pix");
    box.classList.remove("hidden");
    box.innerHTML =
      '<img class="mx-auto rounded-2xl border-2 border-emerald-400 bg-white p-2" src="' + qrUrl(pix.pix_payload) + '" alt="QR Code PIX" width="220" height="220">' +
      '<button type="button" id="tdl-home-copy-pix" class="mt-3 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-black uppercase text-white">Copiar Código PIX</button>' +
      '<textarea id="tdl-home-pix-code" readonly class="mt-2 h-20 w-full rounded-xl border border-emerald-200 bg-white p-2 text-[10px] text-stone-600">' + escapeHtml(pix.pix_payload) + '</textarea>' +
      '<p id="tdl-home-status" class="mt-2 rounded-xl border border-blue-200 bg-blue-50 p-2 text-[11px] font-bold text-blue-800">PIX gerado. Após pagar no app do banco, volte para esta página. A confirmação envia você automaticamente para o chat da sua sessão.</p>';
    document.getElementById("tdl-home-copy-pix").addEventListener("click", function () {
      var code = document.getElementById("tdl-home-pix-code");
      code.select();
      document.execCommand("copy");
      this.textContent = "Código PIX copiado";
    });
  }

  function watchPayment(pix) {
    var timer = setInterval(function () {
      fetch("check-purchase.php?external_id=" + encodeURIComponent(pix.external_id) + "&transaction_id=" + encodeURIComponent(pix.transaction_id))
        .then(function (response) { return response.json(); })
        .then(function (status) {
          var box = document.getElementById("tdl-home-status");
          if (!box) return;
          if (status.paid) {
            clearInterval(timer);
            box.className = "mt-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-[11px] font-bold text-emerald-800";
            box.textContent = "Pagamento confirmado. Abrindo seu atendimento...";
            setTimeout(function () {
              window.location.href = "obrigado.html?pedido=" + encodeURIComponent(pix.external_id);
            }, 1200);
          } else {
            box.textContent = "Aguardando confirmação do PIX...";
          }
        })
        .catch(function () {});
    }, 3500);
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-home-contribution]");
    if (!button) return;
    event.preventDefault();
    openModal(Number(button.getAttribute("data-home-contribution")) || 20);
  }, true);
})();
