// Funzione per ottenere il colore in base al valore
function getColor(d) {
    return d > 6 ? '#800026' :
           d > 4 ? '#BD0026' :
           d > 3 ? '#E31A1C' :
           d > 2 ? '#FC4E2A' :
           d > 1 ? '#FD8D3C' :
           d > 0.5 ? '#FEB24C' :
           d > 0.2 ? '#FED976' :
           d > 0 ? '#FFEDA0' :
                   '#D3D3D3'; // Grigio per dati mancanti
}

// Funzione per lo stile di ogni provincia
function style(feature) {
    const value = feature.properties.rate_time;
    return {
        fillColor: getColor(value),
        weight: 1,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

// Inizializza la mappa Leaflet
const map = L.map('mapid').setView([42.8, 12.8], 6);

// Aggiungi un layer base (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Mappa di traduzione per i nomi che non corrispondono
const nameMap = {
    "VALLE D'AOSTA / VALLEE D'AOSTE": "Valle d'Aosta / Vallee d'Aoste",
    "BOLZANO": "Bolzano-Bozen",
    "REGGIO NELL'EMILIA": "Reggio nell'Emilia",
    "FORLI'-CESENA": "Forli-Cesena",
    "MASSA-CARRARA": "Massa-Carrara",
    "PESARO E URBINO": "Pesaro e Urbino",
    "L'AQUILA": "L'Aquila",
    "BARLETTA-ANDRIA-TRANI": "Barletta-Andria-Trani",
    "REGGIO DI CALABRIA": "Reggio di Calabria",
    "CAGLIARI": "Cagliari"
    // Aggiungi qui altre traduzioni se necessario
};

// Carica il GeoJSON e i dati TSV/JSON
Promise.all([
    fetch('./NUTS_RG_20M_2021_4326_LEVL_3.geojson').then(response => response.json()),
    fetch('./dati_mappa.json').then(response => response.json())
]).then(([geojson, data]) => {
    // Unisci i dati
    geojson.features = geojson.features.filter(feature =>
        feature.properties.CNTR_CODE === 'IT' &&
        feature.properties.LEVL_CODE === 3
    );

    let matchedCount = 0;
    let unmatched = [];

    geojson.features.forEach(feature => {
        const nutsName = feature.properties.NUTS_NAME;
        const mappedName = nameMap[nutsName.toUpperCase()] || nutsName;
        const value = data[mappedName];

        if (value) {
            feature.properties.rate_time = value;
            matchedCount++;
        } else {
            feature.properties.rate_time = null;
            unmatched.push(nutsName);
        }
    });

    console.log(`Matched ${matchedCount} areas.`);
    if (unmatched.length > 0) {
        console.log("Unmatched areas:", unmatched);
    }

    L.geoJSON(geojson, {
        style: style,
        onEachFeature: function(feature, layer) {
            const name = feature.properties.NUTS_NAME;
            const value = feature.properties.rate_time;
            const popupContent = `<b>${name}</b><br/>Furti: ${value !== null ? value.toFixed(3) : 'Dato mancante'}`;
            layer.bindPopup(popupContent);
        }
    }).addTo(map);

    const legend = L.control({position: 'bottomright'});
    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'info legend');
        const grades = [0, 0.2, 0.5, 1, 2, 3, 4, 6];
        div.innerHTML += '<h4>Tasso di Furto</h4>';
        for (let i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + getColor(grades[i] + 0.1) + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        }
        return div;
    };
    legend.addTo(map);
});