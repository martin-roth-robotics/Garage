
(() => {
  "use strict";

  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];

  // Smooth anchor navigation
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener("click", e => {
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({behavior:"smooth", block:"start"});
      }
    });
  });

  // Opening-hours status
  const status = $("[data-open-status]");
  if (status) {
    const d = new Date();
    const day = d.getDay(); // Sun=0
    const minutes = d.getHours()*60 + d.getMinutes();
    const open = (day >= 1 && day <= 5 && minutes >= 480 && minutes < 1080) ||
                 (day === 6 && minutes >= 480 && minutes < 840);
    status.textContent = open ? "Ouvert maintenant" : "Fermé actuellement";
  }

  // Noise diagnosis
  const noiseSelect = $("#noise-select");
  const noiseButton = $("#noise-go");
  const noiseResult = $("#noise-result");
  const noiseNum = $("#noise-num");
  const noiseText = $("#noise-text");
  const noiseTheories = $("#noise-theories");
  const noiseWrench = $("#noise-wrench");
  const answers = [
    "Verdict : c’est un bruit. Nous recommandons de le garder, il tient compagnie.",
    "Chuck pense à la boîte de vitesses. Earl pense à son déjeuner. Nous avons donc deux avis.",
    "Ce bruit est normal. Il date de 1987 et n’a jamais dérangé personne, sauf vous.",
    "Selon nos calculs, il faut remplacer la pièce. Laquelle ? Nous verrons à la facture.",
    "Earl a collé l’oreille sur le capot : « Ça respire encore. » Bon signe.",
    "Essayez de monter le volume de la radio. Si le bruit disparaît, problème résolu.",
    "Nous avons consulté le manuel. Il est en japonais. Nous restons optimistes.",
    "C’est le moteur qui essaie de vous dire quelque chose. Il a l’air fâché.",
    "Un peu de WD-40, un coup de marteau et une prière. Le trio gagnant d’Earl & Chuck.",
    "Bonne nouvelle : ce n’est pas grave. Mauvaise nouvelle : on ne sait pas ce que c’est."
  ];
  let lastAnswer = -1;
  let noiseHint = null;
  if (noiseButton) {
    noiseButton.addEventListener("click", () => {
      if (!noiseSelect || !noiseSelect.value) {
        if (!noiseHint) {
          noiseHint = document.createElement("p");
          noiseHint.className = "noisemeter__hint";
          noiseHint.setAttribute("role", "alert");
          noiseButton.closest(".noisemeter__row").insertAdjacentElement("afterend", noiseHint);
        }
        noiseHint.textContent = "Choisissez un bruit d’abord. Même Earl a besoin d’un indice.";
        if (noiseSelect) noiseSelect.focus();
        return;
      }
      if (noiseHint) { noiseHint.remove(); noiseHint = null; }
      // Réponse au hasard, quel que soit le bruit choisi (jamais deux fois la même d’affilée)
      let i;
      do { i = Math.floor(Math.random() * answers.length); } while (i === lastAnswer && answers.length > 1);
      lastAnswer = i;
      if (noiseNum) noiseNum.textContent = String(Math.floor(Math.random() * 9000) + 1000);
      if (noiseTheories) noiseTheories.textContent = Math.floor(Math.random() * 9) + 2;
      if (noiseWrench) noiseWrench.textContent = Math.floor(Math.random() * 14) + 8;
      if (noiseText) noiseText.textContent = answers[i];
      if (noiseResult) {
        noiseResult.hidden = false;
        noiseResult.classList.remove("ticket--in");
        void noiseResult.offsetWidth;
        noiseResult.classList.add("ticket--in");
      }
    });
  }

  // Service buttons prefill the appointment form
  $$("[data-service]").forEach(btn => {
    btn.addEventListener("click", () => {
      const service = btn.dataset.service;
      const field = $("#f-service");
      if (field) field.value = service;
    });
  });

  // Appointment form
  const form = $("#rdv-form");
  const endpoint = form ? (form.dataset.endpoint || "").trim() : "";
  if (form) {
    const dateInput = $("#f-date");
    const dateError = $("#date-error");
    const formError = $("#form-error");
    const success = $("#rdv-success");
    const recap = $("#rdv-recap");
    const submit = $("#rdv-submit");

    // Pas de date passée
    if (dateInput) {
      const t = new Date();
      dateInput.min = `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;
    }
    const isSunday = v => v && new Date(v + "T12:00:00").getDay() === 0;
    if (dateInput) dateInput.addEventListener("change", () => {
      const bad = isSunday(dateInput.value);
      if (dateError) dateError.hidden = !bad;
      dateInput.setCustomValidity(bad ? "Fermé le dimanche" : "");
    });

    const val = id => { const el = $(id); return el ? el.value.trim() : ""; };
    const frDate = v => new Date(v + "T12:00:00").toLocaleDateString("fr-FR", {weekday:"long", day:"numeric", month:"long", year:"numeric"});

    function showRecap() {
      const rows = [
        ["Nom", `${val("#f-prenom")} ${val("#f-nom")}`],
        ["E-mail", val("#f-email")],
        ["Téléphone", val("#f-tel")],
        ["Véhicule", `${val("#f-marque")} ${val("#f-modele")} (${val("#f-annee")}, ${val("#f-km")} km)`],
        ["Prestation", val("#f-service")],
        ["Date", frDate(val("#f-date"))],
        ["Heure", val("#f-heure")],
        ["Problème", val("#f-desc")],
      ];
      recap.textContent = "";
      rows.forEach(([k, v]) => {
        const dt = document.createElement("dt"); dt.textContent = k;
        const dd = document.createElement("dd"); dd.textContent = v;
        recap.append(dt, dd);
      });
      form.hidden = true;
      success.hidden = false;
      success.focus();
      success.scrollIntoView({behavior:"smooth", block:"center"});
    }

    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (formError) formError.hidden = true;
      if (dateInput && isSunday(dateInput.value)) {
        if (dateError) dateError.hidden = false;
        dateInput.setCustomValidity("Fermé le dimanche");
      }
      if (!form.checkValidity()) { form.reportValidity(); return; }

      if (endpoint) {
        if (submit) submit.disabled = true;
        try {
          const res = await fetch(endpoint, {method:"POST", body:new FormData(form), headers:{Accept:"application/json"}});
          if (!res.ok) throw new Error("send failed");
        } catch {
          if (formError) {
            formError.textContent = "Impossible d’envoyer la demande pour le moment. Appelez-nous au (417) 555-0198.";
            formError.hidden = false;
          }
          if (submit) submit.disabled = false;
          return;
        }
        if (submit) submit.disabled = false;
      }
      showRecap();
    });

    $("#rdv-again")?.addEventListener("click", () => {
      form.reset();
      if (dateError) dateError.hidden = true;
      success.hidden = true;
      form.hidden = false;
      form.scrollIntoView({behavior:"smooth", block:"start"});
    });
  }

  // Gallery lightbox
  const lightbox = $("#lightbox");
  const lbPhoto = $("#lb-photo");
  const lbCaption = $("#lb-caption");
  const gallery = $$(".g-photo");
  let current = 0;

  function openGallery(index) {
    if (!lightbox || !gallery.length) return;
    current = (index + gallery.length) % gallery.length;
    const btn = gallery[current];
    const style = getComputedStyle(btn);
    lbPhoto.style.setProperty("--lb-s", style.getPropertyValue("--s"));
    lbPhoto.style.setProperty("--lb-px", style.getPropertyValue("--px"));
    lbPhoto.style.setProperty("--lb-py", style.getPropertyValue("--py"));
    lbCaption.textContent = btn.dataset.caption || "";
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeGallery() {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.style.overflow = "";
  }
  gallery.forEach((btn,i) => btn.addEventListener("click", () => openGallery(i)));
  $(".lightbox__close")?.addEventListener("click", closeGallery);
  $(".lightbox__nav--prev")?.addEventListener("click", () => openGallery(current-1));
  $(".lightbox__nav--next")?.addEventListener("click", () => openGallery(current+1));
  document.addEventListener("keydown", e => {
    if (!lightbox || lightbox.hidden) return;
    if (e.key === "Escape") closeGallery();
    if (e.key === "ArrowLeft") openGallery(current-1);
    if (e.key === "ArrowRight") openGallery(current+1);
  });

  // Cookie banner
  const cookies = $("#cookies");
  const cookieChoice = localStorage.getItem("earlChuckCookies");
  if (cookies && !cookieChoice) cookies.hidden = false;
  $$("[data-cookie]").forEach(btn => btn.addEventListener("click", () => {
    localStorage.setItem("earlChuckCookies", btn.dataset.cookie);
    if (cookies) cookies.hidden = true;
  }));

  // Back to top
  const top = $("#to-top");
  window.addEventListener("scroll", () => {
    if (top) top.hidden = window.scrollY < 600;
  }, {passive:true});
  top?.addEventListener("click", () => window.scrollTo({top:0, behavior:"smooth"}));
})();
