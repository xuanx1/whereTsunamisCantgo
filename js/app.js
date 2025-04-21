import { combinedCoordinates } from "./sea_coord.js";

// main map
const app = d3
  .select("#app")
  .html("")
  .style("position", "fixed")
  .style("inset", "0")
  .style("padding", "0")
  .style("overflow", "hidden");

mapboxgl.accessToken = "pk.eyJ1IjoiZGV4dWFudCIsImEiOiJjbTlpNzdxZGswZDlsMmlwcmIzOWhrOGlzIn0.4-M0wnkyIrx9itmQEQ8Jxw";
const map = new mapboxgl.Map({
  container: "map",
  zoom: 1.5,
  center: [115.0, 5.0], // center of Southeast Asia
  pitch: 0, // ensure 2D view by setting pitch to 0
  bearing: 0, // ensure north-up orientation
  style: "mapbox://styles/mapbox/light-v11",
  attributionControl: false,
  collectResourceTiming: false,
  maxBounds: [
    [80.0, -25.0], // sw corner bounding box
    [145.0, 40.2], // ne corner bounding box
  ],
  minZoom: 1.5,
  maxZoom: 14,
  dragRotate: false, // disable 3D rotation
  pitchWithRotate: false, // disable pitch with rotate
  projection: 'mercator', // explicitly set flat projection
  renderWorldCopies: false // prevent multiple world copies in view
});
// map.addControl(
//   new mapboxgl.AttributionControl({
//     compact: true,
//     attributionControl: false,
//   })
// );

// hide all country names
map.on("style.load", () => {
  map.getStyle().layers.forEach((layer) => {
    if (layer.type === "symbol" && layer.layout && layer.layout["text-field"]) {
      map.setLayoutProperty(layer.id, "visibility", "none");
    }
  });

  const countriesToShow = [
    "IDN", "VNM", "LAO", "BRN", "THA", "MMR", "PHL", 
    "KHM", "TLS", "SGP", "MYS", "CHN", "AUS", "PLW"
  ];

  // remove country borders
  map.getStyle().layers.forEach((layer) => {
    if (layer.type === "line" && layer.id.includes("border")) {
      map.setLayoutProperty(layer.id, "visibility", "none");
    }
  });
});

// Add zoom controls separately
const zoomInButton = document.createElement("img");
zoomInButton.src = "images/plus.svg";
zoomInButton.alt = "+";
zoomInButton.style.position = "absolute";
zoomInButton.style.top = "10px";
zoomInButton.style.right = "10px";
zoomInButton.style.zIndex = "1000";
zoomInButton.style.width = "30px";
zoomInButton.style.height = "30px";
zoomInButton.style.borderRadius = "50%";
zoomInButton.style.backgroundColor = "#fff";
zoomInButton.style.border = "1px solid #ccc";
zoomInButton.style.cursor = "pointer";
zoomInButton.style.padding = "5px";
document.body.appendChild(zoomInButton);

const zoomOutButton = document.createElement("img");
zoomOutButton.src = "images/minus.svg";
zoomOutButton.alt = "-";
zoomOutButton.style.position = "absolute";
zoomOutButton.style.top = "50px";
zoomOutButton.style.right = "10px";
zoomOutButton.style.zIndex = "1000";
zoomOutButton.style.width = "30px";
zoomOutButton.style.height = "30px";
zoomOutButton.style.borderRadius = "50%";
zoomOutButton.style.backgroundColor = "#fff";
zoomOutButton.style.border = "1px solid #ccc";
zoomOutButton.style.cursor = "pointer";
zoomOutButton.style.padding = "5px";
document.body.appendChild(zoomOutButton);

// Zoom in and out functionality
zoomInButton.addEventListener("click", () => {
  map.zoomIn();
});

zoomOutButton.addEventListener("click", () => {
  map.zoomOut();
});

// compass control
const compassControl = new mapboxgl.NavigationControl({
  showZoom: false,
  visualizePitch: true,
});
compassControl._container.style.borderRadius = "50%";
compassControl._container.style.overflow = "hidden";
const compassContainer = document.createElement("div");
compassContainer.style.position = "absolute";
compassContainer.style.top = "90px";
compassContainer.style.right = "10px";
compassContainer.style.zIndex = "1000";

document.body.appendChild(compassContainer);

compassContainer.appendChild(compassControl.onAdd(map));

// scale
const scaleControl = new mapboxgl.ScaleControl({
  minWidth: 200,
  maxWidth: 300,
  unit: "metric",
});
map.addControl(scaleControl);

// scale style
const scaleElement = document.querySelector(".mapboxgl-ctrl-scale");
if (scaleElement) {
  scaleElement.style.backgroundColor = "transparent";
  scaleElement.style.border = "2px solid #535353";
  scaleElement.style.color = " #535353";
  scaleElement.style.fontSize = "12px";

  // convert to miles
  const updateScale = () => {
    const kmText = scaleElement.textContent;
    const kmMatch = kmText.match(/([\d.]+)\s*km/);
    if (kmMatch) {
      const kmValue = parseFloat(kmMatch[1]);
      const milesValue = (kmValue * 0.621371).toFixed(2); // convert km to miles and round to 2 decimal places
      scaleElement.textContent = `${kmValue} km ${milesValue} mi`;
    }
  };

  // Update scale on map move + zoom
  map.on("move", updateScale);
  map.on("zoom", updateScale);

  updateScale();
}

