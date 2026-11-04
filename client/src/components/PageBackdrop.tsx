import { useLocation } from 'react-router-dom';
import { sceneFor } from './SceneAside';

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
 * The picture is the foundation of every page and is shown at full strength. Content sits on glass panels above it,
 * so readability comes from the panels (checked for contrast), not from washing the picture out. Keyed on the image: pages that share a picture don't flicker, others fade in (opacity only).
 */
export default function PageBackdrop() {
  const { pathname } = useLocation();
  const src = backdropFor(pathname);
  const soft = sceneFor(pathname)?.ambient ?? false;
  return (
    <div aria-hidden="true" className="print:hidden pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#ece9e4]">
      <img key={src} src={src} alt="" className={`backdrop-in absolute inset-0 h-full w-full object-cover ${soft ? 'scale-105 blur-[6px]' : ''}`} />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#14181c]/35 to-transparent" />
    </div>
  );
}
