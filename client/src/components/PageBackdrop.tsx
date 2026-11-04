import { useLocation } from 'react-router-dom';

type Backdrop = { src: string; pos?: string };

/**
 * One picture per screen, never shared. A screen with no picture of its own gets the plain warm-to-slate gradient,
 * so no two screens ever show the same photo. Add a file under public/images and a line here to give a screen its own.
 * Order matters: first match wins.
 */
const SCREENS: Array<[RegExp, Backdrop]> = [
  [/^\/$/, { src: '/images/still-life.webp' }],
  [/^\/login\/?$/, { src: '/images/vault-key.webp' }],
  [/^\/register\/?$/, { src: '/images/cta.webp' }],
  [/^\/opportunities\/?$/, { src: '/images/opportunities.webp' }],
  [/^\/plans\/new\/?$/, { src: '/images/plan-builder.webp' }],
  [/^\/plans\/?$/, { src: '/images/plans-list.webp', pos: '70% 70%' }],
  [/^\/plans\/[^/]+\/?$/, { src: '/images/score.webp', pos: '50% 62%' }],
  [/^\/advisors\/?$/, { src: '/images/advisors.webp' }],
  [/^\/applications\/?$/, { src: '/images/repayment.webp', pos: '50% 38%' }],
  [/^\/marketplace\/?$/, { src: '/images/marketplace.webp' }],
  [/^\/success-stories\/?$/, { src: '/images/vault.webp', pos: '50% 55%' }],
];

export function backdropFor(pathname: string): Backdrop | undefined {
  return SCREENS.find(([re]) => re.test(pathname))?.[1];
}

/**
 * The picture is the foundation of the screen, softened so the glass panels read as the focus. Keyed on the
 * image so it fades in (opacity only) when it changes.
 */
export default function PageBackdrop() {
  const { pathname } = useLocation();
  const b = backdropFor(pathname);
  return (
    <div
      aria-hidden="true"
      className="print:hidden pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-[#f3ebdc] via-[#ece9e4] to-[#d3d9e1]"
    >
      {b && (
        <img
          key={b.src}
          src={b.src}
          alt=""
          className="backdrop-in absolute inset-0 h-full w-full scale-105 object-cover blur-[6px]"
          style={{ objectPosition: b.pos ?? 'center' }}
        />
      )}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#14181c]/35 to-transparent" />
    </div>
  );
}