// title
const titleContainer = document.createElement("div");
titleContainer.style.position = "absolute";
titleContainer.style.top = "20px";
titleContainer.style.left = "20px";
titleContainer.style.zIndex = "1000";
titleContainer.style.color = "white";
titleContainer.style.fontFamily = "'Open Sans', sans-serif";
// titleContainer.style.textShadow = "1px 1px 3px rgba(0,0,0,0.5)";
titleContainer.style.pointerEvents = "none";

const mainTitle = document.createElement("h1");
mainTitle.innerHTML = "Where Tsunamis<br>Can't Go";
mainTitle.style.margin = "0";
mainTitle.style.fontSize = "48px";
mainTitle.style.lineHeight = "1.2";
mainTitle.style.color = "rgb(0, 202, 209)";
mainTitle.style.fontWeight = "bold";

const subTitle = document.createElement("p");
subTitle.textContent = "Southeast Asia Edition";
subTitle.style.margin = "5px 0 0 0";
subTitle.style.fontSize = "18.5px";
subTitle.style.color = "rgb(117, 117, 117)";
subTitle.style.opacity = "0.8";

titleContainer.appendChild(mainTitle);
titleContainer.appendChild(subTitle);
document.body.appendChild(titleContainer);


// outline SEA
map.on("load", () => {
  map.addSource("countries", {
    type: "vector",
    url: "mapbox://mapbox.country-boundaries-v1",
  });

  map.addLayer({
    id: "highlight-sea",
    type: "line",
    source: "countries",
    "source-layer": "country_boundaries",
    paint: {
      "line-color": "#ffffff",
      "line-width": 0.5,
    },
    filter: ["in", "iso_3166_1_alpha_3", "IDN", "VNM", "LAO", "BRN", "THA", "MMR", "PHL", "KHM", "TLS", "SGP", "MYS"],
  });

  // white out the rest of the world
  map.addLayer({
    id: "black-world",
    type: "fill",
    source: "countries",
    "source-layer": "country_boundaries",
    paint: {
      "fill-color": "rgb(255, 255, 255)",
      "fill-opacity": 0.7,
    },
    filter: [
      "all",
      [
        "!in",
        "iso_3166_1_alpha_3",
        "IDN",
        "VNM",
        "LAO",
        "BRN",
        "THA",
        "MMR",
        "PHL",
        "KHM",
        "TLS",
        "SGP",
        "MYS",
        "CHN",
        "RUS",
        "JPN",
        "IND",
        "PAK",
        "KOR",
        "ARG",
        "BTN",
        "IND",
      ],
    ],
  });

  // Highlight China and Russia with 0.5 opacity
  map.addLayer({
    id: "highlight-china-russia",
    type: "fill",
    source: "countries",
    "source-layer": "country_boundaries",
    paint: {
      "fill-color": "rgb(255, 255, 255)",
      "fill-opacity": 0.4,
    },
    filter: ["in", "iso_3166_1_alpha_3", "CHN", "RUS", "JPN", "IND", "PAK", "KOR", "ARG", "BTN", "IND"],
  });
});


// // Responsive inset map
// const createInsetMap = () => {
//   const insetContainer = document.createElement("div");
//   insetContainer.id = "inset-map";
//   insetContainer.style.position = "absolute";
//   insetContainer.style.width = window.innerWidth > 768 ? "320px" : "200px"; // Adjust width for smaller screens
//   insetContainer.style.height = window.innerWidth > 768 ? "150px" : "100px"; // Adjust height for smaller screens
//   insetContainer.style.bottom = "10px";
//   insetContainer.style.right = "10px";
//   insetContainer.style.border = "2px solid #ccc";
//   insetContainer.style.zIndex = "1000";
//   document.body.appendChild(insetContainer);

//   const insetMap = new mapboxgl.Map({
//     container: "inset-map",
//     style: "mapbox://styles/mapbox/dark-v10",
//     center: map.getCenter(),
//     zoom: 0.1,
//     interactive: false,
//     attributionControl: false,
//   });

//   // inset title
//   const insetTitle = document.createElement("div");
//   insetTitle.textContent = "Southeast Asia";
//   insetTitle.style.position = "absolute";
//   insetTitle.style.top = "5px";
//   insetTitle.style.left = "10px";
//   insetTitle.style.zIndex = "1001";
//   insetTitle.style.color = "white";
//   insetTitle.style.opacity = "0.5";
//   insetTitle.style.fontSize = window.innerWidth > 768 ? "16px" : "12px"; // Adjust font size for smaller screens
//   insetTitle.style.fontWeight = "Bold";
//   insetContainer.appendChild(insetTitle);

