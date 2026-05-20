function Loading() {
  return (
    <div className="container">
      <div className="dot" />
      <div className="dot" />
      <div className="dot" />
      <StyleSheet />
    </div>
  );
}

/**
 * ==============   Styles   ================
 */
function StyleSheet() {
  return (
    <style>
      {`
        .container {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
            gap: 20px;
        }

        @keyframes dot-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.5); }
        }

        .dot {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background-color: var(--app-color);
            will-change: transform;
            animation: dot-pulse 1.2s ease-in-out infinite;
        }

        .dot:nth-child(1) { animation-delay: -0.4s; }
        .dot:nth-child(2) { animation-delay: -0.2s; }
        .dot:nth-child(3) { animation-delay: 0s; }
      `}
    </style>
  );
}

export default Loading;
