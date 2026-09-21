import { ResponsiveContainer, Line, LineChart } from "recharts";

type MiniSparklineProps = {
  values: number[];
  positive?: boolean;
  width?: number;
  height?: number;
};

export function MiniSparkline({ values, positive = true, width = 88, height = 28 }: MiniSparklineProps) {
  const data = values.map((value, index) => ({ value, index }));
  return (
    <div style={{ width, height }} aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 3, right: 1, bottom: 3, left: 1 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={positive ? "#5eead4" : "#fb7185"}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