//   // remove logo from the inset map
//   const insetLogoElement = document.querySelector("#inset-map .mapboxgl-ctrl-logo");
//   if (insetLogoElement) {
//     insetLogoElement.style.display = "none"; // Hide the logo
//   }

//   insetMap.on("style.load", () => {
//     insetMap.getStyle().layers.forEach((layer) => {
//       if (layer.type === "symbol" && layer.layout && layer.layout["text-field"]) {
//         insetMap.setPaintProperty(layer.id, "text-color", "#d3d3d3");
//       }
//     });
//   });

//   insetMap.on("load", () => {
//     insetMap.addSource("countries", {
//       type: "vector",
//       url: "mapbox://mapbox.country-boundaries-v1",
//     });

//     insetMap.addLayer({
//       id: "rest-world",
//       type: "fill",
//       source: "countries",
//       "source-layer": "country_boundaries",
//       paint: {
//         "fill-color": "#2b2b2b",
//         "fill-opacity": 0.6,
//       },
//       filter: [
//         "!in",
//         "iso_3166_1_alpha_3",
//         "IDN",
//         "VNM",
//         "LAO",
//         "BRN",
//         "THA",
//         "MMR",
//         "PHL",
//         "KHM",
//         "TLS",
//         "SGP",
//         "MYS",
//       ],
//     });

//     insetMap.addLayer({
//       id: "highlight-sea",
//       type: "fill",
//       source: "countries",
//       "source-layer": "country_boundaries",
//       paint: {
//         "fill-color": "#ffffff",
//         "fill-opacity": 0.6,
//       },
//       filter: ["in", "iso_3166_1_alpha_3", "IDN", "LAO", "BRN", "THA", "MMR", "KHM", "TLS", "SGP", "MYS"],
//     });

//     insetMap.addLayer({
//       id: "highlight-philippines-vietnam",
//       type: "fill",
//       source: "countries",
//       "source-layer": "country_boundaries",
//       paint: {
//         "fill-color": "#ffffff",
//         "fill-opacity": 0.4,
//       },
//       filter: ["in", "iso_3166_1_alpha_3", "PHL", "VNM"],
//     });

//     insetMap.moveLayer("highlight-sea", "country-label");
//     insetMap.moveLayer("highlight-philippines-vietnam", "country-label");
//     insetMap.moveLayer("rest-world", "country-label");
//   });

//   map.on("move", () => {
//     insetMap.setCenter(map.getCenter());
//     insetMap.setZoom(map.getZoom() - 4);
//   });

//   return insetContainer;
// };

// // Create inset map if screen width is greater than 480px
// if (window.innerWidth > 480) {
//   createInsetMap();
// }

// // Adjust inset map on window resize
// window.addEventListener("resize", () => {
//   const existingInsetMap = document.getElementById("inset-map");
//   if (existingInsetMap) {
//     existingInsetMap.remove();
//   }
//   if (window.innerWidth > 480) {
//     createInsetMap();
//   }
// });

// Adj map container ht to follow win ht
const resizeMap = () => {
  const mapContainer = document.getElementById("map");
  if (mapContainer) {
    mapContainer.style.height = `${window.innerHeight}px`;
  }
};
window.addEventListener("resize", resizeMap);
resizeMap();






// highest risk cities
const highRiskCitiesContainer = document.createElement("div");
highRiskCitiesContainer.style.position = "absolute";
highRiskCitiesContainer.style.top = "20px";
highRiskCitiesContainer.style.right = "85px";
highRiskCitiesContainer.style.padding = "15px";
highRiskCitiesContainer.style.zIndex = "1000";
highRiskCitiesContainer.style.maxHeight = "800px";
highRiskCitiesContainer.style.overflowY = "auto";
highRiskCitiesContainer.style.maxWidth = "250px";
highRiskCitiesContainer.style.fontSize = "14px";
highRiskCitiesContainer.style.color = "#444444"; // Set default text color to dark grey

const title = document.createElement("h3");
title.textContent = "Top 10 Riskiest Cities";
title.style.marginTop = "0";
title.style.color = "#444444"; // Changed from #019cde to dark grey
title.style.fontSize = "16px";
highRiskCitiesContainer.appendChild(title);

const description = document.createElement("p");
description.innerHTML = "Based on Tsunami Risk Index (TSI), lower values indicate higher risk.";
description.style.margin = "0 0 15px 0";
description.style.fontSize = "12px";
description.style.color = "#444444"; // Changed from #666 to dark grey
highRiskCitiesContainer.appendChild(description);

const cityList = document.createElement("ol");
cityList.style.paddingLeft = "20px";
cityList.style.margin = "0";
cityList.style.color = "#444444"; // Set list text to dark grey

