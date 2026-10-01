# erg-web

Evolving Reality Games stüdyo sitesi: https://evolvingrealitygames.com (EN kökte, TR `/tr/`).

- `src/template.html` + `src/strings.mjs` → `node build.mjs` → `dist/`. Bağımlılık yok.
- `public/assets/`: görseller, videolar ve font. Marka dosyaları `../erg-brand`'den, oyun görselleri
  `../rogueliketech/builds/{store,trailer}`'dan ffmpeg ile küçültülerek kopyalandı; kaynağı orada değiştir.
- Yerel önizleme: `node build.mjs && python -m http.server 8765 --directory dist`
- Deploy: `main`'e push → GitHub webhook → Jenkins job'ı `erg-web` (`Jenkinsfile`): derleme, docker build,
  `/home/furkan/erg-web`'de `git pull && docker compose up -d --build` (127.0.0.1:3004), sağlık kontrolü.
- Steam sayfası açılınca: `src/template.html`'deki `.status` satırı mağaza bağlantısına çevrilir.
