import { useState, useEffect, useRef, useCallback } from 'react';

import {
  Shield, Search, Moon, Sun, AlertTriangle, Cookie, Globe,
  History, Trash2, Download, Share2, RefreshCw, Lock, Eye,
  Code, BarChart3, Clock, ExternalLink, FileText, Clipboard,
  Zap, CheckCircle, XCircle, Info, Link, Layers, Terminal,
  ChevronDown, ChevronUp, Copy, X, Database,
  Award, TrendingDown,
  BookOpen, ArrowRight, Wifi, Image
} from 'lucide-react';

// ============================================================
// TYPES
// ============================================================
interface ScanResult {
  url: string;
  score: number;
  trackers: TrackerDetail[];
  thirdPartyDomains: string[];
  cookiesDetected: boolean;
  localStorageUsed: boolean;
  sessionStorageUsed: boolean;
  timestamp: number;
  httpsUsed: boolean;
  scriptsCount: number;
  iframesCount: number;
  externalLinks: number;
  metaTags: { name: string; content: string }[];
  inlineScriptsCount: number;
  externalScriptsCount: number;
  imagesFromThirdParty: number;
  hasCSP: boolean;
  hasReferrerPolicy: boolean;
  hasDoNotTrack: boolean;
  hasXFrameOptions: boolean;
  hasPermissionsPolicy: boolean;
  formCount: number;
  passwordFields: number;
  scanDuration: number;
  htmlSize: number;
}

interface TrackerDetail {
  name: string;
  category: string;
  risk: 'high' | 'medium' | 'low';
  description: string;
}

interface HistoryEntry {
  url: string;
  score: number;
  trackerCount: number;
  timestamp: number;
}