const cities = [
  { name: "Banda Aceh, Indonesia", risk: "Fatally High Risk", color: "#9400d3" },
  { name: "Padang, Indonesia", risk: "Fatally High Risk", color: "#9400d3" },
  { name: "Medan, Indonesia", risk: "Fatally High Risk", color: "#9400d3" },
  { name: "Phuket, Thailand", risk: "High Risk", color: "#e85347" },
  { name: "Manila, Philippines", risk: "High Risk", color: "#e85347" },
  { name: "Jakarta, Indonesia", risk: "Moderate Risk", color: "#f67a0a" },
  { name: "Hue, Vietnam", risk: "Moderate Risk", color: "#f67a0a" },
  { name: "Da Nang, Vietnam", risk: "Moderate Risk", color: "#f67a0a" },
  { name: "Palu, Indonesia", risk: "Low Risk", color: "rgb(255, 187, 0)" },
  { name: "Quezon City, Philippines", risk: "Low Risk", color: "rgb(255, 187, 0)" }
];

cities.forEach(city => {
  const listItem = document.createElement("li");
  listItem.style.marginBottom = "8px";
  listItem.style.color = "#444444"; // Set list item text to dark grey
  
  const cityName = document.createElement("strong");
  cityName.textContent = city.name;
  cityName.style.color = "#444444"; // Set city name to dark grey
  
  const riskInfo = document.createElement("div");
  riskInfo.innerHTML = `<span style="color: ${city.color}; font-weight: bold;">■</span> <span style="color: #444444;">${city.risk}</span>`;
  
  listItem.appendChild(cityName);
  listItem.appendChild(document.createElement("br"));
  listItem.appendChild(riskInfo);
  
  cityList.appendChild(listItem);
});

highRiskCitiesContainer.appendChild(cityList);
document.body.appendChild(highRiskCitiesContainer);



// // roads Mapbox
// map.on("load", () => {
//   map.addLayer({
//     id: "filtered-roads-layer",
//     type: "line",
//     source: {
//       type: "vector",
//       url: "mapbox://mapbox.mapbox-streets-v8",
//     },
//     "source-layer": "road",
//     paint: {
//       "line-color": "#ffa500", // orange
//       "line-width": [
//         "interpolate",
//         ["linear"],
//         ["zoom"],
//         4,
//         1, // Thin lines at low zoom levels
//         10,
//         3, // Thicker lines at higher zoom levels
//       ],
//       "line-opacity": 0.6,
//     },
//     filter: [
//       "within",
//       {
//         type: "Polygon",
//         coordinates: combinedCoordinates,
//       },
//     ],
//   });
// });

// tsi
map.on("load", () => {
  // Load TSI values from grid_vect.geojson
  map.addSource("tsi-data", {
    type: "geojson",
    data: "data/grid_vect_with_tsi.geojson"
  });

  // Add a layer for the TSI data - always visible
  map.addLayer({
    id: "tsi-points",
    type: "circle",
    source: "tsi-data",
    paint: {
      "circle-radius": [
        "interpolate", ["linear"], ["zoom"],
        2, 1.5,
        6, 3,
        10, 5
      ],
      "circle-color": [
        "case",
        ["==", ["get", "TSI"], null], "#ffffff", // Grey for null/unaffected
        ["interpolate", 
          ["linear"], 
          ["get", "TSI"],
          0.0, " #9400d3",  //highest risk
          0.07, " #e85347", 
          0.10, " #f67a0a", 
          0.13, " #fed86b", 
          0.16, " #00be0e", 
          0.19, "rgb(63, 63, 63)"  // lowest risk
        ]
      ],
      "circle-opacity": 0.08
    },
    layout: {
      visibility: "visible"
    }
  });

  // Add hover functionality to TSI circles with debug logging
  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    className: 'tsi-popup',
    maxWidth: '300px',
    offset: 10 // Add an offset so the popup doesn't cover the exact point
  });

  // Style the popup to ensure visibility
  const style = document.createElement('style');
  style.textContent = `
    .tsi-popup .mapboxgl-popup-content {
      background-color: white;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 2000;
    }
    .tsi-popup .mapboxgl-popup-tip {
      border-top-color: white;
      z-index: 2000;
    }
  `;
  document.head.appendChild(style);

  // Create a styled popup content
  const createPopupContent = (coordinates, tsiValue) => {
    // Determine risk class based on TSI value
    let riskClass, riskColor;
    if (tsiValue === null || tsiValue === undefined) {
      riskClass =
      riskClass = "Almost Unaffected";
      riskColor = "rgb(63, 63, 63)";
    }

    // Format coordinates to 4 decimal places
    const formattedLng = coordinates[0].toFixed(4);
    const formattedLat = coordinates[1].toFixed(4);
    
    return `
      <div style="padding: 8px;">
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 5px;">Location: ${formattedLng}, ${formattedLat}</div>
        <div style="color: ${riskColor}; font-weight: bold;">Risk Level: ${riskClass}</div>
        <div style="font-size: 12px;">TSI Value: ${tsiValue ? tsiValue.toFixed(3) : 'N/A'}</div>
      </div>
    `;
  };

  // Use map-wide mousemove event instead of layer-specific events
  map.on('mousemove', (e) => {
    // Query all rendered features at the cursor position from the 'tsi-points' layer
    const features = map.queryRenderedFeatures(e.point, { layers: ['tsi-points'] });
    
    // Check if any TSI points were found
    if (features.length > 0) {
      map.getCanvas().style.cursor = 'pointer';
      
      // Get TSI value and coordinates
      const coordinates = features[0].geometry.coordinates.slice();
      const tsiValue = features[0].properties.TSI;
      
      // Create and set popup content
      popup
        .setLngLat(coordinates)
        .setHTML(createPopupContent(coordinates, tsiValue))
        .addTo(map);
    } else {
      // No TSI points under cursor, reset cursor and remove popup
      map.getCanvas().style.cursor = '';
      popup.remove();
    }
  });



  // tsi legend 
  const legend = document.createElement('div');
  legend.id = 'tsi-legend';
  legend.style.position = 'absolute';
  legend.style.top = '200px';
  legend.style.left = '7px';
  legend.style.padding = '15px';
  legend.style.backgroundColor = 'transparent'; // Removed background
  legend.style.borderRadius = '7px';
  // legend.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
  legend.style.fontSize = '14px';
  legend.style.zIndex = '1000';
  legend.style.display = 'block';
  legend.style.color = '#444444'; // Dark grey text

  const title = document.createElement('div');
  title.innerHTML = '<strong>Tsunami Risk Index</strong>';
  title.style.marginBottom = '10px';
  title.style.color = '#444444'; // Dark grey text
  title.style.fontSize = '16px'; // Set title size to 16px
  legend.appendChild(title);

  const categories = [
    { color: ' #9400d3', label: 'Fatally High Risk' },
    { color: ' #e85347', label: 'High Risk' },
    { color: ' #f67a0a', label: 'Moderate Risk' },
    { color: 'rgb(255, 187, 0)', label: 'Low Risk' },
    { color: ' #00be0e', label: 'Very Low Risk' },
    { color: 'rgb(63, 63, 63)', label: 'Almost Unaffected' },
  ];

  categories.forEach(item => {
    const category = document.createElement('div');
    category.style.display = 'flex';
    category.style.alignItems = 'center';
    category.style.marginBottom = '7px';

    const colorBox = document.createElement('span');
    colorBox.style.width = '10px';
    colorBox.style.height = '10px';
    colorBox.style.backgroundColor = item.color;
    colorBox.style.display = 'inline-block';
    colorBox.style.marginRight = '10px';
    colorBox.style.borderRadius = '3px';

    const label = document.createElement('span');
    label.textContent = item.label;
    label.style.color = '#444444';

    category.appendChild(colorBox);
    category.appendChild(label);
    legend.appendChild(category);
  });

  document.body.appendChild(legend);
});



