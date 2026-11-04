import { useLocation } from 'react-router-dom';

type Backdrop = { src: string; pos?: string; zoom?: number; flip?: boolean };

/**
 * Every screen has a picture from the uploaded set. Screens in the same family (for example the advisor screens)
 * use the same picture but each with its own crop, zoom and mirroring, so no two screens look alike.
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
  [/^\/advisors\/me\/?$/, { src: '/images/plan-builder.webp', pos: '30% 50%', zoom: 1.3, flip: true }],
  [/^\/advisors\/[^/]+\/?$/, { src: '/images/advisors.webp', pos: '18% 55%', zoom: 1.4 }],
  [/^\/bookings/, { src: '/images/advisors.webp', pos: '80% 50%', zoom: 1.4, flip: true }],
  [/^\/messages/, { src: '/images/advisors.webp', pos: '50% 75%', zoom: 1.8 }],
  [/^\/(advisor|advisors)\//, { src: '/images/plan-builder.webp', pos: '30% 50%', zoom: 1.3, flip: true }],
  [/^\/applications\/?$/, { src: '/images/repayment.webp', pos: '50% 38%' }],
  [/^\/applications\//, { src: '/images/repayment.webp', pos: '50% 75%', zoom: 1.3 }],
  [/^\/marketplace\/?$/, { src: '/images/marketplace.webp' }],
  [/^\/storefront/, { src: '/images/marketplace.webp', zoom: 1.3, flip: true }],
  [/^\/success-stories\/?$/, { src: '/images/vault.webp', pos: '50% 55%' }],
  [/^\/resources/, { src: '/images/cta.webp', pos: '25% 60%', zoom: 1.4 }],
  [/^\/admin/, { src: '/images/vault-key.webp', pos: '30% 50%', zoom: 1.5, flip: true }],
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
          className="backdrop-in absolute inset-0 h-full w-full object-cover blur-[6px]"
          style={{
            objectPosition: b.pos ?? 'center',
            transformOrigin: b.pos ?? 'center',
            transform: `scale(${(b.flip ? -1 : 1) * (b.zoom ?? 1.05)}, ${b.zoom ?? 1.05})`,
          }}
        />
      )}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#14181c]/35 to-transparent" />
    </div>
  );
}
