/**
 * Calcule l'aire d'un polygone en mètres carrés
 * @param {Array} polygonCoords - Tableau de coordonnées [lat, lng]
 * @returns {Number} - Aire en mètres carrés
 */
export const calculatePolygonArea = (polygonCoords) => {
  // Implémentation de la formule de l'aire de Gauss (Shoelace formula)
  if (!polygonCoords || polygonCoords.length < 3) {
    return 0;
  }

  // Convertir en radians
  const toRadians = (deg) => deg * (Math.PI / 180);

  // Rayon de la Terre en mètres
  const earthRadius = 6371000;

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
};

/**
 * Calcule le périmètre d'un polygone en mètres
 * @param {Array} polygonCoords - Tableau de coordonnées [lat, lng]
 * @returns {Number} - Périmètre en mètres
 */
export const calculatePolygonPerimeter = (polygonCoords) => {
  if (!polygonCoords || polygonCoords.length < 2) {
    return 0;
  }

  // Rayon de la Terre en mètres
  const earthRadius = 6371000;

  let perimeter = 0;
  const n = polygonCoords.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const lat1 = polygonCoords[i][0] * (Math.PI / 180);
    const lng1 = polygonCoords[i][1] * (Math.PI / 180);
    const lat2 = polygonCoords[j][0] * (Math.PI / 180);
    const lng2 = polygonCoords[j][1] * (Math.PI / 180);

    // Formule haversine pour calculer la distance
    const dLat = lat2 - lat1;
    const dLng = lng2 - lng1;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;

    perimeter += distance;
  }

  return perimeter;
};

/**
 * Convertit un tableau de coordonnées en format GeoJSON
 * @param {Array} polygonCoords - Tableau de coordonnées [lat, lng]
 * @returns {Object} - Objet GeoJSON
 */
export const coordsToGeoJSON = (polygonCoords) => {
  if (!polygonCoords || polygonCoords.length < 3) {
    return null;
  }

  // GeoJSON utilise [lng, lat] contrairement à Leaflet qui utilise [lat, lng]
  const coordinates = polygonCoords.map((coord) => [coord[1], coord[0]]);

  // Fermer le polygone en ajoutant le premier point à la fin s'il n'y est pas déjà
  if (
    coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
    coordinates[0][1] !== coordinates[coordinates.length - 1][1]
  ) {
    coordinates.push([...coordinates[0]]);
  }

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [coordinates],
    },
  };
};

/**
 * Récupère les données d'une zone depuis un service externe
 * @param {Array} polygonCoords - Tableau de coordonnées [lat, lng]
 * @param {String} dataType - Type de données à récupérer
 * @returns {Promise} - Promise contenant les données récupérées
 */
export const fetchDataForArea = async (polygonCoords, dataType) => {
  // Note: Dans une application réelle, cette fonction ferait des appels API à des services externes
  // Ici, nous simulons des données pour la démonstration
  const geoJSON = coordsToGeoJSON(polygonCoords);

  return new Promise((resolve) => {
    setTimeout(() => {
      if (dataType === "population") {
        resolve({
          total: Math.floor(Math.random() * 500000),
          density: Math.floor(Math.random() * 5000),
          ageGroups: {
            "0-14": Math.floor(Math.random() * 20),
            "15-29": Math.floor(Math.random() * 25),
            "30-44": Math.floor(Math.random() * 20),
            "45-59": Math.floor(Math.random() * 15),
            "60-74": Math.floor(Math.random() * 15),
            "75+": Math.floor(Math.random() * 10),
          },
        });
      } else if (dataType === "landUse") {
        resolve({
          urban: Math.floor(Math.random() * 40),
          agriculture: Math.floor(Math.random() * 30),
          forest: Math.floor(Math.random() * 20),
          water: Math.floor(Math.random() * 10),
          other: Math.floor(Math.random() * 10),
        });
      } else if (dataType === "climate") {
        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const temperatures = months.map(
          () => Math.floor(Math.random() * 30) - 5
        );
        const precipitation = months.map(() => Math.floor(Math.random() * 100));

        resolve({
          months,
          temperatures,
          precipitation,
        });
      } else {
        resolve({
          error: "Type de données non supporté",
        });
      }
    }, 500);
  });
};
