import React, { useState, useMemo } from 'react';
import { ParentSize } from '@visx/responsive';
import { LinePath, Area, Bar } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { Group } from '@visx/group';
import { localPoint } from '@visx/event';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

const INTERVALS = [
  { value: '1h', label: '1S' },
  { value: '4h', label: '4S' },
  { value: '1d', label: '1G' },
];

// Her iki outcome için candles çeken hook
function useDualPriceCandles(marketId, interval, limit = 100) {
  // YES candles
  const yesQuery = useQuery({
    queryKey: ['candles', marketId, interval, 'yes'],
    queryFn: async () => {
      const response = await apiClient.get(`/markets/${marketId}/candles`, {
        params: { interval, outcome: 'true', limit }
      });
      return response.data.data || [];
    },
    enabled: !!marketId,
    staleTime: 60000,
  });

  // NO candles
  const noQuery = useQuery({
    queryKey: ['candles', marketId, interval, 'no'],
    queryFn: async () => {
      const response = await apiClient.get(`/markets/${marketId}/candles`, {
        params: { interval, outcome: 'false', limit }
      });
      return response.data.data || [];
    },
    enabled: !!marketId,
    staleTime: 60000,
  });

  return {
    yesCandles: yesQuery.data || [],
    noCandles: noQuery.data || [],
    isLoading: yesQuery.isLoading || noQuery.isLoading,
  };
}

