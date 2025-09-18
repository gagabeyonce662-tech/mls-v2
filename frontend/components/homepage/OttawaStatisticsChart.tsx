// components/OttawaStatisticsChart.js
import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement } from 'chart.js';

// Register the required chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement // Register PointElement here for line chart
);

const OttawaStatisticsChart = () => {
  const chartData = {
    labels: [
      '2020-09', '2021-01', '2021-05', '2021-09', '2022-01', '2022-05', 
      '2022-09', '2023-01', '2023-05', '2023-09', '2024-01', '2024-05', 
      '2025-01', '2025-05'
    ],
    datasets: [
      {
        label: 'Median Price',
        data: [
          500000, 520000, 540000, 560000, 580000, 590000, 600000, 620000, 
          630000, 650000, 670000, 690000, 700000, 720000
        ],
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        pointBorderWidth: 2,
      },
      {
        label: 'Total Sold',
        data: [
          1200, 1300, 1400, 1500, 1600, 1700, 1500, 1800, 
          1600, 1550, 1650, 1700, 1800, 1900
        ],
        backgroundColor: 'rgba(255, 159, 64, 0.8)',
        borderRadius: 5,
        type: 'bar', // Display this dataset as a bar chart
      }
    ],
  };

  // Chart options for interactive legend
  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Ottawa Statistics * (All Property Types)',
        font: {
          size: 20,
        },
      },
      legend: {
        position: 'top',
        labels: {
          boxWidth: 20,
          padding: 15,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    hover: {
      mode: 'index',
      intersect: false,
    },
    stacked: true, // Stack bar chart on top of the line chart
  };

  return (
    <div className="chart-container" style={{ width: '100%', margin: '0 auto', padding: '20px' }}>
      <h3 style={{ textAlign: 'center' }}>Ottawa Statistics * (All Property Types)</h3>
      <div className="chart-wrapper">
        <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
          <Line data={chartData} options={options} />
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button style={{ padding: '10px 20px', backgroundColor: '#41f9fb', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          View More Stats
        </button>
      </div>
    </div>
  );
};

export default OttawaStatisticsChart;
