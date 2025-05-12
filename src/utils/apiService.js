import axios from "axios";
import { coordsToGeoJSON } from "./geoUtils";

/**
 * Récupère des données d'élévation pour un polygone depuis l'API Open-Elevation
 * @param {Array} polygonCoords - Coordonnées du polygone [lat, lng]
 * @returns {Promise} - Promise avec les données d'élévation
 */
export const fetchElevationData = async (polygonCoords) => {
  try {
    // Calcule le centre du polygone pour obtenir l'élévation
    const centerLat =
      polygonCoords.reduce((sum, point) => sum + point[0], 0) /
      polygonCoords.length;
    const centerLng =
      polygonCoords.reduce((sum, point) => sum + point[1], 0) /
      polygonCoords.length;

    // Utilise l'API Open-Elevation
    const response = await axios.get(
      `https://api.open-elevation.com/api/v1/lookup?locations=${centerLat},${centerLng}`
    );

    if (
      response.data &&
      response.data.results &&
      response.data.results.length > 0
    ) {
      return {
        centerElevation: response.data.results[0].elevation,
        unit: "mètres",
      };
    }

    throw new Error("Données d'élévation non disponibles");
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des données d'élévation:",
      error
    );
    // Fallback vers Google Elevation API si disponible
    try {
      const GOOGLE_API_KEY = process.env.VITE_GOOGLE_API_KEY;
      if (GOOGLE_API_KEY) {
        const centerLat =
          polygonCoords.reduce((sum, point) => sum + point[0], 0) /
          polygonCoords.length;
        const centerLng =
          polygonCoords.reduce((sum, point) => sum + point[1], 0) /
          polygonCoords.length;

        const googleResponse = await axios.get(
          `https://maps.googleapis.com/maps/api/elevation/json?locations=${centerLat},${centerLng}&key=${GOOGLE_API_KEY}`
        );

        if (
          googleResponse.data &&
          googleResponse.data.results &&
          googleResponse.data.results.length > 0
        ) {
          return {
            centerElevation: googleResponse.data.results[0].elevation,
            unit: "mètres",
          };
        }
      }
    } catch (e) {
      console.error(
        "Erreur lors de la récupération des données d'élévation via Google API:",
        e
      );
    }

    // Estimation basée sur la latitude et longitude
    return estimateElevationFromLocation(polygonCoords);
  }
};

/**
 * Récupère des informations météo actuelles pour une zone via l'API OpenWeatherMap
 * @param {Array} polygonCoords - Coordonnées du polygone [lat, lng]
 * @returns {Promise} - Promise avec les données météo
 */
export const fetchWeatherData = async (polygonCoords) => {
  try {
    // Calcule le centre du polygone pour la météo
    const centerLat =
      polygonCoords.reduce((sum, point) => sum + point[0], 0) /
      polygonCoords.length;
    const centerLng =
      polygonCoords.reduce((sum, point) => sum + point[1], 0) /
      polygonCoords.length;

    // API OpenWeatherMap
    const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

    if (!API_KEY) {
      throw new Error("Clé API OpenWeatherMap manquante");
    }

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${centerLat}&lon=${centerLng}&units=metric&appid=${API_KEY}`
    );

    return {
      temperature: response.data.main.temp,
      humidity: response.data.main.humidity,
      windSpeed: response.data.wind.speed,
      description: response.data.weather[0].description,
      icon: response.data.weather[0].icon,
      pressure: response.data.main.pressure,
      clouds: response.data.clouds?.all || 0,
      rain: response.data.rain?.["1h"] || 0,
      location: response.data.name,
      country: response.data.sys.country,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des données météo:", error);

    // Essayer une autre API météo
    try {
      // Autre option : WeatherAPI.com
      const WEATHERAPI_KEY = import.meta.env.VITE_WEATHERAPI_KEY;
      const centerLat =
        polygonCoords.reduce((sum, point) => sum + point[0], 0) /
        polygonCoords.length;
      const centerLng =
        polygonCoords.reduce((sum, point) => sum + point[1], 0) /
        polygonCoords.length;

      if (WEATHERAPI_KEY) {
        const alternateResponse = await axios.get(
          `https://api.weatherapi.com/v1/current.json?key=${WEATHERAPI_KEY}&q=${centerLat},${centerLng}&aqi=no`
        );

        return {
          temperature: alternateResponse.data.current.temp_c,
          humidity: alternateResponse.data.current.humidity,
          windSpeed: alternateResponse.data.current.wind_kph / 3.6, // Conversion en m/s
          description: alternateResponse.data.current.condition.text,
          icon: alternateResponse.data.current.condition.icon,
          pressure: alternateResponse.data.current.pressure_mb,
          clouds: alternateResponse.data.current.cloud,
          rain: 0, // Non disponible directement
          location: alternateResponse.data.location.name,
          country: alternateResponse.data.location.country,
        };
      }
    } catch (err) {
      console.error("Erreur avec l'API alternative:", err);
    }

    // Fallback vers des données simulées
    return generateWeatherDataFromLocation(polygonCoords);
  }
};