const PriceChart = ({ marketId, trades = [], height = 350 }) => {
  const [interval, setInterval] = useState('1h');
  const [showVolume, setShowVolume] = useState(true);

  // Backend'den her iki outcome için candles verisi al
  const { yesCandles, noCandles, isLoading } = useDualPriceCandles(marketId, interval);

  // İki veri setini birleştir
  const chartData = useMemo(() => {
    // Candles verisi varsa kullan
    if (yesCandles.length > 0 || noCandles.length > 0) {
      // Timestamp'e göre birleştir
      const dataMap = new Map();

      yesCandles.forEach(candle => {
        const timestamp = new Date(candle.timestamp).getTime();
        if (!dataMap.has(timestamp)) {
          dataMap.set(timestamp, {
            date: new Date(candle.timestamp),
            volume: 0,
            tradeCount: 0,
          });
        }
        const entry = dataMap.get(timestamp);
        entry.yesPrice = parseFloat(candle.close);
        entry.yesOpen = parseFloat(candle.open);
        entry.yesHigh = parseFloat(candle.high);
        entry.yesLow = parseFloat(candle.low);
        entry.volume += parseInt(candle.volume) || 0;
        entry.tradeCount += parseInt(candle.trade_count) || 0;
      });

      noCandles.forEach(candle => {
        const timestamp = new Date(candle.timestamp).getTime();
        if (!dataMap.has(timestamp)) {
          dataMap.set(timestamp, {
            date: new Date(candle.timestamp),
            volume: 0,
            tradeCount: 0,
          });
        }
        const entry = dataMap.get(timestamp);
        entry.noPrice = parseFloat(candle.close);
        entry.noOpen = parseFloat(candle.open);
        entry.noHigh = parseFloat(candle.high);
        entry.noLow = parseFloat(candle.low);
        entry.volume += parseInt(candle.volume) || 0;
        entry.tradeCount += parseInt(candle.trade_count) || 0;
      });

      // Map'i array'e çevir ve sırala
      const result = Array.from(dataMap.values())
        .map(entry => ({
          ...entry,
          // Eksik değerleri tamamla (100% - diğer taraf)
          yesPrice: entry.yesPrice ?? (entry.noPrice ? 1 - entry.noPrice : 0.5),
          noPrice: entry.noPrice ?? (entry.yesPrice ? 1 - entry.yesPrice : 0.5),
        }))
        .sort((a, b) => a.date - b.date);

      return result;
    }

    // Fallback: trades verisinden grafik oluştur
    if (trades && trades.length > 0) {
      const groupedData = trades.reduce((acc, trade) => {
        const date = new Date(trade.createdAt);
        const dateKey = format(date, 'yyyy-MM-dd HH:00');

        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: new Date(dateKey),
            yesPrices: [],
            noPrices: [],
            volume: 0,
            tradeCount: 0
          };
        }

        if (trade.outcome === 'YES') {
          acc[dateKey].yesPrices.push(parseFloat(trade.price));
        } else {
          acc[dateKey].noPrices.push(parseFloat(trade.price));
        }
        acc[dateKey].volume += parseFloat(trade.quantity || 0);
        acc[dateKey].tradeCount += 1;

        return acc;
      }, {});

      return Object.values(groupedData).map(period => {
        const yesPrice = period.yesPrices.length > 0
          ? period.yesPrices.reduce((a, b) => a + b, 0) / period.yesPrices.length
          : null;
        const noPrice = period.noPrices.length > 0
          ? period.noPrices.reduce((a, b) => a + b, 0) / period.noPrices.length
          : null;

        return {
          date: period.date,
          yesPrice: yesPrice ?? (noPrice ? 1 - noPrice : 0.5),
          noPrice: noPrice ?? (yesPrice ? 1 - yesPrice : 0.5),
          volume: period.volume,
          tradeCount: period.tradeCount,
        };
      }).sort((a, b) => a.date - b.date);
    }

    // Mock data
    const now = new Date();
    const mockData = [];
    let yesPrice = 0.5;
    for (let i = 48; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 60 * 60 * 1000);
      // Random walk
      yesPrice = Math.max(0.05, Math.min(0.95, yesPrice + (Math.random() - 0.5) * 0.05));
      mockData.push({
        date,
        yesPrice,
        noPrice: 1 - yesPrice,
        volume: Math.floor(Math.random() * 50),
        tradeCount: Math.floor(Math.random() * 5),
      });
    }
    return mockData;
  }, [yesCandles, noCandles, trades]);

  const {
    showTooltip,
    hideTooltip,
    tooltipData,
    tooltipTop = 0,
    tooltipLeft = 0,
  } = useTooltip();

  // Son fiyatlar ve değişim
  const stats = useMemo(() => {
    if (chartData.length < 2) {
      return { yesPrice: 50, noPrice: 50, yesChange: 0, noChange: 0 };
    }
    const first = chartData[0];
    const last = chartData[chartData.length - 1];

    const yesChange = ((last.yesPrice - first.yesPrice) / first.yesPrice) * 100;
    const noChange = ((last.noPrice - first.noPrice) / first.noPrice) * 100;

    return {
      yesPrice: Math.round(last.yesPrice * 100),
      noPrice: Math.round(last.noPrice * 100),
      yesChange,
      noChange,
    };
  }, [chartData]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {/* Current prices */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00ff88' }}></div>
            <span style={{ color: '#ffffff' }}>Evet:</span>
            <span className="font-bold" style={{ color: '#00ff88' }}>%{stats.yesPrice}</span>
            <span
              className="text-xs"
              style={{ color: stats.yesChange >= 0 ? '#00ff88' : '#ff4444' }}
            >
              ({stats.yesChange >= 0 ? '+' : ''}{stats.yesChange.toFixed(1)}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff4444' }}></div>
            <span style={{ color: '#ffffff' }}>Hayır:</span>
            <span className="font-bold" style={{ color: '#ff4444' }}>%{stats.noPrice}</span>
            <span
              className="text-xs"
              style={{ color: stats.noChange >= 0 ? '#00ff88' : '#ff4444' }}
            >
              ({stats.noChange >= 0 ? '+' : ''}{stats.noChange.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowVolume(!showVolume)}
            className="px-2 py-1 text-xs rounded transition-all"
            style={{
              backgroundColor: showVolume ? 'rgba(204, 255, 51, 0.2)' : 'transparent',
              color: showVolume ? '#ccff33' : '#666666',
              border: '1px solid #333333'
            }}
          >
            Hacim
          </button>

          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #333333' }}>
            {INTERVALS.map((int) => (
              <button
                key={int.value}
                onClick={() => setInterval(int.value)}
                className="px-3 py-1 text-xs font-medium transition-all"
                style={{
                  backgroundColor: interval === int.value ? '#ccff33' : 'transparent',
                  color: interval === int.value ? '#000000' : '#888888',
                }}
              >
                {int.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
               style={{ borderColor: '#ccff33' }}></div>
        </div>
      )}

      {/* Chart */}
      {!isLoading && (
        <div style={{ position: 'relative' }}>
          <ParentSize>
            {({ width }) => {
              if (width < 10) return null;

              const margin = { top: 10, right: 10, bottom: showVolume ? 60 : 30, left: 45 };
              const innerWidth = width - margin.left - margin.right;
              const chartHeight = showVolume ? height - 50 : height - 20;
              const innerHeight = chartHeight - margin.top - margin.bottom;
              const volumeHeight = 40;

              // Scales - Y ekseni her zaman 0-100%
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
              });

              const volumeScale = scaleLinear({
                domain: [0, Math.max(...chartData.map(d => d.volume), 1)],
                range: [volumeHeight, 0],
              });

              const getX = (d) => xScale(d.date);
              const getYesY = (d) => yScale(d.yesPrice);
              const getNoY = (d) => yScale(d.noPrice);

              const handleTooltip = (event) => {
                const { x } = localPoint(event) || { x: 0 };
                const x0 = xScale.invert(x - margin.left);

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
                  <svg width={width} height={showVolume ? height : chartHeight}>
                    <rect
                      width={width}
                      height={showVolume ? height : chartHeight}
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
                        strokeOpacity={0.8}
                        numTicks={5}
                      />

                      {/* 50% reference line */}
                      <line
                        x1={0}
                        x2={innerWidth}
                        y1={yScale(0.5)}
                        y2={yScale(0.5)}
                        stroke="#333333"
                        strokeDasharray="4,4"
                      />

                      {/* YES Area fill */}
                      <Area
                        data={chartData}
                        x={getX}
                        y0={yScale(0.5)}
                        y1={getYesY}
                        fill="rgba(0, 255, 136, 0.1)"
                        strokeWidth={0}
                        curve={curveMonotoneX}
                      />

                      {/* NO Area fill */}
                      <Area
                        data={chartData}
                        x={getX}
                        y0={yScale(0.5)}
                        y1={getNoY}
                        fill="rgba(255, 68, 68, 0.1)"
                        strokeWidth={0}
                        curve={curveMonotoneX}
                      />

                      {/* YES Line */}
                      <LinePath
                        data={chartData}
                        x={getX}
                        y={getYesY}
                        stroke="#00ff88"
                        strokeWidth={2}
                        curve={curveMonotoneX}
                      />

                      {/* NO Line */}
                      <LinePath
                        data={chartData}
                        x={getX}
                        y={getNoY}
                        stroke="#ff4444"
                        strokeWidth={2}
                        curve={curveMonotoneX}
                      />

                      {/* Y Axis */}
                      <AxisLeft
                        scale={yScale}
                        numTicks={5}
                        stroke="#333333"
                        tickStroke="#333333"
                        tickLabelProps={() => ({
                          fill: '#666666',
                          fontSize: 10,
                          textAnchor: 'end',
                          dy: '0.33em',
                          dx: -4,
                        })}
                        tickFormat={(d) => `${(d * 100).toFixed(0)}%`}
                      />

                      {/* X Axis */}
                      <AxisBottom
                        top={innerHeight}
                        scale={xScale}
                        numTicks={5}
                        stroke="#333333"
                        tickStroke="#333333"
                        tickLabelProps={() => ({
                          fill: '#666666',
                          fontSize: 10,
                          textAnchor: 'middle',
                        })}
                        tickFormat={(d) => {
                          if (interval === '1d') return format(d, 'dd MMM', { locale: tr });
                          return format(d, 'HH:mm', { locale: tr });
                        }}
                      />

                      {/* Tooltip indicators */}
                      {tooltipData && (
                        <>
                          <line
                            x1={xScale(tooltipData.date)}
                            x2={xScale(tooltipData.date)}
                            y1={0}
                            y2={innerHeight}
                            stroke="#444444"
                            strokeDasharray="4,4"
                          />
                          <circle
                            cx={xScale(tooltipData.date)}
                            cy={yScale(tooltipData.yesPrice)}
                            r={5}
                            fill="#00ff88"
                            stroke="#ffffff"
                            strokeWidth={2}
                          />
                          <circle
                            cx={xScale(tooltipData.date)}
                            cy={yScale(tooltipData.noPrice)}
                            r={5}
                            fill="#ff4444"
                            stroke="#ffffff"
                            strokeWidth={2}
                          />
                        </>
                      )}
                    </Group>

                    {/* Volume bars */}
                    {showVolume && (
                      <Group left={margin.left} top={chartHeight}>
                        {chartData.map((d, i) => {
                          const barWidth = Math.max(1, innerWidth / chartData.length - 2);
                          const barHeight = volumeHeight - volumeScale(d.volume);
                          return (
                            <Bar
                              key={i}
                              x={xScale(d.date) - barWidth / 2}
                              y={volumeScale(d.volume)}
                              width={barWidth}
                              height={barHeight}
                              fill="rgba(204, 255, 51, 0.4)"
                            />
                          );
                        })}
                      </Group>
                    )}
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
                        border: '1px solid #333333',
                        color: '#ffffff',
                        padding: '12px',
                        fontSize: '12px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                      }}
                    >
                      <div>
                        <div style={{ color: '#888888', marginBottom: '8px' }}>
                          {format(tooltipData.date, 'dd MMM yyyy HH:mm', { locale: tr })}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00ff88' }}></div>
                              <span>Evet</span>
                            </div>
                            <span className="font-bold" style={{ color: '#00ff88' }}>
                              %{(tooltipData.yesPrice * 100).toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ff4444' }}></div>
                              <span>Hayır</span>
                            </div>
                            <span className="font-bold" style={{ color: '#ff4444' }}>
                              %{(tooltipData.noPrice * 100).toFixed(1)}
                            </span>
                          </div>
                        </div>
                        {tooltipData.volume > 0 && (
                          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #333333', color: '#ccff33' }}>
                            Hacim: {tooltipData.volume} adet
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
      )}
    </div>
  );
};

export default PriceChart;
