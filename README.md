# erg-web

Evolving Reality Games stüdyo sitesi: https://evolvingrealitygames.com (EN kökte, TR `/tr/`).

- `src/template.html` + `src/strings.mjs` → `node build.mjs` → `dist/`. Bağımlılık yok.
- `public/assets/`: görseller, videolar ve font. Marka dosyaları `../erg-brand`'den, oyun görselleri
  `../rogueliketech/builds/{store,trailer}`'dan ffmpeg ile küçültülerek kopyalandı; kaynağı orada değiştir.
- Yerel önizleme: `node build.mjs && python -m http.server 8765 --directory dist`
- Deploy (markahost, 127.0.0.1:3004):
  `tar --exclude=./dist --exclude=./.git -czf - . | ssh markahost 'tar -xzf - -C /home/furkan/erg-web && cd /home/furkan/erg-web && docker compose up -d --build'`
- Steam sayfası açılınca: `src/template.html`'deki `.status` satırı mağaza bağlantısına çevrilir.
