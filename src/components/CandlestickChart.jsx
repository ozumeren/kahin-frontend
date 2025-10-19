import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { scaleTime, scaleLinear } from '@visx/scale';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { bisector } from 'd3-array';
import { Bar } from '@visx/shape';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const tooltipStyles = {
  ...defaultStyles,
  minWidth: 180,
  backgroundColor: 'rgba(0, 0, 0, 0.9)',
  color: 'white',
  padding: '12px',
  borderRadius: '8px',
  fontSize: '13px',
};

// Aggregate trades into candlestick data
function aggregateToCandlesticks(trades, intervalMinutes = 15) {
  if (!trades || trades.length === 0) return [];

  const intervals = new Map();
  
  trades.forEach(trade => {
    const timestamp = new Date(trade.createdAt).getTime();
    const intervalStart = Math.floor(timestamp / (intervalMinutes * 60 * 1000)) * (intervalMinutes * 60 * 1000);
    
    if (!intervals.has(intervalStart)) {
      intervals.set(intervalStart, {
        timestamp: intervalStart,
        trades: [],
        yesVolume: 0,
        noVolume: 0,
      });
    }
    
    const interval = intervals.get(intervalStart);
    interval.trades.push(trade);
    if (trade.outcome) {
      interval.yesVolume += trade.quantity;
    } else {
      interval.noVolume += trade.quantity;
    }
  });

  // Convert to candlestick format
  return Array.from(intervals.values())
    .map(interval => {
      const prices = interval.trades.map(t => parseFloat(t.price));
      return {
        timestamp: interval.timestamp,
        open: prices[0],
        high: Math.max(...prices),
        low: Math.min(...prices),
        close: prices[prices.length - 1],
        volume: interval.yesVolume + interval.noVolume,
        yesVolume: interval.yesVolume,
        noVolume: interval.noVolume,
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp);
}

const getDate = (d) => new Date(d.timestamp);
const bisectDate = bisector((d) => new Date(d.timestamp)).left;

const CandlestickChart = ({ 
  trades = [], 
  width = 800, 
  height = 400,
  margin = { top: 20, right: 60, bottom: 50, left: 60 },
  intervalMinutes = 15,
}) => {
  const {
    showTooltip,
    hideTooltip,
    tooltipData,
    tooltipLeft = 0,
    tooltipTop = 0,
  } = useTooltip();

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Aggregate data
  const candlestickData = useMemo(() => 
    aggregateToCandlesticks(trades, intervalMinutes),
    [trades, intervalMinutes]
  );

  // Scales
  const xScale = useMemo(
    () =>
      scaleTime({
        range: [0, innerWidth],
        domain: candlestickData.length > 0
          ? [
              Math.min(...candlestickData.map(getDate)),
              Math.max(...candlestickData.map(getDate))
            ]
          : [new Date(), new Date()],
      }),
    [innerWidth, candlestickData]
  );

  const yScale = useMemo(
    () =>
      scaleLinear({
        range: [innerHeight, 0],
        domain: candlestickData.length > 0
          ? [
              Math.min(...candlestickData.map(d => d.low)) * 0.95,
              Math.max(...candlestickData.map(d => d.high)) * 1.05
            ]
          : [0, 100],
        nice: true,
      }),
    [innerHeight, candlestickData]
  );

  const handleTooltip = (event) => {
    const { x } = localPoint(event) || { x: 0 };
    const x0 = xScale.invert(x - margin.left);
    const index = bisectDate(candlestickData, x0, 1);
    const d0 = candlestickData[index - 1];
    const d1 = candlestickData[index];
    let d = d0;

    if (d1 && getDate(d1)) {
      d = x0.valueOf() - getDate(d0).valueOf() > getDate(d1).valueOf() - x0.valueOf() ? d1 : d0;
    }

    showTooltip({
      tooltipData: d,
      tooltipLeft: x,
      tooltipTop: yScale((d.high + d.low) / 2),
    });
  };

  if (candlestickData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="font-medium">Mum grafiği için yeterli veri yok</p>
          <p className="text-sm mt-1">En az {intervalMinutes} dakikalık işlem verisi gerekiyor</p>
        </div>
      </div>
    );
  }

  const candleWidth = Math.max(2, (innerWidth / candlestickData.length) * 0.7);

  return (
    <div className="relative">
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          {/* Grid */}
          <GridRows
            scale={yScale}
            width={innerWidth}
            strokeDasharray="2,2"
            stroke="#e5e7eb"
            strokeOpacity={0.7}
          />

          {/* Candlesticks */}
          {candlestickData.map((d, i) => {
            const x = xScale(getDate(d));
            const isUp = d.close >= d.open;
            const color = isUp ? '#ccff33' : '#ef4444';
            const wickColor = isUp ? '#16a34a' : '#dc2626';

            return (
              <Group key={i}>
                {/* Wick (high-low line) */}
                <line
                  x1={x}
                  y1={yScale(d.high)}
                  x2={x}
                  y2={yScale(d.low)}
                  stroke={wickColor}
                  strokeWidth={1.5}
                />
                
                {/* Body (open-close rectangle) */}
                <rect
                  x={x - candleWidth / 2}
                  y={yScale(Math.max(d.open, d.close))}
                  width={candleWidth}
                  height={Math.max(1, Math.abs(yScale(d.open) - yScale(d.close)))}
                  fill={color}
                  stroke={color}
                  strokeWidth={1}
                  rx={1}
                />
              </Group>
            );
          })}

          {/* Axes */}
          <AxisBottom
            top={innerHeight}
            scale={xScale}
            numTicks={6}
            stroke="#9ca3af"
            tickStroke="#9ca3af"
            tickLabelProps={() => ({
              fill: '#6b7280',
              fontSize: 11,
              textAnchor: 'middle',
            })}
            tickFormat={(date) => format(date, 'HH:mm', { locale: tr })}
          />

          <AxisLeft
            scale={yScale}
            numTicks={5}
            stroke="#9ca3af"
            tickStroke="#9ca3af"
            tickLabelProps={() => ({
              fill: '#6b7280',
              fontSize: 11,
              textAnchor: 'end',
              dx: -4,
            })}
            tickFormat={(value) => `₺${value.toFixed(0)}`}
          />

          {/* Hover overlay */}
          <Bar
            x={0}
            y={0}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            onMouseMove={handleTooltip}
            onMouseLeave={() => hideTooltip()}
          />

          {/* Tooltip crosshair */}
          {tooltipData && (
            <>
              <line
                x1={tooltipLeft - margin.left}
                y1={0}
                x2={tooltipLeft - margin.left}
                y2={innerHeight}
                stroke="#9ca3af"
                strokeWidth={1}
                strokeDasharray="4,4"
                pointerEvents="none"
              />
              <line
                x1={0}
                y1={tooltipTop}
                x2={innerWidth}
                y2={tooltipTop}
                stroke="#9ca3af"
                strokeWidth={1}
                strokeDasharray="4,4"
                pointerEvents="none"
              />
            </>
          )}
        </Group>
      </svg>

      {/* Tooltip */}
      {tooltipData && (
        <TooltipWithBounds
          key={Math.random()}
          top={tooltipTop + margin.top}
          left={tooltipLeft}
          style={tooltipStyles}
        >
          <div className="space-y-2">
            <div className="font-semibold text-xs text-gray-300 mb-2 pb-2 border-b border-gray-700">
              {format(getDate(tooltipData), 'dd MMM HH:mm', { locale: tr })}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span className="text-gray-400">Açılış:</span>
              <span className="font-bold text-right">₺{tooltipData.open.toFixed(2)}</span>
              
              <span className="text-gray-400">Yüksek:</span>
              <span className="font-bold text-green-400 text-right">₺{tooltipData.high.toFixed(2)}</span>
              
              <span className="text-gray-400">Düşük:</span>
              <span className="font-bold text-red-400 text-right">₺{tooltipData.low.toFixed(2)}</span>
              
              <span className="text-gray-400">Kapanış:</span>
              <span className="font-bold text-right">₺{tooltipData.close.toFixed(2)}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-gray-700 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Hacim:</span>
                <span className="font-bold">{tooltipData.volume} işlem</span>
              </div>
            </div>
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
};

export default CandlestickChart;