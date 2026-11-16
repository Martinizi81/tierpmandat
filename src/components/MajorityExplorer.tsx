import React, { useMemo, useState } from 'react';
import { ArrowUpRight, FilterX } from 'lucide-react';
import {
  computeMinimalWinningCoalitions,
  ElectionTerm,
  PARTIES,
} from '../data/tierpMandat';

interface MajorityExplorerProps {
  term: ElectionTerm;
  activeTargetGroupName: string;
  onLoadCoalition: (partyIds: string[]) => void;
}

export const MajorityExplorer: React.FC<MajorityExplorerProps> = ({
  term,
  activeTargetGroupName,
  onLoadCoalition,
}) => {
  const [mustInclude, setMustInclude] = useState<string[]>([]);
  const [mustExclude, setMustExclude] = useState<string[]>([]);
  const [maxParties, setMaxParties] = useState<number>(0); // 0 = all

  const activeParties = useMemo(
    () =>
      term.parties
        .filter((p) => p.seats > 0)
        .sort((a, b) => b.seats - a.seats || PARTIES[a.partyId].spectrumOrder - PARTIES[b.partyId].spectrumOrder),
    [term]
  );

  const allMinimalCoalitions = useMemo(
    () => computeMinimalWinningCoalitions(term.id),
    [term.id]
  );

  const filteredCoalitions = useMemo(() => {
    return allMinimalCoalitions.filter((c) => {
      if (maxParties > 0 && c.partyCount > maxParties) return false;
      if (mustInclude.some((id) => !c.partyIds.includes(id))) return false;
      if (mustExclude.some((id) => c.partyIds.includes(id))) return false;
      return true;
    });
  }, [allMinimalCoalitions, mustInclude, mustExclude, maxParties]);

  const toggleInclude = (partyId: string) => {
    setMustExclude((prev) => prev.filter((id) => id !== partyId));
    setMustInclude((prev) =>
      prev.includes(partyId) ? prev.filter((id) => id !== partyId) : [...prev, partyId]
    );
  };

  const toggleExclude = (partyId: string) => {
    setMustInclude((prev) => prev.filter((id) => id !== partyId));
    setMustExclude((prev) =>
      prev.includes(partyId) ? prev.filter((id) => id !== partyId) : [...prev, partyId]
    );
  };

  const resetFilters = () => {
    setMustInclude([]);
    setMustExclude([]);
    setMaxParties(0);
  };

  const hasActiveFilters = mustInclude.length > 0 || mustExclude.length > 0 || maxParties > 0;

  return (
    <div className="space-y-12">
      {/* Combinatorial Majority Finder */}
      <section id="kombinationer" className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Alla möjliga majoriteter i Tierp
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Matematisk beräkning av alla minimala majoritetskoalitioner (minst{' '}
              <span className="font-mono font-semibold text-slate-900">
                {term.majorityThreshold}
              </span>{' '}
              av{' '}
              <span className="font-mono font-semibold text-slate-900">
                {term.totalSeats}
              </span>{' '}
              mandat, utan överflödiga stödpartier).
            </p>
          </div>

          <div className="text-xs text-slate-500 font-mono tabular-nums shrink-0">
            Visar {filteredCoalitions.length} av {allMinimalCoalitions.length} kombinationer
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Include Filter */}
            <div className="lg:col-span-5">
              <div className="text-xs font-semibold text-slate-700 mb-2">
                Måste ingå i samarbetet
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeParties.map((p) => {
                  const party = PARTIES[p.partyId];
                  const active = mustInclude.includes(p.partyId);
                  return (
                    <button
                      key={`inc-${p.partyId}`}
                      type="button"
                      onClick={() => toggleInclude(p.partyId)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-xs shrink-0"
                        style={{ backgroundColor: party.color }}
                        aria-hidden="true"
                      />
                      <span>{party.code}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Exclude Filter */}
            <div className="lg:col-span-5">
              <div className="text-xs font-semibold text-slate-700 mb-2">
                Uteslut parti ur beräkningen
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeParties.map((p) => {
                  const party = PARTIES[p.partyId];
                  const active = mustExclude.includes(p.partyId);
                  return (
                    <button
                      key={`exc-${p.partyId}`}
                      type="button"
                      onClick={() => toggleExclude(p.partyId)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-rose-700 text-white border-rose-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-xs shrink-0"
                        style={{ backgroundColor: party.color }}
                        aria-hidden="true"
                      />
                      <span>Ej {party.code}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Max Parties Segmented Filter */}
            <div className="lg:col-span-2">
              <div className="text-xs font-semibold text-slate-700 mb-2">
                Max antal partier
              </div>
              <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {[0, 3, 4, 5].map((limit) => (
                  <button
                    key={limit}
                    type="button"
                    onClick={() => setMaxParties(limit)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      maxParties === limit
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {limit === 0 ? 'Alla' : `≤ ${limit}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Filter aktiva — visar koalitioner som matchar dina val.
              </span>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
              >
                <FilterX className="w-3.5 h-3.5" />
                Rensa filter
              </button>
            </div>
          )}
        </div>

        {/* Coalitions Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {filteredCoalitions.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-slate-800">
                Ingen majoritetskoalition matchar de valda filtren.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Med de uteslutna partierna går det inte att nå {term.majorityThreshold} mandat.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Återställ filter
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Partier i samarbetet</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Partier</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Mandat</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Marginal</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Testa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredCoalitions.slice(0, 24).map((coalition) => (
                    <tr
                      key={coalition.partyIds.join('-')}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {coalition.partyIds.map((id) => {
                            const party = PARTIES[id];
                            const seatsCount =
                              term.parties.find((p) => p.partyId === id)?.seats ?? 0;
                            return (
                              <span
                                key={id}
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-900"
                              >
                                <span
                                  className="w-2.5 h-2.5 rounded-xs shrink-0"
                                  style={{ backgroundColor: party.color }}
                                  aria-hidden="true"
                                />
                                <span>{party.code}</span>
                                <span className="font-mono text-slate-400 tabular-nums">
                                  {seatsCount}
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-xs text-slate-600 tabular-nums">
                        {coalition.partyCount}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                        {coalition.totalSeats} / {term.totalSeats}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-xs tabular-nums">
                        <span
                          className={
                            coalition.margin === 0
                              ? 'text-amber-700 font-semibold'
                              : 'text-emerald-700 font-medium'
                          }
                        >
                          {coalition.margin === 0 ? 'Exakt (0)' : `+${coalition.margin}`}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onLoadCoalition(coalition.partyIds)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <span>Till {activeTargetGroupName}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredCoalitions.length > 24 && (
                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
                  Visar de 24 mest kompakta kombinationerna av {filteredCoalitions.length} totalt.
                  Använd filtren ovan för att smalna av urvalet.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Seat Reference Table */}
      <section id="mandattabell" className="space-y-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Mandatfördelning i Tierps kommunfullmäktige
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {term.summary}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Parti</th>
                  <th className="py-3 px-4 text-right">Mandat</th>
                  <th className="py-3 px-4 text-right">Andel</th>
                  {term.id === '2026' && (
                    <th className="py-3 px-4 text-right">Förändring jfr 2022</th>
                  )}
                  <th className="py-3 px-4">Visuell fördelning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {[...term.parties]
                  .sort(
                    (a, b) =>
                      b.seats - a.seats ||
                      PARTIES[a.partyId].spectrumOrder - PARTIES[b.partyId].spectrumOrder
                  )
                  .map((item) => {
                    const party = PARTIES[item.partyId];
                    const pct = ((item.seats / term.totalSeats) * 100)
                      .toFixed(1)
                      .replace('.', ',');
                    return (
                      <tr key={item.partyId} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-6 h-6 rounded-md flex items-center justify-center text-white font-mono text-[11px] font-semibold shrink-0"
                              style={{ backgroundColor: party.color }}
                            >
                              {party.code}
                            </span>
                            <div>
                              <span className="font-medium text-slate-900">{party.name}</span>
                              {party.localNote && (
                                <span className="text-xs text-slate-500 ml-2">
                                  · {party.localNote}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                          {item.seats}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-xs text-slate-600 tabular-nums">
                          {pct} %
                        </td>
                        {term.id === '2026' && (
                          <td className="py-2.5 px-4 text-right font-mono text-xs tabular-nums">
                            {item.seatChange === undefined || item.seatChange === 0 ? (
                              <span className="text-slate-400">±0</span>
                            ) : item.seatChange > 0 ? (
                              <span className="text-emerald-700 font-medium">
                                +{item.seatChange}
                              </span>
                            ) : (
                              <span className="text-rose-700 font-medium">{item.seatChange}</span>
                            )}
                          </td>
                        )}
                        <td className="py-2.5 px-4">
                          {item.seats === 0 ? (
                            <span className="text-xs text-slate-400">Inga mandat</span>
                          ) : (
                            <div className="flex items-center gap-1" aria-hidden="true">
                              {Array.from({ length: item.seats }).map((_, i) => (
                                <span
                                  key={i}
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: party.color }}
                                />
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
