import React, { useMemo, useState } from 'react';
import {
  CollaborationGroup,
  ElectionTerm,
  PARTIES,
  SeatItem,
} from '../data/tierpMandat';

export type HemicycleLayoutMode = 'coalition' | 'spectrum';

interface HemicycleChartProps {
  term: ElectionTerm;
  seats: SeatItem[];
  collaborations: CollaborationGroup[];
  activeTargetGroupId: string;
  dragMode: 'party' | 'seat';
  layoutMode: HemicycleLayoutMode;
  onLayoutModeChange: (mode: HemicycleLayoutMode) => void;
  onSeatClick: (seat: SeatItem) => void;
}

interface PositionedSeat {
  seat: SeatItem;
  x: number;
  y: number;
  angle: number;
  radius: number;
}

function generateHemicycleSlots(totalSeats: number, cx: number, cy: number) {
  const radii = totalSeats > 44 ? [108, 140, 172, 204] : [116, 152, 188];
  const radiusSum = radii.reduce((acc, r) => acc + r, 0);

  // Allocate seat counts proportionally to arc circumference
  const rowCounts = radii.map((r) => Math.floor((r / radiusSum) * totalSeats));
  let assigned = rowCounts.reduce((acc, c) => acc + c, 0);
  let idx = radii.length - 1;
  while (assigned < totalSeats) {
    rowCounts[idx]++;
    assigned++;
    idx = idx === 0 ? radii.length - 1 : idx - 1;
  }

  const slots: { x: number; y: number; angle: number; radius: number }[] = [];
  const marginAngle = 0.06; // subtle lift off horizontal baseline

  radii.forEach((r, rIdx) => {
    const count = rowCounts[rIdx];
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const angle = Math.PI - marginAngle - t * (Math.PI - 2 * marginAngle);
      const x = cx + r * Math.cos(angle);
      const y = cy - r * Math.sin(angle);
      slots.push({ x, y, angle, radius: r });
    }
  });

  // Sort strictly from left (PI) to right (0) so wedges stay contiguous across rows
  slots.sort((a, b) => b.angle - a.angle || a.radius - b.radius);
  return slots;
}

