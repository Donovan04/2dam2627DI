import { types, regions, places, sources } from "./data.js";

export function renderPlaces(root, { t, tr, intro, state, dispose }) {
  dispose?.();
  const url = new URL(location.href);
  state ??= {
    type: Object.hasOwn(types, url.searchParams.get("tipo")) ? url.searchParams.get("tipo") : "",
    region: Object.hasOwn(regions, url.searchParams.get("region")) ? url.searchParams.get("region") : "",
    filtersOpen: false,
    view: "list",
    selected: ""
  };

  const option = (value, title) => `<option value="${value}">${title}</option>`;
  root.innerHTML = `<div class="shell places-page">
    ${intro(t("Lugares", "Places"), t("Explora México", "Explore Mexico"), t("Elige una región o un tipo de visita para encontrar tus próximas paradas.", "Choose a region or type of visit to find your next stops."))}
    <div class="view-switch" role="group" aria-label="${t("Vista de resultados", "Results view")}">
      <button type="button" data-view="list" aria-controls="results">${t("Lista", "List")}</button>
      <button type="button" data-view="map" aria-controls="map-panel">${t("Mapa", "Map")}</button>
    </div>
    <div class="explorer">
      <aside class="filters">
        <button class="filter-toggle" id="filter-toggle" type="button" aria-controls="filters">${t("Filtrar", "Filter")} <span aria-hidden="true">⌄</span></button>
        <form id="filters" aria-label="${t("Filtros de lugares", "Place filters")}">
          <h2>${t("Filtra tu búsqueda", "Filter your search")}</h2>
          <label for="type">${t("Tipo", "Type")}</label>
          <select id="type" name="tipo">${option("", t("Todos los tipos", "All types"))}${Object.entries(types).map(([key, type]) => option(key, tr(type.label))).join("")}</select>
          <label for="region">${t("Región", "Region")}</label>
          <select id="region" name="region">${option("", t("Todas las regiones", "All regions"))}${Object.entries(regions).map(([key, region]) => option(key, tr(region))).join("")}</select>
          <button class="quiet" id="clear" type="button">${t("Limpiar filtros", "Clear filters")}</button>
        </form>
      </aside>
      <section class="results" id="results" aria-label="${t("Lista de lugares", "Places list")}">
        <div class="results-head"><p id="count" role="status"></p><p>${t("Confirma horarios y tarifas en las fuentes de cada lugar.", "Confirm opening hours and prices with each place’s source.")}</p></div>
        <div id="cards" class="place-list"></div>
      </section>
      <section class="map-panel" id="map-panel" aria-labelledby="map-title">
        <h2 id="map-title" tabindex="-1">${t("Mapa de lugares", "Places map")}</h2>
        <p id="map-count" role="status"></p>
        <p class="map-note">${t("Los marcadores indican lugares y puntos de referencia. Confirma el acceso con la fuente de la ficha.", "Markers indicate places and reference points. Confirm access with the source on each card.")}</p>
        <p class="map-message" id="map-status" role="status" hidden></p>
        <div id="map" role="region" aria-label="${t("Mapa interactivo de México", "Interactive map of Mexico")}"></div>
        <p class="map-selected" id="map-selected" hidden></p>
        <div class="map-bottom">
          <span><b aria-hidden="true">◆</b> ${t("Visitas", "Sights")} <b class="food-legend" aria-hidden="true">✦</b> ${t("Dónde comer", "Where to eat")}</span>
          <span>© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://leafletjs.com/">Leaflet</a></span>
        </div>
      </section>
    </div>
    <p class="source-note"><a href="${sources.inah}">${t("Zonas arqueológicas · INAH", "Archaeological sites · INAH")}</a></p>
  </div>`;

  const get = selector => root.querySelector(selector);
  const form = get("#filters");
  const filterToggle = get("#filter-toggle");
  const type = get("#type");
  const region = get("#region");
  const cards = get("#cards");
  const mapPanel = get("#map-panel");
  const mapFrame = get("#map");
  const mapStatus = get("#map-status");
  const selectedInfo = get("#map-selected");
  const wide = matchMedia("(min-width: 1050px)");
  const small = matchMedia("(max-width: 599px)");
  const viewButtons = [...root.querySelectorAll("[data-view]")];
  const leaflet = window.L;
  let map;
  let markerLayer;
  let markers = new Map();
  let filtered = [];
  let frame;

  const mapURL = place => place.coordinates
    ? `https://www.openstreetmap.org/?mlat=${place.point[0]}&mlon=${place.point[1]}#map=17/${place.point.join("/")}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${place.location}`)}`;
  const locationLink = place => `<a href="${mapURL(place)}">${t("Ubicación externa", "External map")}</a>`;
  const defaultMapMessage = () => t("No se pudo cargar el mapa. Puedes consultar las fichas y sus enlaces de ubicación.", "The map could not load. You can still use the cards and their location links.");

  function mapMessage(message) {
    mapStatus.textContent = message;
    mapStatus.hidden = !message;
  }

  function createMap() {
    if (!leaflet) {
      mapFrame.hidden = true;
      mapMessage(defaultMapMessage());
      return;
    }
    map = leaflet.map(mapFrame, {
      center: [23.7, -102.6], zoom: 5, zoomControl: false,
      attributionControl: false, scrollWheelZoom: false, minZoom: 3,
      fadeAnimation: false, zoomAnimation: false, markerZoomAnimation: false
    });
    leaflet.control.zoom({
      zoomInText: "+", zoomOutText: "−",
      zoomInTitle: t("Acercar", "Zoom in"), zoomOutTitle: t("Alejar", "Zoom out")
    }).addTo(map);
    let tileFailed = false;
    const tiles = leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 });
    tiles.on("loading", () => { tileFailed = false; });
    tiles.on("tileerror", () => {
      tileFailed = true;
      mapMessage(t("La capa cartográfica está incompleta. Los marcadores y los enlaces de ubicación siguen disponibles.", "The map layer is incomplete. Markers and location links are still available."));
    });
    tiles.on("load", () => { if (!tileFailed) mapMessage(""); });
    tiles.addTo(map);
    markerLayer = leaflet.layerGroup().addTo(map);
    refreshMarkers();
  }

  function showSelection(place) {
    state.selected = place?.id ?? "";
    selectedInfo.hidden = !place;
    selectedInfo.innerHTML = place ? `<strong>${place.name}</strong> · ${locationLink(place)}` : "";
  }

  function refreshMarkers() {
    markerLayer.clearLayers();
    markers = new Map();
    for (const place of filtered) {
      const food = place.type === "food";
      const marker = leaflet.marker(place.point, {
        title: `${place.name} · ${tr(types[place.type].label)}`,
        icon: leaflet.divIcon({
          className: `pin ${food ? "pin-food" : ""}`,
          html: `<span aria-hidden="true">${food ? "✦" : "◆"}</span>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          popupAnchor: [0, -14]
        })
      });
      marker.bindPopup(`<strong>${place.name}</strong><br>${place.location}<br>${locationLink(place)}`);
      marker.on("popupopen", event => {
        const close = event.popup.getElement().querySelector(".leaflet-popup-close-button");
        close.setAttribute("aria-label", t("Cerrar ficha del mapa", "Close map popup"));
        showSelection(place);
      });
      markerLayer.addLayer(marker);
      markers.set(place.id, marker);
    }
  }

  function focusPlace(place) {
    if (!map || !markers.has(place.id)) return;
    map.setView(place.point, place.type === "food" || place.type === "museum" || place.type === "city" ? 16 : 13);
    markers.get(place.id).openPopup();
  }

  function fitResults() {
    if (!map) return;
    if (filtered.length) map.fitBounds(filtered.map(place => place.point), { padding: [35, 35], maxZoom: 10 });
    else map.setView([23.7, -102.6], 5);
  }

  function syncView(updateMap = false) {
    const showMap = !small.matches || state.view === "map";
    get("#results").hidden = small.matches && state.view === "map";
    mapPanel.hidden = !showMap;
    for (const button of viewButtons) button.setAttribute("aria-pressed", String(button.dataset.view === state.view));
    cancelAnimationFrame(frame);
    if (!showMap) return;
    frame = requestAnimationFrame(() => {
      if (!map) createMap();
      if (!map) return;
      map.invalidateSize({ pan: false });
      const selected = filtered.find(place => place.id === state.selected);
      if (selected) focusPlace(selected);
      else if (updateMap) fitResults();
    });
  }

  function renderResults() {
    filtered = places.filter(place => (!state.type || place.type === state.type) && (!state.region || place.region === state.region));
    if (!filtered.some(place => place.id === state.selected)) showSelection(null);
    const count = filtered.length;
    const countText = count === 1 ? t("1 lugar", "1 place") : t(`${count} lugares`, `${count} places`);
    get("#count").textContent = countText;
    get("#map-count").textContent = count ? countText : t("No hay lugares con estos filtros.", "No places match these filters.");
    cards.innerHTML = filtered.length ? filtered.map(place => `
      <article class="card place-card" id="${place.id}" data-type="${place.type}">
        <div class="place-type"><span aria-hidden="true">${types[place.type].symbol}</span> ${tr(types[place.type].label)} <span aria-hidden="true">·</span> ${tr(regions[place.region])}</div>
        <h3>${place.name}</h3>
        <p class="place-address">${place.location}</p>
        <p>${tr(place.description)}</p>
        ${place.coordinates ? "" : `<p class="approx">${t("Punto orientativo · coordenadas exactas por confirmar", "Approximate marker · exact coordinates pending")}</p>`}
        <div class="place-actions">
          <button type="button" class="quiet" data-place="${place.id}">${t("Ver en el mapa", "View on map")}</button>
          ${locationLink(place)}
          <a href="${place.source}" aria-label="${t("Fuente de", "Source for")} ${place.name}">${t("Fuente", "Source")}</a>
        </div>
      </article>`).join("") : `<p class="empty">${t("No hay coincidencias. Cambia la región o el tipo, o limpia los filtros.", "No matches. Try another region or type, or clear the filters.")}</p>`;
    if (map) refreshMarkers();
    syncView(true);
  }

  function syncFilters() {
    form.hidden = !wide.matches && !state.filtersOpen;
    filterToggle.setAttribute("aria-expanded", String(!form.hidden));
  }

  function updateFilters() {
    state.type = type.value;
    state.region = region.value;
    state.selected = "";
    showSelection(null);
    for (const field of [type, region]) {
      if (field.value) url.searchParams.set(field.name, field.value);
      else url.searchParams.delete(field.name);
    }
    url.hash = "";
    history.replaceState(null, "", url);
    renderResults();
  }

  function onResize() {
    const previousFocus = document.activeElement;
    syncFilters();
    if (wide.matches && previousFocus === filterToggle) type.focus();
    if (form.hidden && form.contains(previousFocus)) filterToggle.focus();
    syncView(false);
  }

  filterToggle.addEventListener("click", () => {
    state.filtersOpen = !state.filtersOpen;
    syncFilters();
    if (state.filtersOpen) type.focus();
  });
  form.addEventListener("keydown", event => {
    if (event.key !== "Escape" || wide.matches) return;
    event.stopPropagation();
    state.filtersOpen = false;
    syncFilters();
    filterToggle.focus();
  });
  form.addEventListener("submit", event => event.preventDefault());
  form.addEventListener("change", updateFilters);
  get("#clear").addEventListener("click", () => {
    type.value = "";
    region.value = "";
    updateFilters();
  });

  for (const button of viewButtons) button.addEventListener("click", () => {
    state.view = button.dataset.view;
    syncView(true);
  });
  cards.addEventListener("click", event => {
    const button = event.target.closest("[data-place]");
    if (!button) return;
    const place = filtered.find(item => item.id === button.dataset.place);
    state.view = "map";
    showSelection(place);
    syncView(true);
    if (small.matches || !leaflet) get("#map-title").focus();
    mapPanel.scrollIntoView({ block: "nearest" });
  });

  type.value = state.type;
  region.value = state.region;
  wide.addEventListener("change", onResize);
  small.addEventListener("change", onResize);
  syncFilters();
  showSelection(places.find(place => place.id === state.selected));
  renderResults();
  if (url.hash) requestAnimationFrame(() => document.getElementById(url.hash.slice(1))?.scrollIntoView());

  return {
    state,
    dispose() {
      cancelAnimationFrame(frame);
      wide.removeEventListener("change", onResize);
      small.removeEventListener("change", onResize);
      map?.remove();
    }
  };
}