/**
 * Récupère des données historiques climatiques via l'API NOAA
 * @param {Array} polygonCoords - Coordonnées du polygone [lat, lng]
 * @returns {Promise} - Promise avec les données climatiques
 */
export const fetchClimateData = async (polygonCoords) => {
  try {
    // Calcule le centre du polygone
    const centerLat =
      polygonCoords.reduce((sum, point) => sum + point[0], 0) /
      polygonCoords.length;
    const centerLng =
      polygonCoords.reduce((sum, point) => sum + point[1], 0) /
      polygonCoords.length;

    // Arrondir aux 0.5 degrés les plus proches pour la compatibilité avec les données de grille
    const roundedLat = Math.round(centerLat * 2) / 2;
    const roundedLng = Math.round(centerLng * 2) / 2;

    // Utilise l'API WorldBank Climate
    const response = await axios.get(
      `https://climateknowledgeportal.worldbank.org/api/data/get-download-data/historical/mavg/1901-2016/${roundedLat}/${roundedLng}`
    );

    if (response.data && response.data.length > 0) {
      // Transformation des données pour notre format
      const processedData = processClimateData(response.data);
      return processedData;
    }

    throw new Error("Données climatiques non disponibles");
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des données climatiques:",
      error
    );

    // Fallback vers des données simulées basées sur la localisation
    return generateClimateDataFromLocation(polygonCoords);
  }
};

/**
 * Récupère des données de population pour la zone en utilisant l'API WorldPop
 * @param {Array} polygonCoords - Coordonnées du polygone [lat, lng]
 * @returns {Promise} - Promise avec estimation de population
 */
export const fetchPopulationEstimate = async (polygonCoords) => {
  try {
    const boundingBox = calculateBoundingBox(polygonCoords);
    const area = calculatePolygonAreaInKm2(polygonCoords);
    const geoJSON = coordsToGeoJSON(polygonCoords);

    // Essayer d'abord l'API World Population
    const { north, south, east, west } = boundingBox;
    const response = await axios.get(
      `https://api.worldpop.org/v1/services/stats?dataset=wpgp&year=2020&geojson=${JSON.stringify(
        geoJSON
      )}`
    );

    if (response.data && response.data.data) {
      return {
        population: Math.round(response.data.data.population),
        density: Math.round(response.data.data.population / area),
        area: area.toFixed(2),
      };
    }

    throw new Error("Données de population non disponibles");
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des données de population:",
      error
    );

    // Essayer une autre source
    try {
      const geocodingAPIKey = import.meta.env.VITE_GEOCODING_API_KEY;
      const centerLat =
        polygonCoords.reduce((sum, point) => sum + point[0], 0) /
        polygonCoords.length;
      const centerLng =
        polygonCoords.reduce((sum, point) => sum + point[1], 0) /
        polygonCoords.length;

      if (geocodingAPIKey) {
        // Utiliser une API de géocodage inverse pour déterminer la localité
        const reverseResponse = await axios.get(
          `https://api.opencagedata.com/geocode/v1/json?q=${centerLat}+${centerLng}&key=${geocodingAPIKey}&no_annotations=1`
        );

        if (
          reverseResponse.data &&
          reverseResponse.data.results &&
          reverseResponse.data.results.length > 0
        ) {
          const locationData = reverseResponse.data.results[0];

          // Ensuite, estimer la population basée sur les informations de la localité
          const area = calculatePolygonAreaInKm2(polygonCoords);

          // Si nous avons une information sur le pays, utiliser les données de densité par pays
          if (locationData.components.country_code) {
            const countryDensity = await getCountryPopulationDensity(
              locationData.components.country_code
            );
            const estimatedPopulation = Math.round(countryDensity * area);

            return {
              population: estimatedPopulation,
              density: countryDensity,
              area: area.toFixed(2),
              country: locationData.components.country,
              locality:
                locationData.components.city ||
                locationData.components.town ||
                locationData.components.state,
            };
          }
        }
      }
    } catch (err) {
      console.error("Erreur avec l'API alternative:", err);
    }

    // Fallback vers une estimation basée sur la localisation
    return estimatePopulationFromLocation(polygonCoords);
  }
};