// ============================================================
// TRACKER DATABASE — 100+ entries
// ============================================================
const TRACKER_DB: {
  name: string;
  patterns: string[];
  category: string;
  risk: 'high' | 'medium' | 'low';
  description: string;
}[] = [
  // ── Analytics ──────────────────────────────────────────
  { name:'Google Analytics',    patterns:['google-analytics','gtag/js','ga.js','analytics.js','UA-','G-','GA_MEASUREMENT_ID'], category:'Analytics', risk:'medium', description:'Google\'s web analytics platform tracking page views, sessions & user behavior' },
  { name:'Google Tag Manager',  patterns:['googletagmanager.com/gtm','GTM-','gtm.js'],                                          category:'Analytics', risk:'medium', description:'Container tag that manages and fires other tracking codes' },
  { name:'Yandex Metrica',      patterns:['mc.yandex.ru','yandex.ru/watch','yandex_metrika','ym('],                            category:'Analytics', risk:'medium', description:'Yandex\'s analytics platform with session recording' },
  { name:'Adobe Analytics',     patterns:['omniture','adobe-analytics','demdex.net','omtrdc.net','sc.omtrdc'],                  category:'Analytics', risk:'medium', description:'Enterprise-grade analytics suite by Adobe' },
  { name:'Matomo / Piwik',      patterns:['matomo.js','piwik.js','matomo.php','piwik.php'],                                    category:'Analytics', risk:'low',    description:'Privacy-focused self-hostable analytics' },
  { name:'Plausible Analytics', patterns:['plausible.io','plausible.js'],                                                      category:'Analytics', risk:'low',    description:'Lightweight, cookie-free, GDPR-compliant analytics' },
  { name:'Fathom Analytics',    patterns:['usefathom.com','cdn.usefathom.com'],                                                category:'Analytics', risk:'low',    description:'Simple, privacy-friendly analytics without cookies' },
  { name:'Mixpanel',            patterns:['mixpanel.com','mixpanel.js','mixpanel.init'],                                       category:'Analytics', risk:'medium', description:'Product analytics for user journey and event tracking' },
  { name:'Amplitude',           patterns:['amplitude.com','amplitude.js','cdn.amplitude.com'],                                 category:'Analytics', risk:'medium', description:'Behavioral analytics for product growth' },
  { name:'Heap Analytics',      patterns:['heapanalytics.com','heap.js','cdn.heapanalytics'],                                  category:'Analytics', risk:'medium', description:'Auto-capture analytics without manual event coding' },
  { name:'Segment',             patterns:['cdn.segment.com','segment.io','analytics.js','segment.com/analytics'],              category:'Analytics', risk:'medium', description:'Customer data platform routing to other analytics tools' },
  { name:'Kissmetrics',         patterns:['kissmetrics.com','kissmetrics.js'],                                                 category:'Analytics', risk:'medium', description:'Behavioral analytics focused on individual users' },
  { name:'Statcounter',         patterns:['statcounter.com','sc.js','stat_block'],                                             category:'Analytics', risk:'medium', description:'Web traffic analysis and visitor tracking' },
  { name:'Woopra',              patterns:['woopra.com','woopra.js'],                                                           category:'Analytics', risk:'medium', description:'Real-time customer analytics platform' },
  { name:'Clicky',              patterns:['static.getclicky.com','clicky.js'],                                                 category:'Analytics', risk:'medium', description:'Real-time web analytics with heatmaps' },
  { name:'GoSquared',           patterns:['gosquared.com','gs.js'],                                                            category:'Analytics', risk:'medium', description:'Real-time analytics and customer data platform' },

  // ── Advertising / Tracking Pixels ──────────────────────
  { name:'Facebook Pixel',      patterns:['connect.facebook.net','fbq(','facebook.com/tr','fbevents.js','fb-pixel'],          category:'Advertising', risk:'high', description:'Meta\'s conversion and retargeting pixel for Facebook/Instagram ads' },
  { name:'Google Ads',          patterns:['googleads.g.doubleclick','pagead2.googlesyndication','conversion.js','doubleclick.net','google_tag_data'], category:'Advertising', risk:'high', description:'Google\'s advertising and conversion tracking system' },
  { name:'Bing / Microsoft Ads',patterns:['bat.bing.com','uet.bing.com','clarity.ms/tag','microsoft-uet'],                   category:'Advertising', risk:'high', description:'Microsoft\'s universal event tracking for Bing Ads' },
  { name:'Twitter / X Pixel',   patterns:['analytics.twitter.com','ads.twitter.com','t.co/i/adsct','twq('],                  category:'Advertising', risk:'high', description:'Twitter/X conversion tracking and retargeting pixel' },
  { name:'LinkedIn Insight',    patterns:['snap.licdn.com','linkedin.com/insight','_linkedin_data_partner_id'],              category:'Advertising', risk:'high', description:'LinkedIn\'s ad conversion and audience tracking tag' },
  { name:'Pinterest Tag',       patterns:['ct.pinterest.com','pintrk(','s.pinimg.com/ct'],                                   category:'Advertising', risk:'high', description:'Pinterest\'s conversion tracking pixel' },
  { name:'TikTok Pixel',        patterns:['analytics.tiktok.com','tiktok.com/i18n/pixel','ttq.load','tiktok-pixel'],          category:'Advertising', risk:'high', description:'TikTok\'s ad conversion and audience tracking pixel' },
  { name:'Snapchat Pixel',      patterns:['tr.snapchat.com','sc-analytics','snapchat.com/p','snaptr('],                      category:'Advertising', risk:'high', description:'Snap\'s conversion pixel for Snapchat advertising' },
  { name:'Reddit Pixel',        patterns:['alb.reddit.com','rdt.r.redd.it','redditstatic.com/ads','rdt('],                   category:'Advertising', risk:'high', description:'Reddit\'s conversion tracking for Reddit Ads' },
  { name:'Quora Pixel',         patterns:['qp.quora.com','qevents.js','quora.com/qevents'],                                  category:'Advertising', risk:'high', description:'Quora\'s ad pixel for conversion tracking' },
  { name:'Criteo',              patterns:['static.criteo.net','criteo.com','dis.criteo.com'],                                 category:'Advertising', risk:'high', description:'Retargeting ad network using behavioral data' },
  { name:'AdRoll',              patterns:['d.adroll.com','adroll.com','arlog('],                                              category:'Advertising', risk:'high', description:'Cross-channel retargeting and advertising platform' },
  { name:'Taboola',             patterns:['cdn.taboola.com','taboola.js','_taboola'],                                         category:'Advertising', risk:'high', description:'Native content advertising and recommendations' },
  { name:'Outbrain',            patterns:['widgets.outbrain.com','outbrain.js','OBR.extern'],                                 category:'Advertising', risk:'high', description:'Content discovery and native advertising network' },
  { name:'Media.net',           patterns:['media.net','static.media.net'],                                                   category:'Advertising', risk:'high', description:'Contextual ad network by Yahoo/Bing' },
  { name:'AppNexus / Xandr',    patterns:['secure.adnxs.com','ib.adnxs.com'],                                               category:'Advertising', risk:'high', description:'Programmatic advertising and data exchange' },
  { name:'Trade Desk',          patterns:['js.adsrvr.org','match.adsrvr.org'],                                               category:'Advertising', risk:'high', description:'Demand-side advertising platform' },
  { name:'Amazon Ads',          patterns:['amazon-adsystem.com','z-na.amazon-adsystem','s.amazon-adsystem'],                 category:'Advertising', risk:'high', description:'Amazon\'s advertising and display network' },

  // ── Session Recording & Heatmaps ──────────────────────
  { name:'Hotjar',              patterns:['hotjar.com','hj(','hjSetting','hjBootstrap'],                                     category:'Session Recording', risk:'high', description:'Records user sessions, clicks, and creates scroll/click heatmaps' },
  { name:'FullStory',           patterns:['fullstory.com','fs.js','_fs_debug','FS.identify'],                               category:'Session Recording', risk:'high', description:'Digital experience platform recording full user sessions' },
  { name:'LogRocket',           patterns:['cdn.logrocket.io','logrocket.js','LogRocket.init'],                              category:'Session Recording', risk:'high', description:'Session replay with performance monitoring for debugging' },
  { name:'Microsoft Clarity',   patterns:['clarity.ms','clarity.js','WW('],                                                 category:'Session Recording', risk:'high', description:'Microsoft\'s heatmap and session recording tool' },
  { name:'Crazy Egg',           patterns:['script.crazyegg.com','crazyegg.js'],                                             category:'Session Recording', risk:'high', description:'Heatmaps, scrollmaps, and A/B testing tool' },
  { name:'Mouseflow',           patterns:['cdn.mouseflow.com','mouseflow.js','mf.track'],                                   category:'Session Recording', risk:'high', description:'Session recording with form analytics and heatmaps' },
  { name:'Lucky Orange',        patterns:['luckyorange.com','lo.js','window.__lo_site_id'],                                 category:'Session Recording', risk:'high', description:'Live chat, heatmaps, and session recordings' },
  { name:'Smartlook',           patterns:['rec.smartlook.com','smartlook.js'],                                              category:'Session Recording', risk:'high', description:'Session recording and product analytics' },
  { name:'Contentsquare',       patterns:['tag.contentsquare.net','contentSquare','cs.js'],                                 category:'Session Recording', risk:'high', description:'Digital experience analytics with session recording' },
  { name:'Inspectlet',          patterns:['www.inspectlet.com','ij_recorder'],                                              category:'Session Recording', risk:'high', description:'Eye-tracking heatmaps and session recordings' },
  { name:'SessionCam',          patterns:['d3ru4eqzqy5ok3.cloudfront.net','sessioncam.js'],                                 category:'Session Recording', risk:'high', description:'Session recording and customer journey analytics' },

  // ── Live Chat & Support ────────────────────────────────
  { name:'Intercom',            patterns:['intercom.io','intercomcdn.com','widget.intercom.io'],                             category:'Live Chat', risk:'medium', description:'Customer messaging platform with live chat and automation' },
  { name:'Zendesk',             patterns:['zendesk.com','zopim.com','ekr.zdassets.com','zEWidget'],                         category:'Live Chat', risk:'medium', description:'Customer support and live chat platform' },
  { name:'Drift',               patterns:['js.driftt.com','drift.js','drift.load'],                                         category:'Live Chat', risk:'medium', description:'Conversational marketing and sales platform' },
  { name:'HubSpot Chat',        patterns:['js.hs-scripts.com','js.hsforms.net','js.hubspot.com'],                          category:'Live Chat', risk:'medium', description:'HubSpot\'s CRM-integrated live chat' },
  { name:'LiveChat',            patterns:['cdn.livechatinc.com','livechat.js','window.__lc'],                               category:'Live Chat', risk:'medium', description:'Live customer support chat widget' },
  { name:'Tawk.to',             patterns:['embed.tawk.to','tawk.js','Tawk_API'],                                            category:'Live Chat', risk:'medium', description:'Free live chat and customer support' },
  { name:'Crisp Chat',          patterns:['client.crisp.chat','crisp.chat','CRISP_WEBSITE_ID'],                             category:'Live Chat', risk:'medium', description:'Business messaging platform with live chat' },
  { name:'Freshchat',           patterns:['wchat.freshchat.com','freshchat.com','fcWidget'],                                category:'Live Chat', risk:'medium', description:'Freshworks\' customer messaging software' },
  { name:'Olark',               patterns:['static.olark.com','olark.js','olark('],                                         category:'Live Chat', risk:'medium', description:'Simple live chat for sales and support' },
  { name:'Tidio',               patterns:['code.tidio.co','tidio.js'],                                                     category:'Live Chat', risk:'medium', description:'Live chat with chatbots and email integration' },
  { name:'LivePerson',          patterns:['lptag.liveperson.net','lpTag','liveperson.js'],                                  category:'Live Chat', risk:'medium', description:'Enterprise conversational AI and live chat' },

  // ── A/B Testing ────────────────────────────────────────
  { name:'Optimizely',          patterns:['cdn.optimizely.com','optimizely.js','window.optimizely'],                        category:'A/B Testing', risk:'medium', description:'Experimentation and feature flag platform' },
  { name:'VWO',                 patterns:['dev.visualwebsiteoptimizer.com','vwo.js','wingify.com'],                         category:'A/B Testing', risk:'medium', description:'Visual Website Optimizer — A/B and multivariate testing' },
  { name:'AB Tasty',            patterns:['try.abtasty.com','abtasty.js'],                                                  category:'A/B Testing', risk:'medium', description:'A/B testing and personalization platform' },
  { name:'Convert.com',         patterns:['cdn-3.convertexperiments.com','convert.js'],                                     category:'A/B Testing', risk:'medium', description:'A/B testing platform for conversion optimization' },
  { name:'Google Optimize',     patterns:['optimize.google.com','googleoptimize'],                                          category:'A/B Testing', risk:'medium', description:'Google\'s now-deprecated A/B testing tool' },

  // ── Marketing / CRM ───────────────────────────────────
  { name:'Mailchimp',           patterns:['chimpstatic.com','list-manage.com','mc.js'],                                     category:'Marketing', risk:'medium', description:'Email marketing platform with audience tracking' },
  { name:'HubSpot',             patterns:['js.hs-analytics.net','js.hsleadflows.net','_hsq'],                               category:'Marketing', risk:'medium', description:'Inbound marketing and CRM platform' },
  { name:'Marketo',             patterns:['munchkin.marketo.net','munchkin.js'],                                            category:'Marketing', risk:'medium', description:'B2B marketing automation with lead tracking' },
  { name:'Pardot',              patterns:['pi.pardot.com','pardot.js'],                                                     category:'Marketing', risk:'medium', description:'Salesforce B2B marketing automation' },
  { name:'ActiveCampaign',      patterns:['trackcmp.net','activecampaign.js'],                                              category:'Marketing', risk:'medium', description:'Customer experience automation and email marketing' },
  { name:'Klaviyo',             patterns:['static.klaviyo.com','klaviyo.js','_learnq'],                                     category:'Marketing', risk:'medium', description:'E-commerce email and SMS marketing' },
  { name:'Braze',               patterns:['js.appboycdn.com','braze.js','Appboy'],                                          category:'Marketing', risk:'medium', description:'Customer engagement platform with multi-channel messaging' },
  { name:'Drip',                patterns:['drip.com/tracker','_dcq','dc.js'],                                               category:'Marketing', risk:'medium', description:'E-commerce CRM and email marketing' },

  // ── Error & Performance ────────────────────────────────
  { name:'Sentry',              patterns:['browser.sentry-cdn.com','sentry.io','Sentry.init','raven.js'],                   category:'Error Tracking', risk:'low', description:'Error tracking and performance monitoring (open-source available)' },
  { name:'New Relic',           patterns:['js-agent.newrelic.com','nr-data.net','newrelic.js','NREUM'],                     category:'Error Tracking', risk:'low', description:'Full-stack observability and performance monitoring' },
  { name:'Bugsnag',             patterns:['app.bugsnag.com','bugsnag.js','Bugsnag.start'],                                  category:'Error Tracking', risk:'low', description:'Error monitoring and stability management' },
  { name:'Rollbar',             patterns:['cdnjs.rollbar.com','rollbar.js','Rollbar.init'],                                 category:'Error Tracking', risk:'low', description:'Error tracking and debugging platform' },
  { name:'Datadog RUM',         patterns:['browser-intake-datadoghq.com','datadog-rum.js','DD_RUM'],                        category:'Error Tracking', risk:'low', description:'Real user monitoring and log management' },
  { name:'Raygun',              patterns:['cdn.raygun.io','raygun.js','rg4js'],                                             category:'Error Tracking', risk:'low', description:'Error tracking and crash reporting' },

  // ── Social Widgets ─────────────────────────────────────
  { name:'Disqus',              patterns:['disqus.com/embed','disquscdn.com','disqus_config'],                              category:'Social', risk:'medium', description:'Third-party commenting system with extensive tracking' },
  { name:'AddThis',             patterns:['s7.addthis.com','addthis.com','addthis_widget'],                                 category:'Social', risk:'medium', description:'Social sharing buttons with cross-site tracking' },
  { name:'ShareThis',           patterns:['w.sharethis.com','sharethis.com','stLight'],                                     category:'Social', risk:'medium', description:'Social sharing widget with user tracking' },
  { name:'Facebook Widget',     patterns:['connect.facebook.net/en_US/sdk','fb-root','FB.init','like.php'],                 category:'Social', risk:'high',   description:'Facebook\'s Like/Share buttons tracking non-Facebook users' },
  { name:'Twitter / X Widget',  patterns:['platform.twitter.com/widgets','twitter-widget','twitterFetcher'],               category:'Social', risk:'medium', description:'Twitter/X embedded timeline and share buttons' },
  { name:'YouTube Embed',       patterns:['youtube.com/embed','youtube-nocookie.com/embed','ytimg.com'],                   category:'Social', risk:'medium', description:'YouTube embedded videos — uses tracking cookies by default' },
  { name:'Vimeo Embed',         patterns:['player.vimeo.com','vimeocdn.com'],                                              category:'Social', risk:'low',    description:'Vimeo video player embed' },

  // ── Consent Management ─────────────────────────────────
  { name:'OneTrust',            patterns:['cdn.cookielaw.org','optanon','onetrust.com','CookieConsent'],                    category:'Consent', risk:'low', description:'Cookie consent and privacy compliance platform' },
  { name:'Cookiebot',           patterns:['consent.cookiebot.com','cookiebot.js','CookiebotCallback'],                     category:'Consent', risk:'low', description:'GDPR/CCPA cookie consent solution' },
  { name:'CookieYes',           patterns:['cdn-cookieyes.com','cookieyes.js'],                                             category:'Consent', risk:'low', description:'Cookie consent management solution' },
  { name:'Termly',              patterns:['app.termly.io','termly.js'],                                                    category:'Consent', risk:'low', description:'Privacy compliance with cookie consent banner' },
  { name:'Osano',               patterns:['cmp.osano.com','osano.js'],                                                     category:'Consent', risk:'low', description:'Data privacy and cookie consent software' },
  { name:'TrustArc',            patterns:['consent.trustarc.com','truste.com','trustarc.js'],                              category:'Consent', risk:'low', description:'Privacy compliance and consent management' },

  // ── CDN / Infrastructure ───────────────────────────────
  { name:'Google Fonts',        patterns:['fonts.googleapis.com','fonts.gstatic.com'],                                     category:'CDN', risk:'low', description:'Google\'s web font delivery — sends IP to Google servers' },
  { name:'Cloudflare Insights', patterns:['static.cloudflareinsights.com','cf-beacon','cloudflare-insights'],              category:'CDN', risk:'low', description:'Cloudflare\'s web analytics beacon' },
  { name:'jsDelivr CDN',        patterns:['cdn.jsdelivr.net'],                                                             category:'CDN', risk:'low', description:'Open-source CDN for npm and GitHub packages' },
  { name:'unpkg CDN',           patterns:['unpkg.com'],                                                                    category:'CDN', risk:'low', description:'CDN for npm packages' },
  { name:'cdnjs',               patterns:['cdnjs.cloudflare.com'],                                                         category:'CDN', risk:'low', description:'Cloudflare\'s open-source JavaScript CDN' },
  { name:'Stripe.js',           patterns:['js.stripe.com','stripe.js'],                                                    category:'Payment', risk:'low', description:'Payment processing library — collects financial fraud signals' },
  { name:'PayPal SDK',          patterns:['www.paypal.com/sdk/js','paypal.js'],                                            category:'Payment', risk:'low', description:'PayPal\'s checkout and payment SDK' },
  { name:'Recaptcha',           patterns:['www.google.com/recaptcha','recaptcha/api.js','grecaptcha'],                     category:'Security', risk:'low', description:'Google\'s bot protection — shares signals with Google' },
  { name:'hCaptcha',            patterns:['hcaptcha.com/1/api.js','h-captcha'],                                            category:'Security', risk:'low', description:'Privacy-focused captcha alternative to reCAPTCHA' },
];

