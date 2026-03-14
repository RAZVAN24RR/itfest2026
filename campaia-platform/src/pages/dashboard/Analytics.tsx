import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Heart,
  MapPin,
  Megaphone,
  Share2,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

/** Aligned with campaign event types — demo metrics for Community Problems track */
const EVENT_TYPE_IMPACT = [
  { id: 'blood_donation', labelRo: 'Donare sânge', labelEn: 'Blood donation', reach: 128_400, actions: 920, color: '#ef4444', icon: '🩸' },
  { id: 'hackathon', labelRo: 'Hackathon', labelEn: 'Hackathon', reach: 89_200, actions: 640, color: '#3b82f6', icon: '💻' },
  { id: 'volunteering', labelRo: 'Voluntariat', labelEn: 'Volunteering', reach: 156_000, actions: 1180, color: '#22c55e', icon: '🤝' },
  { id: 'marathon', labelRo: 'Maraton / cursă', labelEn: 'Marathon / run', reach: 72_300, actions: 510, color: '#0ea5e9', icon: '🏅' },
  { id: 'charity', labelRo: 'Strângere fonduri', labelEn: 'Fundraising', reach: 95_100, actions: 780, color: '#eab308', icon: '💛' },
  { id: 'education', labelRo: 'Educație', labelEn: 'Education', reach: 64_800, actions: 420, color: '#6366f1', icon: '📚' },
  { id: 'community_gathering', labelRo: 'Adunări locale', labelEn: 'Local gatherings', reach: 41_500, actions: 290, color: '#f97316', icon: '🏘️' },
  { id: 'other', labelRo: 'Alte cauze', labelEn: 'Other causes', reach: 52_000, actions: 360, color: '#a855f7', icon: '✨' },
];

const TIME_SERIES = (() => {
  const out: { day: string; reach: number; actions: number; shares: number; sentiment: number }[] = [];
  let r = 4200,
    a = 180,
    s = 95,
    sen = 72;
  for (let i = 1; i <= 28; i++) {
    r += Math.round(200 + Math.random() * 400);
    a += Math.round(5 + Math.random() * 25);
    s += Math.round(2 + Math.random() * 12);
    sen = Math.min(94, Math.max(58, sen + (Math.random() * 6 - 2.5)));
    out.push({
      day: `Z${i}`,
      reach: r,
      actions: a,
      shares: s,
      sentiment: Math.round(sen),
    });
  }
  return out;
})();

const RADAR_IMPACT = [
  { dimRo: 'Conștientizare', dimEn: 'Awareness', a: 92, fullMark: 100 },
  { dimRo: 'Mobilizare', dimEn: 'Mobilization', a: 88, fullMark: 100 },
  { dimRo: 'Încredere', dimEn: 'Trust', a: 85, fullMark: 100 },
  { dimRo: 'Viralitate', dimEn: 'Virality', a: 79, fullMark: 100 },
  { dimRo: 'Retenție', dimEn: 'Retention', a: 81, fullMark: 100 },
];

const CITY_TOUCH = [
  { city: 'București', lift: 100 },
  { city: 'Cluj', lift: 86 },
  { city: 'Timișoara', lift: 72 },
  { city: 'Iași', lift: 68 },
  { city: 'Constanța', lift: 54 },
  { city: 'Național', lift: 91 },
];

const FUNNEL = [
  { stageRo: 'Văzut mesajul', stageEn: 'Saw message', value: 100, fill: '#c4b5fd' },
  { stageRo: 'Engagement', stageEn: 'Engaged', value: 68, fill: '#a78bfa' },
  { stageRo: 'Intent acțiune', stageEn: 'Action intent', value: 42, fill: '#8b5cf6' },
  { stageRo: 'Conversie cauză', stageEn: 'Cause conversion', value: 19, fill: '#6d28d9' },
];

type Lang = 'ro' | 'en';

