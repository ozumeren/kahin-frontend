import React, { useMemo, useState, useCallback } from 'react';
import { scaleTime, scaleLinear } from '@visx/scale';
import { curveMonotoneX } from '@visx/curve';
import { LinePath, AreaClosed, Bar } from '@visx/shape';
import { GridRows, GridColumns } from '@visx/grid';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { localPoint } from '@visx/event';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { bisector } from 'd3-array';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const tooltipStyles = {
  ...defaultStyles,
  minWidth: 120,
  backgroundColor: 'rgba(0, 0, 0, 0.9)',
  color: 'white',
  padding: '12px',
  borderRadius: '8px',
  fontSize: '14px',
};

const getDate = (d) => new Date(d.timestamp);
const getYesPrice = (d) => d.yes;
const getNoPrice = (d) => d.no;

const bisectDate = bisector((d) => new Date(d.timestamp)).left;

const MarketChart = ({ 
  data = [], 
  width = 800, 
  height = 400,
  margin = { top: 20, right: 40, bottom: 50, left: 50 },
  showGrid = true,
  showArea = true,
  animated = true
}) => {
  const [hoveredOutcome, setHoveredOutcome] = useState(null);

  const {
    showTooltip,
    hideTooltip,
    tooltipData,
    tooltipLeft = 0,
    tooltipTop = 0,
  } = useTooltip();

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data
      .filter(d => d.timestamp && (d.yes !== null || d.no !== null))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [data]);

  const xScale = useMemo(
    () =>
      scaleTime({
        range: [0, innerWidth],
        domain: chartData.length > 0 
          ? [
              Math.min(...chartData.map(getDate)),
              Math.max(...chartData.map(getDate))
            ]
          : [new Date(), new Date()],
      }),
    [innerWidth, chartData]
  );

  const yScale = useMemo(
    () =>
      scaleLinear({
        range: [innerHeight, 0],
        domain: [0, 100],
        nice: true,
      }),
    [innerHeight]
  );

  const handleTooltip = useCallback(
    (event) => {
      const { x } = localPoint(event) || { x: 0 };
      const x0 = xScale.invert(x - margin.left);
      const index = bisectDate(chartData, x0, 1);
      const d0 = chartData[index - 1];
      const d1 = chartData[index];
      let d = d0;

      if (d1 && getDate(d1)) {
        d = x0.valueOf() - getDate(d0).valueOf() > getDate(d1).valueOf() - x0.valueOf() ? d1 : d0;
      }

      showTooltip({
        tooltipData: d,
        tooltipLeft: x,
        tooltipTop: yScale(d?.yes || d?.no || 50),
      });
    },
    [showTooltip, xScale, yScale, chartData, margin.left]
  );

  if (chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          <p className="font-medium">Henüz yeterli işlem verisi yok</p>
          <p className="text-sm mt-1">İşlemler gerçekleştikçe grafik burada görünecek</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Legend */}
      <div className="flex items-center justify-end gap-4 mb-3 px-2">
        <button
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
            hoveredOutcome === 'yes' ? 'bg-green-100' : ''
          }`}
          onMouseEnter={() => setHoveredOutcome('yes')}
          onMouseLeave={() => setHoveredOutcome(null)}
        >
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span className="text-sm font-medium text-gray-700">EVET</span>
        </button>
        <button
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
            hoveredOutcome === 'no' ? 'bg-red-100' : ''
          }`}
          onMouseEnter={() => setHoveredOutcome('no')}
          onMouseLeave={() => setHoveredOutcome(null)}
        >
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <span className="text-sm font-medium text-gray-700">HAYIR</span>
        </button>
      </div>

      <svg width={width} height={height}>
        <defs>
          <linearGradient id="area-gradient-yes" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ccff33" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#ccff33" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="area-gradient-no" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF0000" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#FF0000" stopOpacity={0.05} />
          </linearGradient>
        </defs>

        <g transform={`translate(${margin.left},${margin.top})`}>
          {showGrid && (
            <>
              <GridRows
                scale={yScale}
                width={innerWidth}
                strokeDasharray="2,2"
                stroke="#e5e7eb"
                strokeOpacity={0.7}
              />
              <GridColumns
                scale={xScale}
                height={innerHeight}
                strokeDasharray="2,2"
                stroke="#e5e7eb"
                strokeOpacity={0.7}
              />
            </>
          )}

          {showArea && (
            <>
              {chartData.some(d => d.yes !== null) && (
                <AreaClosed
                  data={chartData.filter(d => d.yes !== null)}
                  x={(d) => xScale(getDate(d)) ?? 0}
                  y={(d) => yScale(getYesPrice(d)) ?? 0}
                  yScale={yScale}
                  fill="url(#area-gradient-yes)"
                  curve={curveMonotoneX}
                  opacity={hoveredOutcome === 'no' ? 0.2 : hoveredOutcome === 'yes' ? 1 : 0.8}
                  className={animated ? 'transition-opacity duration-200' : ''}
                />
              )}

              {chartData.some(d => d.no !== null) && (
                <AreaClosed
                  data={chartData.filter(d => d.no !== null)}
                  x={(d) => xScale(getDate(d)) ?? 0}
                  y={(d) => yScale(getNoPrice(d)) ?? 0}
                  yScale={yScale}
                  fill="url(#area-gradient-no)"
                  curve={curveMonotoneX}
                  opacity={hoveredOutcome === 'yes' ? 0.2 : hoveredOutcome === 'no' ? 1 : 0.8}
                  className={animated ? 'transition-opacity duration-200' : ''}
                />
              )}
            </>
          )}

          {chartData.some(d => d.yes !== null) && (
            <LinePath
              data={chartData.filter(d => d.yes !== null)}
              x={(d) => xScale(getDate(d)) ?? 0}
              y={(d) => yScale(getYesPrice(d)) ?? 0}
              stroke="#ccff33"
              strokeWidth={hoveredOutcome === 'no' ? 1.5 : 2.5}
              curve={curveMonotoneX}
              opacity={hoveredOutcome === 'no' ? 0.3 : 1}
              className={animated ? 'transition-all duration-200' : ''}
            />
          )}

          {chartData.some(d => d.no !== null) && (
            <LinePath
              data={chartData.filter(d => d.no !== null)}
              x={(d) => xScale(getDate(d)) ?? 0}
              y={(d) => yScale(getNoPrice(d)) ?? 0}
              stroke="#FF0000"
              strokeWidth={hoveredOutcome === 'yes' ? 1.5 : 2.5}
              curve={curveMonotoneX}
              opacity={hoveredOutcome === 'yes' ? 0.3 : 1}
              className={animated ? 'transition-all duration-200' : ''}
            />
          )}

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
              fontFamily: 'system-ui, -apple-system, sans-serif',
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
              fontFamily: 'system-ui, -apple-system, sans-serif',
            })}
            tickFormat={(value) => `${value}%`}
          />

          <Bar
            x={0}
            y={0}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            onMouseMove={handleTooltip}
            onMouseLeave={() => hideTooltip()}
          />

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
              {tooltipData.yes !== null && (
                <circle
                  cx={xScale(getDate(tooltipData))}
                  cy={yScale(getYesPrice(tooltipData))}
                  r={4}
                  fill="#ccff33"
                  stroke="white"
                  strokeWidth={2}
                  pointerEvents="none"
                />
              )}
              {tooltipData.no !== null && (
                <circle
                  cx={xScale(getDate(tooltipData))}
                  cy={yScale(getNoPrice(tooltipData))}
                  r={4}
                  fill="#FF0000"
                  stroke="white"
                  strokeWidth={2}
                  pointerEvents="none"
                />
              )}
            </>
          )}
        </g>
      </svg>

      {tooltipData && (
        <TooltipWithBounds
          key={Math.random()}
          top={tooltipTop + margin.top}
          left={tooltipLeft}
          style={tooltipStyles}
        >
          <div className="space-y-2">
            <div className="font-semibold text-xs text-gray-300 mb-2">
              {format(getDate(tooltipData), 'dd MMM HH:mm', { locale: tr })}
            </div>
            {tooltipData.yes !== null && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-green-400 font-medium">EVET:</span>
                <span className="font-bold">{tooltipData.yes.toFixed(1)}%</span>
              </div>
            )}
            {tooltipData.no !== null && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-red-400 font-medium">HAYIR:</span>
                <span className="font-bold">{tooltipData.no.toFixed(1)}%</span>
              </div>
            )}
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
};

export default MarketChart;