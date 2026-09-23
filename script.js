(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const scene = $("#arScene"), welcome = $("#welcome"), scannerUi = $("#scannerUi"), errorPanel = $("#errorPanel");
  const status = $("#status"), statusText = $("#statusText"), reticle = $("#reticle"), scanHint = $("#scanHint"), infoCard = $("#beeCard");
  const controls = [$("#infoButton"), $("#animationButton"), $("#resetButton")];
  const experiences = {
    bee: {
      target: $("#beeTarget"), model: $("#beeModel"), pivot: $("#beePivot"),
      found: "¡La abeja ha aterrizado!", eyebrow: "Apis mellifera", title: "Abeja melífera",
      text: "Una polinizadora esencial: al visitar flores ayuda a sostener ecosistemas y cultivos.",
    },
    hive: {
      target: $("#hiveTarget"), model: $("#hiveModel"), pivot: $("#hivePivot"),
      found: "¡Descubriste la colmena!", eyebrow: "El hogar de la colonia", title: "La colmena",
      text: "Una comunidad organizada donde las abejas protegen a la reina, almacenan alimento y cuidan sus crías.",
    },
    hive2: {
      target: $("#hive2Target"), model: $("#hive2Model"), pivot: $("#hive2Pivot"),
      found: "¡Descubriste la segunda colmena!", eyebrow: "Explora la colonia", title: "Colmena 2",
      text: "Observa este modelo de colmena desde distintos ángulos y descubre el hogar de las abejas.",
    },
    fullHive: {
      target: $("#fullHiveTarget"), model: $("#fullHiveModel"), pivot: $("#fullHivePivot"),
      found: "¡Descubriste la colmena completa!", eyebrow: "Una vista del conjunto", title: "Colmena completa",
      text: "Explora el modelo completo de la colmena y observa sus diferentes partes en tres dimensiones.",
    },
  };
  let started = false, activeExperience = null, animationPaused = false;

  function setStatus(message, mode = "loading") { statusText.textContent = message; status.dataset.mode = mode; }
  function setControls(enabled) { controls.forEach((button) => { button.disabled = !enabled; }); }
  function showError(message) {
    welcome.hidden = true; scannerUi.hidden = true; errorPanel.hidden = false;
    $("#errorMessage").textContent = message; started = false;
  }
  function friendlyCameraError(error) {
    if (!window.isSecureContext) return "Abre esta experiencia desde HTTPS o localhost para usar la cámara.";
    if (error?.name === "NotAllowedError") return "El permiso de cámara fue rechazado. Habilítalo en la configuración del navegador.";
    if (error?.name === "NotFoundError") return "No encontramos una cámara disponible en este dispositivo.";
    if (error?.name === "NotReadableError") return "Otra aplicación está usando la cámara. Ciérrala y vuelve a intentarlo.";
    return "No fue posible iniciar la realidad aumentada. Revisa la cámara y vuelve a intentarlo.";
  }
  async function startExperience() {
    if (started) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      showError("Este navegador no ofrece acceso compatible a la cámara. Prueba con Safari o Chrome actualizado.");
      return;
    }
    started = true; welcome.hidden = true; errorPanel.hidden = true; scannerUi.hidden = false;
    setStatus("Iniciando cámara…");
    try { await scene.systems["mindar-image-system"].start(); }
    catch (error) { console.error("No se pudo iniciar MindAR", error); showError(friendlyCameraError(error)); }
  }
  function stopExperience() {
    const system = scene.systems?.["mindar-image-system"];
    if (started && system) system.stop();
    started = false;
  }
  function updateCard(experience) {
    $("#cardEyebrow").textContent = experience.eyebrow;
    $("#cardTitle").textContent = experience.title;
    $("#cardText").textContent = experience.text;
  }
  function resetAnimationButton() {
    animationPaused = false;
    $("#animationButton").innerHTML = "<span>Ⅱ</span>Pausar";
  }
  function handleTargetFound(experience) {
    if (activeExperience && activeExperience !== experience && animationPaused) activeExperience.model.play();
    activeExperience = experience; resetAnimationButton(); updateCard(experience);
    setStatus(`${experience.title} detectada`, "found"); reticle.classList.add("found");
    scanHint.textContent = experience.found; setControls(true); navigator.vibrate?.(35);
  }
  function handleTargetLost(experience) {
    if (activeExperience !== experience) return;
    activeExperience = null; setStatus("Buscando abeja o colmena", "searching");
    reticle.classList.remove("found"); scanHint.textContent = "Enfoca cualquiera de los cuatro marcadores";
    infoCard.hidden = true; setControls(false);
  }

  scene.addEventListener("arReady", () => setStatus("Buscando abeja o colmena", "searching"));
  scene.addEventListener("arError", (event) => {
    console.error("Error de realidad aumentada", event.detail || event);
    showError(friendlyCameraError(event.detail));
  });
  Object.values(experiences).forEach((experience) => {
    experience.target.addEventListener("targetFound", () => handleTargetFound(experience));
    experience.target.addEventListener("targetLost", () => handleTargetLost(experience));
    experience.model.addEventListener("model-loaded", () => console.info(`Modelo 3D listo: ${experience.title}`));
    experience.model.addEventListener("model-error", (event) => {
      console.error(`Error cargando ${experience.title}`, event.detail || event);
      showError(`El modelo ${experience.title} no pudo cargarse. Recarga la página.`);
    });
  });

  $("#startButton").addEventListener("click", startExperience);
  $("#retryButton").addEventListener("click", startExperience);
  $("#infoButton").addEventListener("click", () => { if (activeExperience) infoCard.hidden = !infoCard.hidden; });
  $("#closeCard").addEventListener("click", () => { infoCard.hidden = true; });
  $("#animationButton").addEventListener("click", (event) => {
    if (!activeExperience) return;
    animationPaused = !animationPaused;
    if (animationPaused) activeExperience.model.pause(); else activeExperience.model.play();
    event.currentTarget.innerHTML = animationPaused ? "<span>▶</span>Continuar" : "<span>Ⅱ</span>Pausar";
  });
  $("#resetButton").addEventListener("click", () => {
    if (!activeExperience) return;
    activeExperience.pivot.setAttribute("scale", activeExperience.pivot.dataset.defaultScale);
    activeExperience.model.setAttribute("rotation", "0 0 0");
    if (animationPaused) $("#animationButton").click();
  });
  const helpDialog = $("#helpDialog");
  $("#helpButton").addEventListener("click", () => helpDialog.showModal());
  $("#closeHelp").addEventListener("click", () => helpDialog.close());
  helpDialog.addEventListener("click", (event) => { if (event.target === helpDialog) helpDialog.close(); });
  window.addEventListener("pagehide", stopExperience);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && started && !activeExperience) setStatus("Experiencia pausada", "loading");
  });
})();
