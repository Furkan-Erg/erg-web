// Ziyaret sayacı (stats/server.mjs): çerez yok, kimlik saklanmaz. Sayfa görünür olunca aynı origin'e tek işaret gider.
if (navigator.sendBeacon && !navigator.webdriver) {
  const pulse = () => {
    const q = new URLSearchParams(location.search);
    navigator.sendBeacon(
      "/api/pulse",
      JSON.stringify({
        p: location.pathname,
        r: document.referrer,
        l: navigator.language,
        s: q.get("utm_source") || q.get("ref") || "",
      }),
    );
  };
  if (document.visibilityState === "visible") pulse();
  else document.addEventListener("visibilitychange", pulse, { once: true });
}

// Açılış animasyonu bir kez oynar ve son karede kalır (poster = son kare). Hareket azaltma açıksa hiç oynamaz.
const hero = document.querySelector(".hero-video");
if (hero && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  hero.play().catch(() => {});
}

// Ekran görüntüleri: JS yoksa bağlantılar görseli doğrudan açar.
const box = document.querySelector(".lightbox");
const links = [...document.querySelectorAll(".shots a")];
if (box && box.showModal && links.length) {
  const img = box.querySelector("img");
  let at = 0;
  const show = (i) => {
    at = (i + links.length) % links.length;
    img.src = links[at].href;
    img.alt = links[at].querySelector("img").alt;
  };
  links.forEach((a, i) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      show(i);
      box.showModal();
    }),
  );
  box.querySelector(".lb-close").addEventListener("click", () => box.close());
  box.querySelector(".lb-prev").addEventListener("click", () => show(at - 1));
  box.querySelector(".lb-next").addEventListener("click", () => show(at + 1));
  box.addEventListener("click", (e) => e.target === box && box.close());
  box.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(at - 1);
    if (e.key === "ArrowRight") show(at + 1);
  });
}
