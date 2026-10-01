// Sayfa metinleri. Oyun sayıları rogueliketech/DESIGN.md "İçerik sayıları" tablosundan (1.0 ana oyun).
export const SHOTS = [
  { id: "01_crowd", en: "Warehouse: one guard against the crowd", tr: "Depo: kalabalığa karşı tek güvenlik görevlisi" },
  { id: "02_fork9", en: "Shipping: the FORK-9 boss fight", tr: "Sevkiyat: FORK-9 boss dövüşü" },
  { id: "03_lab", en: "Laboratory", tr: "Laboratuvar" },
  { id: "04_datacenter", en: "Data Center", tr: "Veri Merkezi" },
  { id: "05_reactor", en: "Reactor: a radiation build in full swing", tr: "Reaktör: radyasyon build'i tam güçte" },
  { id: "06_core", en: "The final boss, CORE", tr: "Final boss'u ÇEKİRDEK" },
  { id: "07_neo", en: "Neo-Facility", tr: "Neo-Tesis" },
];

export const STRINGS = {
  en: {
    lang: "en",
    url: "https://evolvingrealitygames.com/",
    home: "/",
    alt: { href: "/tr/", lang: "tr", label: "Türkçe" },
    meta: {
      title: "Evolving Reality Games",
      description:
        "Evolving Reality Games (ERG) is an independent game studio. First game: Last Human Shift, a survivors-like roguelite coming to Steam.",
      locale: "en_US",
    },
    a11y: { skip: "Skip to content", nav: "Main", close: "Close", prev: "Previous", next: "Next" },
    nav: { games: "Games", studio: "Studio" },
    hero: {
      title: "From pixel to smooth.",
      lead: "An independent studio making games that keep evolving, one run at a time.",
      cta: "See our first game",
    },
    evo: {
      label: "The idea behind the logo",
      e: { t: "Pixel", d: "Start with blocks. A mechanic you can feel in the first ten seconds." },
      r: { t: "Low-poly", d: "Give it shape. Systems that click together into builds." },
      g: { t: "Smooth", d: "Polish until it flows. Then keep going." },
    },
    game: {
      eyebrow: "First game · in development",
      tag: "Turn the facility into a weapon. Every shift starts from zero.",
      p1: "It's the night shift at Verimsan Facility No. 7, and the machines have stopped taking orders. You are the last human on the floor. Survive from 00:00 to 06:00.",
      p2: "You only move; your weapons fire on their own. Workbenches, power panels and the vending machine turn the factory itself into your build. Six sections, a boss in each, and no permanent power: every shift you start over, a little wiser.",
      f: { sections: "sections, each with its own boss", workers: "employees to play", weapons: "weapons", evolutions: "evolutions", items: "items" },
      m: {
        genre: { k: "Genre", v: "Survivors-like roguelite" },
        platform: { k: "Platform", v: "PC (Steam)" },
        langs: { k: "Languages", v: "English, Turkish" },
      },
      status: "Steam page coming soon",
      shots: "Screenshots",
    },
    studio: {
      eyebrow: "Studio",
      title: "One person, many hats.",
      p1: "Evolving Reality Games is the studio of Furkan Ergüldürenler, who handles design, programming, art and music. ERG is both the short name and a nod to the surname.",
      p2: "The logo tells the plan: an E built from pixels, an R cut from low-poly triangles, a G drawn as a smooth curve. Games here start rough and playable, and get better with every pass.",
    },
  },
  tr: {
    lang: "tr",
    url: "https://evolvingrealitygames.com/tr/",
    home: "/tr/",
    alt: { href: "/", lang: "en", label: "English" },
    meta: {
      title: "Evolving Reality Games",
      description:
        "Evolving Reality Games (ERG) bağımsız bir oyun stüdyosu. İlk oyun: Last Human Shift, Steam'e gelecek survivors-like bir roguelite.",
      locale: "tr_TR",
    },
    a11y: { skip: "İçeriğe geç", nav: "Ana menü", close: "Kapat", prev: "Önceki", next: "Sonraki" },
    nav: { games: "Oyunlar", studio: "Stüdyo" },
    hero: {
      title: "Pikselden pürüzsüze.",
      lead: "Her vardiyada biraz daha evrilen oyunlar yapan bağımsız bir stüdyo.",
      cta: "İlk oyunumuza bak",
    },
    evo: {
      label: "Logonun arkasındaki fikir",
      e: { t: "Piksel", d: "Bloklarla başla. İlk on saniyede hissedilen bir mekanik." },
      r: { t: "Low-poly", d: "Biçim ver. Birbirine oturup build'e dönüşen sistemler." },
      g: { t: "Pürüzsüz", d: "Akana kadar cilala. Sonra devam et." },
    },
    game: {
      eyebrow: "İlk oyun · geliştiriliyor",
      tag: "Çevreyi silaha dönüştür. Her vardiya sıfırdan.",
      p1: "Verimsan Tesis No. 7'de gece vardiyası. Makineler artık emir dinlemiyor ve katta kalan son insan sensin. 00:00'dan 06:00'ya kadar hayatta kal.",
      p2: "Sen yalnızca hareket edersin, silahların kendiliğinden ateş eder. Atölye tezgâhları, elektrik panelleri ve tedarik otomatı fabrikanın kendisini build'ine çevirir. Altı bölüm, her birinde bir boss ve kalıcı güç yok: her vardiyaya sıfırdan, biraz daha bilerek başlarsın.",
      f: { sections: "bölüm, her birinin kendi boss'u", workers: "oynanabilir çalışan", weapons: "silah", evolutions: "evrim", items: "item" },
      m: {
        genre: { k: "Tür", v: "Survivors-like roguelite" },
        platform: { k: "Platform", v: "PC (Steam)" },
        langs: { k: "Diller", v: "Türkçe, İngilizce" },
      },
      status: "Steam sayfası yakında",
      shots: "Ekran görüntüleri",
    },
    studio: {
      eyebrow: "Stüdyo",
      title: "Tek kişi, çok şapka.",
      p1: "Evolving Reality Games, Furkan Ergüldürenler'in stüdyosu: tasarım, programlama, sanat ve müzik tek elden çıkıyor. ERG hem kısaltma hem de soyada bir gönderme.",
      p2: "Plan logoda yazıyor: piksellerden kurulmuş bir E, low-poly üçgenlerden kesilmiş bir R, pürüzsüz bir eğriyle çizilmiş bir G. Buradaki oyunlar kaba ama oynanabilir başlar, her turda biraz daha iyileşir.",
    },
  },
};