/**
 * Récupère des données d'utilisation des terres pour la zone via l'API OpenStreetMap
 * @param {Array} polygonCoords - Coordonnées du polygone [lat, lng]
 * @returns {Promise} - Promise avec les données d'utilisation des terres
 */
export const fetchLandUseData = async (polygonCoords) => {
  try {
    const boundingBox = calculateBoundingBox(polygonCoords);
    const { north, south, east, west } = boundingBox;

    // Construire la requête Overpass API pour OpenStreetMap
    const query = `
      [out:json];
      (
        // Les zones urbaines
        node["landuse"="residential"](${south},${west},${north},${east});
        way["landuse"="residential"](${south},${west},${north},${east});
        relation["landuse"="residential"](${south},${west},${north},${east});

        // Les zones agricoles
        node["landuse"="farmland"](${south},${west},${north},${east});
        way["landuse"="farmland"](${south},${west},${north},${east});
        relation["landuse"="farmland"](${south},${west},${north},${east});

        // Les forêts
        node["natural"="wood"](${south},${west},${north},${east});
        way["natural"="wood"](${south},${west},${north},${east});
        relation["natural"="wood"](${south},${west},${north},${east});

        // L'eau
        node["natural"="water"](${south},${west},${north},${east});
        way["natural"="water"](${south},${west},${north},${east});
        relation["natural"="water"](${south},${west},${north},${east});
      );
      out body;
      >;
      out skel qt;
    `;

    // Si la zone est trop grande, on utilise une estimation
    const areaInKm2 = calculatePolygonAreaInKm2(polygonCoords);
    if (areaInKm2 > 100) {
      // Éviter de surcharger l'API pour les grandes zones
      return estimateLandUseFromLocation(polygonCoords);
    }

    const response = await axios.post(
      "https://overpass-api.de/api/interpreter",
      query,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    if (response.data && response.data.elements) {
      // Analyse des résultats pour déterminer la répartition
      const elements = response.data.elements;

      // Compter les éléments par type
      let urban = 0;
      let agriculture = 0;
      let forest = 0;
      let water = 0;

      elements.forEach((element) => {
        if (element.tags) {
          if (element.tags.landuse === "residential") urban++;
          if (element.tags.landuse === "farmland") agriculture++;
          if (element.tags.natural === "wood") forest++;
          if (element.tags.natural === "water") water++;
        }
      });

      // Calculer les pourcentages (estimation approximative)
      const total = urban + agriculture + forest + water;

      // Si aucune donnée n'est disponible, utiliser l'estimation
      if (total === 0) {
        return estimateLandUseFromLocation(polygonCoords);
      }

      // Calculer les pourcentages
      const urbanPercent = Math.round((urban / total) * 100);
      const agriculturePercent = Math.round((agriculture / total) * 100);
      const forestPercent = Math.round((forest / total) * 100);
      const waterPercent = Math.round((water / total) * 100);

      // S'assurer que la somme est de 100%
      const calculatedTotal =
        urbanPercent + agriculturePercent + forestPercent + waterPercent;
      const otherPercent = 100 - calculatedTotal;

      return {
        urban: urbanPercent,
        agriculture: agriculturePercent,
        forest: forestPercent,
        water: waterPercent,
        other: otherPercent >= 0 ? otherPercent : 0,
        dataSource: "OpenStreetMap",
      };
    }

    throw new Error("Données d'utilisation des terres non disponibles");
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des données d'utilisation des terres:",
      error
    );
    return estimateLandUseFromLocation(polygonCoords);
  }
};

