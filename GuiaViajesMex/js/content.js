export const photos = {
  chichen: ["chichen.jpg", "ZuyuaT", "https://commons.wikimedia.org/wiki/File:El_Castillo,_Chichen_Itza.jpg", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", ["Cabeza de Kukulkán y pirámide de El Castillo en Chichén Itzá", "Kukulkán stone head and El Castillo pyramid at Chichén Itzá"]],
  tacos: ["tacos.jpg", "William Neuheisel", "https://commons.wikimedia.org/wiki/File:01_Tacos_al_Pastor.jpg", "CC BY 2.0", "https://creativecommons.org/licenses/by/2.0/", ["Tacos al pastor servidos en un plato", "Tacos al pastor served on a plate"]],
  altar: ["altar.jpg", "YessMendez", "https://commons.wikimedia.org/wiki/File:Altar_de_muertos_mexicano.jpg", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/", ["Altar de Día de Muertos con flores y papel picado", "Day of the Dead altar with flowers and cut-paper decorations"]]
};

export const timeline = [
  ["1325", ["Fundación tradicional de México-Tenochtitlan.", "Traditional founding date of México-Tenochtitlan."]],
  ["1521", ["Caída de Tenochtitlan, seguida por el periodo virreinal.", "Fall of Tenochtitlan, followed by the viceregal period."]],
  ["1810–1821", ["Comienza el movimiento de independencia en 1810 y se consuma en 1821.", "The independence movement begins in 1810 and achieves independence in 1821."]],
  ["1910", ["Comienza la Revolución mexicana.", "The Mexican Revolution begins."]]
];

export const climate = [
  [["Altiplano · Ciudad de México", "Highlands · Ciudad de México"], ["Noviembre a abril", "November to April"], ["Meses generalmente más secos para pasear. Lleva una capa para las mañanas frescas y espera lluvias vespertinas en verano.", "Generally drier months for walks. Pack a layer for cool mornings and expect afternoon rain in summer."]],
  [["Caribe · Cancún y Yucatán", "Caribbean · Cancún and Yucatán"], ["Diciembre a abril", "December to April"], ["Suele haber menos lluvia para playa y ruinas. De junio a noviembre, revisa avisos de ciclones y el estado del mar.", "Usually drier for beaches and ruins. From June to November, check tropical storm advisories and sea conditions."]],
  [["Sur · Selva de Chiapas", "South · Chiapas rainforest"], ["Febrero a abril", "February to April"], ["La menor lluvia suele facilitar visitas a ruinas y cascadas. Consulta el caudal y los accesos antes de salir.", "Lower rainfall often makes it easier to visit ruins and waterfalls. Check water levels and access before leaving."]],
  [["Sierra · Barrancas del Cobre", "Mountains · Barrancas del Cobre"], ["Marzo a mayo", "March to May"], ["La primavera suele ser más templada para miradores y senderos. La temperatura cambia mucho con la altitud.", "Spring is often milder for lookouts and trails. Temperatures vary sharply with elevation."]]
];

const agriculture = "https://www.gob.mx/agricultura/articulos/gastronomia-indigena-y-mestiza?idiom=es";
const yucatan = "https://sic.cultura.gob.mx/ficha.php?disciplina=&table=gastronomia&table_id=44";

export const dishes = [
  ["Tacos al pastor", ["Ciudad de México · Taquerías", "Ciudad de México · Taquería tradition"], ["Cerdo marinado que se corta de un asador vertical llamado trompo. Suele servirse en tortilla de maíz con piña, cebolla y cilantro.", "Marinated pork shaved from a vertical spit called a trompo, usually served on corn tortillas with pineapple, onion and coriander."], agriculture],
  ["Cochinita pibil", ["Yucatán · Tradición maya", "Yucatán · Maya tradition"], ["Cerdo con achiote y naranja agria, cocido tradicionalmente en un horno bajo tierra. Se sirve en tacos o panuchos.", "Pork with annatto and sour orange, traditionally cooked in an underground oven. Served in tacos or panuchos."], "https://www.gob.mx/agricultura/articulos/cochinita-pibil-el-sabor-maya-en-un-taco?state=published", "chaya"],
  ["Mole negro", ["Oaxaca · Valles Centrales", "Oaxaca · Central Valleys"], ["Salsa oscura de chiles secos, especias y otros ingredientes, a veces chocolate. Acompaña platos festivos con pollo o guajolote.", "A dark sauce of dried chillies, spices and other ingredients, sometimes including chocolate. Served with chicken or turkey on festive occasions."], "https://sic.cultura.gob.mx/ficha.php?disciplina=&table=gastronomia&table_id=33", "danzantes"],
  ["Pozole", ["Guerrero · Variantes regionales", "Guerrero · Regional variations"], ["Caldo con maíz cacahuazintle y carne. Puede ser blanco, rojo o verde y suele llevar rábanos, lechuga y lima o limón.", "A broth with cacahuazintle maize and meat. It comes in white, red or green versions, often topped with radishes, lettuce and lime."], "https://www.gob.mx/agricultura/articulos/pozole-profunda-historia-en-cada-plato?idiom=es"],
  ["Sopa de lima", ["Yucatán", "Yucatán"], ["Caldo perfumado con lima yucateca, a menudo con pollo o pavo deshebrado y tiras de tortilla frita.", "A broth scented with Yucatecan lime, often with shredded chicken or turkey and crispy tortilla strips."], yucatan, "chaya"],
  ["Carne en su jugo", ["Guadalajara · Jalisco", "Guadalajara · Jalisco"], ["Res cortada fina y cocida en su jugo, servida con frijoles, tocino y acompañamientos como cebolla y cilantro.", "Thinly sliced beef cooked in its juices, served with beans, bacon and toppings such as onion and coriander."], "https://karnegaribaldi.com.mx/", "garibaldi"]
];

export const traditions = [
  [["Día de Muertos", "Day of the Dead"], ["Memoria y ofrendas", "Remembrance and offerings"], ["Entre finales de octubre y principios de noviembre, muchas familias recuerdan a sus difuntos con fotografías, velas, cempasúchil y sus comidas favoritas. En Yucatán, el Hanal Pixán incluye ofrendas de alimentos.", "From late October to early November, many families remember the dead with photographs, candles, marigolds and favourite foods. In Yucatán, Hanal Pixán includes food offerings."], "https://ich.unesco.org/en/RL/indigenous-festivity-dedicated-to-the-dead-00054"],
  [["Mariachi", "Mariachi"], ["Música · Jalisco y Occidente", "Music · Jalisco and western Mexico"], ["Violines, vihuela, guitarrón y trompetas acompañan serenatas y celebraciones. La Plaza de los Mariachis en Guadalajara es una referencia de esta tradición.", "Violins, vihuela, guitarrón and trumpets accompany serenades and celebrations. Guadalajara’s Plaza de los Mariachis is a landmark of the tradition."], "https://ich.unesco.org/en/RL/mariachi-string-music-song-and-trumpet-00575"],
  [["Talavera", "Talavera"], ["Cerámica · Puebla y Tlaxcala", "Ceramics · Puebla and Tlaxcala"], ["La loza vidriada se decora a mano y puede verse en vajillas y fachadas. Los procesos artesanales de Puebla y Tlaxcala forman parte de una inscripción compartida con España.", "This glazed pottery is hand-painted and appears in tableware and on façades. The craft processes of Puebla and Tlaxcala are part of a UNESCO inscription shared with Spain."], "https://ich.unesco.org/en/Decisions/14.COM/10.b.23"],
  [["Diversidad lingüística", "Linguistic diversity"], ["68 agrupaciones indígenas", "68 Indigenous language groups"], ["El INALI registra 68 agrupaciones y 364 variantes indígenas. El náhuatl, el maya yucateco y el zapoteco ilustran la diversidad de lenguas y comunidades.", "INALI records 68 Indigenous language groups and 364 variants. Nahuatl, Yucatec Maya and Zapotec illustrate the diversity of languages and communities."], "https://www.inali.gob.mx/sitios/clin-inali/"]
];

export const packing = [
  [["Ciudad y altiplano", "City and highlands"], ["Calzado cómodo, capa ligera y un impermeable en temporada de lluvias.", "Comfortable shoes, a light layer and a rain jacket in the rainy season."]],
  [["Costa y playa", "Coast and beaches"], ["Sombrero, agua, protección solar y una bolsa para mantener tus cosas secas.", "A hat, water, sun protection and a dry bag for your belongings."]],
  [["Sierra y selva", "Mountains and rainforest"], ["Calzado con agarre, ropa por capas para la sierra y repelente para la selva.", "Grippy shoes, layers for the mountains and insect repellent for the rainforest."]]
];

export const transport = [
  [["Dentro de la ciudad", "Around town"], ["En Ciudad de México, combina trayectos a pie con Metro y Metrobús. La guía oficial explica el uso de la tarjeta de Movilidad Integrada.", "In Ciudad de México, combine walking with the Metro and Metrobús. The official city guide explains how to use the integrated mobility card."]],
  [["Entre ciudades", "Between cities"], ["Compara autobuses interurbanos y vuelos internos. Revisa la terminal, la duración y qué equipaje incluye el billete.", "Compare intercity buses and domestic flights. Check terminals, journey times and the baggage included in your ticket."]],
  [["Sierra y zonas rurales", "Mountains and rural areas"], ["Consulta traslados locales o excursiones y confirma el regreso. Para las Barrancas del Cobre, revisa las estaciones y fechas del Chepe.", "Check local transfers or guided trips and confirm your return. For Barrancas del Cobre, check Chepe stations and travel dates."]]
];

export const budget = [
  [["Alojamiento", "Accommodation"], [350, 650], [950, 1600]],
  [["Comida", "Food"], [220, 400], [450, 750]],
  [["Transporte local", "Local transport"], [25, 70], [80, 220]],
  [["Entradas", "Admission"], [0, 210], [150, 420]]
];

