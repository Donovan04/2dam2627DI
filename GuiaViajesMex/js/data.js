export const sources = {
  census: "https://www.inegi.org.mx/app/saladeprensa/noticia.html?id=6288",
  mexico: "https://www.inegi.org.mx/programas/ccpv/2020/",
  languages: "https://www.inali.gob.mx/sitios/clin-inali/",
  climate: "https://smn.conagua.gob.mx/es/",
  normals: "https://smn.conagua.gob.mx/es/climatologia/informacion-climatologica/normales-climatologicas-por-estado",
  inah: "https://www.inah.gob.mx/zonas-arqueologicas",
  transit: "https://mexicocity.cdmx.gob.mx/wp-content/uploads/2026/01/guia_barrios_cdmx.pdf",
  mna: "https://mna.inah.gob.mx/informacion_general.php",
  mnaPrices: "https://www.inah.gob.mx/boletines/cinco-millones-de-visitantes-recibio-el-museo-nacional-de-antropologia-en-2025",
  photo: "https://commons.wikimedia.org/wiki/File:Palacio_de_Bellas_Artes,_Mexico_City,_MX.jpg",
  photoLicense: "https://creativecommons.org/licenses/by-sa/4.0/",
  flag: "https://commons.wikimedia.org/wiki/File:Flag_of_Mexico.svg"
};

export const types = {
  archaeology: { label: ["Arqueología", "Archaeology"], symbol: "▰" },
  museum: { label: ["Museos", "Museums"], symbol: "▥" },
  city: { label: ["Ciudades", "Cities"], symbol: "◆" },
  beach: { label: ["Playas", "Beaches"], symbol: "≈" },
  nature: { label: ["Naturaleza", "Nature"], symbol: "▲" },
  food: { label: ["Dónde comer", "Where to eat"], symbol: "✦" }
};

export const regions = {
  center: ["Centro", "Central Mexico"],
  west: ["Occidente", "Western Mexico"],
  south: ["Sur", "Southern Mexico"],
  peninsula: ["Península de Yucatán", "Yucatán Peninsula"],
  north: ["Norte", "Northern Mexico"]
};

