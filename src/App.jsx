import { useState } from "react";
import "./App.css";
import DataDisplay from "./components/DataDisplay";
import MapComponent from "./components/Map";
import {
  fetchElevationData,
  fetchPopulationEstimate,
  fetchWeatherData,
} from "./utils/apiService";
import {
  calculatePolygonArea,
  calculatePolygonPerimeter,
} from "./utils/geoUtils";

function App() {
  const [polygonCoords, setPolygonCoords] = useState([]);
  const [polygonMetrics, setPolygonMetrics] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [populationData, setPopulationData] = useState(null);
  const [elevationData, setElevationData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fonction appelée quand un polygone est dessiné
  const handlePolygonDrawn = async (coords) => {
    setPolygonCoords(coords);
    setIsLoading(true);

    try {
      // Calculer les métriques de base du polygone
      const area = calculatePolygonArea(coords);
      const perimeter = calculatePolygonPerimeter(coords);

      // Calculer le centre du polygone
      const centerLat =
        coords.reduce((sum, point) => sum + point[0], 0) / coords.length;
      const centerLng =
        coords.reduce((sum, point) => sum + point[1], 0) / coords.length;

      // Récupérer les données externes
      const [weather, population, elevation] = await Promise.all([
        fetchWeatherData(coords),
        fetchPopulationEstimate(coords),
        fetchElevationData(coords),
      ]);

      // Métriques enrichies
      setPolygonMetrics({
        area: area,
        perimeter: perimeter,
        vertexCount: coords.length,
        center: { lat: centerLat.toFixed(6), lng: centerLng.toFixed(6) },
      });

      // Stockage des données pour utilisation ultérieure
      setWeatherData(weather);
      setPopulationData(population);
      setElevationData(elevation);
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Formatage des grands nombres avec des séparateurs de milliers
  const formatNumber = (num) => {
    return new Intl.NumberFormat("fr-FR").format(num);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-700 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">WebGIS Analyzer</h1>
          <p className="text-sm mt-1">
            Dessinez un polygone sur la carte pour analyser les données de la
            zone
          </p>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4 space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h2 className="text-xl font-semibold">Carte interactive</h2>
              <p className="text-sm text-gray-600">
                Utilisez l'outil de dessin pour sélectionner une zone
              </p>
            </div>

            <MapComponent onPolygonDrawn={handlePolygonDrawn} />
          </div>

          <div className="space-y-6">
            {isLoading ? (
              <div className="bg-white p-4 rounded-lg shadow-md flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
              </div>
            ) : polygonMetrics ? (
              <>
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <h2 className="text-xl font-semibold mb-3">
                    Métriques du polygone
                  </h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Superficie:</span>
                      <span className="font-medium">
                        {(polygonMetrics.area / 1000000).toFixed(2)} km²
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Périmètre:</span>
                      <span className="font-medium">
                        {(polygonMetrics.perimeter / 1000).toFixed(2)} km
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nombre de points:</span>
                      <span className="font-medium">
                        {polygonMetrics.vertexCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Centre (lat, lng):</span>
                      <span className="font-medium">
                        {polygonMetrics.center.lat}, {polygonMetrics.center.lng}
                      </span>
                    </div>
                  </div>
                </div>

                {elevationData && (
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-3">Topographie</h2>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Élévation moyenne:
                        </span>
                        <span className="font-medium">
                          {elevationData.centerElevation !== null
                            ? `${elevationData.centerElevation} ${elevationData.unit}`
                            : "Non disponible"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {populationData && (
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-3">Démographie</h2>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Population estimée:
                        </span>
                        <span className="font-medium">
                          {formatNumber(populationData.population)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Densité:</span>
                        <span className="font-medium">
                          {populationData.density} hab/km²
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {weatherData && (
                  <div className="bg-white p-4 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-3">Météo</h2>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Température:</span>
                        <span className="font-medium">
                          {weatherData.temperature}°C
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Humidité:</span>
                        <span className="font-medium">
                          {weatherData.humidity}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vent:</span>
                        <span className="font-medium">
                          {weatherData.windSpeed} m/s
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-medium text-blue-800 mb-2">
                  Comment utiliser
                </h3>
                <ol className="list-decimal pl-5 space-y-1 text-blue-800">
                  <li>
                    Cliquez sur l'icône de polygone dans la barre d'outils
                  </li>
                  <li>Dessinez votre forme en cliquant sur la carte</li>
                  <li>Terminez le dessin avec un double-clic</li>
                  <li>Les données de la zone s'afficheront automatiquement</li>
                </ol>
              </div>
            )}
          </div>
        </div>

        <DataDisplay polygonData={polygonCoords} />

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">
            À propos de cette application
          </h2>
          <p className="mb-4">
            Cette application WebGIS permet d'analyser différents types de
            données pour n'importe quelle région du monde. Dessinez simplement
            un polygone sur la carte et obtenez instantanément des informations
            sur:
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-md border border-green-200">
              <h3 className="font-semibold text-green-800">Démographie</h3>
              <p className="text-green-700 text-sm">
                Population estimée, densité
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
              <h3 className="font-semibold text-blue-800">
                Utilisation des terres
              </h3>
              <p className="text-blue-700 text-sm">
                Zones urbaines, agriculture, forêts, eau
              </p>
            </div>
            <div className="p-4 bg-amber-50 rounded-md border border-amber-200">
              <h3 className="font-semibold text-amber-800">
                Données climatiques
              </h3>
              <p className="text-amber-700 text-sm">
                Températures, précipitations, conditions actuelles
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-white p-4 mt-10">
        <div className="container mx-auto">
          <p className="text-center">
            © {new Date().getFullYear()} WebGIS Analyzer
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
