import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  className?: string;
};

export function Logo({ className = "" }: LogoProps) {
  return (
    <Link
      aria-label="CareCircle home"
      className={`inline-flex shrink-0 items-center gap-2 ${className}`}
      href="/"
    >
      {/* <svg aria-hidden="true" className="h-9 w-9" viewBox="0 0 40 40">
        <rect fill="#a63412" height="36" rx="13" width="36" x="2" y="2" />
        <path
          d="M13 18.5h14v10H13zM11.5 15.5h17v4h-17zM20 15.5v13"
          fill="none"
          stroke="#fff"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M20 15.5c-2.1-4.5-6.7-4.3-6.7-1.4 0 1.3 1.3 1.8 3.2 1.8H20Zm0 0c2.1-4.5 6.7-4.3 6.7-1.4 0 1.3-1.3 1.8-3.2 1.8H20Z"
          fill="#ffdbd1"
          stroke="#fff"
          strokeLinejoin="round"
          strokeWidth="1.4"
        />
      </svg> */}

      <Image alt="CareCircle Brand Logo" className="h-10 w-auto object-contain" width={200} height={100} src="/logo.png" />
    </Link>
  );
}
