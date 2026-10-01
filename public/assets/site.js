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