// ============================================================
// CORS PROXIES
// ============================================================
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
];

// ============================================================
// QUICK TEST URLs
// ============================================================
const QUICK_TESTS = [
  { name: 'Wikipedia',     url: 'https://en.wikipedia.org', tag: 'Good' },
  { name: 'Example.com',   url: 'https://example.com',      tag: 'Excellent' },
  { name: 'DuckDuckGo',    url: 'https://duckduckgo.com',   tag: 'Good' },
  { name: 'Privacy Guides',url: 'https://privacyguides.org',tag: 'Very Good' },
];

// ============================================================
// SCORE RING COMPONENT
// ============================================================
function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <svg width="140" height="140" className="rotate-[-90deg]" aria-hidden="true">
      <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
      <circle
        cx="70" cy="70" r={radius}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  );
}

// ============================================================
// MINI SCORE DOT
// ============================================================
function ScoreDot({ score }: { score: number }) {
  const bg = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${bg} flex-shrink-0`} />;
}

// ============================================================
// RISK BADGE
// ============================================================
function RiskBadge({ risk }: { risk: 'high' | 'medium' | 'low' }) {
  const cls = risk === 'high' ? 'badge-high' : risk === 'medium' ? 'badge-medium' : 'badge-low';
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${cls}`}>
      {risk}
    </span>
  );
}