// Fonctions utilitaires

/**
 * Calcule une boîte englobante pour un ensemble de coordonnées
 * @param {Array} coordinates - Tableau de coordonnées [lat, lng]
 * @returns {Object} - Objet contenant les limites nord, sud, est et ouest
 */
function calculateBoundingBox(coordinates) {
  if (!coordinates || coordinates.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 };
  }

  let north = coordinates[0][0];
  let south = coordinates[0][0];
  let east = coordinates[0][1];
  let west = coordinates[0][1];

  coordinates.forEach((coord) => {
    north = Math.max(north, coord[0]);
    south = Math.min(south, coord[0]);
    east = Math.max(east, coord[1]);
    west = Math.min(west, coord[1]);
  });

  return { north, south, east, west };
}

/**
 * Calcule l'aire approximative d'un polygone en km²
 * @param {Array} polygonCoords - Coordonnées du polygone [lat, lng]
 * @returns {Number} - Aire en km²
 */
function calculatePolygonAreaInKm2(polygonCoords) {
  // Implémentation simplifiée de la formule de l'aire de Gauss
  if (!polygonCoords || polygonCoords.length < 3) {
    return 0;
  }

  // Convertir en radians
  const toRadians = (deg) => deg * (Math.PI / 180);

  // Rayon de la Terre en km
  const earthRadius = 6371;

  let area = 0;
  const n = polygonCoords.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const lat1 = toRadians(polygonCoords[i][0]);
    const lon1 = toRadians(polygonCoords[i][1]);
    const lat2 = toRadians(polygonCoords[j][0]);
    const lon2 = toRadians(polygonCoords[j][1]);

    area += lon1 * Math.sin(lat2) - lon2 * Math.sin(lat1);
  }

  area = Math.abs((area * earthRadius * earthRadius) / 2);
  return area;
}

/**
 * Estimation naïve pour déterminer si un point est probablement dans un océan
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 * @returns {Boolean} - True si le point est probablement dans un océan
 */
function isLikelyOceanLocation(lat, lng) {
  // Zones de terres connues (estimation très approximative)
  // Europe
  if (lat > 35 && lat < 70 && lng > -10 && lng < 40) return false;

  // Amérique du Nord
  if (lat > 15 && lat < 70 && lng > -170 && lng < -50) return false;

  // Amérique du Sud
  if (lat > -60 && lat < 15 && lng > -80 && lng < -35) return false;

  // Afrique
  if (lat > -40 && lat < 35 && lng > -20 && lng < 55) return false;

  // Asie
  if (lat > 0 && lat < 75 && lng > 40 && lng < 180) return false;

  // Australie
  if (lat > -45 && lat < -10 && lng > 110 && lng < 155) return false;

  // Antarctique (très approximatif)
  if (lat < -60) return false;

  // Sinon, probablement un océan
  return true;
}

/**
 * Estimation de la population basée sur la localisation
 * @param {Array} polygonCoords - Coordonnées du polygone [lat, lng]
 * @returns {Object} - Données de population estimées
 */
