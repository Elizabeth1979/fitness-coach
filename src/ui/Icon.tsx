import {
  IconAdjustmentsHorizontal, IconArrowsExchange, IconCheck, IconClock, IconFlame, IconHome,
  IconListCheck, IconMusic, IconMusicOff, IconPlayerPause, IconPlayerPlay, IconPlayerSkipForward,
  IconPlayerTrackNext, IconRefresh, IconRepeat, IconStretching, IconX,
} from '@tabler/icons-react';

// Every icon the app uses, in one place. Each is a small inline SVG that ships
// in the bundle only because it's listed here — instead of a 5,000-icon font.
// To add one: import it from '@tabler/icons-react' and add it to this map.
const ICONS = {
  'adjustments-horizontal': IconAdjustmentsHorizontal,
  'arrows-exchange': IconArrowsExchange,
  check: IconCheck,
  clock: IconClock,
  flame: IconFlame,
  home: IconHome,
  'list-check': IconListCheck,
  music: IconMusic,
  'music-off': IconMusicOff,
  'player-pause': IconPlayerPause,
  'player-play': IconPlayerPlay,
  'player-skip-forward': IconPlayerSkipForward,
  'player-track-next': IconPlayerTrackNext,
  refresh: IconRefresh,
  repeat: IconRepeat,
  stretching: IconStretching,
  x: IconX,
} as const;

export type IconName = keyof typeof ICONS;

interface Props {
  name: IconName;
  /** Defaults to 1em, so an icon sizes itself to the surrounding text (like the old icon font). */
  size?: number | string;
  /** Extra classes, e.g. a colour from index.css (`icon-warm`, `icon-brand`). */
  className?: string;
}

/** A decorative icon (hidden from screen readers — the text next to it says what it means). */
export function Icon({ name, size = '1em', className }: Props) {
  const Svg = ICONS[name];
  return <Svg size={size} stroke={2} className={className ? `icon ${className}` : 'icon'} aria-hidden="true" focusable="false" />;
}
