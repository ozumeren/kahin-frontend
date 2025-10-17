import React, { useMemo } from 'react';
import { LinePath, AreaClosed } from '@visx/shape';
import { scaleTime, scaleLinear } from '@visx/scale';
import { curveMonotoneX } from '@visx/curve';

const SparklineChart = ({ 
  data = [], 
  width = 200, 
  height = 60,
  color = '#22c55e',
  showArea = true,
  strokeWidth = 2,
  margin = { top: 5, right: 5, bottom: 5, left: 5 }
}) => {
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Process data
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data
      .filter(d => d.timestamp && d.price !== null && d.price !== undefined)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-20); // Last 20 points for performance
  }, [data]);

  // Scales
  const xScale = useMemo(
    () =>
      scaleTime({
        range: [0, innerWidth],
        domain: chartData.length > 0
          ? [
              new Date(chartData[0].timestamp),
              new Date(chartData[chartData.length - 1].timestamp)
            ]
          : [new Date(), new Date()],
      }),
    [innerWidth, chartData]
  );

  const yScale = useMemo(() => {
    if (chartData.length === 0) {
      return scaleLinear({
        range: [innerHeight, 0],
        domain: [0, 100],
      });
    }

    const prices = chartData.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1 || 5;

    return scaleLinear({
      range: [innerHeight, 0],
      domain: [min - padding, max + padding],
    });
  }, [innerHeight, chartData]);

  if (chartData.length === 0) {
    return (
      <svg width={width} height={height}>
        <line
          x1={margin.left}
          y1={height / 2}
          x2={width - margin.right}
          y2={height / 2}
          stroke="#e5e7eb"
          strokeWidth={1}
          strokeDasharray="2,2"
        />
      </svg>
    );
  }

  const getX = (d) => xScale(new Date(d.timestamp));
  const getY = (d) => yScale(d.price);

  // Determine trend
  const firstPrice = chartData[0].price;
  const lastPrice = chartData[chartData.length - 1].price;
  const isPositive = lastPrice >= firstPrice;
  const actualColor = isPositive ? '#22c55e' : '#ef4444';

  return (
    <svg width={width} height={height}>
      <defs>
        <linearGradient id={`sparkline-gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={actualColor} stopOpacity={0.3} />
          <stop offset="100%" stopColor={actualColor} stopOpacity={0.05} />
        </linearGradient>
      </defs>

      <g transform={`translate(${margin.left},${margin.top})`}>
        {/* Area fill */}
        {showArea && (
          <AreaClosed
            data={chartData}
            x={getX}
            y={getY}
            yScale={yScale}
            fill={`url(#sparkline-gradient-${color})`}
            curve={curveMonotoneX}
          />
        )}

        {/* Line path */}
        <LinePath
          data={chartData}
          x={getX}
          y={getY}
          stroke={actualColor}
          strokeWidth={strokeWidth}
          curve={curveMonotoneX}
          strokeLinecap="round"
        />

        {/* Current price indicator */}
        <circle
          cx={getX(chartData[chartData.length - 1])}
          cy={getY(chartData[chartData.length - 1])}
          r={3}
          fill={actualColor}
          stroke="white"
          strokeWidth={2}
        />
      </g>
    </svg>
  );
};

export default SparklineChart;