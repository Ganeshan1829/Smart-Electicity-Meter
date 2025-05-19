"use client";
import React, { useEffect, useState } from 'react';
import GaugeMeter from './components/GaugeMeter';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { createClient } from '@supabase/supabase-js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Supabase client
const supabase = createClient(
  'Supabase Url',
  'Supabase Key');

interface Readings {
  voltage: number;
  current: number;
  power: number;
  total_kwh: number;
  time: string;
}

interface MaxValues {
  voltage: number;
  current: number;
  power: number;
  total_kwh: number;
}

interface GaugeColors {
  voltage: string;
  current: string;
  power: string;
  total_kwh: string;
}

interface Prediction {
  created_at: string;
  predicted_kwh: number;
  predicted_bill: number;
}

const ElectricityDashboard: React.FC = () => {
  const maxValues: MaxValues = {
    voltage: 240,
    current: 63,
    power: 15000,
    total_kwh: 10000
  };

  const gaugeColors: GaugeColors = {
    voltage: "#3b82f6",
    current: "#ef4444",
    power: "#10b981",
    total_kwh: "#8b5cf6"
  };

  const [readings, setReadings] = useState<Readings>({
    voltage: 0,
    current: 0,
    power: 0,
    total_kwh: 0,
    time: new Date().toLocaleString()
  });

  const [voltageHistory, setVoltageHistory] = useState<number[]>([]);
  const [currentHistory, setCurrentHistory] = useState<number[]>([]);
  const [predictedKwh, setPredictedKwh] = useState<number[]>([0, 0, 0, 0]);
  const [predictedBill, setPredictedBill] = useState<number[]>([0, 0, 0, 0]);
  const [predictionLabels, setPredictionLabels] = useState<string[]>(['Week 1', 'Week 2', 'Week 3', 'Week 4']);
  const [latestPrediction, setLatestPrediction] = useState<Prediction | null>(null);

  const fetchData = async () => {
    const { data, error } = await supabase
      .from("meter_data")
      .select("*")
      .order("time", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Supabase fetch error:", error);
      return;
    }

    if (data && data.length > 0) {
      const record = data[0];
      const newReading: Readings = {
        voltage: parseFloat((record.voltage || 0).toFixed(2)),
        current: parseFloat((record.current || 0).toFixed(4)),
        power: parseFloat((record.power || 0).toFixed(4)),
        total_kwh: parseFloat((record.total_kwh || 0).toFixed(6)),
        time: new Date(record.time).toLocaleString()
      };

      setReadings(newReading);
      setVoltageHistory(prev => [...prev.slice(-9), newReading.voltage]);
      setCurrentHistory(prev => [...prev.slice(-9), newReading.current]);
    }
  };

  const fetchPredictions = async () => {
    // Fetch predictions
    const { data: predictionsData, error: predictionsError } = await supabase
      .from("predictions")
      .select("*")
      .order("created_at", { ascending: true });

    if (predictionsError) {
      console.error("Supabase fetch error for predictions:", predictionsError);
      return;
    }

    if (predictionsData && predictionsData.length > 0) {
      // Get the last/latest prediction
      const latest = predictionsData[predictionsData.length - 1];
      setLatestPrediction(latest);
      
      // Take the last 4 predictions for the graph (or fewer if there are less than 4)
      const recentPredictions = predictionsData.slice(-4);
      
      const kwhData = recentPredictions.map((prediction: Prediction) => 
        parseFloat(prediction.predicted_kwh.toFixed(2))
      );
      
      const billData = recentPredictions.map((prediction: Prediction) => 
        parseFloat(prediction.predicted_bill.toFixed(2))
      );
      
      // Create labels from created_at dates
      const labels = recentPredictions.map((prediction: Prediction) => {
        const date = new Date(prediction.created_at);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      });

      setPredictedKwh(kwhData);
      setPredictedBill(billData);
      setPredictionLabels(labels);
    }
  };

  useEffect(() => {
    fetchData();
    fetchPredictions(); // Fetch predictions on initial load
    const interval = setInterval(() => {
      fetchData();
      // Fetch predictions less frequently, maybe once a minute
      const currentTime = new Date();
      if (currentTime.getSeconds() === 0) {
        fetchPredictions();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const voltageData = {
    labels: voltageHistory.map((_, i) => `T-${voltageHistory.length - i}`),
    datasets: [{
      label: "Voltage (V)",
      data: voltageHistory,
      borderColor: "#3b82f6",
      backgroundColor: "#3b82f6",
      fill: false
    }]
  };

  const currentData = {
    labels: currentHistory.map((_, i) => `T-${currentHistory.length - i}`),
    datasets: [{
      label: "Current (A)",
      data: currentHistory,
      borderColor: "#ef4444",
      backgroundColor: "#ef4444",
      fill: false
    }]
  };

  const predictedKwhAndBillData = {
    labels: predictionLabels,
    datasets: [
      {
        label: 'Predicted kWh',
        data: predictedKwh,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'Predicted Bill (₹)',
        data: predictedBill,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.5)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { 
        beginAtZero: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'kWh'
        }
      },
      y1: {
        beginAtZero: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Bill (₹)'
        }
      }
    },
    plugins: {
      legend: { display: true, position: 'top' as const },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (label.includes('kWh')) {
                label += context.parsed.y + ' kWh';
              } else if (label.includes('Bill')) {
                label += '₹' + context.parsed.y;
              }
            }
            return label;
          }
        }
      }
    },
    layout: { padding: 0 }
  };

  const kWhFeedback = () => {
    if (readings.total_kwh < 2000) {
      return <p className="text-green-500 text-center mt-2">🌱 Great job! Your energy usage is low. Keep saving the planet! 🌍</p>;
    } else if (readings.total_kwh > 8000) {
      return <p className="text-red-500 text-center mt-2">⚠️ High energy consumption! Consider switching off unused devices. 💡</p>;
    } else {
      return <p className="text-yellow-500 text-center mt-2">📊 Moderate usage. Keep monitoring for better efficiency. ⚙️</p>;
    }
  };

  return (
    <div className="flex justify-center items-center w-full min-h-screen bg-white p-0 m-0">
      <div className="w-full h-full grid grid-cols-2 gap-4">

        {/* Left Side */}
        <div className="flex flex-col p-4 h-full">
          <div className="w-full flex flex-col items-center mb-6">
            <h1 className="text-2xl font-bold text-black">Electricity Monitor</h1>
            <p className="text-sm text-black">Last Updated: {readings.time}</p>
          </div>

          <div className="grid grid-cols-2 gap-6 w-full mb-8">
            <div className="flex flex-col items-center">
              <h2 className="text-lg font-medium mb-2 text-black">Voltage</h2>
              <div className="w-full h-64">
                <GaugeMeter 
                  value={readings.voltage} 
                  maxValue={maxValues.voltage}
                  color={gaugeColors.voltage}
                  unit="V"
                />
              </div>
            </div>

            <div className="flex flex-col items-center">
              <h2 className="text-lg font-medium mb-2 text-black">Current</h2>
              <div className="w-full h-64">
                <GaugeMeter 
                  value={readings.current} 
                  maxValue={maxValues.current}
                  color={gaugeColors.current}
                  unit="A"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 w-full">
            <div className="flex flex-col items-center">
              <h2 className="text-lg font-medium mb-2 text-black">Power</h2>
              <div className="w-full h-64">
                <GaugeMeter 
                  value={readings.power} 
                  maxValue={maxValues.power}
                  color={gaugeColors.power}
                  unit="W"
                />
              </div>
            </div>

            <div className="flex flex-col items-center">
              <h2 className="text-lg font-medium mb-2 text-black">Energy (kWh)</h2>
              <div className="w-full h-64">
                <GaugeMeter 
                  value={readings.total_kwh} 
                  maxValue={maxValues.total_kwh}
                  color={gaugeColors.total_kwh}
                  unit="kWh"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex flex-col p-4 h-full">
          <div className="grid grid-cols-2 gap-6 mb-2">
            <div className="flex flex-col items-center">
              <h2 className="text-lg font-bold text-black mb-2">Voltage Graph</h2>
              <div className="w-full h-56">
                <Line data={voltageData} options={chartOptions} />
              </div>
            </div>

            <div className="flex flex-col items-center">
              <h2 className="text-lg font-bold text-black mb-2">Current Graph</h2>
              <div className="w-full h-56">
                <Line data={currentData} options={chartOptions} />
              </div>
            </div>
          </div>

          <div className="flex flex-col p-4 rounded-lg mt-2">
            <div className="flex items-center justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h2 className="text-lg font-bold text-black">Predicted kWh & Bill</h2>
            </div>
            <div className="w-full h-80">
              <Line 
                data={predictedKwhAndBillData} 
                options={chartOptions}
              />
            </div>
            {kWhFeedback()}
            <div className="mt-4 bg-blue-50 p-3 rounded-lg shadow-sm">
              <h3 className="text-md font-semibold text-blue-800">Prediction Summary</h3>
              <div className="flex justify-between mt-2">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Latest kWh</p>
                  <p className="text-lg font-bold text-blue-600">
                    {latestPrediction ? latestPrediction.predicted_kwh.toFixed(6) : "0.000000"} kWh
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Latest Predicted Bill</p>
                  <p className="text-lg font-bold text-orange-500">
                    ₹{latestPrediction ? latestPrediction.predicted_bill.toFixed(2) : "0.00"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="text-lg font-bold text-gray-700">
                    {latestPrediction ? new Date(latestPrediction.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectricityDashboard;