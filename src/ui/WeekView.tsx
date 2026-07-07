import { weekView } from '../storage/week';

interface Props { dates: string[]; today: string }
export function WeekView({ dates, today }: Props) {
  const days = weekView(dates, today);
  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>This week</div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {days.map((d) => (
          <div key={d.date} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: d.isToday ? 'var(--accent)' : 'var(--text-hint)', fontWeight: d.isToday ? 700 : 500, marginBottom: 7 }}>{d.label}</div>
            <div style={{ width: 30, height: 30, borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: d.done ? 'var(--accent)' : 'var(--control-bg)', color: '#fff', boxShadow: d.isToday ? '0 0 0 2px var(--border)' : 'none' }}>
              {d.done && <i className="ti ti-check" aria-hidden="true" style={{ fontSize: 16 }} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
