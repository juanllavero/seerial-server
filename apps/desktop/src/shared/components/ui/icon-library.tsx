export const ServerIcon = () => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    width="512"
    height="512"
    viewBox="0 0 512 512"
  >
    <g
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="32"
    >
      <ellipse cx="256" cy="112" rx="176" ry="80" />
      <path d="M432 112v288c0 44.18-78.8 80-176 80S80 444.18 80 400V112" />
      <path d="M432 256c0 44.18-78.8 80-176 80S80 300.18 80 256" />
    </g>
  </svg>
);

export const HomeIcon = () => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    viewBox="0 0 24 24"
  >
    <path
      fill="#FFFFFF"
      d="M4 19v-9q0-.48.21-.9t.59-.7l6-4.5q.53-.4 1.2-.4t1.2.4l6 4.5q.38.28.59.7T20 10v9q0 .83-.59 1.41T18 21h-3q-.43 0-.71-.29T14 20v-5q0-.43-.29-.71T13 14h-2q-.43 0-.71.29T10 15v5q0 .43-.29.71T9 21H6q-.83 0-1.41-.59T4 19"
    />
  </svg>
);

export const WarningIcon = () => (
  <svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    width="80"
    height="80"
    viewBox="0 0 512 512"
  >
    <path
      fill="currentColor"
      d="M449.07 399.08L278.64 82.58c-12.08-22.44-44.26-22.44-56.35 0L51.87 399.08A32 32 0 0 0 80 446.25h340.89a32 32 0 0 0 28.18-47.17m-198.6-1.83a20 20 0 1 1 20-20a20 20 0 0 1-20 20m21.72-201.15l-5.74 122a16 16 0 0 1-32 0l-5.74-121.95a21.73 21.73 0 0 1 21.5-22.69h.21a21.74 21.74 0 0 1 21.73 22.7Z"
    />
  </svg>
);

export const PlayIcon = ({ size, color }: { size?: number; color?: string }) => (
  <svg
    aria-hidden="true"
    height={size ?? 22}
    viewBox="0 0 48 48"
    width={size ?? 22}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13.5 42C13.1 42 12.72 41.84 12.44 41.56C12.16 41.28 12 40.9 12 40.5V7.5C12 7.24 12.07 6.98 12.2 6.76C12.33 6.53 12.51 6.34 12.74 6.21C12.96 6.08 13.22 6 13.48 6C13.74 6 13.99 6.06 14.22 6.19L44.22 22.69C44.46 22.82 44.65 23.01 44.79 23.24C44.93 23.47 45 23.73 45 24C45 24.27 44.93 24.53 44.79 24.76C44.65 24.99 44.46 25.18 44.22 25.31L14.22 41.81C14 41.94 13.75 42 13.5 42Z"
      fill={color ?? '#FFFFFF'}
    />
  </svg>
);

export const PauseIcon = ({ size }: { size?: number }) => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    height={size ?? 22}
    viewBox="0 0 48 48"
    width={size ?? 22}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13 8C13 6.9 13.9 6 15 6H17C18.1 6 19 6.9 19 8V40C19 41.1 18.1 42 17 42H15C13.9 42 13 41.1 13 40V8Z"
      fill="#FFFFFF"
    />
    <path
      d="M29 8C29 6.9 29.9 6 31 6H33C34.1 6 35 6.9 35 8V40C35 41.1 34.1 42 33 42H31C29.9 42 29 41.1 29 40V8Z"
      fill="#FFFFFF"
    />
  </svg>
);

export const StopIcon = () => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    height="18"
    viewBox="0 0 48 48"
    width="18"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M36 9H12C11.2 9 10.44 9.32 9.88 9.88C9.32 10.44 9 11.2 9 12V36C9 36.8 9.32 37.56 9.88 38.12C10.44 38.68 11.2 39 12 39H36C36.8 39 37.56 38.68 38.12 38.12C38.68 37.56 39 36.8 39 36V12C39 11.2 38.68 10.44 38.12 9.88C37.56 9.32 36.8 9 36 9Z"
      fill="#FFFFFF"
    />
  </svg>
);

export const PrevTrackIcon = () => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    height="18"
    viewBox="0 0 48 48"
    width="18"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M3 6H6V42H3V6Z" fill="#FFFFFF" />
    <path
      d="M39.75 41.8C39.98 41.93 40.24 42 40.5 42C40.9 42 41.28 41.84 41.56 41.56C41.84 41.28 42 40.9 42 40.5V7.5C42 7.24 41.93 6.98 41.8 6.75C41.67 6.52 41.48 6.33 41.25 6.2C41.02 6.07 40.76 6 40.5 6C40.24 6 39.98 6.07 39.75 6.2L11.25 22.7C11.02 22.83 10.83 23.02 10.7 23.25C10.57 23.48 10.5 23.74 10.5 24C10.5 24.26 10.57 24.52 10.7 24.75C10.83 24.98 11.02 25.17 11.25 25.3L39.75 41.8Z"
      fill="#FFFFFF"
    />
  </svg>
);