// coastlines
map.on("load", () => {
  map.addSource("sea-coastline", {
    type: "geojson",
    data: "data/earth-coastlines.geo.json",
  });

  map.addLayer({
    id: "sea-coastline-layer",
    type: "line",
    source: "sea-coastline",
    paint: {
      "line-color": " #019cde",
      "line-width": 0.6,
      "line-opacity": 0.9,
    },
  });

  // toggle coastline
  const coastlineToggleContainer = d3
    .select("body")
    .append("div")
    .style("position", "absolute")
    .style("top", "205px")
    .style("right", "5px")
    .style("z-index", "1000");

  const coastlineButton = coastlineToggleContainer
    .append("img")
    .attr("src", "images/coast.svg")
    .attr("alt", "Coastline")
    .style("margin", "5px")
    .style("padding", "5px")
    .style("cursor", "pointer")
    .style("width", "30px")
    .style("height", "30px")
    .style("border", "0px solid #ccc")
    .style("border-radius", "50%")
    .style("background-color", "#4181f2")
    .style("filter", "brightness(100%)") // Start as coloured
    .on("click", () => {
      const visibility = map.getLayoutProperty("sea-coastline-layer", "visibility");
      if (visibility === "visible") {
        map.setLayoutProperty("sea-coastline-layer", "visibility", "none");
        coastlineButton.style("filter", "brightness(30%)"); // Greyed out
      } else {
        map.setLayoutProperty("sea-coastline-layer", "visibility", "visible");
        coastlineButton.style("filter", "brightness(100%)"); // Coloured
      }
    });

  // hover description
  const coastlineDescription = d3
    .select("body")
    .append("div")
    .style("position", "absolute")
    .style("padding", "7px")
    .style("background-color", "white")
    .style("border", "0px solid #ccc")
    .style("border-radius", "20px")
    .style("box-shadow", "0px 2px 5px rgba(0, 0, 0, 0.2)")
    .style("font-size", "14px")
    .style("color", "#333")
    .style("display", "none")
    .style("z-index", "1000")
    .style("top", "210px")
    .style("right", "50px")
    .text("Show Southeast Asian Coastline");

  coastlineButton
    .on("mouseover", (event) => {
      coastlineDescription
        // .style("left", `${event.pageX - 160}px`)
        // .style("top", `${event.pageY + 0}px`)
        .style("display", "block");
    })
    .on("mouseout", () => {
      coastlineDescription.style("display", "none");
    });
});

