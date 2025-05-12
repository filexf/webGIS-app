import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useEffect, useState } from "react";
import { Bar, Doughnut, Pie } from "react-chartjs-2";
import {
  fetchClimateData,
  fetchLandUseData,
  fetchPopulationEstimate,
} from "../utils/apiService";

// Enregistrement des éléments nécessaires pour Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const DataDisplay = ({ polygonData }) => {
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dataType, setDataType] = useState("landUse");
  const [chartType, setChartType] = useState("pie");
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState(null);

  useEffect(() => {
    if (polygonData && polygonData.length > 0) {
      setIsLoading(true);
      setError(null);

      // Récupération de données réelles basées sur le type demandé
      const fetchData = async () => {
        try {
          let result;

          switch (dataType) {
            case "landUse":
              result = await fetchLandUseData(polygonData);
              generateLandUseChart(result);
              setDataSource(result.dataSource || "Source inconnue");
              break;
            case "population":
              result = await fetchPopulationEstimate(polygonData);

              // Génération de données démographiques par tranche d'âge
              const totalPop = result.population;
              const ageDistribution = generateAgeDistribution(totalPop);
              generatePopulationChart(ageDistribution);
              setDataSource(
                result.dataSource || result.note || "Source inconnue"
              );
              break;
            case "climate":
              result = await fetchClimateData(polygonData);
              generateClimateChart(result);
              setDataSource(result.dataSource || "Source inconnue");
              break;
            default:
              setError("Type de données non supporté");
          }
        } catch (err) {
          console.error("Erreur lors de la récupération des données:", err);
          setError("Impossible de récupérer les données");
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [polygonData, dataType]);

  // Génération d'une distribution d'âge plausible pour une population donnée
  const generateAgeDistribution = (totalPopulation) => {
    // Distribution d'âge typique (pourcentages approximatifs)
    const distribution = {
      "0-14 ans": Math.random() * 10 + 15, // 15-25%
      "15-29 ans": Math.random() * 10 + 15, // 15-25%
      "30-44 ans": Math.random() * 8 + 16, // 16-24%
      "45-59 ans": Math.random() * 8 + 14, // 14-22%
      "60-74 ans": Math.random() * 8 + 10, // 10-18%
      "75+ ans": Math.random() * 8 + 4, // 4-12%
    };

    // Normalisation pour que la somme soit égale à 100%
    const total = Object.values(distribution).reduce((a, b) => a + b, 0);
    const normalizedDistribution = {};

    Object.keys(distribution).forEach((key) => {
      normalizedDistribution[key] = Math.round(
        (distribution[key] / total) * totalPopulation
      );
    });

    return normalizedDistribution;
  };

  // Génération du graphique d'utilisation des terres
  const generateLandUseChart = (data) => {
    if (!data) return;

    const chartData = {
      labels: ["Zones urbaines", "Agriculture", "Forêts", "Eau", "Autres"],
      datasets: [
        {
          label: "Utilisation des terres (%)",
          data: [
            data.urban || 0,
            data.agriculture || 0,
            data.forest || 0,
            data.water || 0,
            data.other || 0,
          ],
          backgroundColor: [
            "rgba(255, 99, 132, 0.6)",
            "rgba(75, 192, 192, 0.6)",
            "rgba(54, 162, 235, 0.6)",
            "rgba(153, 102, 255, 0.6)",
            "rgba(255, 159, 64, 0.6)",
          ],
        },
      ],
    };

    setChartData(chartData);
  };

  // Génération du graphique de population
  const generatePopulationChart = (data) => {
    if (!data) return;

    const chartData = {
      labels: Object.keys(data),
      datasets: [
        {
          label: "Population par tranche d'âge",
          data: Object.values(data),
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

    setChartData(chartData);
  };

  // Génération du graphique climatique
  const generateClimateChart = (data) => {
    if (!data) return;

    const { months, temperatures, precipitation } = data;

    const chartData = {
      labels: months,
      datasets: [
        {
          label: "Température moyenne (°C)",
          data: temperatures,
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 2,
          type: "line",
          yAxisID: "y",
          tension: 0.3,
          pointRadius: 3,
        },
        {
          label: "Précipitations (mm)",
          data: precipitation,
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
          type: "bar",
          yAxisID: "y1",
        },
      ],
    };

    setChartData({
      ...chartData,
      isClimate: true,
    });
  };

  // Options pour les graphiques standards (non-climat)
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
            ? "Utilisation des terres (%)"
            : "Données climatiques",
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }

            let value = context.parsed;
            // Si c'est un camembert ou un donut
            if (
              context.chart.config.type === "pie" ||
              context.chart.config.type === "doughnut"
            ) {
              value = context.raw;
            }

            if (dataType === "population") {
              return label + new Intl.NumberFormat("fr-FR").format(value);
            } else if (dataType === "landUse") {
              return label + value + "%";
            } else {
              return label + value;
            }
          },
        },
      },
    },
  };

  // Options spécifiques pour les données climatiques (double axe Y)
  const climateOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Données climatiques mensuelles",
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        type: "linear",
        display: true,
        position: "left",
        title: {
          display: true,
          text: "Température (°C)",
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        grid: {
          drawOnChartArea: true,
        },
        title: {
          display: true,
          text: "Précipitations (mm)",
        },
      },
    },
  };

  const renderChart = () => {
    if (!chartData) return null;

    // Si ce sont des données climatiques, utiliser Chart.js directement pour un graphique mixte
    if (chartData.isClimate) {
      return <Bar data={chartData} options={climateOptions} />;
    }

    // Sinon, utiliser le type de graphique sélectionné
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
              <option value="landUse">Utilisation des terres</option>
              <option value="population">Population</option>
              <option value="climate">Climat</option>
            </select>
            {dataType !== "climate" && (
              <select
                className="p-2 border rounded"
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
              >
                <option value="pie">Camembert</option>
                <option value="doughnut">Donut</option>
                <option value="bar">Histogramme</option>
              </select>
            )}
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
      ) : error ? (
        <div className="h-64 flex items-center justify-center text-red-500">
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="h-64 mb-2">{renderChart()}</div>
          {dataSource && (
            <div className="text-xs text-gray-500 text-right mt-2">
              Source: {dataSource}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DataDisplay;
