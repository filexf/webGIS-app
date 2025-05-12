import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { useEffect, useState } from "react";
import { Bar, Doughnut, Pie } from "react-chartjs-2";

// Enregistrement des éléments nécessaires pour Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const DataDisplay = ({ polygonData }) => {
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dataType, setDataType] = useState("population");
  const [chartType, setChartType] = useState("bar");

  useEffect(() => {
    if (polygonData && polygonData.length > 0) {
      setIsLoading(true);

      // Simulation d'une requête de données basée sur le polygone
      // Dans une application réelle, vous remplaceriez cela par un appel API
      setTimeout(() => {
        const mockData = generateMockData(dataType);
        setChartData(mockData);
        setIsLoading(false);
      }, 500);
    }
  }, [polygonData, dataType]);

  // Fonction pour générer des données simulées
  const generateMockData = (type) => {
    if (type === "population") {
      return {
        labels: [
          "0-14 ans",
          "15-29 ans",
          "30-44 ans",
          "45-59 ans",
          "60-74 ans",
          "75+ ans",
        ],
        datasets: [
          {
            label: "Population par âge",
            data: [
              Math.floor(Math.random() * 20000),
              Math.floor(Math.random() * 25000),
              Math.floor(Math.random() * 30000),
              Math.floor(Math.random() * 25000),
              Math.floor(Math.random() * 15000),
              Math.floor(Math.random() * 10000),
            ],
            backgroundColor: [
              "rgba(255, 99, 132, 0.6)",
              "rgba(54, 162, 235, 0.6)",
              "rgba(255, 206, 86, 0.6)",
              "rgba(75, 192, 192, 0.6)",
              "rgba(153, 102, 255, 0.6)",
              "rgba(255, 159, 64, 0.6)",
            ],
          },
        ],
      };
    } else if (type === "landUse") {
      return {
        labels: ["Zones urbaines", "Agriculture", "Forêts", "Eau", "Autres"],
        datasets: [
          {
            label: "Utilisation des terres",
            data: [
              Math.floor(Math.random() * 40),
              Math.floor(Math.random() * 30),
              Math.floor(Math.random() * 20),
              Math.floor(Math.random() * 10),
              Math.floor(Math.random() * 10),
            ],
            backgroundColor: [
              "rgba(255, 99, 132, 0.6)",
              "rgba(54, 162, 235, 0.6)",
              "rgba(75, 192, 192, 0.6)",
              "rgba(153, 102, 255, 0.6)",
              "rgba(255, 159, 64, 0.6)",
            ],
          },
        ],
      };
    } else if (type === "climate") {
      return {
        labels: [
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
        ],
        datasets: [
          {
            label: "Température moyenne (°C)",
            data: Array.from(
              { length: 12 },
              () => Math.floor(Math.random() * 30) - 5
            ),
            backgroundColor: "rgba(255, 99, 132, 0.6)",
          },
          {
            label: "Précipitations (mm)",
            data: Array.from({ length: 12 }, () =>
              Math.floor(Math.random() * 100)
            ),
            backgroundColor: "rgba(54, 162, 235, 0.6)",
          },
        ],
      };
    }
  };

  // Options pour les graphiques
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text:
          dataType === "population"
            ? "Données démographiques"
            : dataType === "landUse"
            ? "Utilisation des terres"
            : "Données climatiques",
      },
    },
  };

  const renderChart = () => {
    if (!chartData) return null;

    switch (chartType) {
      case "bar":
        return <Bar data={chartData} options={options} />;
      case "pie":
        return <Pie data={chartData} options={options} />;
      case "doughnut":
        return <Doughnut data={chartData} options={options} />;
      default:
        return <Bar data={chartData} options={options} />;
    }
  };

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Analyse de la zone sélectionnée</h2>
        {polygonData && polygonData.length > 0 && !isLoading && (
          <div className="flex gap-2">
            <select
              className="p-2 border rounded"
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
            >
              <option value="population">Population</option>
              <option value="landUse">Utilisation des terres</option>
              <option value="climate">Climat</option>
            </select>
            <select
              className="p-2 border rounded"
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
            >
              <option value="bar">Histogramme</option>
              <option value="pie">Camembert</option>
              <option value="doughnut">Donut</option>
            </select>
          </div>
        )}
      </div>

      {!polygonData || polygonData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          Dessinez un polygone sur la carte pour afficher les données
        </div>
      ) : isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      ) : (
        <div className="h-64">{renderChart()}</div>
      )}
    </div>
  );
};

export default DataDisplay;