export const NextTrackIcon = () => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    height="18"
    viewBox="0 0 48 48"
    width="18"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M42 6H45V42H42V6Z" fill="#FFFFFF" />
    <path
      d="M6.44 41.56C6.72 41.84 7.1 42 7.5 42C7.76 42 8.02 41.93 8.25 41.8L36.75 25.3C36.98 25.17 37.17 24.98 37.3 24.75C37.43 24.52 37.5 24.26 37.5 24C37.5 23.74 37.43 23.48 37.3 23.25C37.17 23.02 36.98 22.83 36.75 22.7L8.25 6.2C8.02 6.07 7.76 6 7.5 6C7.24 6 6.98 6.07 6.75 6.2C6.52 6.33 6.33 6.52 6.2 6.75C6.07 6.98 6 7.24 6 7.5V40.5C6 40.9 6.16 41.28 6.44 41.56Z"
      fill="#FFFFFF"
    />
  </svg>
);

export const AddToListIcon = () => (
  <svg
    aria-hidden="true"
    height="22"
    viewBox="0 0 48 48"
    width="22"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M38 6V40.13L24.85 33.74L23.5 33.07L22.15 33.74L9 40.13V6H38ZM38 3H9C8.2 3 7.44 3.32 6.88 3.88C6.32 4.44 6 5.2 6 6V45L23.5 36.5L41 45V6C41 5.2 40.68 4.44 40.12 3.88C39.56 3.32 38.8 3 38 3Z"
      fill="#FFFFFF"
    />
  </svg>
);

export const RemoveFromListIcon = () => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    height="22"
    viewBox="0 0 48 48"
    width="22"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M38 3H9C8.2 3 7.44 3.32 6.88 3.88C6.32 4.44 6 5.2 6 6V45L23.5 36.5L41 45V6C41 5.2 40.68 4.44 40.12 3.88C39.56 3.32 38.8 3 38 3Z"
      fill="#FFFFFF"
    />
  </svg>
);

export const MarkWatchedIcon = () => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    height="52"
    viewBox="0 0 48 48"
    width="52"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13.5 24.62L21 32.12L34.5 18.62L32.38 16.5L21 27.88L15.62 22.5L13.5 24.62Z"
      fill="currentColor"
    />
    <path
      clipRule="evenodd"
      d="M12.33 6.54C15.79 4.23 19.85 3 24 3C29.57 3 34.91 5.21 38.85 9.15C42.79 13.09 45 18.43 45 24C45 28.15 43.77 32.21 41.46 35.67C39.15 39.12 35.87 41.81 32.04 43.4C28.2 44.99 23.98 45.41 19.9 44.6C15.83 43.79 12.09 41.79 9.15 38.85C6.21 35.91 4.21 32.17 3.4 28.1C2.59 24.02 3.01 19.8 4.6 15.96C6.19 12.13 8.88 8.85 12.33 6.54ZM14 38.97C16.96 40.94 20.44 42 24 42C28.77 42 33.35 40.1 36.73 36.73C40.1 33.35 42 28.77 42 24C42 20.44 40.94 16.96 38.97 14C36.99 11.04 34.18 8.73 30.89 7.37C27.6 6.01 23.98 5.65 20.49 6.35C17 7.04 13.79 8.75 11.27 11.27C8.75 13.79 7.04 17 6.35 20.49C5.65 23.98 6.01 27.6 7.37 30.89C8.73 34.18 11.04 36.99 14 38.97Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

export const UnmarkWatchedIcon = () => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    height="52"
    viewBox="0 0 48 48"
    width="52"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      clipRule="evenodd"
      d="M12.33 6.54C15.79 4.23 19.85 3 24 3C29.57 3 34.91 5.21 38.85 9.15C42.79 13.09 45 18.43 45 24C45 28.15 43.77 32.21 41.46 35.67C39.15 39.12 35.87 41.81 32.04 43.4C28.2 44.99 23.98 45.41 19.9 44.6C15.83 43.79 12.09 41.79 9.15 38.85C6.21 35.91 4.21 32.17 3.4 28.1C2.59 24.02 3.01 19.8 4.6 15.96C6.19 12.13 8.88 8.85 12.33 6.54ZM12.79 24.62L21 32.83L35.21 18.62L32.38 15.79L21 27.17L15.62 21.79L12.79 24.62Z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);
