import { Activity, BarChart3, CandlestickChart, ChevronDown, Maximize2, Settings2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MarketInstrument } from "@shared/market-data";
import { cn } from "@/lib/utils";

const timeframes = ["1D", "5D", "1M", "3M", "1Y", "5Y"];
const chartTypes = [
  { label: "Line", icon: Activity },
  { label: "Candles", icon: CandlestickChart },
  { label: "Area", icon: BarChart3 },
];

type MarketChartProps = {
  instrument: MarketInstrument;
  series: { label: string; value: number }[];
  onCompare?: () => void;
};

export function MarketChart({ instrument, series, onCompare }: MarketChartProps) {
  const [timeframe, setTimeframe] = useState("1D");
  const [chartType, setChartType] = useState("Area");
  const positive = instrument.changePct >= 0;
  const chartColor = positive ? "#5eead4" : "#fb7185";
  const gradientId = useMemo(() => `chart-${instrument.symbol.replace(/[^a-z0-9]/gi, "")}`, [instrument.symbol]);

  return (
    <div className="chart-shell">
      <div className="chart-toolbar">
        <div className="chart-tabs">
          {timeframes.map((period) => (
            <button key={period} type="button" className={cn("chart-tab", timeframe === period && "active")} onClick={() => setTimeframe(period)}>
              {period}
            </button>
          ))}
        </div>
        <div className="chart-tools">
          <button type="button" className="toolbar-button" onClick={onCompare}><span>Compare</span><ChevronDown size={13} /></button>
          <div className="chart-type-group">
            {chartTypes.map(({ label, icon: Icon }) => (
              <button key={label} type="button" aria-label={label} className={cn("chart-icon-button", chartType === label && "active")} onClick={() => setChartType(label)}>
                <Icon size={15} />
              </button>
            ))}
          </div>
          <button type="button" className="chart-icon-button"><Settings2 size={15} /></button>
          <button type="button" className="chart-icon-button"><Maximize2 size={15} /></button>
        </div>
      </div>
      <div className="chart-area">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 12, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1e2b3d" strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#60718a", fontSize: 10 }} axisLine={false} tickLine={false} dy={10} />
            <YAxis orientation="right" tick={{ fill: "#60718a", fontSize: 10 }} axisLine={false} tickLine={false} domain={["dataMin - 2", "dataMax + 2"]} tickFormatter={(value) => Number(value).toFixed(instrument.price < 10 ? 4 : 0)} />
            <Tooltip
              cursor={{ stroke: "#60718a", strokeDasharray: "3 3" }}
              contentStyle={{ background: "#111c2b", border: "1px solid #2b3a4d", borderRadius: 10, color: "#f4f7fb", fontSize: 12 }}
              labelStyle={{ color: "#8da0b8", marginBottom: 4 }}
              formatter={(value) => [`${Number(value).toLocaleString(undefined, { maximumFractionDigits: instrument.price < 10 ? 4 : 2 })}`, instrument.symbol]}
            />
            <Area type="monotone" dataKey="value" stroke={chartColor} strokeWidth={2.5} fill={`url(#${gradientId})`} dot={false} activeDot={{ r: 4, fill: chartColor, stroke: "#0d1622", strokeWidth: 3 }} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="chart-badge"><span className="live-dot" /> Live market data</div>
      </div>
    </div>
  );
}
