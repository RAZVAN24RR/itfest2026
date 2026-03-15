import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CalendarRange,
  Heart,
  MapPin,
  Megaphone,
  Share2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import campaignService, { type CampaignMapMarker } from '../../services/campaignService';

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export default function Analytics() {
  const { language, toggleLanguage } = useLanguage();
  const ro = language !== 'en';
  const L = (r: string, e: string) => (ro ? r : e);
  const [{ from, to }, setRange] = useState(defaultRange);
  const [markers, setMarkers] = useState<CampaignMapMarker[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoadErr(null);
      const data = await campaignService.getMapMarkers();
      setMarkers(data);
    } catch {
      setLoadErr(L('Nu s-au putut încărca datele.', 'Could not load data.'));
    }
  }, [L]);

  useEffect(() => {
    load();
  }, [load]);

  const inRange = useCallback(
    (m: CampaignMapMarker) => {
      if (!m.created_at) return true;
      const d = m.created_at.slice(0, 10);
      return d >= from && d <= to;
    },
    [from, to],
  );

  const filtered = useMemo(() => markers.filter(inRange), [markers, inRange]);

  const totals = useMemo(() => {
    let imp = 0,
      clk = 0,
      shr = 0,
      sp = 0;
    for (const m of filtered) {
      imp += m.impressions || m.estimated_reach || 0;
      clk += m.clicks || 0;
      shr += m.shares || 0;
      sp += Number(m.spend_ron || 0);
    }
    const ctr = imp ? (100 * clk) / imp : 0;
    return { imp, clk, shr, sp, ctr };
  }, [filtered]);

  const byCategory = useMemo(() => {
    const map = new Map<string, { imp: number; n: number }>();
    for (const m of filtered) {
      const k = m.category || '—';
      const cur = map.get(k) || { imp: 0, n: 0 };
      cur.imp += m.impressions || m.estimated_reach || 0;
      cur.n += 1;
      map.set(k, cur);
    }
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, imp: v.imp, n: v.n }))
      .sort((a, b) => b.imp - a.imp);
  }, [filtered]);

  const maxImp = Math.max(1, ...byCategory.map((x) => x.imp));

  return (
    <div className="w-full space-y-8 pb-24 pt-2">
      <header className="rounded-[2rem] border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-emerald-50 p-6 shadow-lg sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <span className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-600 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
              <Sparkles className="h-3 w-3" />
              ITFest 2026 · Community
            </span>
            <h1 className="mt-2 flex items-center gap-3 text-2xl font-black text-slate-900 sm:text-3xl">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white">
                <Heart className="h-5 w-5" />
              </span>
              {L('Analitice comunitate', 'Community analytics')}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {L(
                'Agregat din campaniile de pe hartă — metrici în stil TikTok Ads (impressions, clicks, CTR, spend).',
                'Aggregated from map campaigns — TikTok Ads–style metrics.',
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggleLanguage()}
            className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase"
          >
            {ro ? 'EN' : 'RO'}
          </button>
        </div>

        {/* Calendar range */}
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 sm:flex-row sm:items-end sm:flex-wrap">
          <div className="flex items-center gap-2 text-slate-500">
            <CalendarRange className="h-5 w-5 shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider">{L('Perioadă', 'Date range')}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex flex-col gap-1 text-[10px] font-bold uppercase text-slate-400">
              {L('De la', 'From')}
              <input
                type="date"
                value={from}
                max={to}
                onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800"
              />
            </label>
            <label className="flex flex-col gap-1 text-[10px] font-bold uppercase text-slate-400">
              {L('Până la', 'To')}
              <input
                type="date"
                value={to}
                min={from}
                onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800"
              />
            </label>
            <button
              type="button"
              onClick={() => setRange(defaultRange())}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black uppercase text-white"
            >
              {L('Ultimele 30 zile', 'Last 30 days')}
            </button>
          </div>
          <p className="w-full text-xs text-slate-500 sm:ml-auto sm:w-auto">
            {L('Campanii în interval', 'Campaigns in range')}: <strong>{filtered.length}</strong> / {markers.length}
          </p>
        </div>
      </header>

      {loadErr && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">{loadErr}</div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { k: L('Impressions', 'Impressions'), v: totals.imp.toLocaleString(), icon: Activity },
          { k: L('Click-uri', 'Clicks'), v: totals.clk.toLocaleString(), icon: MapPin },
          { k: 'CTR', v: `${totals.ctr.toFixed(2)}%`, icon: BarChart3 },
          { k: L('Cheltuială', 'Spend'), v: `${totals.sp.toFixed(2)} RON`, icon: TrendingUp },
        ].map(({ k, v, icon: Icon }) => (
          <div key={k} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-md">
            <Icon className="mb-2 h-5 w-5 text-violet-500" />
            <p className="text-[10px] font-bold uppercase text-slate-400">{k}</p>
            <p className="text-xl font-black text-slate-900">{v}</p>
            <p className="mt-1 flex items-center gap-0.5 text-[10px] font-bold text-emerald-600">
              <ArrowUpRight className="h-3 w-3" />
              {L('din hartă', 'from map')}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-lg">
        <h3 className="mb-4 flex items-center gap-2 font-black text-slate-900">
          <Megaphone className="h-5 w-5 text-violet-500" />
          {L('Impressions pe tip (în perioadă)', 'Impressions by type (period)')}
        </h3>
        <ul className="space-y-3">
          {byCategory.length === 0 && (
            <li className="text-sm text-slate-500">{L('Nicio campanie în interval.', 'No campaigns in range.')}</li>
          )}
          {byCategory.map((row) => (
            <li key={row.name}>
              <div className="mb-1 flex justify-between text-xs font-bold text-slate-600">
                <span>{row.name}</span>
                <span>{row.imp.toLocaleString()} · {row.n} camp.</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-violet-500"
                  style={{ width: `${Math.round((row.imp / maxImp) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-lg overflow-x-auto">
        <h3 className="mb-4 flex items-center gap-2 font-black text-slate-900">
          <Share2 className="h-5 w-5 text-sky-500" />
          {L('Campanii (detaliu TikTok-style)', 'Campaigns (TikTok-style)')}
        </h3>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400">
              <th className="pb-2 pr-2">{L('Campanie', 'Campaign')}</th>
              <th className="pb-2 pr-2">{L('Oraș', 'City')}</th>
              <th className="pb-2 pr-2 text-right">Impr.</th>
              <th className="pb-2 pr-2 text-right">Clicks</th>
              <th className="pb-2 pr-2 text-right">CTR</th>
              <th className="pb-2 pr-2 text-right">Shares</th>
              <th className="pb-2 text-right">RON</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id} className="border-b border-slate-50">
                <td className="py-2 pr-2 font-medium text-slate-800 max-w-[200px] truncate">{m.title}</td>
                <td className="py-2 pr-2 text-slate-600">{m.city}</td>
                <td className="py-2 pr-2 text-right font-mono">{(m.impressions || m.estimated_reach).toLocaleString()}</td>
                <td className="py-2 pr-2 text-right font-mono text-blue-600">{(m.clicks || 0).toLocaleString()}</td>
                <td className="py-2 pr-2 text-right font-mono">{(m.ctr_pct ?? 0).toFixed(2)}%</td>
                <td className="py-2 pr-2 text-right font-mono">{(m.shares || 0).toLocaleString()}</td>
                <td className="py-2 text-right font-mono">{Number(m.spend_ron || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-5 text-white shadow-lg">
        <p className="font-black">{L('Harta comunitară', 'Community map')}</p>
        <p className="text-sm text-violet-100">{L('Vezi pin-urile și filtrele pe categorii/orașe.', 'See pins and filters by city/type.')}</p>
      </div>
    </div>
  );
}
