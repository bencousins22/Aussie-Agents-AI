import React from 'react';
import { TrendingUp, TrendingDown, FileText, CircleDollarSign, AlertTriangle } from 'lucide-react';

const FinancialDashboard: React.FC = () => {
  // Mock data - to be replaced with data from the financial service
  const mockData = {
    outstandingInvoices: {
      total: 12500.50,
      overdue: 4800.00,
    },
    revenue: {
      thisMonth: 25000.00,
      lastMonth: 22000.00,
    },
    profitMargin: {
      current: 0.25,
      target: 0.30,
    },
  };

  const revenueChange = mockData.revenue.thisMonth - mockData.revenue.lastMonth;
  const revenueChangePercentage = (revenueChange / mockData.revenue.lastMonth) * 100;

  const MetricCard = ({ title, icon, value, change, footer }: { title: string; icon: React.ReactNode; value: string; change?: React.ReactNode; footer?: React.ReactNode }) => (
    <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6 hover:bg-gray-800/80 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</h2>
        <div className="text-gray-500">{icon}</div>
      </div>
      <p className="text-4xl font-bold mt-4">{value}</p>
      {change && <div className="mt-2">{change}</div>}
      {footer && <div className="text-xs text-gray-500 mt-4">{footer}</div>}
    </div>
  );

  return (
    <div className="p-8 bg-gray-900 text-white h-full overflow-y-auto font-sans">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Financial Dashboard</h1>
        <p className="text-gray-400 mt-1">Real-time insights into your business's financial health.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <MetricCard
          title="Outstanding Invoices"
          icon={<FileText className="w-6 h-6" />}
          value={`$${mockData.outstandingInvoices.total.toLocaleString()}`}
          footer={
            <div className="flex items-center text-red-400">
              <AlertTriangle className="w-4 h-4 mr-2" />
              <span>Overdue: ${mockData.outstandingInvoices.overdue.toLocaleString()}</span>
            </div>
          }
        />
        <MetricCard
          title="This Month's Revenue"
          icon={revenueChange >= 0 ? <TrendingUp className="w-6 h-6 text-green-400" /> : <TrendingDown className="w-6 h-6 text-red-400" />}
          value={`$${mockData.revenue.thisMonth.toLocaleString()}`}
          change={
            <p className={`text-sm flex items-center ${revenueChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {revenueChange >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              <span>{revenueChange >= 0 ? '+' : ''}${revenueChange.toLocaleString()} ({revenueChangePercentage.toFixed(2)}%) vs last month</span>
            </p>
          }
        />
        <MetricCard
          title="Profit Margin"
          icon={<CircleDollarSign className="w-6 h-6" />}
          value={`${(mockData.profitMargin.current * 100).toFixed(2)}%`}
          footer={
            <p className="text-xs text-gray-500">
              Target: {(mockData.profitMargin.target * 100).toFixed(2)}%
            </p>
          }
        />
      </div>
    </div>
  );
};

export default FinancialDashboard;