// Los puntos son referencias de la visita, no necesariamente el acceso.
export const places = [
  {
    id: "bellas-artes", name: "Palacio de Bellas Artes", type: "museum", region: "center",
    location: "Av. Juárez, Ciudad de México", point: [19.4352, -99.1412],
    description: ["Un palacio de mármol junto a la Alameda Central. En su interior, los murales permiten acercarse al arte mexicano del siglo XX.", "A marble palace beside the Alameda Central. Its murals offer an introduction to 20th-century Mexican art."],
    source: "https://inba.gob.mx/recinto/67/museo-del-palacio-de-bellas-artes"
  },
  {
    id: "chichen-itza", name: "Chichén Itzá", type: "archaeology", region: "peninsula",
    location: "Tinum, Yucatán", point: [20.684325, -88.56781],
    description: ["Recorre una antigua ciudad maya y detente ante El Castillo y el Gran Juego de Pelota.", "Explore an ancient Maya city and stop at El Castillo and the Great Ball Court."],
    source: "https://whc.unesco.org/en/list/483/", coordinates: "https://datos.inah.gob.mx/taxonomy/term/2211"
  },
  {
    id: "oaxaca", name: "Centro Histórico de Oaxaca", type: "city", region: "south",
    location: "Santo Domingo, Oaxaca de Juárez", point: [17.0659, -96.7237],
    description: ["Pasea del Zócalo a Santo Domingo entre fachadas de cantera, patios y talleres.", "Walk from the Zócalo to Santo Domingo past stone façades, courtyards and workshops."],
    source: "https://whc.unesco.org/en/list/415/"
  },
  {
    id: "delfines", name: "Playa Delfines", type: "beach", region: "peninsula",
    location: "Bulevar Kukulkán, Cancún, Quintana Roo", point: [21.061, -86.779],
    description: ["Una playa abierta al Caribe con mirador. Consulta las banderas locales antes de bañarte.", "An open Caribbean beach with a lookout. Check the local flags before swimming."],
    source: "https://www.turismocancun.mx/el-ni%C3%B1o-1-1-1-1"
  },
  {
    id: "antropologia", name: "Museo Nacional de Antropología", type: "museum", region: "center",
    location: "Bosque de Chapultepec, Ciudad de México", point: [19.426, -99.1863],
    description: ["Reserva tiempo para la sala Mexica, donde se exhibe la Piedra del Sol, y para el patio del Paraguas.", "Make time for the Mexica gallery, home to the Sun Stone, and the courtyard beneath the Umbrella."],
    source: sources.mna
  },
  {
    id: "teotihuacan", name: "Teotihuacan", type: "archaeology", region: "center",
    location: "San Juan Teotihuacán, Estado de México", point: [19.692, -98.844],
    description: ["La Calzada de los Muertos conecta plazas y conjuntos ceremoniales junto a las pirámides del Sol y de la Luna.", "The Avenue of the Dead connects squares and ceremonial complexes near the pyramids of the Sun and Moon."],
    source: "https://whc.unesco.org/en/list/414/"
  },
  {
    id: "merida", name: "Centro Histórico de Mérida", type: "city", region: "peninsula",
    location: "Plaza Grande, Mérida, Yucatán", point: [20.967, -89.6237],
    description: ["Empieza en la Plaza Grande, frente a la catedral y a la Casa de Montejo, y continúa hacia Santa Lucía.", "Start at the Plaza Grande, facing the cathedral and Casa de Montejo, then walk toward Santa Lucía."],
    source: "https://visitmerida.mx/guia/c786"
  },
  {
    id: "cabanas", name: "Hospicio Cabañas", type: "museum", region: "west",
    location: "Paseo Hospicio, Guadalajara, Jalisco", point: [20.6765, -103.3383],
    description: ["El antiguo hospicio alberga los murales de José Clemente Orozco, incluido El hombre de fuego en la cúpula.", "The former hospice houses murals by José Clemente Orozco, including The Man of Fire in the dome."],
    source: "https://guadalajara.gob.mx/turismo/hospicio"
  },
  {
    id: "monte-alban", name: "Monte Albán", type: "archaeology", region: "south",
    location: "Valles Centrales, Oaxaca", point: [17.043, -96.767],
    description: ["La gran plaza de esta antigua capital zapoteca domina los valles de Oaxaca desde la cima de una montaña.", "The great plaza of this ancient Zapotec capital overlooks the Oaxaca valleys from a mountaintop."],
    source: "https://whc.unesco.org/en/list/415/"
  },
  {
    id: "palenque", name: "Palenque", type: "archaeology", region: "south",
    location: "Palenque, Chiapas", point: [17.484, -92.046],
    description: ["Explora una ciudad maya rodeada de selva, con paneles esculpidos y el Templo de las Inscripciones.", "Explore a Maya city surrounded by forest, with carved panels and the Temple of the Inscriptions."],
    source: "https://whc.unesco.org/en/list/411/"
  },
  {
    id: "agua-azul", name: "Cascadas de Agua Azul", type: "nature", region: "south",
    location: "Tumbalá, Chiapas", point: [17.258, -92.115],
    description: ["Una sucesión de saltos de agua. Los miradores permiten observar cómo cambia el color del río con la temporada.", "A series of waterfalls. From the lookouts you can see how the river changes colour with the seasons."],
    source: "https://visitmexico.com/es/destino/2753/centro-turistico-cascada-de-agua-azul"
  },
  {
    id: "divisadero", name: "Barrancas del Cobre · Divisadero", type: "nature", region: "north",
    location: "Divisadero, Chihuahua", point: [27.524, -107.826],
    description: ["Mirador de la Sierra Tarahumara con vistas a las barrancas. Puedes combinar la visita con un tramo del ferrocarril Chepe.", "A Sierra Tarahumara lookout with canyon views. You can combine the visit with a ride on the Chepe railway."],
    source: "https://chepe.mx/"
  },
  {
    id: "cardenal", name: "El Cardenal · Palma", type: "food", region: "center",
    location: "Palma 23, Ciudad de México", point: [19.433, -99.135],
    description: ["Un clásico del centro para desayunar chocolate, pan y platos de cocina mexicana.", "A downtown classic for breakfast with chocolate, bread and Mexican dishes."],
    source: "https://www.restauranteelcardenal.com/espacios/palma"
  },
  {
    id: "danzantes", name: "Los Danzantes Oaxaca", type: "food", region: "south",
    location: "Macedonio Alcalá 403, Oaxaca de Juárez", point: [17.0645, -96.7236],
    description: ["Cocina oaxaqueña contemporánea en un patio del centro histórico, con moles y mezcal en su propuesta.", "Contemporary Oaxacan cooking in a historic-centre courtyard, with moles and mezcal on offer."],
    source: "https://losdanzantesoaxaca.com.mx/"
  },
  {
    id: "chaya", name: "La Chaya Maya · Casona", type: "food", region: "peninsula",
    location: "Calle 55 entre 60 y 62, Mérida, Yucatán", point: [20.971, -89.6227],
    description: ["Cocina yucateca cerca de Santa Lucía. Busca especialidades a base de achiote, chaya o pepita de calabaza.", "Yucatecan cooking near Santa Lucía. Look for specialities featuring annatto, chaya or pumpkin seeds."],
    source: "https://visitmerida.mx/que-hacer/c403"
  },
  {
    id: "garibaldi", name: "Karne Garibaldi · Santa Tere", type: "food", region: "west",
    location: "Santa Teresita, Guadalajara, Jalisco", point: [20.686, -103.367],
    description: ["Sucursal en Santa Teresita conocida por la carne en su jugo, servida con frijoles y acompañamientos.", "A Santa Teresita branch known for carne en su jugo, served with beans and sides."],
    source: "https://karnegaribaldi.com.mx/"
  }
];