export default function Analytics() {
  const { language, toggleLanguage } = useLanguage();
  const [tf, setTf] = useState<'7d' | '30d' | '90d'>('30d');
  const lang: Lang = language === 'en' ? 'en' : 'ro';

  const t = lang === 'ro'
    ? {
        title: 'Impact comunitar',
        subtitle: 'Analytics pentru track-ul Community Problems — mobilizare, conștientizare, acțiune.',
        badge: 'ITFest 2026 · Community Problems',
        kpis: [
          { k: 'Acoperire conștientizare', v: '684K', d: '+24% vs. luna trecută', up: true },
          { k: 'Acțiuni comunitare', v: '5.2K', d: 'înscrieri, donații, participări', up: true },
          { k: 'Share-uri pentru cauză', v: '12.8K', d: 'amplificare organică', up: true },
          { k: 'Orașe atinse', v: '42', d: 'prezență locală', up: true },
        ],
        time: 'Perioadă',
        chart1: 'Mobilizare în timp',
        chart1sub: 'Reach estimat + acțiuni generate (demo)',
        chart2: 'Mix tipuri de campanii',
        chart2sub: 'Distribuție pe tip eveniment comunitar',
        chart3: 'Dimensiuni impact',
        chart3sub: 'Scor normalizat (demo marketing)',
        chart4: 'Lift pe oraș',
        chart4sub: 'Index relativ vs. medie națională',
        chart5: 'Funnel conștientizare → acțiune',
        hackathon: 'Poveste pentru juriu',
        hackathonBody:
          'Campaia măsoară nu doar click-uri, ci semnale de mobilizare: voluntari, donatori, participanți la evenimente. Mai jos, totul e hardcodat pentru demo — în producție se leagă de campanii reale + TikTok insights.',
      }
    : {
        title: 'Community impact',
        subtitle: 'Analytics for the Community Problems track — awareness, mobilization, action.',
        badge: 'ITFest 2026 · Community Problems',
        kpis: [
          { k: 'Awareness reach', v: '684K', d: '+24% vs last month', up: true },
          { k: 'Community actions', v: '5.2K', d: 'sign-ups, donations, joins', up: true },
          { k: 'Shares for good', v: '12.8K', d: 'organic amplification', up: true },
          { k: 'Cities touched', v: '42', d: 'local presence', up: true },
        ],
        time: 'Range',
        chart1: 'Mobilization over time',
        chart1sub: 'Estimated reach + actions generated (demo)',
        chart2: 'Campaign type mix',
        chart2sub: 'Distribution by community event type',
        chart3: 'Impact dimensions',
        chart3sub: 'Normalized score (demo)',
        chart4: 'Lift by city',
        chart4sub: 'Relative index vs national average',
        chart5: 'Awareness → action funnel',
        hackathon: 'Pitch for judges',
        hackathonBody:
          'Campaia measures not just clicks but mobilization signals: volunteers, donors, event participants. Below is demo data — in production this ties to real campaigns + TikTok insights.',
      };

  const pieData = useMemo(
    () =>
      EVENT_TYPE_IMPACT.map((e) => ({
        name: lang === 'ro' ? e.labelRo : e.labelEn,
        value: e.reach,
        actions: e.actions,
        color: e.color,
      })),
    [lang],
  );

  const radarData = useMemo(
    () =>
      RADAR_IMPACT.map((r) => ({
        subject: lang === 'ro' ? r.dimRo : r.dimEn,
        score: r.a,
        fullMark: 100,
      })),
    [lang],
  );

  const funnelData = useMemo(
    () =>
      FUNNEL.map((f) => ({
        name: lang === 'ro' ? f.stageRo : f.stageEn,
        value: f.value,
        fill: f.fill,
      })),
    [lang],
  );

  const TooltipBox = ({ active, payload, label }: { active?: boolean; payload?: { name?: string; value?: number; color?: string }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-sm shadow-lg backdrop-blur">
        <div className="font-bold text-slate-800">{label}</div>
        {payload.map((p, i) => (
          <div key={i} className="text-slate-600">
            {p.name}: <span className="font-semibold text-slate-900">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-0 w-full max-w-[1600px] mx-auto space-y-8 pb-24 pt-2 px-1 sm:px-0">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border border-violet-200/60 bg-gradient-to-br from-violet-50 via-white to-emerald-50 p-6 sm:p-10 shadow-xl"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/4 h-48 w-48 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-600 px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
              <Sparkles className="h-3.5 w-3.5" />
              {t.badge}
            </span>
            <h1 className="flex flex-wrap items-center gap-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-emerald-500 text-white shadow-lg">
                <Heart className="h-6 w-6" fill="currentColor" fillOpacity={0.3} />
              </span>
              {t.title}
            </h1>
            <p className="mt-2 max-w-2xl text-base font-medium text-slate-600">{t.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => toggleLanguage()}
              className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-black uppercase text-slate-700 shadow-sm hover:bg-slate-50"
            >
              {lang === 'ro' ? 'EN' : 'RO'}
            </button>
            <div className="flex rounded-2xl border border-slate-200 bg-white/80 p-1 shadow-sm">
              {(['7d', '30d', '90d'] as const).map((x) => (
                <button
                  key={x}
                  type="button"
                  onClick={() => setTf(x)}
                  className={`rounded-xl px-4 py-2 text-xs font-black ${tf === x ? 'bg-slate-900 text-white' : 'text-slate-500'}`}
                >
                  {x}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {t.kpis.map((k, i) => (
          <motion.div
            key={k.k}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/50"
          >
            <div className="flex items-start justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{k.k}</p>
              {k.up && (
                <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-600">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  live demo
                </span>
              )}
            </div>
            <p className="mt-2 text-3xl font-black text-slate-900">{k.v}</p>
            <p className="mt-1 text-sm text-slate-500">{k.d}</p>
          </motion.div>
        ))}
      </div>

      {/* Story card */}
      <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-6 sm:p-8">
        <div className="flex gap-4">
          <Target className="h-10 w-10 shrink-0 text-emerald-600" />
          <div>
            <h3 className="text-lg font-black text-slate-900">{t.hackathon}</h3>
            <p className="mt-2 text-slate-700 leading-relaxed">{t.hackathonBody}</p>
          </div>
        </div>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        {/* Wide area chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="xl:col-span-2 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-lg sm:p-8"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900">{t.chart1}</h3>
              <p className="text-sm text-slate-500">{t.chart1sub}</p>
            </div>
            <Activity className="h-8 w-8 text-violet-400" />
          </div>
          <div className="h-[340px] w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TIME_SERIES} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipBox />} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="reach" name={lang === 'ro' ? 'Reach cumulat' : 'Cumulative reach'} stroke="#7c3aed" fill="url(#gR)" strokeWidth={2} />
                <Area yAxisId="right" type="monotone" dataKey="actions" name={lang === 'ro' ? 'Acțiuni' : 'Actions'} stroke="#059669" fill="url(#gA)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pie */}
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-lg sm:p-8">
          <div className="mb-4 flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-violet-500" />
            <div>
              <h3 className="text-lg font-black text-slate-900">{t.chart2}</h3>
              <p className="text-xs text-slate-500">{t.chart2sub}</p>
            </div>
          </div>
          <div className="h-[320px] w-full min-h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={EVENT_TYPE_IMPACT[i]?.color ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip content={<TooltipBox />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar */}
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-lg sm:p-8">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-emerald-500" />
            <div>
              <h3 className="text-lg font-black text-slate-900">{t.chart3}</h3>
              <p className="text-xs text-slate-500">{t.chart3sub}</p>
            </div>
          </div>
          <div className="h-[320px] w-full min-h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                <Radar name="score" dataKey="score" stroke="#7c3aed" fill="#8b5cf6" fillOpacity={0.45} strokeWidth={2} />
                <Tooltip content={<TooltipBox />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cities bar */}
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-lg sm:p-8">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-rose-500" />
            <div>
              <h3 className="text-lg font-black text-slate-900">{t.chart4}</h3>
              <p className="text-xs text-slate-500">{t.chart4sub}</p>
            </div>
          </div>
          <div className="h-[300px] w-full min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CITY_TOUCH} layout="vertical" margin={{ left: 8 }} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" domain={[0, 110]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="city" width={88} tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipBox />} />
                <Bar dataKey="lift" name="Index" fill="#f43f5e" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel + line sentiment */}
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-lg sm:p-8">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-6 w-6 text-amber-500" />
            <div>
              <h3 className="text-lg font-black text-slate-900">{t.chart5}</h3>
            </div>
          </div>
          <div className="h-[280px] w-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} margin={{ top: 8, right: 8, left: 8, bottom: 32 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} interval={0} angle={-12} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipBox />} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {funnelData.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-lg sm:p-8">
          <div className="mb-4 flex items-center gap-2">
            <Share2 className="h-6 w-6 text-sky-500" />
            <div>
              <h3 className="text-lg font-black text-slate-900">{lang === 'ro' ? 'Sentiment & share-uri' : 'Sentiment & shares'}</h3>
              <p className="text-xs text-slate-500">{lang === 'ro' ? 'Demo — corelație pozitivă' : 'Demo — positive correlation'}</p>
            </div>
          </div>
          <div className="h-[280px] w-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TIME_SERIES} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 9 }} hide />
                <YAxis yAxisId="L" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <YAxis yAxisId="R" orientation="right" tick={{ fontSize: 10 }} domain={[50, 100]} />
                <Tooltip content={<TooltipBox />} />
                <Legend />
                <Line yAxisId="L" type="monotone" dataKey="shares" name={lang === 'ro' ? 'Share-uri' : 'Shares'} stroke="#0ea5e9" strokeWidth={2} dot={false} />
                <Line yAxisId="R" type="monotone" dataKey="sentiment" name={lang === 'ro' ? 'Sentiment index' : 'Sentiment index'} stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom CTA strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-8 w-8 opacity-90" />
          <div>
            <p className="font-black">{lang === 'ro' ? 'Următorul pas: campanie nouă' : 'Next step: new campaign'}</p>
            <p className="text-sm text-violet-100">{lang === 'ro' ? 'Alege tipul de eveniment comunitar și măsoară impactul.' : 'Pick a community event type and measure impact.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
