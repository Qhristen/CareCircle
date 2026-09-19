import type { SVGProps } from "react";

export type IconName =
  | "alarm"
  | "arrow-left"
  | "arrow-right"
  | "at-sign"
  | "bell"
  | "bolt"
  | "book"
  | "calendar"
  | "check"
  | "chevron-down"
  | "close"
  | "cloud"
  | "compass"
  | "copy"
  | "edit"
  | "eye"
  | "heart"
  | "image"
  | "leaf"
  | "link"
  | "lock"
  | "lock-open"
  | "mail"
  | "menu"
  | "message"
  | "phone-off"
  | "plus"
  | "quote"
  | "save"
  | "search"
  | "share"
  | "shield"
  | "sparkles"
  | "smartphone"
  | "trash"
  | "tune"
  | "user"
  | "wand"
  | "wallet"
  | "users";

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

export function Icon({ name, size = 20, ...props }: IconProps) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
  };

  const paths: Record<IconName, React.ReactNode> = {
    alarm: (
      <>
        <circle cx="12" cy="13" r="7.5" />
        <path d="M12 9v4l2.5 1.5M7 3 3.5 6M17 3l3.5 3M7.5 20.5 6 22M16.5 20.5 18 22" />
      </>
    ),
    "arrow-left": <path d="M19 12H5m6-6-6 6 6 6" />,
    "arrow-right": <path d="M5 12h14m-6-6 6 6-6 6" />,
    "at-sign": (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M15.5 12v-1a3.5 3.5 0 1 0-1 2.5c0 1.4 1 2.5 2.5 2.5 2.2 0 4-1.8 4-4a9 9 0 1 0-3.2 6.9" />
      </>
    ),
    bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />,
    bolt: <path d="m13 2-7 11h6l-1 9 7-12h-6z" />,
    book: (
      <>
        <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H11v17H6.5A2.5 2.5 0 0 0 4 21.5z" />
        <path d="M20 4.5A2.5 2.5 0 0 0 17.5 2H13v17h4.5a2.5 2.5 0 0 1 2.5 2.5z" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.6 2.6L16.5 9" />
      </>
    ),
    "chevron-down": <path d="m7 9.5 5 5 5-5" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    cloud: <path d="M7 18h11a4 4 0 0 0 .5-8A6.5 6.5 0 0 0 6 8.5 4.8 4.8 0 0 0 7 18Zm2-5 2 2 4-4" />,
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9z" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
      </>
    ),
    edit: <path d="M13.5 6.5 17.5 10.5M4 20l1-4 10.8-10.8a2.8 2.8 0 0 1 4 4L9 20z" />,
    eye: (
      <>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    heart: <path d="M20.8 5.7a5.4 5.4 0 0 0-7.6 0L12 6.9l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 22l8.8-8.7a5.4 5.4 0 0 0 0-7.6Z" />,
    image: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9" r="1.5" />
        <path d="m3 17 5-5 4 4 2.5-2.5L21 20" />
      </>
    ),
    leaf: <path d="M20.5 3.5C13 3.8 7 6.3 5.2 11.2c-1 2.8.3 5.6 2.8 6.8 4.8 2.3 9-1.8 10.8-6.2 1.2-3 1.5-6 1.7-8.3ZM4 21c2.3-5 6.3-8.4 11.5-10.5" />,
    link: <path d="M10 13.5a4 4 0 0 0 5.7.1l2-2a4 4 0 0 0-5.7-5.7l-1.1 1.1M14 10.5a4 4 0 0 0-5.7-.1l-2 2a4 4 0 0 0 5.7 5.7l1.1-1.1" />,
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
      </>
    ),
    "lock-open": (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 7.7-1.5" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    message: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
        <path d="M8 10h.01M12 10h.01M16 10h.01" />
      </>
    ),
    "phone-off": (
      <>
        <path d="m3 3 18 18M15.5 14.5l2-2a2 2 0 0 1 2.3-.4l2.1 1a2 2 0 0 1 1.1 2v3a2 2 0 0 1-2.1 2A19 19 0 0 1 4 7.1 2 2 0 0 1 6 5h3a2 2 0 0 1 2 1.1l1 2.1a2 2 0 0 1-.4 2.3l-.8.8" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    quote: <path d="M9.5 7H5a2 2 0 0 0-2 2v4h5v4H4M21 7h-4.5a2 2 0 0 0-2 2v4h5v4h-4" />,
    save: (
      <>
        <path d="M4 3h13l3 3v15H4z" />
        <path d="M8 3v6h8V3M8 21v-7h8v7" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    share: (
      <>
        <circle cx="18" cy="5" r="2.5" />
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="18" cy="19" r="2.5" />
        <path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" />
      </>
    ),
    shield: <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Zm-3.2-10 2.1 2.1 4.5-4.5" />,
    sparkles: <path d="m12 3 1.1 3.4L16.5 7.5l-3.4 1.1L12 12l-1.1-3.4-3.4-1.1 3.4-1.1zM19 14l.7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7zM5 14l.7 1.8 1.8.7-1.8.7L5 19l-.7-1.8-1.8-.7 1.8-.7z" />,
    smartphone: (
      <>
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <path d="M11 18h2" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6" />
      </>
    ),
    tune: <path d="M4 6h6M14 6h6M10 4v4M4 12h10M18 12h2M18 10v4M4 18h3M11 18h9M7 16v4" />,
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    wand: <path d="m15 4 5 5L8 21H3v-5zM13 6l5 5M5 3v3M3.5 4.5h3M19 16v4M17 18h4" />,
    wallet: (
      <>
        <path d="M4 6.5h14a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h13" />
        <path d="M15 11h7v5h-7a2.5 2.5 0 0 1 0-5Z" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2M16 4.5a3 3 0 0 1 0 5.8M18 13a4 4 0 0 1 3 3.9V20" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      {...common}
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
