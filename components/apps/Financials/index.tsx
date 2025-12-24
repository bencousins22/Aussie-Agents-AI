import React, { useState, useEffect, useMemo } from 'react';
import { financialService, FinancialData, Invoice } from '../../../services/financials';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, TrendingDown, ChevronUp, ChevronDown, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

type SortConfig = {
  key: keyof Invoice;
  direction: 'ascending' | 'descending';
};

const MetricCard = ({ title, value, footer }: { title: string; value: string; footer: React.ReactNode }) => (
  <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6 shadow-lg transition-transform transform hover:-translate-y-1">
    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</h3>
    <p className="text-3xl font-bold mt-2">{value}</p>
    <div className="text-xs text-gray-500 mt-2">{footer}</div>
  </div>
);

const InvoiceTable = ({ invoices }: { invoices: Invoice[] }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'dueDate', direction: 'descending' });

  const sortedInvoices = useMemo(() => {
    let sortableItems = [...invoices];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [invoices, sortConfig]);

  const requestSort = (key: keyof Invoice) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Invoice) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronDown className="h-4 w-4 inline text-gray-600" />;
    }
    return sortConfig.direction === 'ascending' ? <ChevronUp className="h-4 w-4 inline" /> : <ChevronDown className="h-4 w-4 inline" />;
  };

  const statusIcon = (status: Invoice['status']) => {
    switch(status) {
      case 'Paid': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Pending': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'Overdue': return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6 col-span-1 lg:col-span-2">
       <h3 className="text-lg font-semibold mb-4">Recent Invoices</h3>
       <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-700">
              {['id', 'customer', 'amount', 'dueDate', 'status'].map((key) => (
                <th key={key} className="p-3 text-xs font-medium text-gray-400 uppercase cursor-pointer" onClick={() => requestSort(key as keyof Invoice)}>
                  {key} {getSortIcon(key as keyof Invoice)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedInvoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-gray-800 hover:bg-gray-700/50">
                <td className="p-3 text-sm font-mono">{invoice.id}</td>
                <td className="p-3 text-sm">{invoice.customer}</td>
                <td className="p-3 text-sm">${invoice.amount.toLocaleString()}</td>
                <td className="p-3 text-sm">{invoice.dueDate}</td>
                <td className="p-3 text-sm">
                  <span className="flex items-center gap-2">{statusIcon(invoice.status)} {invoice.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
       </div>
    </div>
  )
};

const FinancialsApp: React.FC = () => {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    financialService.getFinancialData()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Loading financial data...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-red-500">Failed to load financial data.</div>;
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  const overdueData = Object.entries(data.invoiceDetails.agingBrackets).map(([name, value]) => ({ name: `${name} days`, value }));

  return (
    <div className="p-4 md:p-8 bg-gray-900 text-white h-full overflow-y-auto font-sans">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Financial Command Center</h1>
        <p className="text-gray-400 mt-1">Enterprise-grade insights into your business's financial health.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <MetricCard title="YTD Revenue" value={`$${data.revenueAnalysis.ytdRevenue.toLocaleString()}`} footer="Year-to-Date" />
        <MetricCard title="Outstanding" value={`$${data.invoiceDetails.outstanding.toLocaleString()}`} footer={
          <span className="text-red-400 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            ${data.invoiceDetails.overdue.toLocaleString()} Overdue
          </span>
        } />
        <MetricCard title="Profit Margin" value={`${(data.profitMargin.current * 100).toFixed(1)}%`} footer={
          <span className={`flex items-center gap-1 ${data.profitMargin.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {data.profitMargin.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            Target: {(data.profitMargin.target * 100).toFixed(1)}%
          </span>
        } />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-gray-800/50 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.revenueAnalysis.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
              <XAxis dataKey="month" stroke="#888" />
              <YAxis stroke="#888" tickFormatter={(value) => `$${Number(value) / 1000}k`} />
              <Tooltip cursor={{fill: 'rgba(128, 128, 128, 0.1)'}} contentStyle={{ backgroundColor: '#222', border: 'none' }} />
              <Bar dataKey="revenue" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Overdue Invoices</h3>
           <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={overdueData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8">
                {overdueData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#222', border: 'none' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <InvoiceTable invoices={data.invoiceDetails.recentInvoices} />

    </div>
  );
};

export default FinancialsApp;
