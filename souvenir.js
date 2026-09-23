(() => {
  "use strict";
  const scene = document.querySelector("#arScene");
  const button = document.querySelector("#photoButton");
  const status = document.querySelector("#photoStatus");
  const dialog = document.querySelector("#photoDialog");
  const preview = document.querySelector("#photoPreview");
  const download = document.querySelector("#downloadPhoto");
  const share = document.querySelector("#sharePhoto");
  const feedback = document.querySelector("#photoFeedback");
  const title = "Mi visita a colmena del macizo";
  let ready = false, busy = false, photoUrl = null, photoFile = null;

  function releasePhoto() {
    preview.removeAttribute("src");
    download.removeAttribute("href");
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = null;
    photoFile = null;
  }

  // Use the displayed rectangles so camera cropping and AR stay aligned,
  // including after rotating the phone. MindAR uses an unmirrored rear camera.
  function drawLayer(context, source, viewport) {
    const rect = source.getBoundingClientRect();
    context.drawImage(source, rect.left - viewport.left, rect.top - viewport.top, rect.width, rect.height);
  }

  async function capture() {
    if (!ready || busy) return;
    busy = true;
    button.disabled = true;
    status.textContent = "Preparando tu recuerdo…";
    try {
      const video = scene.systems?.["mindar-image-system"]?.video;
      const renderer = scene.renderer;
      const viewport = scene.getBoundingClientRect();
      if (!video || video.readyState < 2 || !video.videoWidth || !renderer || !scene.camera || !viewport.width || !viewport.height) {
        throw new Error("La cámara todavía no está lista. Espera un momento e inténtalo de nuevo.");
      }

      const canvas = document.createElement("canvas");
      const footer = Math.max(76, Math.min(110, viewport.width * 0.22));
      const scale = Math.min(window.devicePixelRatio || 1, 2, 1920 / Math.max(viewport.width, viewport.height + footer));
      canvas.width = Math.round(viewport.width * scale);
      canvas.height = Math.round((viewport.height + footer) * scale);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("No se pudo preparar la foto en este navegador.");
      context.scale(scale, scale);
      context.fillStyle = "#152018";
      context.fillRect(0, 0, viewport.width, viewport.height + footer);
      context.save();
      context.beginPath();
      context.rect(0, 0, viewport.width, viewport.height);
      context.clip();
      drawLayer(context, video, viewport);
      // Render and copy synchronously before WebGL clears its drawing buffer.
      // No preserveDrawingBuffer or changes to the normal AR loop are needed.
      renderer.render(scene.object3D, scene.camera);
      drawLayer(context, renderer.domElement, viewport);
      context.restore();

      context.fillStyle = "#ffd96b";
      context.fillRect(0, viewport.height, viewport.width, 3);
      context.textAlign = "center";
      context.textBaseline = "middle";
      let fontSize = Math.min(26, viewport.width * 0.052);
      context.font = `700 ${fontSize}px system-ui, sans-serif`;
      while (context.measureText(title).width > viewport.width - 32 && fontSize > 10) {
        context.font = `700 ${--fontSize}px system-ui, sans-serif`;
      }
      context.fillText(title, viewport.width / 2, viewport.height + footer * 0.4);
      context.fillStyle = "#d4ddd2";
      context.font = `${Math.min(16, viewport.width * 0.034)}px system-ui, sans-serif`;
      context.fillText(new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(new Date()), viewport.width / 2, viewport.height + footer * 0.73);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.94));
      if (!blob) throw new Error("No se pudo generar la foto. Inténtalo de nuevo.");
      releasePhoto();
      photoUrl = URL.createObjectURL(blob);
      const filename = `mi-visita-colmena-del-macizo-${Date.now()}.jpg`;
      photoFile = typeof File === "function" ? new File([blob], filename, { type: "image/jpeg" }) : null;
      preview.src = photoUrl;
      download.href = photoUrl;
      download.download = filename;
      let canShare = false;
      try { canShare = Boolean(photoFile && navigator.share && navigator.canShare?.({ files: [photoFile] })); } catch (_) { /* Download remains available. */ }
      share.hidden = !canShare;
      feedback.textContent = "Tu foto se genera en este dispositivo. Puedes descargarla o mantenerla pulsada para guardarla.";
      dialog.showModal();
      status.textContent = "";
    } catch (error) {
      console.error("No se pudo crear el recuerdo", error);
      status.textContent = error.name === "SecurityError"
        ? "El navegador no permitió guardar la imagen. Recarga la página e inténtalo de nuevo."
        : error.message || "No se pudo tomar la foto. Inténtalo de nuevo.";
    } finally {
      busy = false;
      button.disabled = !ready;
    }
  }

  scene.addEventListener("arReady", () => { ready = true; button.disabled = busy; });
  scene.addEventListener("arError", () => { ready = false; button.disabled = true; });
  button.addEventListener("click", capture);
  document.querySelector("#closePhoto").addEventListener("click", () => dialog.close());
  document.querySelector("#retakePhoto").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  // Keep the URL alive while the preview is open, including during download.
  dialog.addEventListener("close", releasePhoto);
  share.addEventListener("click", async () => {
    if (!photoFile) return;
    share.disabled = true;
    try {
      await navigator.share({ files: [photoFile], title, text: title });
      feedback.textContent = "Recuerdo compartido.";
    } catch (error) {
      if (error.name !== "AbortError") feedback.textContent = "No se pudo compartir. Puedes usar Descargar foto o mantener pulsada la imagen para guardarla.";
    } finally { share.disabled = false; }
  });
  window.addEventListener("pagehide", () => { ready = false; button.disabled = true; releasePhoto(); });
})();
