import { sources, places } from "./data.js";
import { photos, timeline, climate, dishes, traditions, packing, transport, budget } from "./content.js";
import { renderPlaces } from "./places.js";

const page = document.body.dataset.page;
const header = document.querySelector("#header");
const main = document.querySelector("#main");
const footer = document.querySelector("#footer");
const navItems = {
  home: ["index.html", "Inicio", "Home"],
  places: ["lugares.html", "Lugares", "Places"],
  food: ["gastronomia.html", "Gastronomía", "Food"],
  culture: ["cultura.html", "Cultura", "Culture"],
  plan: ["planifica.html", "Planifica", "Plan"]
};

function preference(key, value) {
  try {
    if (value !== undefined) localStorage.setItem(`mexico-${key}`, value);
    return localStorage.getItem(`mexico-${key}`);
  } catch {
    return null;
  }
}

let language = preference("language") === "en" ? "en" : "es";
let theme = preference("theme") === "dark" ? "dark" : "light";
let explorer;
const t = (es, en) => language === "es" ? es : en;
const tr = pair => t(...pair);
const link = (href, label) => `<a href="${href}">${label}</a>`;
const sourceLink = href => link(href, t("Fuente", "Source"));
const placesURL = id => `./lugares.html?tipo=food${id ? `#${id}` : ""}`;
const image = (key, className = "") => {
  const [file, author, original, license, licenseURL, alt] = photos[key];
  return `<figure class="picture ${className}">
    <img src="./assets/${file}" alt="${tr(alt)}" loading="lazy">
    <figcaption>${link(original, author)} · ${link(licenseURL, license)} · ${t("Encuadre adaptado", "Cropped for display")}</figcaption>
  </figure>`;
};

function applyTheme() {
  document.documentElement.dataset.theme = theme;
  const control = document.querySelector("#theme");
  control.setAttribute("aria-pressed", String(theme === "dark"));
  control.title = t("Modo oscuro", "Dark mode");
  control.setAttribute("aria-label", control.title);
  control.firstElementChild.textContent = theme === "dark" ? "☀" : "☾";
}

function renderFrame() {
  document.documentElement.lang = language;
  document.title = `${navItems[page][language === "es" ? 1 : 2]} · México de cerca`;
  document.querySelector('meta[name="description"]').content = t("Guía de viaje para descubrir México y preparar tu primera visita.", "A travel guide to exploring Mexico and planning your first visit.");
  document.querySelector(".skip").textContent = t("Saltar al contenido", "Skip to content");
  header.innerHTML = `<div class="shell header-inner">
    <a class="brand" href="./index.html"><img src="./assets/mark.svg" alt="" width="37" height="37"><span>México <i>de cerca</i></span></a>
    <button class="menu-button" id="menu" type="button" aria-expanded="false" aria-controls="nav">${t("Menú", "Menu")}</button>
    <nav id="nav" aria-label="${t("Navegación principal", "Main navigation")}">
      ${Object.entries(navItems).map(([key, [href, es, en]]) => `<a href="./${href}" ${page === key ? 'aria-current="page"' : ""}>${t(es, en)}</a>`).join("")}
    </nav>
    <div class="header-actions">
      <label class="sr-only" for="language">${t("Idioma", "Language")}</label>
      <select id="language">
        <option value="es" lang="es">Español</option>
        <option value="en" lang="en">English</option>
      </select>
      <button class="theme" id="theme" type="button"><span aria-hidden="true"></span></button>
    </div>
  </div>`;
  footer.innerHTML = `<div class="shell footer-inner">
    <a class="brand" href="./index.html"><img src="./assets/mark.svg" alt="" width="33" height="33"><span>México <i>de cerca</i></span></a>
    <p>${t("Guía de viaje · México", "Travel guide · Mexico")}</p>
    ${link("./planifica.html", t("Prepara tu viaje", "Plan your trip"))}
  </div>`;
  const languageControl = document.querySelector("#language");
  languageControl.value = language;
  languageControl.addEventListener("change", () => {
    language = languageControl.value;
    preference("language", language);
    render();
    document.querySelector("#language").focus();
  });
  document.querySelector("#theme").addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    preference("theme", theme);
    applyTheme();
  });
  applyTheme();

  const menu = document.querySelector("#menu");
  const nav = document.querySelector("#nav");
  const closeMenu = restoreFocus => {
    menu.setAttribute("aria-expanded", "false");
    if (restoreFocus) menu.focus();
  };
  menu.addEventListener("click", () => {
    if (menu.getAttribute("aria-expanded") === "true") {
      closeMenu(true);
    } else {
      menu.setAttribute("aria-expanded", "true");
      nav.querySelector("a").focus();
    }
  });
  header.onkeydown = event => {
    if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") closeMenu(true);
  };
  header.onfocusout = event => {
    if (event.relatedTarget && !nav.contains(event.relatedTarget) && event.relatedTarget !== menu) closeMenu(false);
  };
  header.onclick = event => {
    if (event.target !== menu && !nav.contains(event.target)) closeMenu(false);
  };
}

