export const Logo = () => {
  const letters = ['S', 'i', 'm', 'm', 'e', 'r'];
  // Slight vertical nudges and rotations per letter for a hand-crafted feel
  const nudge  = [0, -3,  2, -2,  1, -2];
  const rotate = [-1.5, 1, -1, 1.5, -0.8, 1.2];
  // Approximate x positions for each letter (Lilita One, ~72px)
  const xPos   = [0, 52, 76, 118, 160, 202];

  return (
    <svg
      viewBox="0 0 248 90"
      height="52"
      style={{ display: 'block', overflow: 'visible' }}
      aria-label="Simmer"
    >
      <defs>
        <filter id="logo-rough" x="-8%" y="-20%" width="116%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.035 0.055"
            numOctaves="4"
            seed="12"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="5"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>

      <g filter="url(#logo-rough)">
        {letters.map((letter, i) => (
          <text
            key={i}
            x={xPos[i]}
            y={68 + nudge[i]}
            transform={`rotate(${rotate[i]}, ${xPos[i] + 18}, 52)`}
            fontFamily="'Lilita One', sans-serif"
            fontSize="72"
            fill="#2D6A2D"
          >
            {letter}
          </text>
        ))}
      </g>
    </svg>
  );
};
