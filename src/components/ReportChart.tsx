import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ChartData } from '@/types/reports';

interface ReportChartProps {
  chart: ChartData;
}

const ReportChart: React.FC<ReportChartProps> = ({ chart }) => {
  const [isDark, setIsDark] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if dark mode is active
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };

    // Initial checks
    checkDarkMode();
    checkMobile();

    // Watch for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Watch for resize
    window.addEventListener('resize', checkMobile);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Theme-aware colors
  const colors = {
    primary: isDark ? '#60a5fa' : '#3b82f6',
    secondary: isDark ? '#34d399' : '#10b981',
    tertiary: isDark ? '#f59e0b' : '#f59e0b',
    danger: isDark ? '#f87171' : '#ef4444',
    text: isDark ? '#e5e7eb' : '#374151',
    grid: isDark ? '#374151' : '#e5e7eb',
    background: isDark ? '#1f2937' : '#ffffff',
  };

  // Default color palette for multi-dataset charts
  const colorPalette = [
    colors.primary,
    colors.secondary,
    colors.tertiary,
    colors.danger,
    isDark ? '#a78bfa' : '#8b5cf6',
    isDark ? '#fb923c' : '#f97316',
  ];

  // Transform data for recharts format
  const transformData = () => {
    if (!chart.data || !chart.data.labels) return [];

    return chart.data.labels.map((label, index) => {
      const dataPoint: any = { name: label };
      chart.data.datasets.forEach((dataset, datasetIndex) => {
        dataPoint[dataset.label || `value${datasetIndex}`] = dataset.data[index];
      });
      return dataPoint;
    });
  };

  const rechartsData = transformData();

  // Responsive chart configuration
  const chartConfig = {
    margin: isMobile ? { top: 5, right: 5, left: -20, bottom: 0 } : { top: 10, right: 30, left: 0, bottom: 0 },
    fontSize: isMobile ? '10px' : '12px',
    pieRadius: isMobile ? 70 : 100,
    strokeWidth: isMobile ? 2 : 3,
    dotRadius: isMobile ? 3 : 5,
  };

  // Custom tooltip with theme support
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className={`rounded-lg border shadow-lg ${isMobile ? 'p-2' : 'p-3'}`}
          style={{
            backgroundColor: colors.background,
            borderColor: colors.grid,
          }}
        >
          <p className={`font-semibold ${isMobile ? 'mb-1 text-xs' : 'mb-2 text-sm'}`} style={{ color: colors.text }}>
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className={isMobile ? 'text-xs' : 'text-sm'}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render different chart types
  const renderChart = () => {
    switch (chart.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rechartsData} margin={chartConfig.margin}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} opacity={0.3} />
              <XAxis
                dataKey="name"
                stroke={colors.text}
                style={{ fontSize: chartConfig.fontSize }}
                angle={isMobile ? -45 : 0}
                textAnchor={isMobile ? 'end' : 'middle'}
                height={isMobile ? 60 : 30}
              />
              <YAxis stroke={colors.text} style={{ fontSize: chartConfig.fontSize }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ color: colors.text, fontSize: chartConfig.fontSize }}
                iconSize={isMobile ? 8 : 14}
              />
              {chart.data.datasets.map((dataset, index) => (
                <Bar
                  key={index}
                  dataKey={dataset.label || `value${index}`}
                  fill={colorPalette[index % colorPalette.length]}
                  radius={isMobile ? [4, 4, 0, 0] : [8, 8, 0, 0]}
                  animationDuration={800}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rechartsData} margin={chartConfig.margin}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} opacity={0.3} />
              <XAxis
                dataKey="name"
                stroke={colors.text}
                style={{ fontSize: chartConfig.fontSize }}
                angle={isMobile ? -45 : 0}
                textAnchor={isMobile ? 'end' : 'middle'}
                height={isMobile ? 60 : 30}
              />
              <YAxis stroke={colors.text} style={{ fontSize: chartConfig.fontSize }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ color: colors.text, fontSize: chartConfig.fontSize }}
                iconSize={isMobile ? 8 : 14}
              />
              {chart.data.datasets.map((dataset, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={dataset.label || `value${index}`}
                  stroke={colorPalette[index % colorPalette.length]}
                  strokeWidth={chartConfig.strokeWidth}
                  dot={{ r: chartConfig.dotRadius, fill: colorPalette[index % colorPalette.length] }}
                  activeDot={{ r: chartConfig.dotRadius + 2 }}
                  animationDuration={800}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rechartsData} margin={chartConfig.margin}>
              <defs>
                {chart.data.datasets.map((dataset, index) => (
                  <linearGradient key={index} id={`colorGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colorPalette[index % colorPalette.length]} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={colorPalette[index % colorPalette.length]} stopOpacity={0.1} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} opacity={0.3} />
              <XAxis
                dataKey="name"
                stroke={colors.text}
                style={{ fontSize: chartConfig.fontSize }}
                angle={isMobile ? -45 : 0}
                textAnchor={isMobile ? 'end' : 'middle'}
                height={isMobile ? 60 : 30}
              />
              <YAxis stroke={colors.text} style={{ fontSize: chartConfig.fontSize }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ color: colors.text, fontSize: chartConfig.fontSize }}
                iconSize={isMobile ? 8 : 14}
              />
              {chart.data.datasets.map((dataset, index) => (
                <Area
                  key={index}
                  type="monotone"
                  dataKey={dataset.label || `value${index}`}
                  stroke={colorPalette[index % colorPalette.length]}
                  strokeWidth={chartConfig.strokeWidth}
                  fillOpacity={1}
                  fill={`url(#colorGradient${index})`}
                  animationDuration={800}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const pieData = chart.data.labels.map((label, index) => ({
          name: label,
          value: chart.data.datasets[0].data[index],
        }));

        // Use custom colors if provided in backgroundColor
        const pieColors = Array.isArray(chart.data.datasets[0].backgroundColor)
          ? chart.data.datasets[0].backgroundColor
          : colorPalette;

        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={!isMobile}
                label={
                  isMobile
                    ? false
                    : ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={chartConfig.pieRadius}
                fill="#8884d8"
                dataKey="value"
                animationDuration={800}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ color: colors.text, fontSize: chartConfig.fontSize }}
                iconSize={isMobile ? 8 : 14}
              />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Unsupported chart type: {chart.type}
          </div>
        );
    }
  };

  return <div className="w-full h-full">{renderChart()}</div>;
};

export default ReportChart;
