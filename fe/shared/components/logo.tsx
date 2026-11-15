import { cn } from "cn"
import Image from "next/image"

export function Logo({ className }: { className?: string }) {
  return <LogoImage className="h-10 w-10" />
}

export function LogoImage({ className }: { className?: string }) {
  return (
    <Image
      alt="app logo"
      width={30}
      height={30}
      className={cn("h-10 w-10", className)}
      src={"/logo.png"}
      style={{
        width: "auto",
        height: "auto",
      }}
    />
  )
}

export function LogoSvg({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width="100%"
      height="100%"
      className={cn("h-10 w-10", className)}
    >
      <defs>
        <linearGradient id="bcc-blue-main" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#022873" />
          <stop offset="55%" stopColor="#0066CC" />
          <stop offset="100%" stopColor="#00D2FF" />
        </linearGradient>

        <linearGradient id="bcc-blue-dark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00449E" />
          <stop offset="100%" stopColor="#021D54" />
        </linearGradient>

        <linearGradient id="bcc-orange" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E64A00" />
          <stop offset="50%" stopColor="#FF6B00" />
          <stop offset="100%" stopColor="#FFA000" />
        </linearGradient>
      </defs>

      <path
        d="M 88 184 L 122 184 L 170 256 L 122 328 L 88 328 L 136 256 Z"
        fill="url(#bcc-blue-main)"
      />

      <path
        d="M 134 148 L 166 148 L 234 256 L 166 364 L 134 364 L 202 256 Z"
        fill="url(#bcc-blue-main)"
      />
      <path
        d="M 134 364 L 166 364 L 202 307 L 184 285 Z"
        fill="url(#bcc-blue-dark)"
        opacity="0.6"
      />

      <path
        d="M 164 114 L 298 114 C 348 114 378 140 378 178 C 378 192 373 205 364 215 L 336 238 C 340 225 342 208 342 192 C 342 162 322 146 288 146 L 194 146 Z"
        fill="url(#bcc-blue-main)"
      />

      <path
        d="M 358 232 C 384 246 398 272 398 306 C 398 362 356 398 294 398 L 164 398 L 194 366 L 290 366 C 334 366 360 342 360 306 C 360 274 338 256 300 256 L 284 256 L 316 226 C 332 226 346 228 358 232 Z"
        fill="url(#bcc-blue-main)"
      />

      <path
        d="M 164 398 L 294 398 C 325 398 350 388 368 372 L 340 348 C 326 360 309 366 290 366 L 194 366 Z"
        fill="url(#bcc-blue-dark)"
        opacity="0.55"
      />

      <g transform="translate(292, 312)" fill="url(#bcc-orange)">
        <path
          d="M -6 -28 L 6 -28 L 8 -20 C 10 -19 12 -18 14 -17 L 21 -21 L 28 -14 L 24 -7 C 25 -5 26 -3 27 -1 L 35 1 L 35 13 L 27 15 C 26 17 25 19 24 21 L 28 28 L 21 35 L 14 31 C 12 32 10 33 8 34 L 6 42 L -6 42 L -8 34 C -10 33 -12 32 -14 31 L -21 35 L -28 28 L -24 21 C -25 19 -26 17 -27 15 L -35 13 L -35 1 L -27 -1 C -26 -3 -25 -5 -24 -7 L -28 -14 L -21 -21 L -14 -17 C -12 -18 -10 -19 -8 -20 Z M 0 -6 C -7.2 -6 -13 -0.2 -13 7 C -13 14.2 -7.2 20 0 20 C 7.2 20 13 14.2 13 7 C 13 -0.2 7.2 -6 0 -6 Z"
          transform="scale(0.82) translate(0, -7)"
        />
      </g>

      <path
        d="M 206 184 L 234 166 L 266 218 L 424 88 L 264 268 Z"
        fill="url(#bcc-orange)"
      />
      <path
        d="M 206 184 L 220 175 L 265 245 L 264 268 Z"
        fill="#D93800"
        opacity="0.45"
      />
    </svg>
  )
}
