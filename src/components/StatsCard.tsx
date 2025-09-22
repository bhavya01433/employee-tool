interface StatsCardProps {
  title: string;
  value: number;
  icon: string;
  color: "blue" | "green" | "yellow" | "red" | "purple";
}

export default function StatsCard({
  title,
  value,
  icon,
  color,
}: StatsCardProps) {
  const tone = {
    blue: "var(--ring)",
    green: "var(--success)",
    yellow: "#ca8a04",
    red: "var(--danger)",
    purple: "#7e22ce",
  }[color];

  return (
    <div className="ui-card p-6" style={{ borderLeft: `4px solid ${tone}` }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--muted-fore)' }}>{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="p-3 rounded-full" style={{
          backgroundColor: 'color-mix(in oklab, ' + tone + ' 12%, transparent)',
          border: '1px solid color-mix(in oklab, ' + tone + ' 30%, transparent)',
          color: tone
        }}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
}
