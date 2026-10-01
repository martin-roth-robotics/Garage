
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
  const noiseButton = $("#noise-button");
  const noiseResult = $("#noise-result");
  const answers = [
    "Probablement un petit souci. Ou un gros souci qui fait semblant.",
    "Les freins aimeraient qu’on s’intéresse à eux. Faites-les vérifier.",
    "Earl vote pour un roulement. Chuck vote pour quelque chose de plus cher.",
    "Un sifflement : soit l’aérodynamique, soit quelque chose qui demande de l’attention.",
    "Si ça ressemble à un animal, ne nourrissez pas le moteur.",
    "C’est probablement le silence avant la prochaine facture.",
  ];
  if (noiseButton) {
    noiseButton.addEventListener("click", () => {
      if (!noiseSelect || !noiseSelect.value) {
        if (noiseResult) noiseResult.textContent = "Choisissez un bruit d’abord. Même Earl a besoin d’un indice.";
        return;
      }
      if (noiseResult) noiseResult.textContent = answers[Number(noiseSelect.value)] || answers[0];
    });
  }

  // Service buttons prefill the appointment form
  $$("[data-service]").forEach(btn => {
    btn.addEventListener("click", () => {
      const service = btn.dataset.service;
      const field = $("#service");
      if (field) field.value = service;
    });
  });

  // Appointment form
  const form = $("#rdv-form");
  const endpoint = form ? (form.dataset.endpoint || "").trim() : "";
  if (form) {
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const data = new FormData(form);
      if (!endpoint) {
        alert("Le formulaire est prêt, mais l’envoi par e-mail n’est pas encore configuré. Vous pouvez nous appeler au (417) 555-0198.");
        return;
      }
      const submit = form.querySelector('[type="submit"]');
      if (submit) submit.disabled = true;
      try {
        const res = await fetch(endpoint, {method:"POST", body:data, headers:{Accept:"application/json"}});
        if (!res.ok) throw new Error("send failed");
        form.reset();
        alert("Votre demande a bien été envoyée. Merci !");
      } catch {
        alert("Impossible d’envoyer le formulaire pour le moment. Appelez-nous au (417) 555-0198.");
      } finally {
        if (submit) submit.disabled = false;
      }
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
