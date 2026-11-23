/** Iconos del panel: SVG de trazo 1.5, sin emojis ni glifos tipográficos. */
import type { ReactNode } from "react";

type Props = { className?: string };

function Svg({
  className = "size-4",
  children,
}: Props & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

export function PlusIcon({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function TrashIcon({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M4 7h16M9 7V4.5h6V7m-8 0 1 12.5h8L17 7M10 11v5m4-5v5" />
    </Svg>
  );
}

export function CloseIcon({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  );
}

export function CheckIcon({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </Svg>
  );
}

export function ImageIcon({ className }: Props) {
  return (
    <Svg className={className}>
      <rect x="3.5" y="4.5" width="17" height="15" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m4 17 4.5-4.5 3.5 3.5 2.5-2.5L20 18" />
    </Svg>
  );
}

export function HistoryIcon({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 4.5V9H8" />
      <path d="M12 7.5V12l3 2" />
    </Svg>
  );
}

export function SendIcon({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M4 12 20 4l-5.5 16-3-6.5L4 12Z" />
      <path d="m11.5 13.5 8.5-9.5" />
    </Svg>
  );
}

export function PencilIcon({ className }: Props) {
  return (
    <Svg className={className}>
      <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="m14.5 7.5 2 2" />
    </Svg>
  );
}
