import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { CoalitionBuilder } from './components/CoalitionBuilder';
import { HemicycleChart, HemicycleLayoutMode } from './components/HemicycleChart';
import { MajorityExplorer } from './components/MajorityExplorer';
import {
  CollaborationGroup,
  createInitialSeats,
  DEFAULT_COLLABORATIONS,
  ELECTION_TERMS,
  ElectionPreset,
  ElectionTermId,
  EXTRA_COLLAB_COLORS,
  PARTIES,
  SeatItem,
} from './data/tierpMandat';

export function App() {
  const [termId, setTermId] = useState<ElectionTermId>('2026');
  const [seats, setSeats] = useState<SeatItem[]>(() => createInitialSeats('2026'));
  const [collaborations, setCollaborations] = useState<CollaborationGroup[]>(
    DEFAULT_COLLABORATIONS
  );
  const [activeTargetGroupId, setActiveTargetGroupId] = useState<string>('collab-1');
  const [dragMode, setDragMode] = useState<'party' | 'seat'>('party');
  const [hemicycleLayout, setHemicycleLayout] = useState<HemicycleLayoutMode>('coalition');
  const [activePresetId, setActivePresetId] = useState<string>('empty-2026');

  const term = ELECTION_TERMS[termId];

  const handleTermChange = (nextTermId: ElectionTermId) => {
    if (nextTermId === termId) return;
    setTermId(nextTermId);
    setSeats(createInitialSeats(nextTermId));
    setCollaborations(DEFAULT_COLLABORATIONS);
    setActiveTargetGroupId('collab-1');
    setActivePresetId(`empty-${nextTermId}`);
  };

  const handleResetAll = () => {
    setSeats(createInitialSeats(termId));
    setCollaborations(DEFAULT_COLLABORATIONS);
    setActiveTargetGroupId('collab-1');
    setActivePresetId(`empty-${termId}`);
  };

  const handleApplyPreset = (preset: ElectionPreset) => {
    const nextCollaborations: CollaborationGroup[] = preset.groups.map((g, idx) => ({
      id: `collab-${idx + 1}`,
      name: g.name,
      accentColor: EXTRA_COLLAB_COLORS[idx % EXTRA_COLLAB_COLORS.length],
    }));

    const partyToGroup = new Map<string, string>();
    preset.groups.forEach((g, idx) => {
      const gid = `collab-${idx + 1}`;
      g.partyIds.forEach((pid) => partyToGroup.set(pid, gid));
    });

    const freshSeats = createInitialSeats(termId).map((seat) => ({
      ...seat,
      groupId: partyToGroup.get(seat.partyId) ?? 'unassigned',
    }));

    setCollaborations(nextCollaborations);
    setSeats(freshSeats);
    setActiveTargetGroupId(nextCollaborations[0]?.id ?? 'collab-1');
    setActivePresetId(preset.id);
  };

  const handleMovePartyFromZone = (
    partyId: string,
    sourceGroupId: string,
    targetGroupId: string
  ) => {
    setActivePresetId('');
    setSeats((prev) =>
      prev.map((seat) =>
        seat.partyId === partyId && seat.groupId === sourceGroupId
          ? { ...seat, groupId: targetGroupId }
          : seat
      )
    );
  };

  const handleMoveSeat = (seatId: string, targetGroupId: string) => {
    setActivePresetId('');
    setSeats((prev) =>
      prev.map((seat) => (seat.id === seatId ? { ...seat, groupId: targetGroupId } : seat))
    );
  };

  const handleMovePartiesToGroup = (partyIds: string[], targetGroupId: string) => {
    setActivePresetId('');
    const setIds = new Set(partyIds);
    setSeats((prev) =>
      prev.map((seat) =>
        seat.groupId === 'unassigned' && setIds.has(seat.partyId)
          ? { ...seat, groupId: targetGroupId }
          : seat
      )
    );
  };

  const handleSeatClickInHemicycle = (clickedSeat: SeatItem) => {
    setActivePresetId('');
    const targetId = activeTargetGroupId || collaborations[0]?.id || 'collab-1';

    if (dragMode === 'seat') {
      const nextGroup = clickedSeat.groupId === targetId ? 'unassigned' : targetId;
      handleMoveSeat(clickedSeat.id, nextGroup);
      return;
    }

    // Party mode: toggle whole party into or out of activeTargetGroupId
    setSeats((prev) => {
      const partySeatsInTarget = prev.filter(
        (s) => s.partyId === clickedSeat.partyId && s.groupId === targetId
      ).length;

      if (partySeatsInTarget > 0 && clickedSeat.groupId === targetId) {
        return prev.map((s) =>
          s.partyId === clickedSeat.partyId && s.groupId === targetId
            ? { ...s, groupId: 'unassigned' }
            : s
        );
      }

      return prev.map((s) =>
        s.partyId === clickedSeat.partyId ? { ...s, groupId: targetId } : s
      );
    });
  };

  const handleAddCollaboration = () => {
    if (collaborations.length >= 4) return;
    const nextIdx = collaborations.length;
    const letter = String.fromCharCode(65 + nextIdx);
    const newId = `collab-${Date.now()}`;
    const newGroup: CollaborationGroup = {
      id: newId,
      name: `Samarbete ${letter}`,
      accentColor: EXTRA_COLLAB_COLORS[nextIdx % EXTRA_COLLAB_COLORS.length],
    };
    setCollaborations((prev) => [...prev, newGroup]);
    setActiveTargetGroupId(newId);
  };

  const handleRemoveCollaboration = (groupId: string) => {
    if (collaborations.length <= 1) return;
    setSeats((prev) =>
      prev.map((s) => (s.groupId === groupId ? { ...s, groupId: 'unassigned' } : s))
    );
    const remaining = collaborations.filter((c) => c.id !== groupId);
    setCollaborations(remaining);
    if (activeTargetGroupId === groupId) {
      setActiveTargetGroupId(remaining[0].id);
    }
  };

  const handleRenameCollaboration = (groupId: string, newName: string) => {
    setCollaborations((prev) =>
      prev.map((c) => (c.id === groupId ? { ...c, name: newName } : c))
    );
  };

  const handleClearCollaboration = (groupId: string) => {
    setActivePresetId('');
    setSeats((prev) =>
      prev.map((s) => (s.groupId === groupId ? { ...s, groupId: 'unassigned' } : s))
    );
  };

  const handleLoadCoalitionFromExplorer = (partyIds: string[]) => {
    setActivePresetId('');
    const targetId = activeTargetGroupId || collaborations[0]?.id || 'collab-1';
    const targetSet = new Set(partyIds);

    setSeats((prev) =>
      prev.map((seat) => {
        if (targetSet.has(seat.partyId)) {
          return { ...seat, groupId: targetId };
        }
        if (seat.groupId === targetId) {
          return { ...seat, groupId: 'unassigned' };
        }
        return seat;
      })
    );

    const el = document.getElementById('oversikt');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const groupSummaries = useMemo(() => {
    return collaborations.map((group) => {
      const groupSeats = seats.filter((s) => s.groupId === group.id);
      const byParty = new Map<string, number>();
      groupSeats.forEach((s) => {
        byParty.set(s.partyId, (byParty.get(s.partyId) ?? 0) + 1);
      });
      const partySummary = Array.from(byParty.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([partyId, count]) => ({ partyId, count }));

      return {
        group,
        seatCount: groupSeats.length,
        hasMajority: groupSeats.length >= term.majorityThreshold,
        partySummary,
      };
    });
  }, [collaborations, seats, term.majorityThreshold]);

  const unassignedCount = seats.filter((s) => s.groupId === 'unassigned').length;
  const activeTargetGroupName =
    collaborations.find((c) => c.id === activeTargetGroupId)?.name ?? 'Samarbete A';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#oversikt"
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Tierpsfullmäktige
          </a>

          <nav
            aria-label="Huvudnavigering"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <a
              href="#oversikt"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Översikt
            </a>
            <a
              href="#bygg-samarbete"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Bygg samarbete
            </a>
            <a
              href="#kombinationer"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Kombinationer
            </a>
            <a
              href="#mandattabell"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Mandattabell
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleResetAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Återställ</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-12">
        {/* Hero / Overview Header & Toolbar */}
        <section id="oversikt" className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-2.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-500">
                <span>Tierps kommun</span>
                <span aria-hidden="true">·</span>
                <span>Mandatperiod {term.period}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{term.totalSeats} mandat</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-slate-800 font-semibold">
                  Majoritet {term.majorityThreshold} mandat
                </span>
              </div>

              <h1
                className="font-display font-bold text-slate-900 tracking-tight leading-[1.12]"
                style={{
                  fontSize: 'clamp(1.85rem, 3.2vw, 2.75rem)',
                  textWrap: 'balance',
                }}
              >
                Mandat & majoriteter i Tierps kommunfullmäktige
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Se samtliga mandat i fullmäktige och dra partier eller enskilda stolar till olika
                samarbeten för att testa hur en styrande majoritet kan bildas.
              </p>
            </div>

            {/* Term Switcher */}
            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              <span className="text-xs font-medium text-slate-500">Välj mandatperiod</span>
              <div
                className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg"
                role="group"
                aria-label="Välj valresultat"
              >
                <button
                  type="button"
                  onClick={() => handleTermChange('2026')}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    termId === '2026'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Valet 2026 (41 mandat)
                </button>
                <button
                  type="button"
                  onClick={() => handleTermChange('2022')}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    termId === '2022'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Valet 2022 (49 mandat)
                </button>
              </div>
            </div>
          </div>

          {/* Preset Scenarios Strip */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-slate-500 mr-1">Snabbscenarier:</span>
            {term.presets.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  title={preset.description}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* 2-Column Focal Stage: Hemicycle + Live Balance Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 flex flex-col">
              <HemicycleChart
                term={term}
                seats={seats}
                collaborations={collaborations}
                activeTargetGroupId={activeTargetGroupId}
                dragMode={dragMode}
                layoutMode={hemicycleLayout}
                onLayoutModeChange={setHemicycleLayout}
                onSeatClick={handleSeatClickInHemicycle}
              />
            </div>

            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
              <div className="space-y-5">
                <div>
                  <h2 className="font-display text-lg font-semibold text-slate-900 tracking-tight">
                    Styrkeförhållanden just nu
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Jämför dina samarbeten mot majoritetsgränsen på {term.majorityThreshold} mandat.
                  </p>
                </div>

                {/* Combined Coalition Comparison Bar */}
                <div className="space-y-2">
                  <div className="relative h-5 w-full bg-slate-100 rounded-md overflow-hidden border border-slate-200/80 flex">
                    {groupSummaries.map((summary, idx) => {
                      const widthPct = (summary.seatCount / term.totalSeats) * 100;
                      if (widthPct === 0) return null;
                      return (
                        <div
                          key={summary.group.id}
                          style={{
                            width: `${widthPct}%`,
                            backgroundColor:
                              idx === 0 ? '#0F172A' : idx === 1 ? '#64748B' : '#94A3B8',
                          }}
                          className="h-full border-r border-white/70 transition-all duration-200 flex items-center justify-center text-[10px] font-mono font-semibold text-white overflow-hidden"
                          title={`${summary.group.name}: ${summary.seatCount} mandat`}
                        >
                          {summary.seatCount >= 4 ? summary.seatCount : ''}
                        </div>
                      );
                    })}
                    {/* 50% majority line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-rose-600 z-10"
                      style={{
                        left: '50%',
                      }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono tabular-nums">
                    <span>0</span>
                    <span className="text-rose-700 font-semibold">
                      Majoritet {term.majorityThreshold}
                    </span>
                    <span>{term.totalSeats}</span>
                  </div>
                </div>

                {/* Per-Group Breakdown Rows */}
                <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
                  {groupSummaries.map(({ group, seatCount, hasMajority, partySummary }) => {
                    const isSelected = activeTargetGroupId === group.id;
                    const diff = seatCount - term.majorityThreshold;

                    return (
                      <div
                        key={group.id}
                        className="py-3.5 flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveTargetGroupId(group.id)}
                            className="text-left inline-flex items-center gap-2 cursor-pointer group min-w-0"
                          >
                            <span
                              className={`w-2.5 h-2.5 rounded-full border shrink-0 ${
                                isSelected
                                  ? 'bg-slate-900 border-slate-900'
                                  : 'bg-white border-slate-400 group-hover:border-slate-700'
                              }`}
                              aria-hidden="true"
                            />
                            <span className="font-display text-sm font-semibold text-slate-900 truncate">
                              {group.name}
                            </span>
                          </button>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                              {seatCount}
                            </span>
                            {seatCount > 0 &&
                              (hasMajority ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>{diff === 0 ? 'Exakt' : `+${diff}`}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                                  <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>{diff}</span>
                                </span>
                              ))}
                          </div>
                        </div>

                        {partySummary.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pl-4 text-xs text-slate-600">
                            {partySummary.map(({ partyId, count }) => (
                              <span key={partyId} className="inline-flex items-center gap-1">
                                <span
                                  className="w-2 h-2 rounded-xs shrink-0"
                                  style={{ backgroundColor: PARTIES[partyId].color }}
                                  aria-hidden="true"
                                />
                                <span className="font-medium text-slate-800">
                                  {PARTIES[partyId].code}
                                </span>
                                <span className="font-mono text-slate-500 tabular-nums">
                                  {count}
                                </span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="pl-4 text-xs text-slate-400">
                            Inga placerade partier ännu
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Unassigned Row */}
                  <div className="py-3 flex items-center justify-between text-xs text-slate-500">
                    <span>Ej placerade mandat i bänken</span>
                    <span className="font-mono font-semibold text-slate-700 tabular-nums">
                      {unassignedCount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Klick i plenisalen styr till:</span>
                <span className="font-semibold text-slate-900 truncate max-w-[180px]">
                  {activeTargetGroupName}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Drag and Drop Builder */}
        <CoalitionBuilder
          term={term}
          seats={seats}
          collaborations={collaborations}
          activeTargetGroupId={activeTargetGroupId}
          dragMode={dragMode}
          onDragModeChange={setDragMode}
          onSelectTargetGroup={setActiveTargetGroupId}
          onMovePartyFromZone={handleMovePartyFromZone}
          onMoveSeat={handleMoveSeat}
          onMovePartiesToGroup={handleMovePartiesToGroup}
          onAddCollaboration={handleAddCollaboration}
          onRemoveCollaboration={handleRemoveCollaboration}
          onRenameCollaboration={handleRenameCollaboration}
          onClearCollaboration={handleClearCollaboration}
        />

        {/* Minimal Winning Coalitions Explorer & Reference Table */}
        <MajorityExplorer
          term={term}
          activeTargetGroupName={activeTargetGroupName}
          onLoadCoalition={handleLoadCoalitionFromExplorer}
        />
      </main>

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Mandatdata för Tierps kommunfullmäktige baserat på Valmyndighetens och Tierps kommuns
            officiella valresultat (2022 och 2026).
          </div>
          <a
            href="#oversikt"
            className="font-medium text-slate-700 hover:text-slate-900 hover:underline whitespace-nowrap shrink-0"
          >
            Tillbaka till toppen
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
