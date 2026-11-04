import { useLocation } from 'react-router-dom';

const IMG = {
  vault: '/images/vault-key.webp',
  plan: '/images/plan-builder.webp',
  map: '/images/opportunities.webp',
  chat: '/images/advisors.webp',
  market: '/images/marketplace.webp',
  growth: '/images/cta.webp',
  abstract: '/images/still-life.webp',
};

/** Picks the picture that fits what the page is about. Order matters: first match wins. */
const ROUTES: Array<[RegExp, string]> = [
  [/^\/(login|register)/, IMG.vault],
  [/^\/applications/, IMG.vault],
  [/^\/plans/, IMG.plan],
  [/^\/opportunities/, IMG.map],
  [/^\/(advisors|advisor|bookings|messages)/, IMG.chat],
  [/^\/(marketplace|storefront)/, IMG.market],
  [/^\/success-stories/, IMG.growth],
  [/^\/(resources|admin)/, IMG.abstract],
];

export function backdropFor(pathname: string): string {
  return ROUTES.find(([re]) => re.test(pathname))?.[1] ?? IMG.abstract;
}

/**
 * Full-viewport picture behind the whole site. The page renders on top of it, so a light veil keeps text
 * readable. Keyed on the image: pages that share a picture don't flicker, others fade in (opacity only).
 */
export default function PageBackdrop() {
  const { pathname } = useLocation();
  const src = backdropFor(pathname);
  return (
    <div aria-hidden="true" className="print:hidden pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#ece9e4]">
      <img key={src} src={src} alt="" className="backdrop-in absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#f3ebdc]/20 via-[#efe9e0]/10 to-[#e3e7ec]/30" />
    </div>
  );
}