// ============================================================
// CATEGORY ICON
// ============================================================
function CategoryIcon({ category }: { category: string }) {
  const icons: Record<string, string> = {
    'Analytics': '📊', 'Advertising': '📡', 'Session Recording': '🎥',
    'Live Chat': '💬', 'A/B Testing': '🔀', 'Marketing': '📧',
    'Error Tracking': '🐛', 'Social': '🔗', 'Consent': '✅',
    'CDN': '🖥️', 'Payment': '💳', 'Security': '🔒',
  };
  return <span className="text-xs">{icons[category] ?? '🔍'}</span>;
}

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [url, setUrl] = useState('');
  const [htmlInput, setHtmlInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStage, setScanStage] = useState('');
  const [activeTab, setActiveTab] = useState<'url' | 'html'>('url');
  const [showInfo, setShowInfo] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedTracker, setExpandedTracker] = useState<string | null>(null);
  const [trackerFilter, setTrackerFilter] = useState<string>('all');
  const [showAllDomains, setShowAllDomains] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const urlInputRef = useRef<HTMLInputElement>(null);

  // ── Load from localStorage ────────────────────────────
  useEffect(() => {
    try {
      const h = localStorage.getItem('ps_history');
      if (h) setHistory(JSON.parse(h));
      const t = localStorage.getItem('ps_theme');
      if (t) setDarkMode(t === 'dark');
      const c = localStorage.getItem('ps_count');
      if (c) setScanCount(parseInt(c, 10));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    localStorage.setItem('ps_theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // ── URL Validation ────────────────────────────────────
  const normalizeUrl = (input: string): string | null => {
    if (!input.trim()) return null;
    let u = input.trim();
    if (!u.startsWith('http://') && !u.startsWith('https://')) u = 'https://' + u;
    try {
      const p = new URL(u);
      if (p.hostname.includes('.')) return u;
    } catch { /* fall */ }
    return null;
  };

  // ── HTML Analyzer ─────────────────────────────────────
  const analyzeHtml = useCallback((html: string, targetUrl: string, duration = 0): ScanResult => {
    const t0 = performance.now();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const lower = html.toLowerCase();

    // Detect trackers
    const detectedTrackers: TrackerDetail[] = [];
    TRACKER_DB.forEach(t => {
      if (t.patterns.some(p => lower.includes(p.toLowerCase()))) {
        detectedTrackers.push({ name: t.name, category: t.category, risk: t.risk, description: t.description });
      }
    });

    // Third-party domains
    let targetHost = '';
    try { targetHost = new URL(targetUrl).hostname; } catch { /* ok */ }

    const thirdPartySet = new Set<string>();
    let imagesFromThirdParty = 0;

    const checkSrc = (src: string | null, isImage = false) => {
      if (!src) return;
      const s = src.startsWith('//') ? 'https:' + src : src;
      if (!s.startsWith('http')) return;
      try {
        const h = new URL(s).hostname;
        if (h !== targetHost && !h.endsWith('.' + targetHost)) {
          thirdPartySet.add(h);
          if (isImage) imagesFromThirdParty++;
        }
      } catch { /* ok */ }
    };

    doc.querySelectorAll('script[src]').forEach(el => checkSrc(el.getAttribute('src')));
    doc.querySelectorAll('link[href]').forEach(el => checkSrc(el.getAttribute('href')));
    doc.querySelectorAll('iframe[src]').forEach(el => checkSrc(el.getAttribute('src')));
    doc.querySelectorAll('img[src]').forEach(el => checkSrc(el.getAttribute('src'), true));

    // Counts
    const allScripts   = doc.querySelectorAll('script');
    const extScripts   = doc.querySelectorAll('script[src]');
    const inlineScript = doc.querySelectorAll('script:not([src])');
    const iframes      = doc.querySelectorAll('iframe');
    const forms        = doc.querySelectorAll('form');
    const passwords    = doc.querySelectorAll('input[type="password"]');

    // Storage / cookie patterns
    const cookiesDetected     = ['document.cookie','set-cookie','cookieconsent','cookiepolicy','cookie-banner','gdpr','cookie_consent'].some(p => lower.includes(p));
    const localStorageUsed    = lower.includes('localstorage');
    const sessionStorageUsed  = lower.includes('sessionstorage');

    // Meta tags
    const metaTags: { name: string; content: string }[] = [];
    doc.querySelectorAll('meta').forEach(m => {
      const name = m.getAttribute('name') || m.getAttribute('property') || '';
      const content = m.getAttribute('content') || '';
      if (name && content) metaTags.push({ name, content });
    });

    // Security features
    const hasCSP              = lower.includes('content-security-policy') || metaTags.some(m => m.name.toLowerCase().includes('csp'));
    const hasReferrerPolicy   = lower.includes('referrer-policy') || metaTags.some(m => m.name.toLowerCase().includes('referrer'));
    const hasDoNotTrack       = lower.includes('donottrack') || lower.includes('do-not-track') || navigator.doNotTrack === '1';
    const hasXFrameOptions    = lower.includes('x-frame-options') || lower.includes('frame-ancestors');
    const hasPermissionsPolicy= lower.includes('permissions-policy') || lower.includes('feature-policy');

    // Score
    const highTrackers   = detectedTrackers.filter(t => t.risk === 'high').length;
    const medTrackers    = detectedTrackers.filter(t => t.risk === 'medium').length;
    const lowTrackers    = detectedTrackers.filter(t => t.risk === 'low').length;

    let score = 100;
    score -= highTrackers * 12;
    score -= medTrackers  * 6;
    score -= lowTrackers  * 2;
    score -= Math.min(thirdPartySet.size * 2, 20);
    if (cookiesDetected)    score -= 5;
    if (localStorageUsed)   score -= 3;
    if (sessionStorageUsed) score -= 2;
    if (hasCSP)             score += 5;
    if (hasReferrerPolicy)  score += 3;
    if (hasPermissionsPolicy) score += 2;
    if (hasXFrameOptions)   score += 1;

    score = Math.max(0, Math.min(100, score));

    const elapsed = duration || Math.round(performance.now() - t0);

    return {
      url: targetUrl,
      score,
      trackers: detectedTrackers,
      thirdPartyDomains: Array.from(thirdPartySet),
      cookiesDetected,
      localStorageUsed,
      sessionStorageUsed,
      timestamp: Date.now(),
      httpsUsed: targetUrl.startsWith('https'),
      scriptsCount: allScripts.length,
      iframesCount: iframes.length,
      externalLinks: thirdPartySet.size,
      metaTags: metaTags.slice(0, 25),
      inlineScriptsCount: inlineScript.length,
      externalScriptsCount: extScripts.length,
      imagesFromThirdParty,
      hasCSP,
      hasReferrerPolicy,
      hasDoNotTrack,
      hasXFrameOptions,
      hasPermissionsPolicy,
      formCount: forms.length,
      passwordFields: passwords.length,
      scanDuration: elapsed,
      htmlSize: Math.round(html.length / 1024),
    };
  }, []);

  // ── Save history ──────────────────────────────────────
  const saveToHistory = (r: ScanResult) => {
    const entry: HistoryEntry = { url: r.url, score: r.score, trackerCount: r.trackers.length, timestamp: r.timestamp };
    const updated = [entry, ...history.filter(h => h.url !== r.url)].slice(0, 20);
    setHistory(updated);
    try { localStorage.setItem('ps_history', JSON.stringify(updated)); } catch { /* ok */ }
    const newCount = scanCount + 1;
    setScanCount(newCount);
    try { localStorage.setItem('ps_count', String(newCount)); } catch { /* ok */ }
  };

  // ── Scan via URL ──────────────────────────────────────
  const scanWebsite = async () => {
    const normalized = normalizeUrl(url);
    if (!normalized) { setError('Please enter a valid website URL (e.g., https://example.com)'); return; }

    setError('');
    setResult(null);
    setIsScanning(true);
    setScanProgress(5);
    setScanStage('Initializing…');
    setExpandedTracker(null);
    setShowAllDomains(false);
    setTrackerFilter('all');

    const t0 = performance.now();
    let html = '';
    let success = false;

    for (let i = 0; i < CORS_PROXIES.length && !success; i++) {
      try {
        setScanStage(`Fetching via proxy ${i + 1}/${CORS_PROXIES.length}…`);
        setScanProgress(10 + i * 15);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        const resp = await fetch(CORS_PROXIES[i] + encodeURIComponent(normalized), {
          headers: { Accept: 'text/html,*/*' },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (resp.ok) {
          const text = await resp.text();
          if (text && text.length > 200) { html = text; success = true; }
        }
      } catch { /* try next */ }
    }

    if (!success) {
      setError(
        'यह website external scanning को block करती है (CORS policy). यह सामान्य है — कई websites security के लिए third-party requests को block करती हैं।\n\n' +
        '✅ Solution: "Paste HTML" tab use करें — website पर जाएं, Ctrl+U से source खोलें, सब copy करें और paste करें।'
      );
      setIsScanning(false);
      setScanProgress(0);
      return;
    }

    setScanStage('Analyzing trackers…');
    setScanProgress(70);
    await new Promise(r => setTimeout(r, 300));

    setScanStage('Calculating privacy score…');
    setScanProgress(90);
    await new Promise(r => setTimeout(r, 200));

    const duration = Math.round(performance.now() - t0);
    const scanResult = analyzeHtml(html, normalized, duration);

    setResult(scanResult);
    saveToHistory(scanResult);
    setScanProgress(100);
    setScanStage('Scan complete!');
    setTimeout(() => { setIsScanning(false); setScanProgress(0); setScanStage(''); }, 600);
  };

  // ── Scan pasted HTML ──────────────────────────────────
  const scanPastedHtml = async () => {
    if (!htmlInput.trim()) { setError('Please paste some HTML source code first.'); return; }

    setError('');
    setResult(null);
    setIsScanning(true);
    setScanProgress(20);
    setScanStage('Parsing HTML…');
    setExpandedTracker(null);
    setShowAllDomains(false);
    setTrackerFilter('all');
    await new Promise(r => setTimeout(r, 200));

    setScanProgress(60);
    setScanStage('Detecting trackers…');
    await new Promise(r => setTimeout(r, 200));

    const targetUrl = normalizeUrl(url) || 'https://pasted-content.local';
    const scanResult = analyzeHtml(htmlInput, targetUrl);

    setScanProgress(100);
    setScanStage('Analysis complete!');
    setResult(scanResult);
    saveToHistory(scanResult);
    setTimeout(() => { setIsScanning(false); setScanProgress(0); setScanStage(''); }, 500);
  };

  // ── Quick URL test ────────────────────────────────────
  const runQuickTest = (testUrl: string) => {
    setUrl(testUrl);
    setActiveTab('url');
    setTimeout(async () => {
      const normalized = normalizeUrl(testUrl);
      if (!normalized) return;
      setError('');
      setResult(null);
      setIsScanning(true);
      setScanProgress(5);
      setScanStage('Initializing…');
      setExpandedTracker(null);

      const t0 = performance.now();
      let html = '';
      let success = false;

      for (let i = 0; i < CORS_PROXIES.length && !success; i++) {
        try {
          setScanStage(`Fetching via proxy ${i + 1}/${CORS_PROXIES.length}…`);
          setScanProgress(10 + i * 15);
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 12000);
          const resp = await fetch(CORS_PROXIES[i] + encodeURIComponent(normalized), {
            headers: { Accept: 'text/html,*/*' },
            signal: controller.signal,
          });
          clearTimeout(timeout);
          if (resp.ok) {
            const text = await resp.text();
            if (text && text.length > 200) { html = text; success = true; }
          }
        } catch { /* try next */ }
      }

      if (!success) {
        setError('CORS block — please use Paste HTML tab for this site.');
        setIsScanning(false);
        setScanProgress(0);
        return;
      }

      setScanProgress(85);
      setScanStage('Calculating score…');
      await new Promise(r => setTimeout(r, 200));

      const duration = Math.round(performance.now() - t0);
      const scanResult = analyzeHtml(html, normalized, duration);
      setResult(scanResult);
      saveToHistory(scanResult);
      setScanProgress(100);
      setScanStage('Done!');
      setTimeout(() => { setIsScanning(false); setScanProgress(0); setScanStage(''); }, 500);
    }, 100);
  };

  // ── Clipboard paste ───────────────────────────────────
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setHtmlInput(text);
    } catch {
      setError('Clipboard access denied. Please paste manually (Ctrl+V).');
    }
  };

  // ── Clear history ─────────────────────────────────────
  const clearHistory = () => {
    setHistory([]);
    try { localStorage.removeItem('ps_history'); } catch { /* ok */ }
  };

  // ── Export JSON ───────────────────────────────────────
  const exportResults = () => {
    if (!result) return;
    const data = {
      tool: 'PrivacyScore by @PrivMITLab',
      version: '3.0',
      scanDate: new Date(result.timestamp).toISOString(),
      url: result.url,
      privacyScore: result.score,
      scoreLabel: getScoreLabel(result.score),
      trackers: result.trackers,
      thirdPartyDomains: result.thirdPartyDomains,
      storage: { cookies: result.cookiesDetected, localStorage: result.localStorageUsed, sessionStorage: result.sessionStorageUsed },
      security: { https: result.httpsUsed, csp: result.hasCSP, referrerPolicy: result.hasReferrerPolicy, xFrameOptions: result.hasXFrameOptions, permissionsPolicy: result.hasPermissionsPolicy, doNotTrack: result.hasDoNotTrack },
      metrics: { scripts: result.scriptsCount, inlineScripts: result.inlineScriptsCount, externalScripts: result.externalScriptsCount, iframes: result.iframesCount, thirdPartyImages: result.imagesFromThirdParty, forms: result.formCount },
      scanDurationMs: result.scanDuration,
      htmlSizeKB: result.htmlSize,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `privacyscore-${result.url.replace(/https?:\/\//, '').replace(/\//g, '-')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ── Share ─────────────────────────────────────────────
  const shareResults = async () => {
    if (!result) return;
    const text = `🛡️ PrivacyScore: ${result.score}/100 (${getScoreLabel(result.score)})\n\n🌐 Website: ${result.url}\n🔍 Trackers: ${result.trackers.length}\n📡 3rd-party domains: ${result.thirdPartyDomains.length}\n🍪 Cookies: ${result.cookiesDetected ? 'Yes' : 'No'}\n🔒 HTTPS: ${result.httpsUsed ? 'Yes' : 'No'}\n\nScanned with PrivacyScore by @PrivMITLab`;
    if (navigator.share) {
      try { await navigator.share({ title: 'PrivacyScore Result', text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // ── Load from history ─────────────────────────────────
  const loadFromHistory = (entry: HistoryEntry) => {
    setUrl(entry.url);
    setShowHistory(false);
  };

  // ── Score helpers ─────────────────────────────────────
  const getScoreColor = (s: number) => s >= 80 ? 'text-emerald-400' : s >= 50 ? 'text-amber-400' : 'text-red-400';
  const getScoreBg   = (s: number) => s >= 80 ? 'bg-emerald-500' : s >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const getScoreLabel = (s: number) => {
    if (s >= 90) return 'Excellent';
    if (s >= 80) return 'Very Good';
    if (s >= 70) return 'Good';
    if (s >= 60) return 'Fair';
    if (s >= 50) return 'Moderate';
    if (s >= 30) return 'Poor';
    return 'Very Poor';
  };
  const getScoreEmoji = (s: number) => {
    if (s >= 90) return '🛡️';
    if (s >= 80) return '✅';
    if (s >= 70) return '👍';
    if (s >= 50) return '⚠️';
    return '🚨';
  };

  // ── Tracker categories for filter ────────────────────
  const trackerCategories = result
    ? ['all', ...Array.from(new Set(result.trackers.map(t => t.category)))]
    : ['all'];

  const filteredTrackers = result?.trackers.filter(t =>
    trackerFilter === 'all' || t.category === trackerFilter
  ) ?? [];

  // ── Visible domains ───────────────────────────────────
  const visibleDomains = result
    ? showAllDomains ? result.thirdPartyDomains : result.thirdPartyDomains.slice(0, 12)
    : [];

  // ── Theme classes ─────────────────────────────────────
  const bg     = darkMode ? 'bg-slate-950'  : 'bg-slate-50';
  const card   = darkMode ? 'bg-slate-900 border-slate-800'     : 'bg-white border-slate-200';
  const cardSub= darkMode ? 'bg-slate-800/60 border-slate-700'  : 'bg-slate-50 border-slate-200';
  const text   = darkMode ? 'text-white'    : 'text-slate-900';
  const muted  = darkMode ? 'text-slate-400': 'text-slate-500';
  const inputCls = darkMode
    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-violet-500'
    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-violet-500';

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className={`min-h-screen ${bg} transition-colors duration-300`}>

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-50 glass ${darkMode ? 'glass-dark border-b border-slate-800/80' : 'glass-light border-b border-slate-200/80'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">

            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0 animate-pulse-ring">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className={`font-bold text-base sm:text-lg ${text}`}>PrivacyScore</span>
                <span className={`hidden sm:inline text-xs ml-1.5 ${muted}`}>by @PrivMITLab</span>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-1">
              {/* Scan count badge */}
              {scanCount > 0 && (
                <div className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${darkMode ? 'bg-violet-900/30 text-violet-300 border border-violet-700/40' : 'bg-violet-50 text-violet-700 border border-violet-200'}`}>
                  <Award className="h-3 w-3" />
                  <span>{scanCount} scans</span>
                </div>
              )}
              <button onClick={() => setShowInfo(v => !v)} title="How to use"
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
                <Info className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </button>
              <button onClick={() => setShowHistory(v => !v)} title="Scan History"
                className={`p-2 rounded-lg transition-colors relative ${darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
                <History className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                {history.length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-violet-500" />
                )}
              </button>
              <button onClick={() => setDarkMode(v => !v)} title={darkMode ? 'Light Mode' : 'Dark Mode'}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-800 text-amber-400' : 'hover:bg-slate-100 text-slate-600'}`}>
                {darkMode ? <Sun className="h-4.5 w-4.5 sm:h-5 sm:w-5" /> : <Moon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">

        {/* ── HERO ───────────────────────────────────────────────── */}
        <div className="text-center space-y-3 sm:space-y-4">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm border ${darkMode ? 'bg-violet-900/20 border-violet-700/40 text-violet-300' : 'bg-violet-50 border-violet-200 text-violet-700'}`}>
            <Lock className="h-3.5 w-3.5" />
            100% Client-Side &nbsp;•&nbsp; No Data Collection &nbsp;•&nbsp; Open Source &nbsp;•&nbsp; Zero-Knowledge
          </div>
          <h1 className={`text-3xl sm:text-5xl font-bold leading-tight ${text}`}>
            Website{' '}
            <span className="gradient-text">Privacy</span>
            {' '}Scanner
          </h1>
          <p className={`text-sm sm:text-lg max-w-xl mx-auto ${muted}`}>
            Detect trackers, cookies & third-party scripts instantly.
            100% free, open source, and runs entirely in your browser.
          </p>
        </div>

        {/* ── INFO PANEL ─────────────────────────────────────────── */}
        {showInfo && (
          <div className={`rounded-2xl border p-5 animate-fade-in ${darkMode ? 'bg-blue-950/30 border-blue-800/50' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex gap-3">
              <Info className={`h-5 w-5 flex-shrink-0 mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <div className="flex-1">
                <h3 className={`font-semibold mb-3 ${text}`}>How to Use PrivacyScore</h3>
                <div className={`text-sm space-y-2 ${muted}`}>
                  <div className="flex gap-2"><ArrowRight className="h-4 w-4 flex-shrink-0 mt-0.5 text-violet-400" /><p><strong className={text}>URL Scan:</strong> Paste any website URL → click "Scan Website". Works for most sites.</p></div>
                  <div className="flex gap-2"><ArrowRight className="h-4 w-4 flex-shrink-0 mt-0.5 text-violet-400" /><p><strong className={text}>Paste HTML (CORS blocked):</strong> Open the site → Right-click → "View Page Source" (Ctrl+U) → Ctrl+A → Ctrl+C → paste in "Paste HTML" tab → Analyze.</p></div>
                  <div className="flex gap-2"><ArrowRight className="h-4 w-4 flex-shrink-0 mt-0.5 text-violet-400" /><p><strong className={text}>Quick Test:</strong> Click any pre-loaded URL below to scan instantly.</p></div>
                  <div className="flex gap-2"><ArrowRight className="h-4 w-4 flex-shrink-0 mt-0.5 text-violet-400" /><p><strong className={text}>Export:</strong> Download full scan report as JSON. Share your results with one click.</p></div>
                </div>
                <button onClick={() => setShowInfo(false)}
                  className={`mt-4 text-xs px-3 py-1.5 rounded-lg transition-colors ${darkMode ? 'bg-blue-800/60 text-blue-200 hover:bg-blue-700/60' : 'bg-blue-200 text-blue-800 hover:bg-blue-300'}`}>
                  Got it ✓
                </button>
              </div>
              <button onClick={() => setShowInfo(false)} className={`p-1 rounded ${muted} hover:text-white`}><X className="h-4 w-4" /></button>
            </div>
          </div>
        )}

        {/* ── MAIN SCANNER CARD ──────────────────────────────────── */}
        <div className={`rounded-2xl border shadow-xl p-5 sm:p-8 ${card}`}>

          {/* Tab switcher */}
          <div className={`flex rounded-xl p-1 mb-6 gap-1 ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
            {(['url', 'html'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-md'
                    : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}>
                {tab === 'url' ? <><Globe className="h-4 w-4" /> Scan URL</> : <><FileText className="h-4 w-4" /> Paste HTML</>}
              </button>
            ))}
          </div>

          {/* URL Tab */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <label className={`block text-sm font-medium ${muted}`}>Website URL</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Globe className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${muted}`} />
                  <input
                    ref={urlInputRef}
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !isScanning && scanWebsite()}
                    placeholder="https://example.com"
                    disabled={isScanning}
                    autoComplete="off"
                    spellCheck={false}
                    className={`w-full pl-12 pr-4 py-3.5 rounded-xl border-2 transition-all text-sm input-focus disabled:opacity-50 ${inputCls}`}
                  />
                </div>
                <button onClick={scanWebsite} disabled={isScanning}
                  className="px-6 py-3.5 bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-violet-500/25 hover:scale-105 active:scale-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm whitespace-nowrap">
                  {isScanning
                    ? <><RefreshCw className="h-4 w-4 animate-spin" /> Scanning…</>
                    : <><Search className="h-4 w-4" /> Scan Website</>}
                </button>
              </div>

              {/* Quick Tests */}
              <div>
                <p className={`text-xs mb-2 ${muted}`}>⚡ Quick test:</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_TESTS.map(t => (
                    <button key={t.url} onClick={() => runQuickTest(t.url)} disabled={isScanning}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${darkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white hover:border-violet-600' : 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-violet-400'}`}>
                      {t.name}
                      <span className={`ml-1.5 text-[10px] ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>{t.tag}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Paste HTML Tab */}
          {activeTab === 'html' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className={`text-sm font-medium ${muted}`}>Paste HTML Source Code</label>
                <button onClick={pasteFromClipboard}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${darkMode ? 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  <Clipboard className="h-3.5 w-3.5" /> Paste from Clipboard
                </button>
              </div>
              <textarea
                value={htmlInput}
                onChange={e => setHtmlInput(e.target.value)}
                placeholder={"Paste the website's full HTML source here…\n\nHow to get it:\n1. Open the website in your browser\n2. Press Ctrl+U (or Cmd+U on Mac) to view source\n3. Press Ctrl+A to select all\n4. Press Ctrl+C to copy\n5. Click \"Paste from Clipboard\" above or Ctrl+V here"}
                rows={9}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all text-sm font-mono input-focus resize-none ${inputCls}`}
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Globe className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${muted}`} />
                  <input type="url" value={url} onChange={e => setUrl(e.target.value)}
                    placeholder="Optional: website URL for reference (e.g., https://example.com)"
                    className={`w-full pl-11 pr-4 py-3 rounded-xl border-2 transition-all text-sm input-focus ${inputCls}`} />
                </div>
                <button onClick={scanPastedHtml} disabled={isScanning || !htmlInput.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:scale-105 active:scale-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm whitespace-nowrap">
                  {isScanning ? <><RefreshCw className="h-4 w-4 animate-spin" /> Analyzing…</> : <><Zap className="h-4 w-4" /> Analyze HTML</>}
                </button>
              </div>
              {htmlInput && (
                <p className={`text-xs ${muted}`}>📄 {Math.round(htmlInput.length / 1024)} KB pasted · ready to analyze</p>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {isScanning && (
            <div className="mt-5 space-y-1.5 animate-fade-in">
              <div className="flex justify-between text-xs">
                <span className={muted}>{scanStage}</span>
                <span className={muted}>{scanProgress}%</span>
              </div>
              <div className={`h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 progress-bar rounded-full"
                  style={{ width: `${scanProgress}%` }} />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !isScanning && (
            <div className={`mt-5 p-4 rounded-xl border flex gap-3 animate-fade-in ${darkMode ? 'bg-red-950/30 border-red-800/50 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm whitespace-pre-line">{error}</p>
                {error.includes('CORS') && (
                  <button onClick={() => { setActiveTab('html'); setError(''); }}
                    className={`mt-2.5 text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 ${darkMode ? 'bg-red-900/50 text-red-200 hover:bg-red-800/50' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}>
                    <FileText className="h-3.5 w-3.5" /> Switch to Paste HTML tab →
                  </button>
                )}
              </div>
              <button onClick={() => setError('')} className={`${muted} hover:text-white`}><X className="h-4 w-4" /></button>
            </div>
          )}

          {/* ── RESULTS ──────────────────────────────────────────── */}
          {result && !isScanning && (
            <div className="mt-6 space-y-5 animate-fade-in">

              {/* Score Display */}
              <div className={`rounded-xl border p-5 sm:p-6 ${cardSub}`}>
                <div className="flex flex-col sm:flex-row items-center gap-5">

                  {/* Score Ring */}
                  <div className="relative flex-shrink-0">
                    <ScoreRing score={result.score} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-3xl font-bold score-number ${getScoreColor(result.score)}`}>{result.score}</span>
                      <span className={`text-xs ${muted}`}>/100</span>
                    </div>
                  </div>

                  {/* Score Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                      <span className="text-2xl">{getScoreEmoji(result.score)}</span>
                      <span className={`text-xl font-bold ${getScoreColor(result.score)}`}>{getScoreLabel(result.score)} Privacy</span>
                    </div>
                    <p className={`text-sm ${muted} mb-3`}>
                      Scanned <strong className={text}>{result.url.replace(/https?:\/\//, '')}</strong> in {result.scanDuration}ms &nbsp;·&nbsp; {result.htmlSize} KB HTML
                    </p>

                    {/* Score bar */}
                    <div className={`h-2 rounded-full overflow-hidden mb-4 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                      <div className={`h-full rounded-full ${getScoreBg(result.score)} transition-all duration-1000`}
                        style={{ width: `${result.score}%` }} />
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      <button onClick={exportResults}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-sm transition-colors ${darkMode ? 'border-slate-600 hover:bg-slate-700 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'}`}>
                        <Download className="h-4 w-4" /> Export JSON
                      </button>
                      <button onClick={shareResults}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-sm transition-colors ${darkMode ? 'border-slate-600 hover:bg-slate-700 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'}`}>
                        {copied ? <><Copy className="h-4 w-4 text-emerald-400" /><span className="text-emerald-400">Copied!</span></> : <><Share2 className="h-4 w-4" /> Share</>}
                      </button>
                      <button onClick={() => { setResult(null); setUrl(''); setHtmlInput(''); urlInputRef.current?.focus(); }}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-sm transition-colors ${darkMode ? 'border-slate-600 hover:bg-slate-700 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'}`}>
                        <RefreshCw className="h-4 w-4" /> New Scan
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: <Eye />, label: 'Trackers', value: result.trackers.length, color: result.trackers.length > 0 ? 'text-red-400' : 'text-emerald-400' },
                  { icon: <Globe />, label: '3rd-Party', value: result.thirdPartyDomains.length, color: result.thirdPartyDomains.length > 5 ? 'text-amber-400' : 'text-emerald-400' },
                  { icon: <Cookie />, label: 'Cookies', value: result.cookiesDetected ? 'Yes' : 'No', color: result.cookiesDetected ? 'text-amber-400' : 'text-emerald-400' },
                  { icon: <Lock />, label: 'HTTPS', value: result.httpsUsed ? 'Yes' : 'No', color: result.httpsUsed ? 'text-emerald-400' : 'text-red-400' },
                ].map(({ icon, label, value, color }) => (
                  <div key={label} className={`p-4 rounded-xl border ${cardSub}`}>
                    <div className={`flex items-center gap-2 mb-2 ${muted}`}>
                      <span className={`h-4 w-4 ${color}`}>{icon}</span>
                      <span className="text-xs">{label}</span>
                    </div>
                    <div className={`text-xl font-bold ${color}`}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Security Features */}
              <div className={`p-5 rounded-xl border ${cardSub}`}>
                <h3 className={`font-semibold mb-4 flex items-center gap-2 ${text}`}>
                  <Shield className="h-5 w-5 text-violet-400" /> Security Headers
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Content Security Policy', ok: result.hasCSP, tip: 'Prevents XSS attacks' },
                    { label: 'Referrer Policy', ok: result.hasReferrerPolicy, tip: 'Controls referrer info shared' },
                    { label: 'X-Frame-Options', ok: result.hasXFrameOptions, tip: 'Prevents clickjacking' },
                    { label: 'Permissions Policy', ok: result.hasPermissionsPolicy, tip: 'Controls browser features' },
                    { label: 'Do Not Track', ok: result.hasDoNotTrack, tip: 'Respects DNT header' },
                    { label: 'HTTPS Enabled', ok: result.httpsUsed, tip: 'Encrypted connection' },
                  ].map(({ label, ok, tip }) => (
                    <div key={label} className={`flex items-start gap-2.5 p-3 rounded-lg ${darkMode ? 'bg-slate-900/50' : 'bg-white'}`}>
                      {ok
                        ? <CheckCircle className="h-4.5 w-4.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        : <XCircle className="h-4.5 w-4.5 text-red-500 flex-shrink-0 mt-0.5" />}
                      <div>
                        <p className={`text-sm font-medium ${text}`}>{label}</p>
                        <p className={`text-xs ${muted}`}>{tip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Storage Detection */}
              <div className={`p-5 rounded-xl border ${cardSub}`}>
                <h3 className={`font-semibold mb-4 flex items-center gap-2 ${text}`}>
                  <Database className="h-5 w-5 text-amber-400" /> Storage & Cookie Usage
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Cookies', ok: result.cookiesDetected, desc: 'document.cookie detected' },
                    { label: 'localStorage', ok: result.localStorageUsed, desc: 'localStorage usage found' },
                    { label: 'sessionStorage', ok: result.sessionStorageUsed, desc: 'sessionStorage usage found' },
                  ].map(({ label, ok, desc }) => (
                    <div key={label} className={`p-3 rounded-lg text-center ${darkMode ? 'bg-slate-900/50' : 'bg-white'}`}>
                      <div className={`text-2xl mb-1 ${ok ? 'text-amber-400' : 'text-emerald-400'}`}>{ok ? '⚠️' : '✅'}</div>
                      <p className={`text-xs font-medium ${text}`}>{label}</p>
                      <p className={`text-[10px] ${muted}`}>{ok ? desc : 'Not detected'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trackers */}
              {result.trackers.length > 0 ? (
                <div className={`p-5 rounded-xl border ${cardSub}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                    <h3 className={`font-semibold flex items-center gap-2 ${text}`}>
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                      Trackers Detected ({result.trackers.length})
                    </h3>
                    {/* Category Filter */}
                    <div className="flex flex-wrap gap-1.5 sm:ml-auto">
                      {trackerCategories.map(cat => (
                        <button key={cat} onClick={() => setTrackerFilter(cat)}
                          className={`text-[10px] px-2.5 py-1 rounded-full border capitalize transition-colors ${
                            trackerFilter === cat
                              ? 'bg-violet-500 border-violet-500 text-white'
                              : darkMode ? 'border-slate-700 text-slate-400 hover:border-slate-500' : 'border-slate-200 text-slate-600 hover:border-slate-400'
                          }`}>
                          {cat === 'all' ? `All (${result.trackers.length})` : cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {filteredTrackers.map(tracker => (
                      <div key={tracker.name}
                        className={`rounded-lg border overflow-hidden transition-all tracker-item ${darkMode ? 'border-slate-700 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
                        <button
                          onClick={() => setExpandedTracker(expandedTracker === tracker.name ? null : tracker.name)}
                          className="w-full flex items-center justify-between p-3 text-left">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <span className={`${muted}`}><CategoryIcon category={tracker.category} /></span>
                            <span className={`text-sm font-medium truncate ${text}`}>{tracker.name}</span>
                            <RiskBadge risk={tracker.risk} />
                          </div>
                          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                            <span className={`text-[10px] hidden sm:block ${muted}`}>{tracker.category}</span>
                            {expandedTracker === tracker.name ? <ChevronUp className={`h-4 w-4 ${muted}`} /> : <ChevronDown className={`h-4 w-4 ${muted}`} />}
                          </div>
                        </button>
                        {expandedTracker === tracker.name && (
                          <div className={`px-3 pb-3 text-xs ${muted} border-t ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                            <p className="mt-2">{tracker.description}</p>
                          </div>
                        )}
                      </div>
                    ))}
                    {filteredTrackers.length === 0 && (
                      <p className={`text-sm text-center py-4 ${muted}`}>No trackers in this category</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className={`p-5 rounded-xl border ${cardSub}`}>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                    <div>
                      <p className={`font-semibold ${text}`}>No Trackers Detected 🎉</p>
                      <p className={`text-sm ${muted}`}>Great! This website appears to be tracker-free.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Third-Party Domains */}
              {result.thirdPartyDomains.length > 0 && (
                <div className={`p-5 rounded-xl border ${cardSub}`}>
                  <h3 className={`font-semibold mb-4 flex items-center gap-2 ${text}`}>
                    <Globe className="h-5 w-5 text-blue-400" />
                    Third-Party Domains ({result.thirdPartyDomains.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {visibleDomains.map(domain => (
                      <span key={domain}
                        className={`domain-chip flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                        <Link className="h-3 w-3 opacity-60" />{domain}
                      </span>
                    ))}
                  </div>
                  {result.thirdPartyDomains.length > 12 && (
                    <button onClick={() => setShowAllDomains(v => !v)}
                      className={`mt-3 text-xs flex items-center gap-1 ${darkMode ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-700'}`}>
                      {showAllDomains
                        ? <><ChevronUp className="h-3.5 w-3.5" /> Show less</>
                        : <><ChevronDown className="h-3.5 w-3.5" /> Show {result.thirdPartyDomains.length - 12} more</>}
                    </button>
                  )}
                </div>
              )}

              {/* Metrics Grid */}
              <div className={`p-5 rounded-xl border ${cardSub}`}>
                <h3 className={`font-semibold mb-4 flex items-center gap-2 ${text}`}>
                  <BarChart3 className="h-5 w-5 text-violet-400" /> Detailed Metrics
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { icon: <Terminal className="h-4 w-4" />, label: 'Total Scripts', val: result.scriptsCount },
                    { icon: <Code className="h-4 w-4" />, label: 'Inline Scripts', val: result.inlineScriptsCount },
                    { icon: <ExternalLink className="h-4 w-4" />, label: 'External Scripts', val: result.externalScriptsCount },
                    { icon: <Layers className="h-4 w-4" />, label: 'iFrames', val: result.iframesCount },
                    { icon: <Image className="h-4 w-4" />, label: '3P Images', val: result.imagesFromThirdParty },
                    { icon: <FileText className="h-4 w-4" />, label: 'Forms', val: result.formCount },
                    { icon: <Lock className="h-4 w-4" />, label: 'Password Fields', val: result.passwordFields },
                    { icon: <Wifi className="h-4 w-4" />, label: '3P Domains', val: result.thirdPartyDomains.length },
                  ].map(({ icon, label, val }) => (
                    <div key={label} className={`p-3 rounded-lg ${darkMode ? 'bg-slate-900/60' : 'bg-white'}`}>
                      <div className={`flex items-center gap-1.5 mb-1 text-xs ${muted}`}>{icon}{label}</div>
                      <div className={`text-lg font-bold ${text}`}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Score Breakdown */}
              <div className={`p-5 rounded-xl border ${cardSub}`}>
                <h3 className={`font-semibold mb-4 flex items-center gap-2 ${text}`}>
                  <TrendingDown className="h-5 w-5 text-rose-400" /> Score Breakdown
                </h3>
                <div className="space-y-2 text-sm">
                  {[
                    { label: 'Base score', val: '+100', color: 'text-emerald-400' },
                    { label: `High-risk trackers (${result.trackers.filter(t=>t.risk==='high').length} × -12)`, val: `-${result.trackers.filter(t=>t.risk==='high').length * 12}`, color: 'text-red-400', hide: result.trackers.filter(t=>t.risk==='high').length === 0 },
                    { label: `Medium-risk trackers (${result.trackers.filter(t=>t.risk==='medium').length} × -6)`, val: `-${result.trackers.filter(t=>t.risk==='medium').length * 6}`, color: 'text-amber-400', hide: result.trackers.filter(t=>t.risk==='medium').length === 0 },
                    { label: `Low-risk trackers (${result.trackers.filter(t=>t.risk==='low').length} × -2)`, val: `-${result.trackers.filter(t=>t.risk==='low').length * 2}`, color: 'text-yellow-400', hide: result.trackers.filter(t=>t.risk==='low').length === 0 },
                    { label: `Third-party domains (${Math.min(result.thirdPartyDomains.length * 2, 20)} cap)`, val: `-${Math.min(result.thirdPartyDomains.length * 2, 20)}`, color: 'text-orange-400', hide: result.thirdPartyDomains.length === 0 },
                    { label: 'Cookies detected', val: '-5', color: 'text-amber-400', hide: !result.cookiesDetected },
                    { label: 'CSP detected bonus', val: '+5', color: 'text-emerald-400', hide: !result.hasCSP },
                    { label: 'Referrer Policy bonus', val: '+3', color: 'text-emerald-400', hide: !result.hasReferrerPolicy },
                    { label: 'Permissions Policy bonus', val: '+2', color: 'text-emerald-400', hide: !result.hasPermissionsPolicy },
                  ].filter(r => !r.hide).map(({ label, val, color }) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className={muted}>{label}</span>
                      <span className={`font-mono font-bold ${color}`}>{val}</span>
                    </div>
                  ))}
                  <div className={`flex justify-between items-center pt-2 border-t font-bold ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                    <span className={text}>Final Score</span>
                    <span className={`text-xl ${getScoreColor(result.score)}`}>{result.score}/100</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── HISTORY PANEL ──────────────────────────────────────── */}
        {showHistory && (
          <div className={`rounded-2xl border shadow-xl p-5 animate-fade-in ${card}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold flex items-center gap-2 ${text}`}>
                <History className="h-5 w-5" /> Scan History ({history.length})
              </h3>
              {history.length > 0 && (
                <button onClick={clearHistory}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${darkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                  <Trash2 className="h-3.5 w-3.5" /> Clear All
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p className={`text-sm text-center py-6 ${muted}`}>No scans yet. Scan a website to see history here.</p>
            ) : (
              <div className="space-y-1.5">
                {history.map((item, i) => (
                  <button key={i} onClick={() => loadFromHistory(item)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                    <ScoreDot score={item.score} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${text}`}>{item.url.replace(/https?:\/\//, '')}</p>
                      <p className={`text-xs ${muted}`}>
                        {item.trackerCount} trackers · {new Date(item.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-sm font-bold flex-shrink-0 ${getScoreColor(item.score)}`}>{item.score}</span>
                    <Clock className={`h-3.5 w-3.5 flex-shrink-0 ${muted}`} />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FEATURES GRID ──────────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: <Eye />, gradient: 'from-violet-500 to-indigo-600', title: 'Tracker Detection', desc: 'Identify 100+ trackers including Google Analytics, Facebook Pixel, Hotjar, TikTok Pixel, and more across 12 categories.' },
            { icon: <Globe />, gradient: 'from-blue-500 to-cyan-600', title: 'Third-Party Analysis', desc: 'List all external domains, CDNs, and scripts loaded — with per-domain risk classification.' },
            { icon: <Cookie />, gradient: 'from-amber-500 to-orange-600', title: 'Cookie & Storage', desc: 'Detect cookies, localStorage, and sessionStorage usage with pattern-based analysis.' },
            { icon: <Shield />, gradient: 'from-emerald-500 to-teal-600', title: 'Privacy Score', desc: 'Dynamic 0–100 score with bonuses for CSP, Referrer Policy, Permissions Policy & HTTPS.' },
            { icon: <Lock />, gradient: 'from-pink-500 to-rose-600', title: 'Security Headers', desc: 'Check CSP, Referrer Policy, X-Frame-Options, Permissions Policy, and Do Not Track support.' },
            { icon: <Code />, gradient: 'from-purple-500 to-violet-600', title: '100% Open Source', desc: 'Fully transparent code — no CDN, no telemetry, no tracking. Audit, fork, and contribute freely.' },
            { icon: <Database />, gradient: 'from-cyan-500 to-blue-600', title: 'Zero-Knowledge', desc: 'No account needed. No data ever leaves your browser. Scan history stored only in localStorage.' },
            { icon: <Download />, gradient: 'from-green-500 to-emerald-600', title: 'Export & Share', desc: 'Download full scan report as JSON or share your privacy score with one tap.' },
            { icon: <FileText />, gradient: 'from-red-500 to-rose-600', title: 'Manual HTML Mode', desc: 'CORS-blocked sites? Paste the HTML source directly for complete offline analysis.' },
          ].map(({ icon, gradient, title, desc }) => (
            <div key={title} className={`feature-card p-5 rounded-xl border ${card}`}>
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-lg`}>
                <span className="h-5 w-5 text-white">{icon}</span>
              </div>
              <h3 className={`font-semibold mb-1.5 ${text}`}>{title}</h3>
              <p className={`text-sm ${muted}`}>{desc}</p>
            </div>
          ))}
        </div>

        {/* ── PRIVACY GUARANTEE ──────────────────────────────────── */}
        <div className={`rounded-2xl border p-6 text-center ${darkMode ? 'bg-violet-950/20 border-violet-800/30' : 'bg-violet-50 border-violet-200'}`}>
          <div className={`inline-flex items-center gap-2 mb-3 ${darkMode ? 'text-violet-300' : 'text-violet-700'}`}>
            <Shield className="h-5 w-5" />
            <span className="font-semibold">Privacy Guarantee</span>
          </div>
          <p className={`text-sm max-w-lg mx-auto mb-4 ${muted}`}>
            This tool does not collect or store any user data. All scans happen locally in your browser.
            No cookies, no analytics, no tracking, no telemetry. Ever.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {['@PrivMITLab', 'v3.0', '100% Client-Side', 'No CDN', 'Zero Telemetry', 'Open Source', 'Zero-Knowledge'].map(tag => (
              <span key={tag} className={`text-xs px-3 py-1 rounded-full ${darkMode ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-white text-slate-600 border border-slate-200'}`}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* ── SCORE LEGEND ───────────────────────────────────────── */}
        <div className={`rounded-2xl border p-5 ${card}`}>
          <h3 className={`font-semibold mb-4 flex items-center gap-2 ${text}`}>
            <BookOpen className="h-5 w-5 text-violet-400" /> Score Legend
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { range: '90–100', label: '🛡️ Excellent', color: 'text-emerald-400', bg: darkMode ? 'bg-emerald-950/30 border-emerald-800/40' : 'bg-emerald-50 border-emerald-200' },
              { range: '70–89', label: '✅ Good', color: 'text-emerald-400', bg: darkMode ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-emerald-50/50 border-emerald-100' },
              { range: '50–69', label: '⚠️ Fair', color: 'text-amber-400', bg: darkMode ? 'bg-amber-950/30 border-amber-800/40' : 'bg-amber-50 border-amber-200' },
              { range: '0–49', label: '🚨 Poor', color: 'text-red-400', bg: darkMode ? 'bg-red-950/30 border-red-800/40' : 'bg-red-50 border-red-200' },
            ].map(({ range, label, color, bg }) => (
              <div key={range} className={`p-3 rounded-xl border text-center ${bg}`}>
                <p className={`text-lg font-bold ${color}`}>{range}</p>
                <p className={`text-sm ${muted}`}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className={`border-t mt-8 py-8 ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className={`font-semibold ${text}`}>PrivacyScore</span>
              <span className={`text-sm ${muted}`}>by @PrivMITLab</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-500'}`}>v3.0</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://github.com/PrivMITLab" target="_blank" rel="noopener noreferrer"
                className={`flex items-center gap-1.5 text-sm transition-colors ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                <Code className="h-4 w-4" /> GitHub
              </a>
              <a href="https://twitter.com/PrivMITLab" target="_blank" rel="noopener noreferrer"
                className={`flex items-center gap-1.5 text-sm transition-colors ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                <ExternalLink className="h-4 w-4" /> @PrivMITLab
              </a>
            </div>
          </div>
          <p className={`text-center text-xs mt-4 ${muted}`}>
            🛡️ Privacy is a right, not a privilege. &nbsp;·&nbsp; No CDN &nbsp;·&nbsp; No Tracking &nbsp;·&nbsp; No Telemetry &nbsp;·&nbsp; 100% Free &nbsp;·&nbsp; Open Source
          </p>
        </div>
      </footer>
    </div>
  );
}
