import React from "react";

interface TeamHeaderConnectorProps {
  children: React.ReactNode;
  height?: number; // height of the connector SVG area above the avatars
  strokeWidth?: number;
  strokeColorVar?: string; // CSS variable name containing HSL color, e.g. --primary or --accent
}

// Wraps a relatively positioned container of avatars and draws a curved connector line above them
export const TeamHeaderConnector: React.FC<TeamHeaderConnectorProps> = ({
  children,
  height = 16,
  strokeWidth = 2.5,
  strokeColorVar = "--primary",
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [path, setPath] = React.useState<string | null>(null);
  const [viewBoxWidth, setViewBoxWidth] = React.useState(0);

  const recalc = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const avatars = Array.from(el.querySelectorAll<HTMLElement>("[data-team-avatar]"));
    if (avatars.length < 2) {
      setPath(null);
      return;
    }

    const containerRect = el.getBoundingClientRect();
    const centers = avatars
      .map((a) => {
        const r = a.getBoundingClientRect();
        return {
          x: r.left - containerRect.left + r.width / 2,
        };
      })
      .sort((a, b) => a.x - b.x);

    const firstX = centers[0].x;
    const lastX = centers[centers.length - 1].x;
    const midX = (firstX + lastX) / 2;

    const h = height; // SVG height
    const startY = h; // start at bottom of SVG
    const endY = h;   // end at bottom of SVG
    const topY = 2; // top of the rectangle

    // Create a rectangular path connecting all avatars
    const main = `M ${firstX},${startY} L ${firstX},${topY} L ${lastX},${topY} L ${lastX},${endY}`;

    setPath(main);
    setViewBoxWidth(el.clientWidth);
  }, [height]);

  React.useLayoutEffect(() => {
    recalc();
    const onResize = () => recalc();
    window.addEventListener("resize", onResize);

    // Observe size/position changes of children
    const ro = new ResizeObserver(() => recalc());
    if (ref.current) ro.observe(ref.current);

    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, [recalc]);

  return (
    <div ref={ref} className="relative">
      {/* Connector SVG above avatars */}
      {path && (
        <svg
          className="pointer-events-none absolute left-0 z-10"
          style={{ top: -height }}
          width={viewBoxWidth}
          height={height}
          viewBox={`0 0 ${viewBoxWidth} ${height}`}
          aria-hidden="true"
        >
          <path
            d={path}
            fill="none"
            // Use semantic design token color with subtle glow for visibility
            style={{ 
              stroke: `hsl(var(${strokeColorVar}))`,
              filter: 'drop-shadow(0 1px 0.5px rgba(0,0,0,0.4))'
            }}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </svg>
      )}

      {children}
    </div>
  );
};

export default TeamHeaderConnector;