function estimatePopulationFromLocation(polygonCoords) {
  const boundingBox = calculateBoundingBox(polygonCoords);
  const area = calculatePolygonAreaInKm2(polygonCoords);

  const centerLat = (boundingBox.north + boundingBox.south) / 2;
  const centerLng = (boundingBox.east + boundingBox.west) / 2;

  // Estimation de la densité basée sur la latitude
  let densityEstimate;

  if (centerLat > 60 || centerLat < -60) {
    // Zones polaires - très faiblement peuplées
    densityEstimate = Math.random() * 2 + 0.1;
  } else if (centerLat > 45 || centerLat < -45) {
    // Zones subpolaires - faiblement peuplées
    densityEstimate = Math.random() * 40 + 5;
  } else if (centerLat > 23 || centerLat < -23) {
    // Zones tempérées - densité moyenne à élevée
    densityEstimate = Math.random() * 200 + 50;
  } else {
    // Zones tropicales - varie beaucoup, mais généralement densité moyenne
    densityEstimate = Math.random() * 150 + 30;
  }

  // Ajustement pour les océans
  const isLikelyOcean = isLikelyOceanLocation(centerLat, centerLng);
  if (isLikelyOcean) {
    densityEstimate = 0;
  }

  // Population estimée
  const estimatedPopulation = Math.round(area * densityEstimate);

  return {
    population: estimatedPopulation,
    density: Math.round(densityEstimate),
    area: area.toFixed(2),
    note: "Estimation basée sur la localisation géographique",
  };
}

/**
 * Estimation des données d'utilisation des terres basée sur la localisation
 * @param {Array} polygonCoords - Coordonnées du polygone [lat, lng]
 * @returns {Object} - Données d'utilisation des terres
 */
function estimateLandUseFromLocation(polygonCoords) {
  const centerLat =
    polygonCoords.reduce((sum, point) => sum + point[0], 0) /
    polygonCoords.length;
  const centerLng =
    polygonCoords.reduce((sum, point) => sum + point[1], 0) /
    polygonCoords.length;

  // Vérifier si la zone est probablement un océan
  const isLikelyOcean = isLikelyOceanLocation(centerLat, centerLng);

  if (isLikelyOcean) {
    return {
      water: 98,
      urban: 0,
      agriculture: 0,
      forest: 0,
      other: 2,
      dataSource: "Estimation (océan)",
    };
  }

  // Distribution plausible selon la latitude
  if (Math.abs(centerLat) > 60) {
    // Zones polaires - principalement naturelles
    return {
      water: Math.floor(Math.random() * 15),
      urban: Math.floor(Math.random() * 5),
      agriculture: Math.floor(Math.random() * 10),
      forest: Math.floor(Math.random() * 30 + 40),
      other: Math.floor(Math.random() * 30 + 10),
      dataSource: "Estimation (zone polaire)",
    };
  } else if (Math.abs(centerLat) > 45) {
    // Zones subpolaires - forêts et agriculture
    return {
      water: Math.floor(Math.random() * 15),
      urban: Math.floor(Math.random() * 15 + 5),
      agriculture: Math.floor(Math.random() * 25 + 15),
      forest: Math.floor(Math.random() * 30 + 20),
      other: Math.floor(Math.random() * 15 + 5),
      dataSource: "Estimation (zone subpolaire)",
    };
  } else if (Math.abs(centerLat) > 23) {
    // Zones tempérées - plus urbanisées
    return {
      water: Math.floor(Math.random() * 10),
      urban: Math.floor(Math.random() * 30 + 15),
      agriculture: Math.floor(Math.random() * 30 + 20),
      forest: Math.floor(Math.random() * 20 + 10),
      other: Math.floor(Math.random() * 15),
      dataSource: "Estimation (zone tempérée)",
    };
  } else {
    // Zones tropicales - variées
    return {
      water: Math.floor(Math.random() * 15),
      urban: Math.floor(Math.random() * 20 + 5),
      agriculture: Math.floor(Math.random() * 25 + 15),
      forest: Math.floor(Math.random() * 35 + 20),
      other: Math.floor(Math.random() * 20),
      dataSource: "Estimation (zone tropicale)",
    };
  }
}

