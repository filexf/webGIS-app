import { useState } from "react";
import "./App.css";
import DataDisplay from "./components/DataDisplay";
import MapComponent from "./components/Map";
import {
  calculatePolygonArea,
  calculatePolygonPerimeter,
} from "./utils/geoUtils";

function App() {
  const [polygonCoords, setPolygonCoords] = useState([]);
  const [polygonMetrics, setPolygonMetrics] = useState(null);

  // Fonction appelée quand un polygone est dessiné
  const handlePolygonDrawn = (coords) => {
    setPolygonCoords(coords);

    // Calculer les métriques du polygone
    const area = calculatePolygonArea(coords);
    const perimeter = calculatePolygonPerimeter(coords);

    setPolygonMetrics({
      area: area,
      perimeter: perimeter,
      vertexCount: coords.length,
    });
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
            {polygonMetrics && (
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-3">
                  Métriques du polygone
                </h2>
                <div className="space-y-2">
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
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-medium text-blue-800 mb-2">
                Comment utiliser
              </h3>
              <ol className="list-decimal pl-5 space-y-1 text-blue-800">
                <li>Cliquez sur l'icône de polygone dans la barre d'outils</li>
                <li>Dessinez votre forme en cliquant sur la carte</li>
                <li>Terminez le dessin avec un double-clic</li>
                <li>Les données de la zone s'afficheront automatiquement</li>
              </ol>
            </div>
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
                Distribution par âge, densité de population
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
                Températures moyennes, précipitations
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
