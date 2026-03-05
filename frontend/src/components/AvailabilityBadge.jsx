const BADGE_CONFIG = {
  available: {
    text: "متوفر",
    color: "#16a34a",
    symbol: "✓",
    circleBg: "rgba(22, 163, 74, 0.18)",
    badgeBg: "rgba(22, 163, 74, 0.08)",
  },
  unavailable: {
    text: "غير متوفر",
    color: "#dc2626",
    symbol: "✕",
    circleBg: "rgba(220, 38, 38, 0.18)",
    badgeBg: "rgba(220, 38, 38, 0.08)",
  },
  portions: {
    text: "متوفر بالتقسيم",
    color: "#f59e0b",
    symbol: "–",
    circleBg: "rgba(245, 158, 11, 0.2)",
    badgeBg: "rgba(245, 158, 11, 0.1)",
  },
};

const AvailabilityBadge = ({ hasPortions = false, stock = 0 }) => {
  const variant = hasPortions ? "portions" : stock > 0 ? "available" : "unavailable";
  const config = BADGE_CONFIG[variant];

  return (
    <span
      className='inline-flex w-fit items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold'
      style={{ color: config.color, backgroundColor: config.badgeBg }}
    >
      <span
        className='availability-pulse inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] leading-none'
        style={{ backgroundColor: config.circleBg }}
      >
        {config.symbol}
      </span>
      <span>{config.text}</span>
    </span>
  );
};

export default AvailabilityBadge;
