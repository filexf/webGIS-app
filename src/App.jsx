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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-sky-700 to-blue-900 text-white p-6 shadow-lg">
        <div className="container mx-auto text-center flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">WebGIS Analyzer</h1>
          <p className="text-sm mt-1 font-medium opacity-90">
            Dessinez un polygone sur la carte pour analyser les données de la
            zone
          </p>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4 space-y-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Carte interactive</h2>
              <p className="text-sm text-gray-600">
                Utilisez l'outil de dessin pour sélectionner une zone
              </p>
            </div>

            <MapComponent onPolygonDrawn={handlePolygonDrawn} />
          </div>

          <div className="space-y-6">
            {isLoading ? (
              <div className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-center h-56 border border-gray-100">
                <div className="flex flex-col items-center space-y-3">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-blue-600"></div>
                  <p className="text-blue-600 font-medium">Chargement des données...</p>
                </div>
              </div>
            ) : polygonMetrics ? (
              <>
                <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
                    Métriques du polygone
                  </h2>
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                        </svg>
                        Superficie:
                      </span>
                      <span className="font-medium text-gray-800">
                        {(polygonMetrics.area / 1000000).toFixed(2)} km²
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16a2 2 0 002 2h12a2 2 0 002-2V4" />
                        </svg>
                        Périmètre:
                      </span>
                      <span className="font-medium text-gray-800">
                        {(polygonMetrics.perimeter / 1000).toFixed(2)} km
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 11V9a2 2 0 00-2-2m2 4v4a2 2 0 104 0v-1m-4-3H9m2 0h4m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Nombre de points:
                      </span>
                      <span className="font-medium text-gray-800">
                        {polygonMetrics.vertexCount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Centre:
                      </span>
                      <span className="font-medium text-gray-800 text-sm">
                        {polygonMetrics.center.lat}, {polygonMetrics.center.lng}
                      </span>
                    </div>
                  </div>
                </div>

                {elevationData && (
                  <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
                      Topographie
                    </h2>
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h11M9 21V3m12 10h-7" />
                          </svg>
                          Élévation moyenne:
                        </span>
                        <span className="font-medium text-gray-800">
                          {elevationData.centerElevation !== null
                            ? `${elevationData.centerElevation} ${elevationData.unit}`
                            : "Non disponible"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {populationData && (
                  <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
                      Démographie
                    </h2>
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h11M9 21V3m12 10h-7" />
                          </svg>
                          Population estimée:
                        </span>
                        <span className="font-medium text-gray-800">
                          {formatNumber(populationData.population)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h11M9 21V3m12 10h-7" />
                          </svg>
                          Densité:
                        </span>
                        <span className="font-medium text-gray-800">
                          {populationData.density} hab/km²
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {weatherData && (
                  <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">
                      Météo
                    </h2>
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h11M9 21V3m12 10h-7" />
                          </svg>
                          Température:
                        </span>
                        <span className="font-medium text-gray-800">
                          {weatherData.temperature}°C
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h11M9 21V3m12 10h-7" />
                          </svg>
                          Humidité:
                        </span>
                        <span className="font-medium text-gray-800">
                          {weatherData.humidity}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h11M9 21V3m12 10h-7" />
                          </svg>
                          Vent:
                        </span>
                        <span className="font-medium text-gray-800">
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
