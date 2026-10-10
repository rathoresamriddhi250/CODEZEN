import React, { useId } from 'react';

interface ShramikLogoProps {
  variant?: 'hero' | 'compact';
  showHindiTagline?: boolean;
}

/**
 * Generates an exact, symmetrical gear arc path with N teeth between startDeg and endDeg
 */
function buildGearArcPath(
  cx: number,
  cy: number,
  rInner: number,
  rRoot: number,
  rTip: number,
  startDeg: number,
  endDeg: number,
  numTeeth: number
): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const pt = (r: number, deg: number) => {
    const rad = toRad(deg);
    return `${(cx + r * Math.cos(rad)).toFixed(2)} ${(cy + r * Math.sin(rad)).toFixed(2)}`;
  };

  const totalSpan = endDeg - startDeg;
  const step = totalSpan / numTeeth;
  const commands: string[] = [];

  // Start at inner radius at startDeg
  commands.push(`M ${pt(rInner, startDeg)}`);
  commands.push(`L ${pt(rRoot, startDeg)}`);

  for (let i = 0; i < numTeeth; i++) {
    const a0 = startDeg + i * step;
    const a1 = a0 + step * 0.14; // tooth base start
    const a2 = a0 + step * 0.24; // tooth tip start (beveled)
    const a3 = a0 + step * 0.62; // tooth tip end
    const a4 = a0 + step * 0.72; // tooth base end
    const a5 = a0 + step;        // valley end

    commands.push(`L ${pt(rRoot, a1)}`);
    commands.push(`L ${pt(rTip, a2)}`);
    commands.push(`L ${pt(rTip, a3)}`);
    commands.push(`L ${pt(rRoot, a4)}`);
    commands.push(`L ${pt(rRoot, a5)}`);
  }

  // Return along inner arc from endDeg back to startDeg
  const endInner = pt(rInner, endDeg);
  const startInner = pt(rInner, startDeg);
  commands.push(`L ${endInner}`);
  commands.push(`A ${rInner} ${rInner} 0 1 0 ${startInner}`);
  commands.push('Z');

  return commands.join(' ');
}