/**
 * Génère des données météo simulées basées sur la localisation
 * @param {Array} polygonCoords - Coordonnées du polygone [lat, lng]
 * @returns {Object} - Données météo simulées
 */
function generateWeatherDataFromLocation(polygonCoords) {
  const centerLat =
    polygonCoords.reduce((sum, point) => sum + point[0], 0) /
    polygonCoords.length;

  // La température dépend fortement de la latitude
  let baseTemp = 25 - Math.abs(centerLat) * 0.5; // Plus chaud à l'équateur, plus froid aux pôles

  // Ajout d'une variation aléatoire
  baseTemp += (Math.random() - 0.5) * 5;

  // Ajustement selon la saison (en supposant Mai = printemps dans l'hémisphère nord, automne dans l'hémisphère sud)
  if (centerLat >= 0) {
    // Hémisphère nord: printemps (plus chaud)
    baseTemp += 3;
  } else {
    // Hémisphère sud: automne (plus frais)
    baseTemp -= 3;
  }

  return {
    temperature: Math.round(baseTemp * 10) / 10,
    humidity: Math.floor(Math.random() * 50 + 30), // 30-80%
    windSpeed: Math.floor(Math.random() * 50 + 10) / 10, // 1-6 m/s
    description: "Données météo estimées",
    pressure: 1013 + Math.floor(Math.random() * 20 - 10),
    clouds: Math.floor(Math.random() * 100),
    dataSource: "Simulation basée sur la localisation",
  };
}

/**
 * Estime l'élévation basée sur la localisation
 * @param {Array} polygonCoords - Coordonnées du polygone [lat, lng]
 * @returns {Object} - Données d'élévation estimées
 */
function estimateElevationFromLocation(polygonCoords) {
  const centerLat =
    polygonCoords.reduce((sum, point) => sum + point[0], 0) /
    polygonCoords.length;
  const centerLng =
    polygonCoords.reduce((sum, point) => sum + point[1], 0) /
    polygonCoords.length;

  // Vérifier si la zone est probablement un océan
  const isLikelyOcean = isLikelyOceanLocation(centerLat, centerLng);

  if (isLikelyOcean) {
    return {
      centerElevation: 0,
      unit: "mètres",
      dataSource: "Estimation (océan)",
    };
  }

  // Estimation très approximative basée sur la continentalité et la latitude
  let baseElevation = Math.random() * 200 + 50; // 50-250m pour les zones typiques

  // Zones montagneuses connues (très approximatif)
  // Alpes
  if (centerLat > 43 && centerLat < 48 && centerLng > 5 && centerLng < 15) {
    baseElevation = Math.random() * 2000 + 1000;
  }
  // Himalaya
  else if (
    centerLat > 27 &&
    centerLat < 36 &&
    centerLng > 70 &&
    centerLng < 95
  ) {
    baseElevation = Math.random() * 4000 + 2000;
  }
  // Andes
  else if (
    centerLat > -50 &&
    centerLat < 10 &&
    centerLng > -80 &&
    centerLng < -65
  ) {
    baseElevation = Math.random() * 3000 + 1500;
  }
  // Rocheuses
  else if (
    centerLat > 35 &&
    centerLat < 60 &&
    centerLng > -125 &&
    centerLng < -105
  ) {
    baseElevation = Math.random() * 2000 + 1000;
  }

  return {
    centerElevation: Math.round(baseElevation),
    unit: "mètres",
    dataSource: "Estimation basée sur la localisation",
  };
}

/**
 * Génère des données climatiques basées sur la localisation
 * @param {Array} polygonCoords - Coordonnées du polygone
 * @returns {Object} - Données climatiques sur 12 mois
 */