// 100 years earthquake 1923 - 2024
d3.json("data/worldQuakesMiles.json").then((data) => {
  // console.log(data);

  const geoData = {
    type: "FeatureCollection",
    features: data.features.map((feature) => ({
      type: "Feature",
      geometry: feature.geometry,
      properties: {
        mag: feature.properties.mag,
      },
    })),
  };

  map.on("load", () => {
    map.addSource("earthquakes", {
      type: "geojson",
      data: geoData,
    });

    map.addLayer({
      id: "earthquake-points",
      type: "circle",
      source: "earthquakes",
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["get", "mag"], 0, 4, 5, 5],
        "circle-color": "#ff7900", // Orange
        "circle-opacity": 0.3,
        // 'circle-stroke-width': 1,
        "circle-stroke-color": "#ff7900", // Orange
      },
      layout: {
        visibility: "none", // Set to hidden initially
      },
    });
  });

  // toggle quakes
  const earthquakeToggleContainer = d3
    .select("body") // Changed from "#app" to "body" to ensure it is appended to the correct container
    .append("div")
    .style("position", "absolute")
    .style("top", "165px")
    .style("right", "5px")
    .style("z-index", "1000");

  const earthquakeButton = earthquakeToggleContainer
    .append("img")
    .attr("src", "images/quake.svg")
    .attr("alt", "Earthquakes")
    .style("margin", "5px")
    .style("padding", "5px")
    .style("cursor", "pointer")
    .style("width", "30px")
    .style("height", "30px")
    .style("border", "0px solid #ccc")
    .style("border-radius", "50%")
    .style("background-color", "#ff7900")
    .style("filter", "brightness(30%)") // Start as greyed out (inactive)
    .on("click", () => {
      const visibility = map.getLayoutProperty("earthquake-points", "visibility");
      if (visibility === "visible") {
        map.setLayoutProperty("earthquake-points", "visibility", "none");
        earthquakeButton.style("filter", "brightness(30%)"); // Greyed out
      } else {
        map.setLayoutProperty("earthquake-points", "visibility", "visible");
        earthquakeButton.style("filter", "brightness(100%)"); // Coloured
      }
    });

  // hover description
  const descriptionWindow = d3
    .select("body")
    .append("div")
    .style("position", "absolute")
    .style("padding", "7px")
    .style("background-color", "white")
    .style("border", "0px solid #ccc")
    .style("border-radius", "20px")
    .style("box-shadow", "0px 2px 5px rgba(0, 0, 0, 0.2)")
    .style("font-size", "14px")
    .style("color", "#333")
    .style("display", "none")
    .style("z-index", "1000")
    .style("top", "170px")
    .style("right", "50px")
    .text("Show Historical Earthquakes");

  earthquakeButton
    .on("mouseover", (event) => {
      descriptionWindow
        // .style("left", `${event.pageX - 240}px`)
        // .style("top", `${event.pageY + 0}px`)
        .style("display", "block");
    })
    .on("mouseout", () => {
      descriptionWindow.style("display", "none");
    });

});

// 100 years tsunami 1923 - 2024
d3.tsv("data/tsunami.tsv").then((data) => {
  // console.log(data);

  const filteredData = data.filter((d) => d.Longitude && d.Latitude);

  // Convert tsv to geojson
  const geoData = {
    type: "FeatureCollection",
    features: filteredData.map((d) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [+d.Longitude, +d.Latitude],
      },
      properties: {
        mag: +d.mag || 0,
        place: d.place || "Unknown Location",
      },
    })),
  };

  map.on("load", () => {
    map.addSource("tsunami", {
      type: "geojson",
      data: geoData,
    });

    // tsunami pt
    map.addLayer({
      id: "tsunami-points",
      type: "circle",
      source: "tsunami",
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["get", "mag"], 0, 4, 10, 20],
        "circle-color": " #00be9d", // Teal #00be9d
        "circle-opacity": 0.6,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#6dbefe", // Teal
      },
      layout: {
        visibility: "visible",
      },
    });

    // toggle tsunami
    const toggleContainer = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("top", "125px")
      .style("right", "5px")
      .style("z-index", "1000");

    const toggleButton = toggleContainer
      .append("img")
      .attr("src", "images/tsunami.svg")
      .attr("alt", "Tsunami")
      .style("margin", "5px")
      .style("padding", "5px")
      .style("cursor", "pointer")
      .style("width", "30px")
      .style("height", "30px")
      .style("border", "0px solid #ccc")
      .style("border-radius", "50%")
      .style("background-color", "#6dbefe")
      .style("filter", "brightness(100%)")
      .on("click", () => {
      const visibility = map.getLayoutProperty("tsunami-points", "visibility");
      if (visibility === "visible") {
        map.setLayoutProperty("tsunami-points", "visibility", "none");
        toggleButton.style("filter", "brightness(30%)"); // Greyed out
      } else {
        map.setLayoutProperty("tsunami-points", "visibility", "visible");
        toggleButton.style("filter", "brightness(100%)"); // Coloured
      }
      });

    // hover description
    const descriptionWindow = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("padding", "7px")
      .style("background-color", "white")
      .style("border", "0px solid #ccc")
      .style("border-radius", "20px")
      .style("box-shadow", "0px 2px 5px rgba(0, 0, 0, 0.2)")
      .style("font-size", "14px")
      .style("color", "#333")
      .style("display", "none")
      .style("top", "130px")
      .style("z-index", "1000")
      .style("right", "50px")
      .text("Show Historical Tsunamis");

    toggleButton
      .on("mouseover", (event) => {
        descriptionWindow
          // .style("left", `${event.pageX - 240}px`)
          // .style("top", `${event.pageY + 0}px`)
          .style("display", "block");
      })
      .on("mouseout", () => {
        descriptionWindow.style("display", "none");
      });
  });
});

