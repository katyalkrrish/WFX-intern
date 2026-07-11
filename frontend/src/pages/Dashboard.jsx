import React, { useEffect, useState } from "react";
import apiClient from "../services/apiClient";
import {
  TrendingUp,
  Users,
  Briefcase,
  Layers,
  FileText,
  DollarSign,
  Loader
} from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient
      .get("/stats")
      .then((res) => {
        setStats(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard metrics");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        <Loader className="spinner" size={48} />
        <p>Loading analytics dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-error">
        <h3>Oops! Something went wrong</h3>
        <p>{error}</p>
      </div>
    );
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Prepare chart variables
  const orderStats = stats.orderStatusDistribution || [];
  const totalOrders = orderStats.reduce((acc, curr) => acc + curr.count, 0) || 1;
  
  // Custom Donut Angles
  let cumulativePercent = 0;
  const donutData = orderStats.map((item, index) => {
    const percent = (item.count / totalOrders) * 100;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;
    return {
      ...item,
      percent,
      startPercent
    };
  });

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  // Render SVG Pie/Donut Path
  const renderDonutSlice = (slice, index) => {
    const colors = ["#aa3bff", "#3b82f6", "#10b981", "#f59e0b"];
    const strokeColor = colors[index % colors.length];
    
    // We can draw a simple circle with stroke-dasharray and stroke-dashoffset for circular representation
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (slice.percent / 100) * circumference;
    const rotation = (slice.startPercent / 100) * 360;

    return (
      <circle
        key={slice.status}
        cx="100"
        cy="100"
        r={radius}
        fill="transparent"
        stroke={strokeColor}
        strokeWidth="15"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        transform={`rotate(${rotation - 90} 100 100)`}
        style={{
          transition: "all 0.6s ease-in-out",
          transformOrigin: "center"
        }}
        className="donut-slice"
      />
    );
  };

  // Payment Status SVG Bar Chart calculations
  const paymentStats = stats.paymentStatusDistribution || [];
  const maxAmount = Math.max(...paymentStats.map((item) => item.amount), 1);
  const barChartHeight = 150;
  const barWidth = 60;
  const barGap = 40;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header animate-fade-in">
        <div>
          <h1>ERP Overview Dashboard</h1>
          <p className="subtitle">Real-time metrics, product distribution, and revenue summary</p>
        </div>
        <div className="time-badge">
          <span className="dot animate-pulse"></span>
          Live Analytics
        </div>
      </header>

      {/* Metrics Grid */}
      <section className="metrics-grid">
        <div className="metric-card card-purple animate-slide-up" style={{ animationDelay: "0ms" }}>
          <div className="metric-icon">
            <DollarSign size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Total Revenue</span>
            <h3 className="metric-value">{formatCurrency(stats.totalRevenue)}</h3>
          </div>
        </div>

        <div className="metric-card card-blue animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="metric-icon">
            <Layers size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Finished Goods</span>
            <h3 className="metric-value">{formatNumber(stats.products)}</h3>
          </div>
        </div>

        <div className="metric-card card-green animate-slide-up" style={{ animationDelay: "200ms" }}>
          <div className="metric-icon">
            <FileText size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Sales Orders</span>
            <h3 className="metric-value">{formatNumber(stats.orders)}</h3>
          </div>
        </div>

        <div className="metric-card card-orange animate-slide-up" style={{ animationDelay: "300ms" }}>
          <div className="metric-icon">
            <Users size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Suppliers & Buyers</span>
            <h3 className="metric-value">{stats.suppliers} / {stats.buyers}</h3>
          </div>
        </div>
      </section>

      {/* Charts Section */}
      <section className="charts-grid animate-fade-in" style={{ animationDelay: "400ms" }}>
        {/* Order Status Donut Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h4>Sales Order Status</h4>
            <span className="chart-subtitle">Distribution of total {formatNumber(stats.orders)} orders</span>
          </div>
          <div className="chart-body donut-chart-container">
            <svg width="200" height="200" viewBox="0 0 200 200">
              {donutData.map((slice, index) => renderDonutSlice(slice, index))}
              <circle cx="100" cy="100" r="35" fill="var(--bg)" />
              <text x="100" y="105" textAnchor="middle" className="donut-center-text" fill="var(--text-h)">
                Orders
              </text>
            </svg>
            <div className="chart-legend">
              {donutData.map((slice, index) => {
                const colors = ["#aa3bff", "#3b82f6", "#10b981", "#f59e0b"];
                return (
                  <div key={slice.status} className="legend-item">
                    <span className="legend-color-dot" style={{ backgroundColor: colors[index % colors.length] }}></span>
                    <span className="legend-name">{slice.status}</span>
                    <span className="legend-value">{formatNumber(slice.count)} ({slice.percent.toFixed(1)}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Invoice Payment Status Bar Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h4>Revenue by Payment Status</h4>
            <span className="chart-subtitle">Total amount in invoices aggregated by payment status</span>
          </div>
          <div className="chart-body bar-chart-container">
            <div className="bar-chart-wrapper">
              <svg width={(barWidth + barGap) * paymentStats.length + barGap} height={barChartHeight + 40}>
                {/* Gridlines */}
                <line x1="20" y1="20" x2="300" y2="20" stroke="var(--border)" strokeDasharray="4 4" />
                <line x1="20" y1={(barChartHeight / 2) + 20} x2="300" y2={(barChartHeight / 2) + 20} stroke="var(--border)" strokeDasharray="4 4" />
                <line x1="20" y1={barChartHeight + 20} x2="300" y2={barChartHeight + 20} stroke="var(--border)" />

                {paymentStats.map((item, index) => {
                  const barHeight = (item.amount / maxAmount) * barChartHeight;
                  const x = barGap + index * (barWidth + barGap);
                  const y = barChartHeight - barHeight + 20;
                  const colors = ["#10b981", "#f59e0b", "#ef4444"];
                  const barColor = item.status === "Paid" ? colors[0] : item.status === "Partially Paid" ? colors[1] : colors[2];

                  return (
                    <g key={item.status} className="bar-group">
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        rx="6"
                        fill={barColor}
                        opacity="0.85"
                        className="bar-rect"
                        style={{ transition: "all 0.5s ease-out" }}
                      />
                      {/* Amount above bar */}
                      <text
                        x={x + barWidth / 2}
                        y={y - 8}
                        textAnchor="middle"
                        fill="var(--text-h)"
                        fontSize="11"
                        fontWeight="500"
                      >
                        {formatCurrency(item.amount)}
                      </text>
                      {/* Status below bar */}
                      <text
                        x={x + barWidth / 2}
                        y={barChartHeight + 35}
                        textAnchor="middle"
                        fill="var(--text)"
                        fontSize="12"
                      >
                        {item.status}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