function generateClimateDataFromLocation(polygonCoords) {
  const centerLat =
    polygonCoords.reduce((sum, point) => sum + point[0], 0) /
    polygonCoords.length;
  const isNorthernHemisphere = centerLat >= 0;

  const months = [
    "Jan",
    "Fév",
    "Mar",
    "Avr",
    "Mai",
    "Juin",
    "Juil",
    "Août",
    "Sep",
    "Oct",
    "Nov",
    "Déc",
  ];

  // La différence entre min et max température dépend de la latitude
  const temperatureRange = Math.min(35, Math.abs(centerLat)) + 5;
  const baseTemperature = Math.max(5, 25 - Math.abs(centerLat) / 2);

  let temperatures = [];
  if (isNorthernHemisphere) {
    temperatures = months.map((_, index) => {
      return (
        baseTemperature +
        (temperatureRange / 2) * Math.sin(((index - 3) / 12) * 2 * Math.PI)
      );
    });
  } else {
    temperatures = months.map((_, index) => {
      return (
        baseTemperature +
        (temperatureRange / 2) * Math.sin(((index + 3) / 12) * 2 * Math.PI)
      );
    });
  }

  // Précipitations
  const baseRain = Math.random() * 40 + 20;
  const precipitation = temperatures.map((temp, i) => {
    const prevTemp =
      i > 0 ? temperatures[i - 1] : temperatures[temperatures.length - 1];
    const tempDiff = Math.abs(temp - prevTemp);
    // Plus de précipitations lors des changements de température et quand il fait plus chaud
    const rainFactor = tempDiff * 5 + temp / 3;
    return Math.max(5, baseRain + Math.random() * rainFactor);
  });

  return {
    months,
    temperatures: temperatures.map((t) => Math.round(t * 10) / 10),
    precipitation: precipitation.map((p) => Math.round(p)),
    dataSource: "Données simulées basées sur la localisation",
  };
}

/**
 * Récupère la densité de population d'un pays
 * @param {String} countryCode - Code ISO du pays (2 lettres)
 * @returns {Number} - Densité de population (habitants/km²)
 */
async function getCountryPopulationDensity(countryCode) {
  // Données de densité de population par pays (habitants/km²)
  const densityData = {
    af: 54.4, // Afghanistan
    al: 104.8, // Albanie
    dz: 15.9, // Algérie
    us: 33.2, // États-Unis
    fr: 117.6, // France
    de: 235.6, // Allemagne
    gb: 270.7, // Royaume-Uni
    it: 201.3, // Italie
    es: 92.9, // Espagne
    ch: 207.3, // Suisse
    ca: 3.9, // Canada
    mx: 57.3, // Mexique
    br: 24.7, // Brésil
    ar: 15.6, // Argentine
    au: 3.1, // Australie
    nz: 17.9, // Nouvelle-Zélande
    jp: 334.8, // Japon
    cn: 147.8, // Chine
    in: 393.3, // Inde
    ru: 8.6, // Russie
    // Et d'autres pays...
  };

  // Convertir le code pays en minuscules
  const code = countryCode.toLowerCase();

  // Si nous avons des données sur ce pays, les utiliser
  if (densityData[code]) {
    return densityData[code];
  }

  // Sinon, retourner une valeur par défaut raisonnable
  return 50; // Moyenne mondiale approximative
}

/**
 * Traite les données climatiques brutes
 * @param {Array} rawData - Données brutes
 * @returns {Object} - Données formatées
 */
function processClimateData(rawData) {
  const months = [
    "Jan",
    "Fév",
    "Mar",
    "Avr",
    "Mai",
    "Juin",
    "Juil",
    "Août",
    "Sep",
    "Oct",
    "Nov",
    "Déc",
  ];
  const temperatures = Array(12).fill(0);
  const precipitation = Array(12).fill(0);

  // Traitement des données brutes (à adapter selon le format réel)
  rawData.forEach((item) => {
    const monthIndex = months.indexOf(item.month);
    if (monthIndex >= 0) {
      temperatures[monthIndex] = item.temperature;
      precipitation[monthIndex] = item.precipitation;
    }
  });

  return {
    months,
    temperatures,
    precipitation,
    dataSource: "Données WorldBank Climate",
  };
}
