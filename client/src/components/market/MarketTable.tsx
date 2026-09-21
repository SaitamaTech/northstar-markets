import { ArrowDownRight, ArrowUpRight, MoreHorizontal, Star } from "lucide-react";
import type { MarketInstrument } from "@shared/market-data";
import { MiniSparkline } from "./MiniSparkline";
import { cn } from "@/lib/utils";

type MarketTableProps = {
  instruments: MarketInstrument[];
  onSelect?: (symbol: string) => void;
  compact?: boolean;
};

export function MarketTable({ instruments, onSelect, compact = false }: MarketTableProps) {
  return (
    <div className={cn("market-table-wrap", compact && "compact-table")}>
      <table className="market-table">
        <thead>
          <tr>
            <th className="star-column" aria-label="Watchlist" />
            <th>Asset</th>
            <th className="right">Last</th>
            <th className="right">Change</th>
            <th className="right">Change %</th>
            {!compact && <th className="spark-column">Trend</th>}
            {!compact && <th className="right">Volume</th>}
            {!compact && <th className="right">Market cap</th>}
            <th aria-label="More" />
          </tr>
        </thead>
        <tbody>
          {instruments.map((item) => {
            const positive = item.changePct >= 0;
            return (
              <tr key={item.symbol} onClick={() => onSelect?.(item.symbol)} className={onSelect ? "clickable-row" : undefined}>
                <td className="star-column"><button type="button" className="icon-button subtle" aria-label={`Add ${item.symbol} to watchlist`} onClick={(event) => event.stopPropagation()}><Star size={14} /></button></td>
                <td>
                  <div className="asset-cell">
                    <div className={cn("asset-mark", `asset-${item.category}`)}>{item.symbol.slice(0, 2)}</div>
                    <div><strong>{item.symbol}</strong><span>{item.name}</span></div>
                  </div>
                </td>
                <td className="right mono">{item.price.toLocaleString(undefined, { maximumFractionDigits: item.price < 10 ? 4 : 2 })}</td>
                <td className={cn("right mono", positive ? "positive" : "negative")}>{positive ? "+" : ""}{item.change.toLocaleString(undefined, { maximumFractionDigits: item.price < 10 ? 4 : 2 })}</td>
                <td className={cn("right mono", positive ? "positive" : "negative")}><span className="change-pill">{positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{positive ? "+" : ""}{item.changePct.toFixed(2)}%</span></td>
                {!compact && <td className="spark-column"><MiniSparkline values={item.sparkline} positive={positive} /></td>}
                {!compact && <td className="right muted mono">{item.volume}</td>}
                {!compact && <td className="right muted mono">{item.marketCap}</td>}
                <td><button type="button" className="icon-button subtle" aria-label={`More options for ${item.symbol}`} onClick={(event) => event.stopPropagation()}><MoreHorizontal size={15} /></button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