function intro(section, title, desc, photo) {
  return `<section class="subhero ${photo ? "subhero-photo" : ""}">
    <div><p class="eyebrow">${section}</p><h1>${title}</h1><p class="lede">${desc}</p></div>
    ${photo ? image(photo) : ""}
  </section>`;
}

function home() {
  const features = [
    ["chichen", "lugares.html", t("Lugares", "Places"), t("De Chichén Itzá a las Barrancas del Cobre.", "From Chichén Itzá to Barrancas del Cobre.")],
    ["tacos", "gastronomia.html", t("Gastronomía", "Food"), t("Seis platos y las tradiciones que los rodean.", "Six dishes and the traditions behind them.")],
    ["altar", "cultura.html", t("Cultura", "Culture"), t("Ofrendas, música, artesanía y lenguas.", "Offerings, music, crafts and languages.")]
  ];
  return `<div class="shell">
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow"><span aria-hidden="true">◆</span> ${t("Guía de viaje", "Travel guide")}</p>
        <h1>${t("México", "Mexico")}<br><em>${t("de cerca", "up close")}</em></h1>
        <p class="lede">${t("De los barrios de Ciudad de México al Caribe y la sierra. Descubre qué visitar, qué probar y cómo preparar tu primer viaje.", "From the neighbourhoods of Ciudad de México to the Caribbean and the mountains. Find out what to see, what to try and how to plan your first trip.")}</p>
        <div class="actions">
          <a class="button primary" href="./lugares.html">${t("Explorar lugares", "Explore places")}</a>
          <a class="button quiet" href="./planifica.html">${t("Planificar viaje", "Plan my trip")}</a>
        </div>
      </div>
      <figure class="hero-image">
        <img src="./assets/bellas-artes.jpg" alt="${t("Vista elevada del Palacio de Bellas Artes, con su cúpula naranja", "Elevated view of Palacio de Bellas Artes and its orange dome")}" fetchpriority="high">
        <div class="image-location"><span aria-hidden="true">◆</span> Ciudad de México</div>
        <figcaption>Palacio de Bellas Artes · ${link(sources.photo, "Timothy Neesam")} · ${link(sources.photoLicense, "CC BY-SA 4.0")} · ${t("Encuadre adaptado", "Cropped for display")}</figcaption>
      </figure>
    </section>
    <section class="fact-strip" aria-label="${t("Datos básicos", "Quick facts")}">
      <div class="fact"><span>${t("Capital", "Capital")}</span><strong>Ciudad de México</strong><small>${t("9 209 944 habitantes · entidad, 2020", "9,209,944 residents · federal entity, 2020")} · ${link(sources.census, "INEGI")}</small></div>
      <div class="fact"><span>${t("Población del país", "National population")}</span><strong>${t("126.014.024", "126,014,024")}</strong><small>${t("Censo de 2020", "2020 census")} · ${link(sources.mexico, "INEGI")}</small></div>
      <div class="fact"><span>${t("Moneda", "Currency")}</span><strong>${t("Peso mexicano", "Mexican peso")}</strong><small>MXN</small></div>
      <div class="fact"><span>${t("Bandera", "Flag")}</span><img src="./assets/bandera.svg" width="54" height="31" alt="${t("Bandera de México: verde, blanca y roja con el escudo al centro", "The Mexican flag: green, white and red with the coat of arms in the centre")}"><small>${link(sources.flag, t("Original y crédito", "Original and credit"))}</small></div>
    </section>
    <section class="block">
      <div class="section-heading"><h2>${t("Por dónde empezar", "Where to start")}</h2></div>
      <div class="grid three">${features.map(([photo, href, title, desc]) => `<article class="card feature">${image(photo)}<div class="card-body"><h3>${link(`./${href}`, title)}</h3><p>${desc}</p></div></article>`).join("")}</div>
    </section>
    <section class="block split">
      <div><h2>${t("México a través del tiempo", "Mexico through time")}</h2>
        <ol class="timeline">${timeline.map(([year, desc]) => `<li><strong>${t("Año", "Year")} ${year}</strong><p>${tr(desc)}</p></li>`).join("")}</ol>
        <p class="source-note">${link("https://www.inehrm.gob.mx/es/inehrm/Cronologias", "INEHRM")} · ${link("https://whc.unesco.org/en/list/412/", "UNESCO")}</p>
      </div>
      <aside class="callout">
        <h2>${t("Datos curiosos", "Did you know?")}</h2>
        <p>${t("El español es de uso mayoritario. El INALI documenta 68 agrupaciones indígenas y 364 variantes, entre ellas variedades de náhuatl, maya y lenguas zapotecas.", "Spanish is the most widely used language. INALI documents 68 Indigenous language groups and 364 variants, including varieties of Nahuatl, Maya and Zapotec languages.")} ${link(sources.languages, "INALI")}</p>
        <p>${t("En Xochimilco se conservan chinampas, parcelas de cultivo construidas en el antiguo sistema lacustre del Valle de México.", "Xochimilco still has chinampas, agricultural plots built within the historic lake system of the Valley of Mexico.")} ${link("https://whc.unesco.org/en/list/412/", "UNESCO")}</p>
      </aside>
    </section>
    <section class="block">
      <div class="section-heading"><h2>${t("Cuándo viajar", "When to travel")}</h2><p>${t("La mejor época depende de la región, la altitud y lo que quieras hacer.", "The best time depends on the region, elevation and what you want to do.")}</p></div>
      <div class="grid two">${climate.map(([title, dates, desc]) => `<article class="card card-body"><p class="eyebrow">${tr(dates)}</p><h3>${tr(title)}</h3><p>${tr(desc)}</p></article>`).join("")}</div>
      <p class="source-note">${link(sources.normals, t("Normales por estado · SMN/CONAGUA", "Climate normals by state · SMN/CONAGUA"))} · ${link(sources.climate, t("Pronósticos y avisos", "Forecasts and advisories"))}</p>
    </section>
  </div>`;
}

