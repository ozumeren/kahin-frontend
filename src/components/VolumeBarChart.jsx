import React, { useMemo } from 'react';
import { Group } from '@visx/group';
import { Bar } from '@visx/shape';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisBottom } from '@visx/axis';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const tooltipStyles = {
  ...defaultStyles,
  minWidth: 100,
  backgroundColor: 'rgba(0, 0, 0, 0.9)',
  color: 'white',
  padding: '8px 12px',
  borderRadius: '6px',
  fontSize: '12px',
};

// Aggregate trades into time buckets
function aggregateVolume(trades, intervalMinutes = 60) {
  if (!trades || trades.length === 0) return [];

  const intervals = new Map();
  
  trades.forEach(trade => {
    const timestamp = new Date(trade.createdAt).getTime();
    const intervalStart = Math.floor(timestamp / (intervalMinutes * 60 * 1000)) * (intervalMinutes * 60 * 1000);
    
    if (!intervals.has(intervalStart)) {
      intervals.set(intervalStart, {
        timestamp: intervalStart,
        yesVolume: 0,
        noVolume: 0,
        totalVolume: 0,
        count: 0,
      });
    }
    
    const interval = intervals.get(intervalStart);
    const volume = trade.quantity * parseFloat(trade.price);
    interval.totalVolume += volume;
    interval.count += 1;
    
    if (trade.outcome) {
      interval.yesVolume += volume;
    } else {
      interval.noVolume += volume;
    }
  });

  return Array.from(intervals.values())
    .sort((a, b) => a.timestamp - b.timestamp);
}

const VolumeBarChart = ({ 
  trades = [], 
  width = 800, 
  height = 150,
  margin = { top: 10, right: 20, bottom: 30, left: 20 },
  intervalMinutes = 60,
  showYesNo = true,
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
  const volumeData = useMemo(() => 
    aggregateVolume(trades, intervalMinutes),
    [trades, intervalMinutes]
  );

  // Scales
  const xScale = useMemo(
    () =>
      scaleTime({
        range: [0, innerWidth],
        domain: volumeData.length > 0
          ? [
              new Date(volumeData[0].timestamp),
              new Date(volumeData[volumeData.length - 1].timestamp)
            ]
          : [new Date(), new Date()],
      }),
    [innerWidth, volumeData]
  );

  const yScale = useMemo(
    () =>
      scaleLinear({
        range: [innerHeight, 0],
        domain: [0, Math.max(...volumeData.map(d => d.totalVolume), 1)],
        nice: true,
      }),
    [innerHeight, volumeData]
  );

  if (volumeData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
        Volume verisi yok
      </div>
    );
  }

  const barWidth = Math.max(2, (innerWidth / volumeData.length) * 0.8);

  return (
    <div className="relative">
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          {/* Bars */}
          {volumeData.map((d, i) => {
            const x = xScale(new Date(d.timestamp));
            const barHeight = innerHeight - yScale(d.totalVolume);

            return (
              <Group key={i}>
                {showYesNo ? (
                  <>
                    {/* YES Volume (Green) */}
                    <Bar
                      x={x - barWidth / 2}
                      y={yScale(d.totalVolume)}
                      width={barWidth}
                      height={barHeight * (d.yesVolume / d.totalVolume)}
                      fill="#ccff33"
                      opacity={0.8}
                      onMouseMove={(event) => {
                        const coords = localPoint(event);
                        showTooltip({
                          tooltipData: d,
                          tooltipLeft: coords.x,
                          tooltipTop: coords.y,
                        });
                      }}
                      onMouseLeave={hideTooltip}
                      className="cursor-pointer hover:opacity-100 transition-opacity"
                    />
                    {/* NO Volume (Red) */}
                    <Bar
                      x={x - barWidth / 2}
                      y={yScale(d.totalVolume) + barHeight * (d.yesVolume / d.totalVolume)}
                      width={barWidth}
                      height={barHeight * (d.noVolume / d.totalVolume)}
                      fill="#ef4444"
                      opacity={0.8}
                      onMouseMove={(event) => {
                        const coords = localPoint(event);
                        showTooltip({
                          tooltipData: d,
                          tooltipLeft: coords.x,
                          tooltipTop: coords.y,
                        });
                      }}
                      onMouseLeave={hideTooltip}
                      className="cursor-pointer hover:opacity-100 transition-opacity"
                    />
                  </>
                ) : (
                  <Bar
                    x={x - barWidth / 2}
                    y={yScale(d.totalVolume)}
                    width={barWidth}
                    height={barHeight}
                    fill="#6366f1"
                    opacity={0.7}
                    onMouseMove={(event) => {
                      const coords = localPoint(event);
                      showTooltip({
                        tooltipData: d,
                        tooltipLeft: coords.x,
                        tooltipTop: coords.y,
                      });
                    }}
                    onMouseLeave={hideTooltip}
                    className="cursor-pointer hover:opacity-100 transition-opacity"
                  />
                )}
              </Group>
            );
          })}

          {/* X Axis */}
          <AxisBottom
            top={innerHeight}
            scale={xScale}
            numTicks={Math.min(6, volumeData.length)}
            stroke="#d1d5db"
            tickStroke="#d1d5db"
            tickLabelProps={() => ({
              fill: '#9ca3af',
              fontSize: 10,
              textAnchor: 'middle',
            })}
            tickFormat={(date) => format(date, 'HH:mm', { locale: tr })}
          />
        </Group>
      </svg>

      {/* Tooltip */}
      {tooltipData && (
        <TooltipWithBounds
          key={Math.random()}
          top={tooltipTop}
          left={tooltipLeft}
          style={tooltipStyles}
        >
          <div className="space-y-1">
            <div className="font-semibold text-xs text-gray-300 mb-1">
              {format(new Date(tooltipData.timestamp), 'HH:mm', { locale: tr })}
            </div>
            <div className="text-xs">
              <div className="font-bold">₺{tooltipData.totalVolume.toFixed(2)}</div>
              <div className="text-gray-400">{tooltipData.count} işlem</div>
            </div>
            {showYesNo && (
              <div className="pt-1 border-t border-gray-700 text-xs space-y-0.5">
                <div className="flex justify-between gap-2">
                  <span className="text-green-400">EVET:</span>
                  <span>₺{tooltipData.yesVolume.toFixed(2)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-red-400">HAYIR:</span>
                  <span>₺{tooltipData.noVolume.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
};

export default VolumeBarChart;