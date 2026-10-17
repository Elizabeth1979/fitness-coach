import { weekView } from '../storage/week';
import { Icon } from './Icon';

interface Props { dates: string[]; today: string }
export function WeekView({ dates, today }: Props) {
  const days = weekView(dates, today);
  return (
    <div className="card week">
      <div className="t-panel week-title">This week</div>
      <div className="week-days">
        {days.map((d) => (
          <div key={d.date} className="week-day" data-today={d.isToday}>
            <div className="week-label">{d.label}</div>
            <div className="daydot" data-done={d.done} data-today={d.isToday}>
              {d.done && <Icon name="check" size={16} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
