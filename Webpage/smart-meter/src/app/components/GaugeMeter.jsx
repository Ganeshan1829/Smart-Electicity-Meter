import React from 'react';

const GaugeMeter = ({
  value,
  maxValue,
  color = "#3b82f6",
  unit = "",
  label = "",
  decimalPlaces = 0
}) => {
  const safeValue = Math.min(value, maxValue);
  const percentage = (safeValue / maxValue) * 100;

  const startAngle = 180;
  const endAngle = 0;
  const arcAngle = 180;

  const fillAngle = (percentage / 100) * arcAngle;

  const centerX = 50;
  const centerY = 70;
  const radius = 40;
  const thickness = 6;

  const createArc = (startAngleDeg, arcAngleDeg) => {
    const startRad = (startAngleDeg * Math.PI) / 180;
    const endRad = ((startAngleDeg + arcAngleDeg) * Math.PI) / 180; // Note: '+' for anti-clockwise

    const startX = centerX + radius * Math.cos(startRad);
    const startY = centerY + radius * Math.sin(startRad);
    const endX = centerX + radius * Math.cos(endRad);
    const endY = centerY + radius * Math.sin(endRad);

    const largeArcFlag = arcAngleDeg > 180 ? 1 : 0;

    // Sweep flag 1 for anti-clockwise
    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
  };

  const backgroundArc = createArc(startAngle, arcAngle);
  const filledArc = createArc(startAngle, fillAngle);

  const tickCount = 5;
  const ticks = [];

  for (let i = 0; i < tickCount; i++) {
    const tickPercentage = i / (tickCount - 1);
    const angle = startAngle + (tickPercentage * arcAngle); // '+' for anti-clockwise
    const angleRad = (angle * Math.PI) / 180;

    const outerX = centerX + (radius + 2) * Math.cos(angleRad);
    const outerY = centerY + (radius + 2) * Math.sin(angleRad);
    const innerX = centerX + (radius - 3) * Math.cos(angleRad);
    const innerY = centerY + (radius - 3) * Math.sin(angleRad);

    const labelValue = (tickPercentage * maxValue).toFixed(decimalPlaces);

    ticks.push({
      line: `M ${innerX} ${innerY} L ${outerX} ${outerY}`,
      label: {
        x: centerX + (radius + 8) * Math.cos(angleRad),
        y: centerY + (radius + 8) * Math.sin(angleRad),
        value: labelValue
      }
    });
  }

  const displayValue = safeValue.toFixed(decimalPlaces);

  return (
    <div className="w-full h-full">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Tick marks */}
        {ticks.map((tick, index) => (
          <g key={index}>
            <path d={tick.line} stroke="#9ca3af" strokeWidth="1" />
            <text
              x={tick.label.x}
              y={tick.label.y}
              textAnchor="middle"
              fontSize="4"
              fill="#6b7280"
              dominantBaseline="middle"
            >
              {tick.label.value}
            </text>
          </g>
        ))}

        {/* Background arc */}
        <path
          d={backgroundArc}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={thickness}
          strokeLinecap="round"
        />

        {/* Filled arc */}
        <path
          d={filledArc}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
        />

        {/* Displayed Value */}
        <text
          x={centerX}
          y={centerY - 15}
          textAnchor="middle"
          fontSize="12"
          fontWeight="bold"
        >
          {displayValue}
        </text>

        {/* Unit */}
        <text
          x={centerX}
          y={centerY - 5}
          textAnchor="middle"
          fontSize="8"
          fill="#6b7280"
        >
          {unit}
        </text>

        {/* Max value */}
        <text
          x={centerX}
          y={centerY + 5}
          textAnchor="middle"
          fontSize="6"
          fill="#6b7280"
        >
          Max: {maxValue}
        </text>
      </svg>
    </div>
  );
};

export default GaugeMeter;
