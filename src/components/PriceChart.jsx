import React, { useMemo } from 'react';
import { ParentSize } from '@visx/responsive';
import { LinePath, Area } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { Group } from '@visx/group';
import { localPoint } from '@visx/event';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const PriceChart = ({ trades = [], height = 300, isMultipleChoice = false, outcomes = [] }) => {
  // Process trades data
  const chartData = useMemo(() => {
    if (!trades || trades.length === 0) {
      // Generate mock data if no trades
      const now = new Date();
      const mockData = [];
      for (let i = 30; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        mockData.push({
          date,
          yesPrice: 0.5 + (Math.random() - 0.5) * 0.3,
          noPrice: 0.5 + (Math.random() - 0.5) * 0.3,
          volume: Math.random() * 1000
        });
      }
      return mockData;
    }
    
    // Group trades by time periods
    const groupedData = trades.reduce((acc, trade) => {
      const date = new Date(trade.createdAt);
      const dateKey = format(date, 'yyyy-MM-dd HH:00');
      
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: new Date(dateKey),
          trades: [],
          volume: 0
        };
      }
      
      acc[dateKey].trades.push(trade);
      acc[dateKey].volume += parseFloat(trade.quantity) * parseFloat(trade.price);
      
      return acc;
    }, {});
    
    // Calculate average prices for each period
    return Object.values(groupedData).map(period => {
      const yesTrades = period.trades.filter(t => t.outcome === 'YES');
      const noTrades = period.trades.filter(t => t.outcome === 'NO');
      
      const yesPrice = yesTrades.length > 0
        ? yesTrades.reduce((sum, t) => sum + parseFloat(t.price), 0) / yesTrades.length
        : 0.5;
      
      const noPrice = noTrades.length > 0
        ? noTrades.reduce((sum, t) => sum + parseFloat(t.price), 0) / noTrades.length
        : 0.5;
      
      return {
        date: period.date,
        yesPrice,
        noPrice,
        volume: period.volume
      };
    }).sort((a, b) => a.date - b.date);
  }, [trades]);
  
  const {
    showTooltip,
    hideTooltip,
    tooltipData,
    tooltipTop = 0,
    tooltipLeft = 0,
  } = useTooltip();
  
  return (
    <div style={{ position: 'relative' }}>
      <ParentSize>
        {({ width }) => {
          if (width < 10) return null;
          
          const margin = { top: 20, right: 20, bottom: 40, left: 50 };
          const innerWidth = width - margin.left - margin.right;
          const innerHeight = height - margin.top - margin.bottom;
          
          // Scales
          const xScale = scaleTime({
            domain: [
              Math.min(...chartData.map(d => d.date)),
              Math.max(...chartData.map(d => d.date))
            ],
            range: [0, innerWidth],
          });
          
          const yScale = scaleLinear({
            domain: [0, 1],
            range: [innerHeight, 0],
            nice: true,
          });
          
          // Accessors
          const getX = (d) => xScale(d.date);
          const getYesY = (d) => yScale(d.yesPrice);
          const getNoY = (d) => yScale(d.noPrice);
          
          const handleTooltip = (event) => {
            const { x } = localPoint(event) || { x: 0 };
            const x0 = xScale.invert(x - margin.left);
            
            // Find closest data point
            const closestData = chartData.reduce((prev, curr) => {
              return Math.abs(curr.date - x0) < Math.abs(prev.date - x0) ? curr : prev;
            });
            
            if (closestData) {
              showTooltip({
                tooltipData: closestData,
                tooltipLeft: xScale(closestData.date) + margin.left,
                tooltipTop: yScale(closestData.yesPrice) + margin.top,
              });
            }
          };
          
          return (
            <>
              <svg width={width} height={height}>
                <rect
                  width={width}
                  height={height}
                  fill="transparent"
                  onMouseMove={handleTooltip}
                  onMouseLeave={hideTooltip}
                />
                
                <Group left={margin.left} top={margin.top}>
                  {/* Grid */}
                  <GridRows
                    scale={yScale}
                    width={innerWidth}
                    stroke="#1a1a1a"
                    strokeOpacity={0.5}
                    numTicks={5}
                  />
                  <GridColumns
                    scale={xScale}
                    height={innerHeight}
                    stroke="#1a1a1a"
                    strokeOpacity={0.5}
                    numTicks={5}
                  />
                  
                  {/* Area fills */}
                  <Area
                    data={chartData}
                    x={getX}
                    y0={innerHeight}
                    y1={getYesY}
                    fill="rgba(0, 255, 136, 0.1)"
                    strokeWidth={0}
                    curve={curveMonotoneX}
                  />
                  
                  <Area
                    data={chartData}
                    x={getX}
                    y0={innerHeight}
                    y1={getNoY}
                    fill="rgba(255, 68, 68, 0.1)"
                    strokeWidth={0}
                    curve={curveMonotoneX}
                  />
                  
                  {/* Lines */}
                  <LinePath
                    data={chartData}
                    x={getX}
                    y={getYesY}
                    stroke="#00ff88"
                    strokeWidth={2}
                    curve={curveMonotoneX}
                  />
                  
                  <LinePath
                    data={chartData}
                    x={getX}
                    y={getNoY}
                    stroke="#ff4444"
                    strokeWidth={2}
                    curve={curveMonotoneX}
                  />
                  
                  {/* Axes */}
                  <AxisBottom
                    top={innerHeight}
                    scale={xScale}
                    numTicks={5}
                    stroke="#555555"
                    tickStroke="#555555"
                    tickLabelProps={() => ({
                      fill: '#666666',
                      fontSize: 10,
                      textAnchor: 'middle',
                    })}
                    tickFormat={(d) => format(d, 'dd MMM', { locale: tr })}
                  />
                  
                  <AxisLeft
                    scale={yScale}
                    numTicks={5}
                    stroke="#555555"
                    tickStroke="#555555"
                    tickLabelProps={() => ({
                      fill: '#666666',
                      fontSize: 10,
                      textAnchor: 'end',
                      dy: '0.33em',
                      dx: -4,
                    })}
                    tickFormat={(d) => `${(d * 100).toFixed(0)}%`}
                  />
                  
                  {/* Tooltip indicator */}
                  {tooltipData && (
                    <>
                      <circle
                        cx={xScale(tooltipData.date)}
                        cy={yScale(tooltipData.yesPrice)}
                        r={4}
                        fill="#00ff88"
                        stroke="white"
                        strokeWidth={2}
                      />
                      <circle
                        cx={xScale(tooltipData.date)}
                        cy={yScale(tooltipData.noPrice)}
                        r={4}
                        fill="#ff4444"
                        stroke="white"
                        strokeWidth={2}
                      />
                    </>
                  )}
                </Group>
              </svg>
              
              {/* Tooltip */}
              {tooltipData && (
                <TooltipWithBounds
                  key={Math.random()}
                  top={tooltipTop}
                  left={tooltipLeft}
                  style={{
                    ...defaultStyles,
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    color: '#ffffff',
                    padding: '8px',
                    fontSize: '12px',
                    borderRadius: '8px',
                  }}
                >
                  <div>
                    <div style={{ marginBottom: '4px', color: '#666666' }}>
                      {format(tooltipData.date, 'dd MMM yyyy HH:mm', { locale: tr })}
                    </div>
                    <div style={{ color: '#00ff88' }}>
                      Evet: {(tooltipData.yesPrice * 100).toFixed(1)}%
                    </div>
                    <div style={{ color: '#ff4444' }}>
                      Hayır: {(tooltipData.noPrice * 100).toFixed(1)}%
                    </div>
                    {tooltipData.volume > 0 && (
                      <div style={{ marginTop: '4px', color: '#ccff33' }}>
                        Hacim: {tooltipData.volume.toFixed(2)}₺
                      </div>
                    )}
                  </div>
                </TooltipWithBounds>
              )}
            </>
          );
        }}
      </ParentSize>
    </div>
  );
};

export default PriceChart;