function food() {
  return `<div class="shell">
    ${intro(t("Gastronomía", "Food"), t("México en seis platos", "Mexico in six dishes"), t("Del trompo de una taquería al horno de tierra yucateco. Seis formas de acercarse a la cocina mexicana.", "From the taquería’s vertical spit to Yucatán’s underground oven. Six ways to get to know Mexican cooking."), "tacos")}
    <section class="grid three" aria-label="${t("Platos", "Dishes")}">
      ${dishes.map(([name, origin, desc, source, place]) => `<article class="card card-body">
        <p class="eyebrow">${tr(origin)}</p><h2>${name}</h2><p>${tr(desc)}</p>
        <div class="text-links">${sourceLink(source)}${place ? link(placesURL(place), places.find(item => item.id === place).name) : ""}</div>
      </article>`).join("")}
    </section>
    <section class="block callout"><h2>${t("Dónde comer", "Where to eat")}</h2>
      <p>${t("Encuentra las cuatro direcciones de la guía en Ciudad de México, Guadalajara, Oaxaca y Mérida. Consulta las cartas antes de ir.", "Find four addresses in Ciudad de México, Guadalajara, Oaxaca and Mérida. Check the menus before you go.")}</p>
      <a class="button primary" href="${placesURL()}">${t("Ver sitios para comer", "See places to eat")}</a>
    </section>
  </div>`;
}

function culture() {
  return `<div class="shell">
    ${intro(t("Cultura", "Culture"), t("Tradiciones vivas", "Living traditions"), t("Cuatro maneras de conocer cómo se recuerda, se celebra y se crea en distintas comunidades de México.", "Four ways to discover how communities across Mexico remember, celebrate and create."), "altar")}
    <section class="grid two" aria-label="${t("Tradiciones", "Traditions")}">${traditions.map(([name, origin, desc, source]) => `<article class="card card-body">
      <p class="eyebrow">${tr(origin)}</p><h2>${tr(name)}</h2><p>${tr(desc)}</p><div class="text-links">${sourceLink(source)}</div>
    </article>`).join("")}</section>
  </div>`;
}

