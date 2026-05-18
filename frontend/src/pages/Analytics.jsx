import React, { useState, useEffect } from 'react';
import { expenseService } from '../services/api';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend 
} from 'chart.js';
import { TrendingUp, Activity, PieChart as PieChartIcon } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const Analytics = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const data = await expenseService.getAllExpenses();
      setExpenses(data);
    } catch (error) {
      console.error('Failed to fetch expenses', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Calculate Data
  const categories = {};
  const monthlyData = {};
  let totalAmount = 0;
  
  expenses.forEach(e => {
    const amt = e.totalAmount || e.amount || 0;
    const category = e.category || 'Other';
    categories[category] = (categories[category] || 0) + amt;
    
    let month = 'Unknown';
    if (e.date) {
      const d = new Date(e.date);
      if (!isNaN(d.getTime())) {
        month = d.toLocaleString('default', { month: 'short' });
      }
    }
    
    monthlyData[month] = (monthlyData[month] || 0) + amt;
    totalAmount += amt;
  });

  const categoryLabels = Object.keys(categories);
  const categoryValues = Object.values(categories);
  const monthLabels = Object.keys(monthlyData);
  const monthValues = Object.values(monthlyData);

  const pieData = {
    labels: categoryLabels,
    datasets: [{
      data: categoryValues,
      backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'],
      borderColor: '#1e293b',
      borderWidth: 2,
    }]
  };

  const barData = {
    labels: categoryLabels,
    datasets: [{
      label: 'Spending by Category',
      data: categoryValues,
      backgroundColor: 'rgba(139, 92, 246, 0.8)',
    }]
  };

  const lineData = {
    labels: monthLabels,
    datasets: [{
      label: 'Monthly Trend',
      data: monthValues,
      borderColor: '#3b82f6',
      tension: 0.4,
      fill: true,
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
    }]
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <h2 className="text-3xl font-bold mb-6">Analytics Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 flex flex-col justify-center">
          <div className="text-gray-400 mb-2 flex items-center gap-2"><Activity size={18}/> Total Spending</div>
          <div className="text-3xl font-bold text-white">${totalAmount.toFixed(2)}</div>
        </div>
        {categoryLabels.slice(0, 3).map((cat, idx) => (
          <div key={idx} className="glass-panel p-6 flex flex-col justify-center">
            <div className="text-gray-400 mb-2">{cat} Spending</div>
            <div className="text-3xl font-bold text-white">${categories[cat].toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><TrendingUp /> Monthly Trend</h3>
          <div className="h-72">
            <Line data={lineData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>
        
        <div className="glass-panel p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><PieChartIcon /> Expense Distribution</h3>
          <div className="h-72 flex justify-center">
            <Pie data={pieData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: 'white' } } } }} />
          </div>
        </div>
      </div>

      <div className="glass-panel p-6">
        <h3 className="text-xl font-bold mb-4">Category Wise Spending</h3>
        <div className="h-80">
          <Bar data={barData} options={{ maintainAspectRatio: false }} />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
