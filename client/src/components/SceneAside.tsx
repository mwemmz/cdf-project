import { useLocation } from 'react-router-dom';

type Card = { label: string; value: string; note: string };
type Scene = { src: string; alt: string; pos: string; top: Card; bottom: Card; ambient: boolean };

/**
 * A framed picture with two glass cards laid over it, the same composition as the home hero.
 * Pages that have one flow their content around it. `ambient` means the frame shows a crop of the page's
 * backdrop picture, so the backdrop is softened to avoid showing the same crisp picture twice.
 */
const SCENES: Array<[RegExp, Scene]> = [
  [
    /^\/opportunities/,
    {
      src: '/images/opportunities.webp',
      alt: 'A large charcoal map pin among smaller green pins',
      pos: '66% 50%',
      ambient: true,
      top: { label: 'Applying', value: 'Free', note: 'through FundPath' },
      bottom: { label: 'Decision', value: 'Bank and PLGO', note: 'after the CDF committee shortlist' },
    },
  ],
  [
    /^\/plans/,
    {
      src: '/images/score.webp',
      alt: 'A gauge with its needle in the green zone',
      pos: '50% 50%',
      ambient: false,
      top: { label: 'Feasibility', value: '0 to 100', note: 'scored from your numbers' },
      bottom: { label: 'Assessment', value: 'K150 once', note: 'demo payment, no real money' },
    },
  ],
  [
    /^\/(advisors|advisor|bookings|messages)/,
    {
      src: '/images/advisors.webp',
      alt: 'A green speech bubble with a checkmark badge',
      pos: '76% 50%',
      ambient: true,
      top: { label: 'Advisors', value: 'Verified', note: 'checked by an admin' },
      bottom: { label: 'Sessions', value: 'Paid per booking', note: 'chat opens after payment' },
    },
  ],
  [
    /^\/(marketplace|storefront)/,
    {
      src: '/images/marketplace.webp',
      alt: 'A small market stall with a green striped awning',
      pos: '24% 50%',
      ambient: true,
      top: { label: 'Marketplace', value: 'Funded shops', note: 'browse without an account' },
      bottom: { label: 'Checkout', value: 'Demo only', note: 'no real money moves' },
    },
  ],
  [
    /^\/applications/,
    {
      src: '/images/repayment.webp',
      alt: 'A calendar with completed repayments ticked and a stack of coins',
      pos: '50% 50%',
      ambient: false,
      top: { label: 'Interest', value: '5% simple', note: 'draft CDF Guidelines' },
      bottom: { label: 'Repayment', value: 'Monthly', note: 'first one 60 days after the loan' },
    },
  ],
];

export function sceneFor(pathname: string): Scene | undefined {
  return SCENES.find(([re]) => re.test(pathname))?.[1];
}

function GlassCard({ card, className }: { card: Card; className: string }) {
  return (
    <div className={`absolute rounded-xl border border-white/15 bg-[#14181c]/70 px-4 py-3 text-white shadow-pop backdrop-blur-sm ${className}`}>
      <div className="text-[10px] font-medium uppercase tracking-wider text-white/75">{card.label}</div>
      <div className="mt-1 text-lg font-bold leading-tight">{card.value}</div>
      <div className="text-[11px] leading-snug text-white/75">{card.note}</div>
    </div>
  );
}

export default function SceneAside({ scene }: { scene: Scene }) {
  const { pathname } = useLocation();
  return (
    <aside key={pathname.split('/')[1]} aria-hidden="false" className="hidden lg:block">
      <div className="sticky top-20 aspect-[9/16] w-full max-h-[calc(100vh-7rem)] overflow-hidden rounded-[1.75rem] shadow-pop ring-1 ring-white/40">
        <img src={scene.src} alt={scene.alt} className="h-full w-full object-cover" style={{ objectPosition: scene.pos }} />
        <GlassCard card={scene.top} className="right-4 top-5 w-[72%]" />
        <GlassCard card={scene.bottom} className="bottom-5 left-4 w-[80%]" />
      </div>
    </aside>
  );
}