map.on("style.load", () => {
  // southeast asian regional border sea.json
  fetch("data/sea.json")
    .then((response) => response.json())
    .then((data) => {
      map.addSource("sea", {
        type: "geojson",
        data: data,
      });
      map.addLayer({
        id: "sea-layer",
        type: "fill",
        source: "sea",
        paint: {
          "fill-color": "#000000",
          "fill-opacity": 0.3,
        },
      });

      // outline sea regional border
      map.addLayer({
        id: "sea-outline-layer",
        type: "line",
        source: "sea",
        paint: {
          "line-color": "#ffffff", // White outline
          "line-width": 1,
          "line-opacity": 0.7,
        },
      });
    })
    .catch((error) => console.error("Error loading GeoJSON:", error));
});

// Spatial population https://api.mapbox.com/v4/{tileset_id}/{zoom}/{x}/{y}{@2x}.{format}
map.on("load", function () {

  const tilesets = [
    "xuanx111.3josh1wj",
    "xuanx111.cuxcvnbr",
    "xuanx111.520thek8",
    "xuanx111.96iq0mqw",
    "xuanx111.d8izfyg0",
    "xuanx111.9vhjaglf",
    "xuanx111.9unpgwbt",
    "xuanx111.0156dejf",
    "xuanx111.0nyni93u",
    "xuanx111.a8vrhntz",
    "xuanx111.26ax1s7t",
    "xuanx111.agopr4of",
  ];

  tilesets.forEach((tileset, index) => {
    const sourceId = `tileset-${index}`;
    const layerId = `raster-layer-${index}`;

    map.addSource(sourceId, {
      type: "raster",
      tiles: [`https://api.mapbox.com/v4/${tileset}/{z}/{x}/{y}@2x.jpg?access_token=` + mapboxgl.accessToken],
      tileSize: 256,
    });

    map.addLayer({
      id: layerId,
      type: "raster",
      source: sourceId,
      paint: {
        "raster-opacity": 1,
        "raster-brightness-min": 1,
        "raster-brightness-max": 1,
      },
      layout: {
        visibility: "visible",
      },
    });

    // toggle spatpop
    const toggleContainer = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("top", "245px")
      .style("right", "5px")
      .style("z-index", "1000");

    const toggleButton = toggleContainer
      .append("img")
      .attr("src", "images/population.svg")
      .attr("alt", "Spatial Population Density")
      .style("margin", "5px")
      .style("padding", "5px")
      .style("cursor", "pointer")
      .style("width", "30px")
      .style("height", "30px")
      .style("border", "0px solid #ccc")
      .style("border-radius", "50%")
      .style("background-color", "#ffffff")
      .style("filter", "brightness(100%)") // Always active - changed from 30%
      .on("click", () => {
        let isActive = true; // Start as active
        tilesets.forEach((tileset, index) => {
          const layerId = `raster-layer-${index}`;
          const visibility = map.getLayoutProperty(layerId, "visibility");
          if (visibility === "visible") {
            map.setLayoutProperty(layerId, "visibility", "none");
            isActive = false;
          } else {
            map.setLayoutProperty(layerId, "visibility", "visible");
            isActive = true;
          }
        });
        toggleButton.style("filter", isActive ? "brightness(100%)" : "brightness(30%)");
      });

    // Make all tilesets visible initially
    tilesets.forEach((tileset, index) => {
      const layerId = `raster-layer-${index}`;
      map.setLayoutProperty(layerId, "visibility", "visible");
    });

    // hover description
    const descriptionWindow = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("padding", "7px")
      .style("background-color", "white")
      .style("border", "0px solid #ccc")
      .style("border-radius", "20px")
      .style("box-shadow", "0px 2px 5px rgba(0, 0, 0, 0.2)")
      .style("font-size", "14px")
      .style("color", "#333")
      .style("display", "none")
      .style("top", "250px")
      .style("z-index", "1000")
      .style("right", "50px")
      .text("Show Spatial Population Density");

    toggleButton
      .on("mouseover", () => {
        descriptionWindow.style("display", "block");
      })
      .on("mouseout", () => {
        descriptionWindow.style("display", "none");
      });
  });
});






