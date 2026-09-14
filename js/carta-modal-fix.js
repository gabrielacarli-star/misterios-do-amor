(function () {
  function closeModal(modal) {
    modal.remove();
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }

  function openFallbackModal() {
    if (document.querySelector('[data-carta-modal-fallback="true"]')) return;

    var modal = document.createElement("div");
    modal.setAttribute("data-carta-modal-fallback", "true");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Visualizador da leitura de tarot amoroso");
    modal.className = "fixed inset-0 z-[300] grid h-[100dvh] w-screen grid-rows-[auto_minmax(0,1fr)_auto] gap-2 overflow-hidden bg-[#09090b]/98 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-white backdrop-blur-md sm:gap-3 sm:p-3";
    modal.innerHTML = '<header class="mx-auto flex w-full max-w-[720px] items-center justify-between gap-3 rounded-2xl border border-white/15 bg-black/70 px-3 py-2.5 shadow-xl"><div class="min-w-0 text-left"><h3 class="truncate text-sm font-extrabold text-white sm:text-base">Tarot Amoroso Manuscrita</h3><p class="hidden text-[11px] font-semibold text-amber-300 sm:block">Templo da Luz Amorosa - Taróloga Milena Medeiros</p></div><div class="flex shrink-0 items-center gap-2"><button type="button" data-zoom class="cursor-pointer rounded-xl border border-white/20 bg-white/15 px-3 py-2 text-xs font-extrabold text-white transition-colors hover:bg-white/25">Ampliar</button><button type="button" data-close class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white/15 text-sm font-extrabold text-white transition-colors hover:bg-red-600" aria-label="Fechar visualizador">X</button></div></header><main class="no-scrollbar min-h-0 w-full overflow-auto overscroll-contain rounded-2xl touch-pan-x touch-pan-y"><div data-stage class="flex min-h-full min-w-full items-center justify-center p-1 sm:p-2"><div data-frame class="w-fit max-w-full rounded-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 p-1 shadow-2xl"><img data-image src="images/exemplo-carta-BoafNKmS.jpeg" alt="Carta revelada no tarot escrita à mão por Milena Medeiros" draggable="false" decoding="async" class="block h-auto w-auto max-h-[calc(100dvh-10.5rem)] max-w-[calc(100vw-1.5rem)] cursor-zoom-in rounded-xl object-contain"></div></div></main><footer class="mx-auto w-full max-w-[720px] rounded-2xl border border-white/15 bg-black/75 px-2.5 py-2 text-center shadow-xl sm:px-4 sm:py-2.5"><p class="hidden text-[11px] italic leading-tight text-amber-200 sm:block sm:text-xs">A leitura mostra sinais do campo amoroso para você decidir com mais clareza.</p><div class="sm:mt-2"><button type="button" data-close class="w-full cursor-pointer rounded-xl bg-white/20 px-5 py-2.5 text-xs font-bold uppercase text-white transition-colors hover:bg-white/30 sm:w-auto">Voltar ao quiz</button></div></footer>';

    document.body.appendChild(modal);
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    var zoomed = false;
    var zoomButton = modal.querySelector("[data-zoom]");
    var image = modal.querySelector("[data-image]");
    var stage = modal.querySelector("[data-stage]");
    var frame = modal.querySelector("[data-frame]");

    function toggleZoom() {
      zoomed = !zoomed;
      zoomButton.textContent = zoomed ? "Ajustar" : "Ampliar";
      stage.className = zoomed ? "mx-auto w-max min-w-full px-2 py-1 sm:px-3" : "flex min-h-full min-w-full items-center justify-center p-1 sm:p-2";
      frame.className = zoomed ? "mx-auto w-[155vw] max-w-[980px] rounded-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 p-1 shadow-2xl sm:w-[96vw] lg:w-[980px]" : "w-fit max-w-full rounded-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 p-1 shadow-2xl";
      image.className = zoomed ? "block h-auto w-full cursor-zoom-out rounded-xl" : "block h-auto w-auto max-h-[calc(100dvh-10.5rem)] max-w-[calc(100vw-1.5rem)] cursor-zoom-in rounded-xl object-contain";
    }

    zoomButton.addEventListener("click", toggleZoom);
    image.addEventListener("click", toggleZoom);
    modal.querySelectorAll("[data-close]").forEach(function (button) {
      button.addEventListener("click", function () {
        closeModal(modal);
      });
    });
    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeModal(modal);
    });
    document.addEventListener("keydown", function onKeydown(event) {
      if (event.key === "Escape" && modal.isConnected) {
        closeModal(modal);
        document.removeEventListener("keydown", onKeydown);
      }
    });
  }

  document.addEventListener("click", function (event) {
    var trigger = event.target.closest('[aria-label="Toque para ampliar exemplo de leitura de tarot amoroso"]');
    if (!trigger) return;
    setTimeout(function () {
      if (!document.querySelector('[role="dialog"][aria-label="Visualizador da leitura de tarot amoroso"]')) {
        openFallbackModal();
      }
    }, 150);
  });
})();
