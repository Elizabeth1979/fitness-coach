import { weekView } from '../storage/week';

interface Props { dates: string[]; today: string }
export function WeekView({ dates, today }: Props) {
  const days = weekView(dates, today);
  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <div className="t-panel" style={{ fontSize: 16, marginBottom: 14 }}>This week</div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {days.map((d) => (
          <div key={d.date} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: d.isToday ? 800 : 600, color: d.isToday ? 'var(--brand)' : 'var(--text-muted)', marginBottom: 7 }}>{d.label}</div>
            <div className="daydot" data-done={d.done} data-today={d.isToday}>
              {d.done && <i className="ti ti-check" aria-hidden="true" style={{ fontSize: 16 }} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
