import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  GripVertical,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import {
  CollaborationGroup,
  ElectionTerm,
  PARTIES,
  SeatItem,
  suggestMajorityCompletions,
} from '../data/tierpMandat';

interface DragPayload {
  kind: 'party' | 'seat';
  partyId: string;
  sourceGroupId: string;
  seatId?: string;
}

interface CoalitionBuilderProps {
  term: ElectionTerm;
  seats: SeatItem[];
  collaborations: CollaborationGroup[];
  activeTargetGroupId: string;
  dragMode: 'party' | 'seat';
  onDragModeChange: (mode: 'party' | 'seat') => void;
  onSelectTargetGroup: (groupId: string) => void;
  onMovePartyFromZone: (partyId: string, sourceGroupId: string, targetGroupId: string) => void;
  onMoveSeat: (seatId: string, targetGroupId: string) => void;
  onMovePartiesToGroup: (partyIds: string[], targetGroupId: string) => void;
  onAddCollaboration: () => void;
  onRemoveCollaboration: (groupId: string) => void;
  onRenameCollaboration: (groupId: string, newName: string) => void;
  onClearCollaboration: (groupId: string) => void;
}

interface PartyCluster {
  partyId: string;
  seats: SeatItem[];
}

function groupSeatsByParty(zoneSeats: SeatItem[]): PartyCluster[] {
  const map = new Map<string, SeatItem[]>();
  for (const seat of zoneSeats) {
    const existing = map.get(seat.partyId);
    if (existing) {
      existing.push(seat);
    } else {
      map.set(seat.partyId, [seat]);
    }
  }

  return Array.from(map.entries())
    .map(([partyId, partySeats]) => ({
      partyId,
      seats: [...partySeats].sort((a, b) => a.seatIndex - b.seatIndex),
    }))
    .sort((a, b) => {
      if (b.seats.length !== a.seats.length) return b.seats.length - a.seats.length;
      return PARTIES[a.partyId].spectrumOrder - PARTIES[b.partyId].spectrumOrder;
    });
}