export const HemicycleChart: React.FC<HemicycleChartProps> = ({
  term,
  seats,
  collaborations,
  activeTargetGroupId,
  dragMode,
  layoutMode,
  onLayoutModeChange,
  onSeatClick,
}) => {
  const [hoveredSeatId, setHoveredSeatId] = useState<string | null>(null);

  const cx = 260;
  const cy = 236;

  const groupIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    collaborations.forEach((c, index) => map.set(c.id, index));
    return map;
  }, [collaborations]);

  const orderedSeats = useMemo(() => {
    const copy = [...seats];
    if (layoutMode === 'spectrum') {
      copy.sort((a, b) => {
        const orderDiff = PARTIES[a.partyId].spectrumOrder - PARTIES[b.partyId].spectrumOrder;
        if (orderDiff !== 0) return orderDiff;
        return a.seatIndex - b.seatIndex;
      });
    } else {
      // Group by collaboration order (collab-1, collab-2, ..., unassigned last)
      copy.sort((a, b) => {
        const idxA = a.groupId === 'unassigned' ? 999 : (groupIndexMap.get(a.groupId) ?? 998);
        const idxB = b.groupId === 'unassigned' ? 999 : (groupIndexMap.get(b.groupId) ?? 998);
        if (idxA !== idxB) return idxA - idxB;

        const orderDiff = PARTIES[a.partyId].spectrumOrder - PARTIES[b.partyId].spectrumOrder;
        if (orderDiff !== 0) return orderDiff;
        return a.seatIndex - b.seatIndex;
      });
    }
    return copy;
  }, [seats, layoutMode, groupIndexMap]);

  const positionedSeats: PositionedSeat[] = useMemo(() => {
    const slots = generateHemicycleSlots(orderedSeats.length, cx, cy);
    return orderedSeats.map((seat, i) => ({
      seat,
      ...slots[i],
    }));
  }, [orderedSeats]);

  const hoveredSeat = useMemo(
    () => positionedSeats.find((p) => p.seat.id === hoveredSeatId)?.seat ?? null,
    [positionedSeats, hoveredSeatId]
  );

  const primaryGroup = collaborations[0];
  const primaryGroupCount = seats.filter((s) => s.groupId === primaryGroup?.id).length;
  const assignedCount = seats.filter((s) => s.groupId !== 'unassigned').length;

  const seatRadius = term.totalSeats > 44 ? 9.2 : 10.5;

  const hoveredParty = hoveredSeat ? PARTIES[hoveredSeat.partyId] : null;
  const hoveredGroupName = hoveredSeat
    ? hoveredSeat.groupId === 'unassigned'
      ? 'Ej placerad'
      : collaborations.find((c) => c.id === hoveredSeat.groupId)?.name ?? 'Samarbete'
    : null;

  const targetGroupName =
    collaborations.find((c) => c.id === activeTargetGroupId)?.name ?? 'Samarbete A';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900 tracking-tight">
            Plenisalens {term.totalSeats} mandat
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {dragMode === 'party'
              ? `Klicka på en stol för att flytta partiet till eller från ${targetGroupName}.`
              : `Klicka på en stol för att flytta just det mandatet till eller från ${targetGroupName}.`}
          </p>
        </div>

        <div
          className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto"
          role="group"
          aria-label="Sortering i plenisalen"
        >
          <button
            type="button"
            onClick={() => onLayoutModeChange('coalition')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              layoutMode === 'coalition'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Efter samarbete
          </button>
          <button
            type="button"
            onClick={() => onLayoutModeChange('spectrum')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              layoutMode === 'spectrum'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Politisk skala V–SD
          </button>
        </div>
      </div>

      {/* SVG Hemicycle */}
      <div className="relative w-full max-w-[540px] mx-auto">
        <svg
          viewBox="0 0 520 264"
          className="w-full h-auto overflow-visible select-none"
          role="img"
          aria-label={`Tierps kommunfullmäktiges ${term.totalSeats} mandat i halvcirkel`}
        >
          {/* Subtle semi-circular arc guide */}
          <path
            d={`M ${cx - 210} ${cy} A 210 210 0 0 1 ${cx + 210} ${cy}`}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="1"
          />

          {/* 50% Majority center vertical guide */}
          <line
            x1={cx}
            y1={cy - 224}
            x2={cx}
            y2={cy - 86}
            stroke="#0F172A"
            strokeWidth="1.25"
            strokeDasharray="4 4"
            opacity="0.45"
          />
          <text
            x={cx}
            y={cy - 232}
            textAnchor="middle"
            className="fill-slate-600 text-[10px] font-mono font-medium"
          >
            Majoritet {term.majorityThreshold} mandat
          </text>

          {/* Individual seats */}
          {positionedSeats.map(({ seat, x, y }) => {
            const party = PARTIES[seat.partyId];
            const isAssigned = seat.groupId !== 'unassigned';
            const groupIdx = groupIndexMap.get(seat.groupId) ?? -1;
            const isHovered = hoveredSeatId === seat.id;
            const isPrimary = groupIdx === 0;

            return (
              <g
                key={seat.id}
                transform={`translate(${x}, ${y})`}
                onClick={() => onSeatClick(seat)}
                onMouseEnter={() => setHoveredSeatId(seat.id)}
                onMouseLeave={() => setHoveredSeatId(null)}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`${party.shortName} mandat ${seat.seatIndex}, ${
                  isAssigned
                    ? collaborations.find((c) => c.id === seat.groupId)?.name
                    : 'Ej placerad'
                }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSeatClick(seat);
                  }
                }}
              >
                {/* Collaboration indicator halo when assigned */}
                {isAssigned && (
                  <circle
                    r={seatRadius + 3}
                    fill="none"
                    stroke={isPrimary ? '#0F172A' : '#64748B'}
                    strokeWidth={isPrimary ? 1.75 : 1.25}
                    strokeDasharray={isPrimary ? undefined : '2.5 2'}
                    opacity={isHovered ? 1 : 0.75}
                  />
                )}

                <circle
                  r={isHovered ? seatRadius + 1.5 : seatRadius}
                  fill={party.color}
                  opacity={
                    layoutMode === 'coalition' && !isAssigned && assignedCount > 0
                      ? 0.36
                      : isHovered
                        ? 1
                        : 0.92
                  }
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  className="transition-transform duration-150"
                />

                {/* Subtle party code inside seat for clear non-hue identification */}
                <text
                  y="3"
                  textAnchor="middle"
                  className="fill-white font-mono font-semibold pointer-events-none"
                  style={{ fontSize: party.code.length > 1 ? '6.8px' : '7.8px' }}
                >
                  {party.code}
                </text>
              </g>
            );
          })}

          {/* Center readout inside the hemicycle podium */}
          <g transform={`translate(${cx}, ${cy - 20})`}>
            {hoveredSeat && hoveredParty ? (
              <>
                <text
                  y="-22"
                  textAnchor="middle"
                  className="fill-slate-900 font-display font-bold text-[15px]"
                >
                  {hoveredParty.shortName} #{hoveredSeat.seatIndex}
                </text>
                <text
                  y="-4"
                  textAnchor="middle"
                  className="fill-slate-500 text-[11px] font-medium"
                >
                  {hoveredGroupName}
                </text>
              </>
            ) : (
              <>
                <text
                  y="-26"
                  textAnchor="middle"
                  className="fill-slate-900 font-mono font-semibold text-[26px] tabular-nums"
                >
                  {primaryGroupCount} / {term.totalSeats}
                </text>
                <text
                  y="-6"
                  textAnchor="middle"
                  className="fill-slate-500 text-[11px] font-medium"
                >
                  {primaryGroup?.name ?? 'Samarbete A'} · {primaryGroupCount >= term.majorityThreshold ? 'Majoritet' : `Saknar ${term.majorityThreshold - primaryGroupCount}`}
                </text>
              </>
            )}
          </g>
        </svg>
      </div>

      {/* Legend strip (clean inline text, zero pills) */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {term.parties
            .filter((p) => p.seats > 0)
            .sort((a, b) => PARTIES[a.partyId].spectrumOrder - PARTIES[b.partyId].spectrumOrder)
            .map((p) => {
              const party = PARTIES[p.partyId];
              return (
                <span key={p.partyId} className="inline-flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-xs shrink-0"
                    style={{ backgroundColor: party.color }}
                    aria-hidden="true"
                  />
                  <span className="font-medium text-slate-800">{party.code}</span>
                  <span className="font-mono tabular-nums text-slate-500">{p.seats}</span>
                </span>
              );
            })}
        </div>
        <div className="text-slate-500 font-mono tabular-nums">
          Placerade: {assignedCount}/{term.totalSeats}
        </div>
      </div>
    </div>
  );
};