function plan() {
  const number = new Intl.NumberFormat(t("es-ES", "en-GB"));
  const range = ([low, high]) => `<span class="budget-range">${number.format(low)}–${number.format(high)}</span> MXN`;
  const totals = level => budget.reduce(([low, high], row) => [low + row[level][0], high + row[level][1]], [0, 0]);
  const cards = rows => rows.map(([name, desc]) => `<article class="card card-body"><h3>${tr(name)}</h3><p>${tr(desc)}</p></article>`).join("");
  return `<div class="shell">
    ${intro(t("Planifica", "Plan"), t("Antes de salir", "Before you go"), t("Prepara la maleta, decide cómo moverte y calcula cuánto reservar por día.", "Pack for your destination, choose how to get around and work out a daily budget."))}
    <section class="block first"><div class="section-heading"><h2>${t("Qué llevar", "What to pack")}</h2></div><div class="grid three">${cards(packing)}</div></section>
    <section class="block"><div class="section-heading"><h2>${t("Cómo moverte", "Getting around")}</h2></div><div class="grid three">${cards(transport)}</div>
      <p class="source-note">${link(sources.transit, t("Guía de barrios de Ciudad de México", "Ciudad de México neighbourhood guide"))} · ${link("https://chepe.mx/", "Chepe Express")}</p>
    </section>
    <section class="block">
      <div class="section-heading"><h2>${t("Presupuesto diario", "Daily budget")}</h2><p>${t("Centro Histórico de Ciudad de México · 22 de noviembre de 2026", "Historic Centre of Ciudad de México · 22 November 2026")}</p></div>
      <table class="budget">
        <caption>${t("Estimación en MXN por persona y día", "Estimate in MXN per person per day")}</caption>
        <thead><tr><th scope="col">${t("Concepto", "Category")}</th><th scope="col">${t("Económico", "Budget")}</th><th scope="col">${t("Medio", "Mid-range")}</th></tr></thead>
        <tbody>${budget.map(([name, low, mid]) => `<tr><th scope="row">${tr(name)}</th><td>${range(low)}</td><td>${range(mid)}</td></tr>`).join("")}</tbody>
        <tfoot><tr><th scope="row">${t("Total", "Total")}</th><td>${range(totals(1))}</td><td>${range(totals(2))}</td></tr></tfoot>
      </table>
      <p>${t("El nivel económico combina dormitorio compartido, comida de mercado y transporte público. El medio supone habitación privada, comidas de restaurante y algún trayecto en coche. Los rangos excluyen vuelos, traslados interurbanos y compras.", "The budget tier combines a dorm bed, market meals and public transport. The mid-range tier assumes a private room, restaurant meals and an occasional car ride. Ranges exclude flights, intercity travel and shopping.")}</p>
      <p>${t("Como referencia, la guía municipal publica 5 MXN por viaje en Metro y el INAH anunció una tarifa general de 210 MXN para el Museo Nacional de Antropología en 2026. Queda por confirmar el precio de alojamiento y comidas para tus fechas, además de descuentos y tarifas de otros recintos.", "For reference, the city guide lists a 5 MXN Metro fare, and INAH announced general admission of 210 MXN to Museo Nacional de Antropología in 2026. Accommodation and meal prices for your dates, discounts and prices at other venues still need confirmation.")}</p>
      <p class="source-note">${link(sources.transit, t("Transporte · guía municipal", "Transport · city guide"))} · ${link(sources.mnaPrices, t("Entradas · INAH", "Admission · INAH"))} · ${link("https://www.restauranteelcardenal.com/desayunos", t("Comida · carta de ejemplo", "Food · example menu"))} · ${link("https://mundojovenhostels.com/", t("Alojamiento · hostal de referencia", "Accommodation · example hostel"))}</p>
    </section>
  </div>`;
}

function render() {
  renderFrame();
  if (page === "places") {
    explorer = renderPlaces(main, { t, tr, intro, state: explorer?.state, dispose: explorer?.dispose });
  } else {
    main.innerHTML = { home, food, culture, plan }[page]();
  }
}

render();