// populationDensityScore from raster tile- Low Demand (<500 people/km²) – Score < 0.33, Moderate Demand (500-5,000 people/km²) – Score ~ 0.34 - 0.66, High Demand (>5,000 people/km²) – Score 0.67 - 1.0

//function for population count from raster tilesets
function getPopulationCount(color) {
  const rgb = color.match(/\d+/g);
  if (!rgb) return 0;

  const [r, g, b] = rgb.map(Number);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000; // calculate brightness

  // Map brightness to population count
  if (brightness < 100) {
    return 0; // Darkest, no one
  } else if (brightness < 150) {
    return 35;
  } else if (brightness < 200) {
    return 50;
  } else if (brightness < 250) {
    return 85;
  } else {
    return 110;
  }
}

async function getPopulationDensityScore(coordinates) {
  const zoomLevel = 12; // Adjust zoom level as needed
  const [lng, lat] = coordinates;
  const radiusKm = 20;
  const radiusPixels = Math.ceil((radiusKm * 256) / (40075 / Math.pow(2, zoomLevel))); // Convert radius to pixels

  const tilesets = [
    "xuanx111.3josh1wj",
    "xuanx111.cuxcvnbr",
    "xuanx111.520thek8",
    "xuanx111.96iq0mqw",
    "xuanx111.d8izfyg0",
    "xuanx111.9vhjaglf",
    "xuanx111.9unpgwbt",
    "xuanx111.0156dejf",
    "xuanx111.0nyni93u",
    "xuanx111.a8vrhntz",
    "xuanx111.26ax1s7t",
    "xuanx111.agopr4of",
  ];

  for (const tilesetId of tilesets) {
    const tileX = Math.floor(((lng + 180) / 360) * Math.pow(2, zoomLevel));
    const tileY = Math.floor(
      ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
        Math.pow(2, zoomLevel)
    );

    const url = `https://api.mapbox.com/v4/${tilesetId}/${zoomLevel}/${tileX}/${tileY}@2x.pngraw?access_token=${mapboxgl.accessToken}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        // console.warn(`Tileset ${tilesetId} not found for coordinates.`);
        continue; // Skip to the next tileset if this one fails
      }

      const blob = await response.blob();
      const imageBitmap = await createImageBitmap(blob);

      const canvas = document.createElement("canvas");
      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;

      const context = canvas.getContext("2d");
      context.drawImage(imageBitmap, 0, 0);

      const centerX = Math.floor((((lng + 180) % 360) / 360) * imageBitmap.width);
      const centerY = Math.floor(
        ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
          imageBitmap.height
      );

      let totalPopulation = 0;
      let pixelCount = 0;

      for (let x = -radiusPixels; x <= radiusPixels; x++) {
        for (let y = -radiusPixels; y <= radiusPixels; y++) {
          const pixelX = centerX + x;
          const pixelY = centerY + y;

          if (pixelX >= 0 && pixelX < imageBitmap.width && pixelY >= 0 && pixelY < imageBitmap.height) {
            const distance = Math.sqrt(x * x + y * y);
            if (distance <= radiusPixels) {
              const pixelData = context.getImageData(pixelX, pixelY, 1, 1).data;
              const color = `rgb(${pixelData[0]},${pixelData[1]},${pixelData[2]})`;

              totalPopulation += getPopulationCount(color);
              pixelCount++;
            }
          }
        }
      }

      const areaKm2 = Math.PI * Math.pow(radiusKm, 2); // Area of the circle in km²
      const populationDensity = totalPopulation / areaKm2;

      console.log(`Total Population: ${totalPopulation}`);
      console.log(`Population Density: ${populationDensity.toFixed(2)} people/km²`);

      let populationDensityScore;
      if (populationDensity < 500) {
        populationDensityScore = (populationDensity / 500) * 0.33; // Scale < 500 people/km²
      } else if (populationDensity <= 5000) {
        populationDensityScore = 0.34 + ((populationDensity - 500) / 4500) * 0.32; // Scale 500-5,000 people/km²
      } else {
        populationDensityScore = Math.min(0.67 + ((populationDensity - 5000) / 5000) * 0.33, 1.0); // Scale > 5,000 people/km²
      }

      console.log(`Population Density Score from tileset ${tilesetId}: ${populationDensityScore.toFixed(2)}`);
      return populationDensityScore; // Return the score from the first matching tileset
    } catch (error) {
      console.error(`Error fetching population density from tileset ${tilesetId}:`, error);
    }
  }

  console.warn("No matching tileset found for the given coordinates.");
  return 0.0; // Default score if no tileset matches
}

// // test population density score on singapore
// getPopulationDensityScore([103.8198, 1.3521]).then(score => {
//   console.log(`Population Density Score for Singapore: ${score.toFixed(2)}`);
// });

// // test population density score on hue
// getPopulationDensityScore([107.5909, 16.4637]).then(score => {
//   console.log(`Population Density Score for Hue: ${score.toFixed(2)}`);
// });

// // test population density score on jakarta
// getPopulationDensityScore([106.8456, -6.2088]).then(score => {
//   console.log(`Population Density Score for Jakarta: ${score.toFixed(2)}`);
// });