export const ShramikLogo: React.FC<ShramikLogoProps> = ({
  variant = 'hero',
  showHindiTagline = true,
}) => {
  const uid = useId().replace(/:/g, '');
  // 8-tooth gear arc from 118° (bottom-left) clockwise to 342° (top-right)
  const gearPath = buildGearArcPath(248, 305, 67, 88, 106, 118, 344, 8);

  const isCompact = variant === 'compact';

  return (
    <div
      className={
        isCompact
          ? 'inline-flex items-center shrink-0 select-none'
          : 'flex flex-col items-center select-none w-full'
      }
    >
      <svg
        viewBox="125 42 590 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Shramik — Skill · Work · Trust"
        className={
          isCompact
            ? 'h-12 sm:h-14 w-auto'
            : 'w-full max-w-[350px] sm:max-w-[400px] h-auto'
        }
      >
        <defs>
          {/* Helmet Gradient: Rich Orange on back-left to Bright Golden Yellow on front-right */}
          <linearGradient
            id={`helmetGrad-${uid}`}
            x1="280"
            y1="118"
            x2="388"
            y2="60"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#EA580C" />
            <stop offset="55%" stopColor="#FB8B11" />
            <stop offset="100%" stopColor="#FFD034" />
          </linearGradient>

          {/* Gear Gradient: Deep Red-Orange at bottom teeth to Golden Amber at top teeth */}
          <linearGradient
            id={`gearGrad-${uid}`}
            x1="160"
            y1="395"
            x2="315"
            y2="195"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#D9430D" />
            <stop offset="50%" stopColor="#FB8B11" />
            <stop offset="100%" stopColor="#FFC122" />
          </linearGradient>

          {/* Letter 'a' Gradient: Golden Amber top to Deep Orange bottom */}
          <linearGradient
            id={`letterAGrad-${uid}`}
            x1="408"
            y1="285"
            x2="408"
            y2="382"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFC627" />
            <stop offset="50%" stopColor="#FB8B11" />
            <stop offset="100%" stopColor="#DD470E" />
          </linearGradient>

          {/* Left Rule Gradient */}
          <linearGradient
            id={`ruleLeft-${uid}`}
            x1="160"
            y1="418"
            x2="225"
            y2="418"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FB8B11" />
            <stop offset="100%" stopColor="#FEB21D" />
          </linearGradient>
        </defs>

        {/* ================================================================ */}
        {/* 1. SYMMETRICAL 8-TOOTH GEAR HALF-WHEEL + INNER SWOOSH            */}
        {/* ================================================================ */}
        <path d={gearPath} fill={`url(#gearGrad-${uid})`} />

        {/* Inner Crescent Ring inside the Gear */}
        <path
          d="M 192 336
             C 182 295 204 252 245 241
             C 266 235 289 240 306 253
             C 288 232 259 224 232 235
             C 194 250 176 294 192 336 Z"
          fill={`url(#gearGrad-${uid})`}
        />

        {/* ================================================================ */}
        {/* 2. GEOMETRIC SLEDGEHAMMER (HEAD, BEVEL HIGHLIGHT & SHAFT)        */}
        {/* ================================================================ */}
        <g transform="translate(218, 149) rotate(12.2)">
          {/* Rear Poll */}
          <rect
            x="-35"
            y="-12"
            width="12"
            height="24"
            rx="3"
            className="fill-[#131E35] dark:fill-slate-100"
          />
          {/* Main Sledgehammer Block */}
          <rect
            x="-25"
            y="-34"
            width="43"
            height="68"
            rx="6"
            className="fill-[#131E35] dark:fill-slate-100"
          />
          {/* Amber-Orange Bevel Highlight Stripe inside Hammer Head */}
          <path
            d="M 11 -27 H -16 C -18 -27 -19 -26 -19 -24 V 27"
            stroke={`url(#gearGrad-${uid})`}
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          {/* Long Sledgehammer Handle */}
          <rect
            x="17"
            y="-8"
            width="284"
            height="16"
            rx="3.5"
            className="fill-[#131E35] dark:fill-slate-100"
          />
        </g>

        {/* ================================================================ */}
        {/* 3. WORKER SILHOUETTE (HEAD, TORSO, MUSCULAR ARM & FIST)          */}
        {/* ================================================================ */}
        {/* Worker Head Profile Facing Right */}
        <path
          d="M 297 124
             L 368 113
             L 370 120
             L 369 124
             L 379 138
             C 380 140 379 142 377 143
             L 372 145
             L 375 148
             L 371 151
             L 373 154
             L 371 163
             C 370 166 367 167 363 167
             L 341 164
             L 345 179
             L 296 167
             L 301 148
             L 296 139
             Z"
          className="fill-[#131E35] dark:fill-slate-100"
        />

        {/* Worker Shoulders, Upper Back, Bent Forearm & Fist */}
        <path
          d="M 252 187
             C 271 175 292 172 315 176
             L 354 185
             C 368 192 379 204 387 219
             L 403 255
             L 428 210
             C 424 202 424 193 428 186
             L 434 178
             C 437 174 443 174 447 176
             L 469 182
             C 473 184 475 189 473 194
             L 465 213
             C 463 217 459 219 454 219
             L 416 285
             C 410 295 400 299 389 296
             L 361 288
             C 352 232 307 192 252 187 Z"
          className="fill-[#131E35] dark:fill-slate-100"
        />

        {/* ================================================================ */}
        {/* 4. SAFETY HELMET / HARD HAT WITH WHITE CROWN STRIPE              */}
        {/* ================================================================ */}
        <path
          d="M 283 116
             C 280 79 307 56 338 57
             C 365 58 383 77 386 102
             L 397 108
             C 398 110 397 112 394 112
             L 283 123
             C 280 123 279 119 283 116 Z"
          fill={`url(#helmetGrad-${uid})`}
        />
        {/* White Helmet Crown Highlight Stripe */}
        <path
          d="M 338 61
             C 351 66 361 80 366 104
             L 375 103
             C 369 78 356 64 338 61 Z"
          fill="#FFFFFF"
        />
        {/* Crisp White Gap Under Brim */}
        <path
          d="M 287 123 Q 338 114 389 112"
          stroke="#FFFFFF"
          strokeWidth="2.8"
          strokeLinecap="round"
        />

        {/* ================================================================ */}
        {/* 5. WORDMARK: "श" + "T" + "r" + "a" + "mik"                       */}
        {/* ================================================================ */}
        {/* Devanagari 'श' */}
        <path
          d="M 244 266
             C 262 266 275 279 275 298
             C 275 318 260 334 236 340
             L 267 368
             L 251 384
             L 210 344
             C 206 340 205 333 209 328
             C 213 322 220 321 227 324
             C 243 323 254 313 254 299
             C 254 289 248 283 240 283
             C 233 283 228 288 228 295
             C 228 300 232 304 238 305
             L 234 319
             C 219 317 209 306 209 292
             C 209 276 224 266 244 266 Z"
          className="fill-[#131E35] dark:fill-white"
        />

        {/* Vertical Stem & Shirorekha Bar ('T' stem of श) */}
        <path
          d="M 269 267 H 328 V 284 H 311 V 380 H 290 V 284 H 269 Z"
          className="fill-[#131E35] dark:fill-white"
        />

        {/* Letter 'r' */}
        <path
          d="M 334 294 H 354 V 308 C 359 297 368 293 381 293 V 313 C 363 313 355 321 355 338 V 380 H 334 Z"
          className="fill-[#131E35] dark:fill-white"
        />

        {/* Letter 'a' in Golden-Amber to Deep-Orange Gradient */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M 408 292
             C 432 292 446 304 446 326
             V 380
             H 426
             V 369
             C 420 377 409 382 396 382
             C 379 382 367 371 367 355
             C 367 338 381 328 405 328
             H 425
             V 324
             C 425 314 418 308 406 308
             C 396 308 389 312 385 319
             L 370 308
             C 378 297 391 292 408 292 Z
             M 401 366
             C 414 366 425 358 425 346
             V 342
             H 407
             C 393 342 387 347 387 355
             C 387 362 392 366 401 366 Z"
          fill={`url(#letterAGrad-${uid})`}
        />

        {/* Letter 'm' */}
        <path
          d="M 460 294
             H 480
             V 305
             C 486 296 496 292 508 292
             C 520 292 530 297 535 307
             C 542 297 553 292 565 292
             C 583 292 594 304 594 325
             V 380
             H 573
             V 328
             C 573 316 567 310 557 310
             C 547 310 541 317 541 329
             V 380
             H 520
             V 328
             C 520 316 514 310 504 310
             C 494 310 488 317 488 329
             V 380
             H 460
             Z"
          className="fill-[#131E35] dark:fill-white"
        />

        {/* Letter 'i' */}
        <circle
          cx="620"
          cy="270"
          r="12.5"
          className="fill-[#131E35] dark:fill-white"
        />
        <rect
          x="610"
          y="294"
          width="21"
          height="86"
          className="fill-[#131E35] dark:fill-white"
        />

        {/* Letter 'k' */}
        <path
          d="M 646 264
             H 667
             V 330
             L 695 294
             H 720
             L 687 333
             L 722 380
             H 697
             L 667 339
             V 380
             H 646
             Z"
          className="fill-[#131E35] dark:fill-white"
        />

        {/* ================================================================ */}
        {/* 6. TAGLINE: "— Skill • Work • Trust —"                           */}
        {/* ================================================================ */}
        <line
          x1="158"
          y1="418"
          x2="224"
          y2="418"
          stroke={`url(#ruleLeft-${uid})`}
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        <text
          x="284"
          y="426"
          textAnchor="middle"
          className="fill-[#131E35] dark:fill-slate-200"
          style={{
            fontFamily: "'Mukta', sans-serif",
            fontWeight: 600,
            fontSize: '26px',
            letterSpacing: '0.08em',
          }}
        >
          Skill
        </text>

        <circle cx="348" cy="417" r="5" fill="#FEB21D" />

        <text
          x="418"
          y="426"
          textAnchor="middle"
          className="fill-[#131E35] dark:fill-slate-200"
          style={{
            fontFamily: "'Mukta', sans-serif",
            fontWeight: 600,
            fontSize: '26px',
            letterSpacing: '0.08em',
          }}
        >
          Work
        </text>

        <circle cx="490" cy="417" r="5" fill="#FEB21D" />

        <text
          x="558"
          y="426"
          textAnchor="middle"
          className="fill-[#131E35] dark:fill-slate-200"
          style={{
            fontFamily: "'Mukta', sans-serif",
            fontWeight: 600,
            fontSize: '26px',
            letterSpacing: '0.08em',
          }}
        >
          Trust
        </text>

        <line
          x1="614"
          y1="418"
          x2="680"
          y2="418"
          stroke="#EA580C"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {showHindiTagline && (
          <text
            x="420"
            y="454"
            textAnchor="middle"
            className="fill-slate-600 dark:fill-slate-400"
            style={{
              fontFamily: "'Mukta', sans-serif",
              fontWeight: 600,
              fontSize: '18px',
              letterSpacing: '0.05em',
            }}
          >
            कौशल  •  काम  •  भरोसा
          </text>
        )}
      </svg>
    </div>
  );
};
