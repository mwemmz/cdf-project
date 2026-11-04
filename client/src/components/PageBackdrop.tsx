import { useLocation } from 'react-router-dom';

type Backdrop = { src: string; pos?: string; flip?: boolean; portrait?: boolean };

/**
 * Every screen has a picture from the uploaded set, shown at its true proportions (never zoomed or stretched).
 * Tall pictures are shown whole in the middle with a soft copy filling the sides. A picture is used at most twice:
 * once as it is and once mirrored. Order matters: first match wins.
 */
const SCREENS: Array<[RegExp, Backdrop]> = [
  [/^\/$/, { src: '/images/still-life.webp' }],
  [/^\/login\/?$/, { src: '/images/vault-key.webp' }],
  [/^\/register\/?$/, { src: '/images/cta.webp' }],
  [/^\/opportunities\/?$/, { src: '/images/opportunities.webp' }],
  [/^\/plans\/new\/?$/, { src: '/images/plan-builder.webp' }],
  [/^\/plans\/?$/, { src: '/images/plans-list.webp' }],
  [/^\/plans\/[^/]+\/?$/, { src: '/images/score.webp', portrait: true }],
  [/^\/advisors\/?$/, { src: '/images/advisors.webp' }],
  [/^\/advisors\/me\/?$/, { src: '/images/plan-builder.webp', flip: true }],
  [/^\/advisors\/[^/]+\/?$/, { src: '/images/advisors.webp', flip: true }],
  [/^\/advisor\//, { src: '/images/plan-builder.webp', flip: true }],
  [/^\/bookings/, { src: '/images/opportunities.webp', flip: true }],
  [/^\/messages/, { src: '/images/cta.webp', flip: true }],
  [/^\/applications\/?$/, { src: '/images/repayment.webp', portrait: true }],
  [/^\/applications\//, { src: '/images/repayment.webp', portrait: true, flip: true }],
  [/^\/marketplace\/?$/, { src: '/images/marketplace.webp' }],
  [/^\/storefront/, { src: '/images/marketplace.webp', flip: true }],
  [/^\/success-stories\/?$/, { src: '/images/vault.webp', portrait: true }],
  [/^\/resources/, { src: '/images/still-life.webp', flip: true }],
  [/^\/admin/, { src: '/images/vault-key.webp', flip: true }],
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
        <div key={b.src + String(b.flip)} className={`backdrop-in absolute inset-0 ${b.flip ? '-scale-x-100' : ''}`}>
          {b.portrait && (
            <img src={b.src} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl" />
          )}
          <img
            src={b.src}
            alt=""
            className={`absolute inset-0 h-full w-full ${b.portrait ? 'object-contain' : 'object-cover blur-[2px]'}`}
            style={
              b.portrait
                ? {
                    maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
                  }
                : undefined
            }
          />
        </div>
      )}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#14181c]/35 to-transparent" />
    </div>
  );
}
