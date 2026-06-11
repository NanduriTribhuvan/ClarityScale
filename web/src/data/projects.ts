/**
 * Case-study data for the Work section.
 *
 * Single source of truth for both the Idea Board tiles and the /work/[slug]
 * case-study pages. Imagery uses designed gradient panels (g1/g2 are brand
 * CSS custom properties) until real project assets are supplied.
 */

export interface ResultStat {
  value: string;
  label: string;
}

export interface GalleryPanel {
  g1: string;
  g2: string;
  caption: string;
  /** Optional layout hint for the gallery grid. */
  wide?: boolean;
}

export interface BeforeAfter {
  metric: string;
  before: string;
  after: string;
}

export interface Project {
  slug: string;
  title: string;
  category: string;
  /** Headline metric shown on the tile and card. */
  metric: string;
  client: string;
  year: string;
  services: string[];
  /** Gradient stops for tiles/cover (brand tokens). */
  g1: string;
  g2: string;
  /** One-line summary for cards/tiles. */
  summary: string;
  challenge: string;
  approach: string[];
  results: ResultStat[];
  beforeAfter: BeforeAfter[];
  gallery: GalleryPanel[];
}

export const PROJECTS: Project[] = [
  {
    slug: 'novabrew',
    title: 'NovaBrew',
    category: 'E-Commerce',
    metric: '+340% traffic',
    client: 'NovaBrew Co.',
    year: '2025',
    services: ['Web Development', 'E-Commerce', 'SEO'],
    g1: 'var(--cyan)',
    g2: 'var(--blue)',
    summary:
      'A craft-coffee storefront rebuilt for speed and story — turning casual scrollers into subscribers.',
    challenge:
      'NovaBrew had a beautiful product but a slow, template storefront that buried their story and leaked customers at checkout. Organic discovery was near zero and mobile conversion was painful.',
    approach: [
      'Replatformed onto a headless commerce stack for sub-second loads.',
      'Designed editorial product pages that lead with origin, roast and ritual.',
      'Rebuilt the checkout into a two-step flow with subscription nudges.',
      'Shipped a technical-SEO foundation: schema, sitemaps, and fast Core Web Vitals.',
    ],
    results: [
      { value: '+340%', label: 'Organic traffic' },
      { value: '4.8%', label: 'Conversion rate' },
      { value: '−61%', label: 'Page weight' },
    ],
    beforeAfter: [
      { metric: 'Largest Contentful Paint', before: '4.6s', after: '0.9s' },
      { metric: 'Mobile conversion', before: '1.2%', after: '4.8%' },
      { metric: 'Monthly organic sessions', before: '1.1k', after: '4.8k' },
    ],
    gallery: [
      { g1: 'var(--cyan)', g2: 'var(--blue)', caption: 'Home — origin-led hero', wide: true },
      { g1: 'var(--blue)', g2: 'var(--purple)', caption: 'Editorial product detail page' },
      { g1: 'var(--purple)', g2: 'var(--violet)', caption: 'Two-step subscription checkout' },
    ],
  },
  {
    slug: 'luxe-realty',
    title: 'Luxe Realty',
    category: 'SEO',
    metric: '+212% leads',
    client: 'Luxe Realty Group',
    year: '2024',
    services: ['SEO', 'Content Strategy', 'Web Development'],
    g1: 'var(--purple)',
    g2: 'var(--violet)',
    summary:
      'Technical SEO and a content engine that pushed a luxury property group to the top of high-intent search.',
    challenge:
      'A premium brand invisible on search. Listings were unstructured, pages were thin, and competitors owned every market-level query.',
    approach: [
      'Built structured data for listings and neighbourhoods.',
      'Launched market-level landing pages tuned to high-intent queries.',
      'Created an editorial cadence around local market insight.',
      'Fixed crawl, indexation and internal-linking debt.',
    ],
    results: [
      { value: '+212%', label: 'Qualified leads' },
      { value: '38', label: 'Keywords ranked #1' },
      { value: '9 wks', label: 'Time to first page' },
    ],
    beforeAfter: [
      { metric: 'Page-1 keywords', before: '14', after: '190+' },
      { metric: 'Monthly qualified leads', before: '22', after: '69' },
      { metric: 'Indexed pages', before: '40', after: '320' },
    ],
    gallery: [
      { g1: 'var(--purple)', g2: 'var(--violet)', caption: 'Market landing page', wide: true },
      { g1: 'var(--violet)', g2: 'var(--pink)', caption: 'Structured listing template' },
      { g1: 'var(--blue)', g2: 'var(--purple)', caption: 'Insight article layout' },
    ],
  },
  {
    slug: 'peakfit',
    title: 'PeakFit',
    category: 'Branding',
    metric: '2.1M reach',
    client: 'PeakFit',
    year: '2025',
    services: ['Brand Identity', 'Motion', 'Packaging'],
    g1: 'var(--pink)',
    g2: 'var(--orange)',
    summary:
      'A bold identity system for a performance fitness brand — built to flex across launch and packaging.',
    challenge:
      'PeakFit was entering a crowded market with no distinct visual voice and inconsistent assets across channels.',
    approach: [
      'Defined a confident typographic and colour system.',
      'Designed a flexible, motion-ready logo.',
      'Built a template kit for campaigns and packaging.',
      'Documented everything in a living brand guide.',
    ],
    results: [
      { value: '2.1M', label: 'Launch reach' },
      { value: '+74%', label: 'Brand recall' },
      { value: '120+', label: 'Assets shipped' },
    ],
    beforeAfter: [
      { metric: 'Aided brand recall', before: '18%', after: '92%' },
      { metric: 'Launch impressions', before: '—', after: '2.1M' },
      { metric: 'On-brand asset coverage', before: '30%', after: '100%' },
    ],
    gallery: [
      { g1: 'var(--pink)', g2: 'var(--orange)', caption: 'Identity system', wide: true },
      { g1: 'var(--orange)', g2: 'var(--coral)', caption: 'Packaging suite' },
      { g1: 'var(--violet)', g2: 'var(--pink)', caption: 'Campaign templates' },
    ],
  },
  {
    slug: 'zenit-saas',
    title: 'Zenit SaaS',
    category: 'Web',
    metric: '+58% signups',
    client: 'Zenit',
    year: '2024',
    services: ['Web Development', 'UX', 'CRO'],
    g1: 'var(--blue)',
    g2: 'var(--cyan)',
    summary:
      'A marketing site and onboarding flow for a B2B analytics platform that lifted activation.',
    challenge:
      'Strong product, muddled message. Visitors did not understand the value fast enough and trials stalled before the aha moment.',
    approach: [
      'Sharpened positioning and messaging hierarchy.',
      'Built interactive product tours on the marketing site.',
      'Streamlined the trial-to-activation path.',
      'Instrumented the funnel to keep improving.',
    ],
    results: [
      { value: '+58%', label: 'Free trials' },
      { value: '+33%', label: 'Activation' },
      { value: '0.9s', label: 'LCP' },
    ],
    beforeAfter: [
      { metric: 'Trial signups / mo', before: '210', after: '332' },
      { metric: 'Activation rate', before: '41%', after: '54%' },
      { metric: 'Bounce on homepage', before: '62%', after: '38%' },
    ],
    gallery: [
      { g1: 'var(--blue)', g2: 'var(--cyan)', caption: 'Homepage', wide: true },
      { g1: 'var(--cyan)', g2: 'var(--blue)', caption: 'Interactive product tour' },
      { g1: 'var(--purple)', g2: 'var(--blue)', caption: 'Onboarding flow' },
    ],
  },
  {
    slug: 'aurora-labs',
    title: 'Aurora Labs',
    category: 'Branding',
    metric: '+90 NPS',
    client: 'Aurora Labs',
    year: '2025',
    services: ['Naming', 'Brand Identity', 'Design System'],
    g1: 'var(--violet)',
    g2: 'var(--pink)',
    summary:
      'Naming, identity and a living design language for a research studio raising its first round.',
    challenge:
      'A brilliant team with no name, no identity, and a fundraise on the horizon.',
    approach: [
      'Ran a naming sprint to a confident, ownable name.',
      'Designed a spectral gradient identity system.',
      'Built a design language spanning product, deck and web.',
      'Shipped a component-ready brand kit.',
    ],
    results: [
      { value: '+90', label: 'NPS' },
      { value: '$12M', label: 'Funding raised' },
      { value: '40+', label: 'Press hits' },
    ],
    beforeAfter: [
      { metric: 'Brand assets', before: '0', after: 'Full system' },
      { metric: 'Investor deck clarity (survey)', before: '5.1/10', after: '9.0/10' },
      { metric: 'Press mentions', before: '2', after: '40+' },
    ],
    gallery: [
      { g1: 'var(--violet)', g2: 'var(--pink)', caption: 'Spectral identity', wide: true },
      { g1: 'var(--pink)', g2: 'var(--coral)', caption: 'Pitch deck system' },
      { g1: 'var(--blue)', g2: 'var(--violet)', caption: 'Product UI language' },
    ],
  },
  {
    slug: 'vertex',
    title: 'Vertex',
    category: 'E-Commerce',
    metric: '+5.4x ROAS',
    client: 'Vertex',
    year: '2024',
    services: ['CRO', 'Performance Marketing', 'Web Development'],
    g1: 'var(--blue)',
    g2: 'var(--purple)',
    summary:
      'A performance-marketing rebuild for a DTC hardware brand — rewiring the funnel end to end.',
    challenge:
      'Rising ad costs and a leaky funnel were crushing margins on an otherwise great product.',
    approach: [
      'Rebuilt the product detail page around objections.',
      'Restructured campaigns and creative testing.',
      'Tightened the checkout and post-purchase flow.',
      'Built a reporting layer the team actually uses.',
    ],
    results: [
      { value: '5.4x', label: 'ROAS' },
      { value: '+41%', label: 'Average order value' },
      { value: '−28%', label: 'Checkout drop-off' },
    ],
    beforeAfter: [
      { metric: 'Blended ROAS', before: '1.9x', after: '5.4x' },
      { metric: 'AOV', before: '$72', after: '$102' },
      { metric: 'Checkout completion', before: '54%', after: '82%' },
    ],
    gallery: [
      { g1: 'var(--blue)', g2: 'var(--purple)', caption: 'Conversion-led PDP', wide: true },
      { g1: 'var(--purple)', g2: 'var(--violet)', caption: 'Creative test matrix' },
      { g1: 'var(--cyan)', g2: 'var(--blue)', caption: 'Checkout redesign' },
    ],
  },
  {
    slug: 'bloom-co',
    title: 'Bloom & Co',
    category: 'E-Commerce',
    metric: '+180% sales',
    client: 'Bloom & Co',
    year: '2024',
    services: ['Web Development', 'UX', 'E-Commerce'],
    g1: 'var(--pink)',
    g2: 'var(--violet)',
    summary: 'A florist gone digital — same-day delivery logic and gift flows that feel effortless.',
    challenge:
      'A beloved local florist losing online orders to clunky tooling and confusing delivery rules.',
    approach: [
      'Designed a calm, tactile shopping interface.',
      'Built same-day delivery and cut-off logic.',
      'Created gifting and message flows.',
      'Optimised repeat-order journeys.',
    ],
    results: [
      { value: '+180%', label: 'Online sales' },
      { value: '52%', label: 'Repeat rate' },
      { value: '−12%', label: 'Returns' },
    ],
    beforeAfter: [
      { metric: 'Online revenue share', before: '21%', after: '59%' },
      { metric: 'Repeat purchase rate', before: '28%', after: '52%' },
      { metric: 'Delivery complaints', before: 'High', after: 'Rare' },
    ],
    gallery: [
      { g1: 'var(--pink)', g2: 'var(--violet)', caption: 'Storefront', wide: true },
      { g1: 'var(--violet)', g2: 'var(--purple)', caption: 'Gift flow' },
      { g1: 'var(--coral)', g2: 'var(--pink)', caption: 'Delivery scheduler' },
    ],
  },
  {
    slug: 'halo-studio',
    title: 'Halo Studio',
    category: 'Web',
    metric: '0.4s LCP',
    client: 'Halo Studio',
    year: '2025',
    services: ['Web Development', 'Performance', 'Motion'],
    g1: 'var(--cyan)',
    g2: 'var(--purple)',
    summary: 'A portfolio for a motion studio that had to feel as good as the work — and load instantly.',
    challenge:
      'Heavy video work that needed to feel premium without tanking performance or SEO.',
    approach: [
      'Edge-rendered pages with aggressive image/video optimisation.',
      'Built tasteful, GPU-friendly motion.',
      'Engineered a fast, accessible media gallery.',
      'Locked in 100 Lighthouse scores.',
    ],
    results: [
      { value: '0.4s', label: 'LCP' },
      { value: '100', label: 'Lighthouse' },
      { value: '−37%', label: 'Bounce rate' },
    ],
    beforeAfter: [
      { metric: 'LCP', before: '3.8s', after: '0.4s' },
      { metric: 'Lighthouse performance', before: '52', after: '100' },
      { metric: 'Avg. session duration', before: '38s', after: '2m 10s' },
    ],
    gallery: [
      { g1: 'var(--cyan)', g2: 'var(--purple)', caption: 'Showreel home', wide: true },
      { g1: 'var(--purple)', g2: 'var(--blue)', caption: 'Project gallery' },
      { g1: 'var(--blue)', g2: 'var(--cyan)', caption: 'Case detail' },
    ],
  },
  {
    slug: 'drift',
    title: 'Drift',
    category: 'Branding',
    metric: '+320% follows',
    client: 'Drift',
    year: '2024',
    services: ['Brand Identity', 'Social System', 'Motion'],
    g1: 'var(--orange)',
    g2: 'var(--pink)',
    summary: 'A social-first identity for a travel app — a kinetic logo and a template kit for the feed.',
    challenge:
      'A travel startup shipping inconsistent, slow-to-produce social content with no brand glue.',
    approach: [
      'Designed a kinetic, feed-native logo.',
      'Built a modular template kit.',
      'Defined a punchy social voice.',
      'Trained the team to ship on-brand fast.',
    ],
    results: [
      { value: '+320%', label: 'Followers' },
      { value: '+5x', label: 'Saves' },
      { value: '−60%', label: 'Content production time' },
    ],
    beforeAfter: [
      { metric: 'Monthly followers added', before: '900', after: '3.8k' },
      { metric: 'Saves per post', before: '40', after: '210' },
      { metric: 'Time per content batch', before: '2 days', after: '4 hrs' },
    ],
    gallery: [
      { g1: 'var(--orange)', g2: 'var(--pink)', caption: 'Kinetic identity', wide: true },
      { g1: 'var(--pink)', g2: 'var(--violet)', caption: 'Template kit' },
      { g1: 'var(--coral)', g2: 'var(--orange)', caption: 'Feed system' },
    ],
  },
  {
    slug: 'monolith',
    title: 'Monolith',
    category: 'Web',
    metric: '99/100 perf',
    client: 'Monolith',
    year: '2025',
    services: ['Design System', 'CMS', 'Web Development'],
    g1: 'var(--blue)',
    g2: 'var(--violet)',
    summary: 'A corporate replatform — a design system and CMS a non-technical team can publish on safely.',
    challenge:
      'A large site that only engineers could update, with mounting design drift and slow releases.',
    approach: [
      'Built a governed design system and component library.',
      'Migrated content into a structured CMS.',
      'Gave editors safe, flexible page-building blocks.',
      'Automated quality and performance checks.',
    ],
    results: [
      { value: '99', label: 'Performance score' },
      { value: '−80%', label: 'Time to publish' },
      { value: '64', label: 'Components' },
    ],
    beforeAfter: [
      { metric: 'Avg. time to publish a page', before: '3 days', after: '15 min' },
      { metric: 'Lighthouse performance', before: '61', after: '99' },
      { metric: 'Design inconsistencies', before: 'Frequent', after: 'Rare' },
    ],
    gallery: [
      { g1: 'var(--blue)', g2: 'var(--violet)', caption: 'Design system', wide: true },
      { g1: 'var(--violet)', g2: 'var(--purple)', caption: 'CMS page builder' },
      { g1: 'var(--cyan)', g2: 'var(--blue)', caption: 'Component library' },
    ],
  },
  {
    slug: 'pulse',
    title: 'Pulse',
    category: 'SEO',
    metric: '#1 rankings',
    client: 'Pulse Health',
    year: '2024',
    services: ['Programmatic SEO', 'Content', 'Web Development'],
    g1: 'var(--cyan)',
    g2: 'var(--blue)',
    summary: 'A programmatic SEO build for a health platform — thousands of fast, genuinely useful pages.',
    challenge:
      'A huge content opportunity locked behind manual processes and a slow stack.',
    approach: [
      'Designed templated, intent-matched page types.',
      'Built a fast, structured content pipeline.',
      'Engineered crawl-friendly architecture at scale.',
      'Monitored quality to avoid thin content.',
    ],
    results: [
      { value: '1.2k', label: 'Top-3 keywords' },
      { value: '8.4k', label: 'Indexed pages' },
      { value: '+460%', label: 'Organic clicks' },
    ],
    beforeAfter: [
      { metric: 'Indexed pages', before: '120', after: '8.4k' },
      { metric: 'Top-3 keywords', before: '30', after: '1.2k' },
      { metric: 'Monthly organic clicks', before: '9k', after: '50k' },
    ],
    gallery: [
      { g1: 'var(--cyan)', g2: 'var(--blue)', caption: 'Templated page type', wide: true },
      { g1: 'var(--blue)', g2: 'var(--purple)', caption: 'Content pipeline' },
      { g1: 'var(--purple)', g2: 'var(--cyan)', caption: 'Topic hub' },
    ],
  },
  {
    slug: 'kindred',
    title: 'Kindred',
    category: 'E-Commerce',
    metric: '+260% AOV',
    client: 'Kindred',
    year: '2025',
    services: ['E-Commerce', 'UX', 'Personalisation'],
    g1: 'var(--purple)',
    g2: 'var(--pink)',
    summary:
      'A subscription marketplace with bundling, gifting and a recommendation layer that nudges the perfect basket.',
    challenge:
      'Low basket sizes and high churn on a marketplace with great supply but flat merchandising.',
    approach: [
      'Designed bundles and gifting mechanics.',
      'Built a recommendation layer into the journey.',
      'Reworked subscription management.',
      'Tuned lifecycle messaging.',
    ],
    results: [
      { value: '+260%', label: 'Average order value' },
      { value: '+3.1x', label: 'Lifetime value' },
      { value: '−19%', label: 'Churn' },
    ],
    beforeAfter: [
      { metric: 'AOV', before: '$28', after: '$101' },
      { metric: 'LTV', before: '$140', after: '$434' },
      { metric: 'Monthly churn', before: '9.1%', after: '7.4%' },
    ],
    gallery: [
      { g1: 'var(--purple)', g2: 'var(--pink)', caption: 'Marketplace home', wide: true },
      { g1: 'var(--pink)', g2: 'var(--violet)', caption: 'Bundle builder' },
      { g1: 'var(--violet)', g2: 'var(--purple)', caption: 'Recommendations' },
    ],
  },
];

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

/** Slugify a project title the same way the Idea Board links do. */
export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
