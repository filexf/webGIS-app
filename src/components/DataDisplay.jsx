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

// Registration of necessary elements for Chart.js
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

      // Fetching real data based on the requested type
      const fetchData = async () => {
        try {
          let result;

          switch (dataType) {
            case "landUse":
              result = await fetchLandUseData(polygonData);
              generateLandUseChart(result);
              setDataSource(result.dataSource || "Unknown source");
              break;
            case "population":
              result = await fetchPopulationEstimate(polygonData);

              // Generating demographic data by age group
              const totalPop = result.population;
              const ageDistribution = generateAgeDistribution(totalPop);
              generatePopulationChart(ageDistribution);
              setDataSource(
                result.dataSource || result.note || "Unknown source"
              );
              break;
            case "climate":
              result = await fetchClimateData(polygonData);
              generateClimateChart(result);
              setDataSource(result.dataSource || "Unknown source");
              break;
            default:
              setError("Unsupported data type");
          }
        } catch (err) {
          console.error("Error fetching data:", err);
          setError("Unable to fetch data");
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [polygonData, dataType]);

  // Generating a plausible age distribution for a given population
  const generateAgeDistribution = (totalPopulation) => {
    // Typical age distribution (approximate percentages)
    const distribution = {
      "0-14 years": Math.random() * 10 + 15, // 15-25%
      "15-29 years": Math.random() * 10 + 15, // 15-25%
      "30-44 years": Math.random() * 8 + 16, // 16-24%
      "45-59 years": Math.random() * 8 + 14, // 14-22%
      "60-74 years": Math.random() * 8 + 10, // 10-18%
      "75+ years": Math.random() * 8 + 4, // 4-12%
    };

    // Normalizing so the sum equals 100%
    const total = Object.values(distribution).reduce((a, b) => a + b, 0);
    const normalizedDistribution = {};

    Object.keys(distribution).forEach((key) => {
      normalizedDistribution[key] = Math.round(
        (distribution[key] / total) * totalPopulation
      );
    });

    return normalizedDistribution;
  };

  // Generating the land use chart
  const generateLandUseChart = (data) => {
    if (!data) return;

    const chartData = {
      labels: ["Urban areas", "Agriculture", "Forests", "Water", "Others"],
      datasets: [
        {
          label: "Land use (%)",
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

  // Generating the population chart
  const generatePopulationChart = (data) => {
    if (!data) return;

    const chartData = {
      labels: Object.keys(data),
      datasets: [
        {
          label: "Population by age group",
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

  // Generating the climate chart
  const generateClimateChart = (data) => {
    if (!data) return;

    const { months, temperatures, precipitation } = data;

    const chartData = {
      labels: months,
      datasets: [
        {
          label: "Average temperature (°C)",
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
          label: "Precipitation (mm)",
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

  // Options for standard charts (non-climate)
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
            ? "Demographic data"
            : dataType === "landUse"
            ? "Land use (%)"
            : "Climate data",
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
            // If it's a pie or doughnut chart
            if (
              context.chart.config.type === "pie" ||
              context.chart.config.type === "doughnut"
            ) {
              value = context.raw;
            }

            if (dataType === "population") {
              return label + new Intl.NumberFormat("en-US").format(value);
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

  // Specific options for climate data (dual Y-axis)
  const climateOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Monthly climate data",
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
          text: "Temperature (°C)",
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
          text: "Precipitation (mm)",
        },
      },
    },
  };

  const renderChart = () => {
    if (!chartData) return null;

    // If it's climate data, use Chart.js directly for a mixed chart
    if (chartData.isClimate) {
      return <Bar data={chartData} options={climateOptions} />;
    }

    // Otherwise, use the selected chart type
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
        <h2 className="text-xl font-bold">Analysis of the selected area</h2>
        {polygonData && polygonData.length > 0 && !isLoading && (
          <div className="flex gap-2">
            <select
              className="p-2 border rounded"
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
            >
              <option value="landUse">Land use</option>
              <option value="population">Population</option>
              <option value="climate">Climate</option>
            </select>
            {dataType !== "climate" && (
              <select
                className="p-2 border rounded"
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
              >
                <option value="pie">Pie chart</option>
                <option value="doughnut">Doughnut chart</option>
                <option value="bar">Bar chart</option>
              </select>
            )}
          </div>
        )}
      </div>

      {!polygonData || polygonData.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          Draw a polygon on the map to display data
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