export const CoalitionBuilder: React.FC<CoalitionBuilderProps> = ({
  term,
  seats,
  collaborations,
  activeTargetGroupId,
  dragMode,
  onDragModeChange,
  onSelectTargetGroup,
  onMovePartyFromZone,
  onMoveSeat,
  onMovePartiesToGroup,
  onAddCollaboration,
  onRemoveCollaboration,
  onRenameCollaboration,
  onClearCollaboration,
}) => {
  const dragPayloadRef = useRef<DragPayload | null>(null);
  const [dragOverZoneId, setDragOverZoneId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<string>('');

  const unassignedSeats = useMemo(
    () => seats.filter((s) => s.groupId === 'unassigned'),
    [seats]
  );

  const unassignedClusters = useMemo(
    () => groupSeatsByParty(unassignedSeats),
    [unassignedSeats]
  );

  const unassignedPartyCounts = useMemo(
    () =>
      unassignedClusters.map((c) => ({
        partyId: c.partyId,
        seats: c.seats.length,
      })),
    [unassignedClusters]
  );

  const handleDragStartParty = (
    e: React.DragEvent,
    partyId: string,
    sourceGroupId: string
  ) => {
    const payload: DragPayload = { kind: 'party', partyId, sourceGroupId };
    dragPayloadRef.current = payload;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.setData('text/plain', `${partyId}:${sourceGroupId}`);
  };

  const handleDragStartSeat = (e: React.DragEvent, seat: SeatItem) => {
    const payload: DragPayload = {
      kind: 'seat',
      partyId: seat.partyId,
      sourceGroupId: seat.groupId,
      seatId: seat.id,
    };
    dragPayloadRef.current = payload;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.setData('text/plain', seat.id);
  };

  const handleDragEnd = () => {
    dragPayloadRef.current = null;
    setDragOverZoneId(null);
  };

  const handleDragOverZone = (e: React.DragEvent, zoneId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverZoneId !== zoneId) {
      setDragOverZoneId(zoneId);
    }
  };

  const handleDropZone = (e: React.DragEvent, targetZoneId: string) => {
    e.preventDefault();
    setDragOverZoneId(null);

    let payload = dragPayloadRef.current;
    if (!payload) {
      try {
        const raw = e.dataTransfer.getData('application/json');
        if (raw) payload = JSON.parse(raw) as DragPayload;
      } catch {
        payload = null;
      }
    }

    if (!payload) return;
    if (payload.sourceGroupId === targetZoneId) return;

    if (payload.kind === 'party') {
      onMovePartyFromZone(payload.partyId, payload.sourceGroupId, targetZoneId);
    } else if (payload.kind === 'seat' && payload.seatId) {
      onMoveSeat(payload.seatId, targetZoneId);
    }

    dragPayloadRef.current = null;
  };

  const startEditingName = (group: CollaborationGroup) => {
    setEditingGroupId(group.id);
    setEditingDraft(group.name);
  };

  const commitEditingName = () => {
    if (editingGroupId) {
      const trimmed = editingDraft.trim();
      if (trimmed.length > 0) {
        onRenameCollaboration(editingGroupId, trimmed);
      }
    }
    setEditingGroupId(null);
  };

  const renderZoneTokens = (zoneId: string, zoneSeats: SeatItem[]) => {
    const clusters = groupSeatsByParty(zoneSeats);

    if (zoneSeats.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
          <p className="text-sm font-medium text-slate-600">
            {zoneId === 'unassigned'
              ? 'Alla mandat är placerade i samarbeten'
              : 'Dra partier eller mandat hit'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {zoneId === 'unassigned'
              ? 'Dra tillbaka ett parti hit eller klicka ✕ för att släppa mandat.'
              : 'Du kan också använda snabbknapparna på partierna i bänken.'}
          </p>
        </div>
      );
    }

    if (dragMode === 'seat') {
      const sortedSeats = [...zoneSeats].sort((a, b) => {
        const specDiff = PARTIES[a.partyId].spectrumOrder - PARTIES[b.partyId].spectrumOrder;
        if (specDiff !== 0) return specDiff;
        return a.seatIndex - b.seatIndex;
      });

      return (
        <div className="flex flex-wrap gap-1.5">
          {sortedSeats.map((seat) => {
            const party = PARTIES[seat.partyId];
            return (
              <div
                key={seat.id}
                draggable
                onDragStart={(e) => handleDragStartSeat(e, seat)}
                onDragEnd={handleDragEnd}
                onClick={() => {
                  const target =
                    seat.groupId === activeTargetGroupId ? 'unassigned' : activeTargetGroupId;
                  onMoveSeat(seat.id, target);
                }}
                title={`${party.shortName} mandat #${seat.seatIndex} — dra eller klicka för att flytta`}
                className="group inline-flex items-center gap-1 px-2 py-1.5 rounded-md border border-slate-200 bg-white hover:border-slate-400 cursor-grab active:cursor-grabbing transition-colors select-none shadow-2xs"
              >
                <span
                  className="w-2.5 h-2.5 rounded-xs shrink-0"
                  style={{ backgroundColor: party.color }}
                  aria-hidden="true"
                />
                <span className="font-mono text-xs font-semibold text-slate-800">
                  {party.code}
                </span>
                <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                  #{seat.seatIndex}
                </span>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {clusters.map(({ partyId, seats: partySeats }) => {
          const party = PARTIES[partyId];
          const totalPartySeats =
            term.parties.find((p) => p.partyId === partyId)?.seats ?? partySeats.length;
          const isSplit = partySeats.length < totalPartySeats;

          return (
            <div
              key={`${zoneId}-${partyId}`}
              draggable
              onDragStart={(e) => handleDragStartParty(e, partyId, zoneId)}
              onDragEnd={handleDragEnd}
              className="group flex flex-col gap-2 p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 cursor-grab active:cursor-grabbing transition-all select-none"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <GripVertical
                    className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0"
                    aria-hidden="true"
                  />
                  <span
                    className="w-7 h-7 rounded-md flex items-center justify-center text-white font-mono text-xs font-semibold shrink-0"
                    style={{ backgroundColor: party.color }}
                  >
                    {party.code}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {party.shortName}
                    </div>
                    <div className="text-xs text-slate-500 font-mono tabular-nums">
                      {isSplit
                        ? `${partySeats.length} av ${totalPartySeats} mandat`
                        : `${partySeats.length} ${partySeats.length === 1 ? 'mandat' : 'mandat'}`}
                      <span className="text-slate-300 mx-1.5">·</span>
                      <span>
                        {((partySeats.length / term.totalSeats) * 100).toFixed(1).replace('.', ',')}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick move buttons (accessible fallback for touch & keyboard) */}
                <div className="flex items-center gap-1 shrink-0">
                  {zoneId === 'unassigned' ? (
                    collaborations.map((collab, idx) => (
                      <button
                        key={collab.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMovePartyFromZone(partyId, zoneId, collab.id);
                        }}
                        title={`Lägg till i ${collab.name}`}
                        className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Till {String.fromCharCode(65 + idx)}
                      </button>
                    ))
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMovePartyFromZone(partyId, zoneId, 'unassigned');
                      }}
                      title={`Ta bort ${party.shortName} från samarbete`}
                      aria-label={`Ta bort ${party.shortName}`}
                      className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Visual representation of every seat belonging to this party */}
              <div className="flex flex-wrap items-center gap-1 pl-6" aria-hidden="true">
                {partySeats.map((s) => (
                  <span
                    key={s.id}
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: party.color, opacity: 0.85 }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section id="bygg-samarbete" className="space-y-4">
      {/* Section Header & Drag Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Dra mandat till olika samarbeten
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Dra partier från bänken till ett eller flera samarbeten, eller växla till enskilda
            mandat för att testa avhopp och splittrade delegationer.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div
            className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg"
            role="group"
            aria-label="Välj vad som dras"
          >
            <button
              type="button"
              onClick={() => onDragModeChange('party')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                dragMode === 'party'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dra hela partier
            </button>
            <button
              type="button"
              onClick={() => onDragModeChange('seat')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                dragMode === 'seat'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dra enskilda mandat ({term.totalSeats})
            </button>
          </div>

          {collaborations.length < 4 && (
            <button
              type="button"
              onClick={onAddCollaboration}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 hover:border-slate-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Nytt samarbete
            </button>
          )}
        </div>
      </div>

      {/* Main Drag & Drop Grid: Left Unassigned Pool + Right Collaborations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Pool: Unassigned Parties / Seats */}
        <div
          onDragOver={(e) => handleDragOverZone(e, 'unassigned')}
          onDragLeave={() => setDragOverZoneId((prev) => (prev === 'unassigned' ? null : prev))}
          onDrop={(e) => handleDropZone(e, 'unassigned')}
          className={`lg:col-span-4 bg-slate-100/70 border rounded-xl p-4 transition-colors ${
            dragOverZoneId === 'unassigned'
              ? 'border-slate-900 ring-2 ring-slate-900/15 bg-slate-100'
              : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200/80">
            <div>
              <h3 className="font-display text-sm font-semibold text-slate-900">
                Ej placerade mandat
              </h3>
              <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                {unassignedSeats.length} av {term.totalSeats} mandat kvar i bänken
              </p>
            </div>
          </div>

          {renderZoneTokens('unassigned', unassignedSeats)}
        </div>

        {/* Right: Collaborations Grid */}
        <div
          className={`lg:col-span-8 grid grid-cols-1 ${
            collaborations.length >= 2 ? 'md:grid-cols-2' : ''
          } gap-5`}
        >
          {collaborations.map((group) => {
            const groupSeats = seats.filter((s) => s.groupId === group.id);
            const seatCount = groupSeats.length;
            const hasMajority = seatCount >= term.majorityThreshold;
            const missingSeats = Math.max(0, term.majorityThreshold - seatCount);
            const surplusSeats = Math.max(0, seatCount - term.majorityThreshold);
            const sharePercent = ((seatCount / term.totalSeats) * 100).toFixed(1).replace('.', ',');
            const isTarget = activeTargetGroupId === group.id;
            const isDragOver = dragOverZoneId === group.id;

            const groupClusters = groupSeatsByParty(groupSeats);
            const thresholdPercent = 50;

            const suggestions =
              seatCount > 0 && !hasMajority
                ? suggestMajorityCompletions(
                    seatCount,
                    term.majorityThreshold,
                    unassignedPartyCounts
                  )
                : [];

            return (
              <div
                key={group.id}
                onDragOver={(e) => handleDragOverZone(e, group.id)}
                onDragLeave={() => setDragOverZoneId((prev) => (prev === group.id ? null : prev))}
                onDrop={(e) => handleDropZone(e, group.id)}
                className={`bg-white border rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-all ${
                  isDragOver
                    ? 'border-slate-900 ring-2 ring-slate-900/15 bg-slate-50/40'
                    : isTarget
                      ? 'border-slate-400'
                      : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Collaboration Header */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="min-w-0 flex-1">
                      {editingGroupId === group.id ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            commitEditingName();
                          }}
                          className="flex items-center gap-1.5"
                        >
                          <input
                            type="text"
                            value={editingDraft}
                            onChange={(e) => setEditingDraft(e.target.value)}
                            onBlur={commitEditingName}
                            autoFocus
                            maxLength={40}
                            className="w-full px-2 py-1 text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                          <button
                            type="submit"
                            className="p-1.5 text-slate-700 hover:text-slate-900 cursor-pointer"
                            aria-label="Spara namn"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </form>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectTargetGroup(group.id)}
                            className="text-left font-display text-base font-bold text-slate-900 hover:underline truncate cursor-pointer"
                            title="Klicka för att välja som aktivt mål i plenisalen"
                          >
                            {group.name}
                          </button>
                          <button
                            type="button"
                            onClick={() => startEditingName(group)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                            aria-label={`Byt namn på ${group.name}`}
                            title="Byt namn"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-1">
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          {seatCount} / {term.totalSeats} mandat
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{sharePercent} %</span>
                        {isTarget && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-700 font-medium">Aktiv i plenisalen</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {seatCount > 0 && (
                        <button
                          type="button"
                          onClick={() => onClearCollaboration(group.id)}
                          title="Töm samarbete"
                          aria-label={`Töm ${group.name}`}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {collaborations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onRemoveCollaboration(group.id)}
                          title="Ta bort samarbete"
                          aria-label={`Ta bort ${group.name}`}
                          className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Majority Meter Bar */}
                  <div className="my-4">
                    <div className="flex items-center justify-between text-xs mb-2">
                      {seatCount === 0 ? (
                        <span className="text-slate-500">
                          Behöver minst {term.majorityThreshold} mandat för majoritet
                        </span>
                      ) : hasMajority ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                          {surplusSeats === 0
                            ? `Exakt majoritet (${seatCount} mandat)`
                            : `Majoritet uppnådd (+${surplusSeats} ${
                                surplusSeats === 1 ? 'mandat' : 'mandat'
                              } över gränsen)`}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
                          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                          Minoritetsläge · Saknar {missingSeats}{' '}
                          {missingSeats === 1 ? 'mandat' : 'mandat'}
                        </span>
                      )}
                      <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                        Gräns: {term.majorityThreshold}
                      </span>
                    </div>

                    {/* Stacked Seat Progress Bar */}
                    <div className="relative h-4 w-full bg-slate-100 rounded-md overflow-hidden border border-slate-200/70">
                      <div className="flex h-full w-full">
                        {groupClusters.map(({ partyId, seats: partySeats }) => {
                          const widthPct = (partySeats.length / term.totalSeats) * 100;
                          return (
                            <div
                              key={`bar-${group.id}-${partyId}`}
                              style={{
                                width: `${widthPct}%`,
                                backgroundColor: PARTIES[partyId].color,
                              }}
                              className="h-full border-r border-white/60 last:border-r-0 transition-all duration-200"
                              title={`${PARTIES[partyId].shortName}: ${partySeats.length} mandat`}
                            />
                          );
                        })}
                      </div>

                      {/* Threshold Marker Line */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
                        style={{ left: `${thresholdPercent}%` }}
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  {/* Placed Parties / Seats */}
                  {renderZoneTokens(group.id, groupSeats)}
                </div>

                {/* Contextual Majority Completion Suggestions */}
                {suggestions.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="text-xs font-medium text-slate-700 mb-2">
                      Förslag från bänken som ger majoritet:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.map((sug) => {
                        const label = sug.partyIds.map((id) => PARTIES[id].code).join(' + ');
                        return (
                          <button
                            key={sug.partyIds.join('-')}
                            type="button"
                            onClick={() => onMovePartiesToGroup(sug.partyIds, group.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-900 hover:text-white rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <span>+ {label}</span>
                            <ArrowRight className="w-3 h-3 opacity-60" aria-hidden="true" />
                            <span className="font-mono tabular-nums">{sug.resultingSeats}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
