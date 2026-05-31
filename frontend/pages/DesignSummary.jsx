import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Sparkles,
    CheckCircle2,
    AlertTriangle,
    IndianRupee,
    ChevronDown,
    ChevronUp,
    Building2,
    Phone,
    Save,
    ShoppingBag,
    ArrowRight,
    Award,
} from 'lucide-react';

const STORAGE_KEY = 'a2s-design-journey';

// Animated counter — ticks from 0 to `target` over `duration` ms with
// ease-out cubic. Returns the live value for the caller to format.
const useCountUp = (target, duration = 1800) => {
    const [value, setValue] = React.useState(0);
    React.useEffect(() => {
        if (!target || target <= 0) { setValue(0); return; }
        const start = performance.now();
        let raf = 0;
        const tick = (now) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(Math.round(target * eased));
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [target, duration]);
    return value;
};

const formatCurrency = (value) => {
    const n = Number(value) || 0;
    if (n >= 100000) {
        return `₹${(n / 100000).toFixed(2)}L`;
    }
    return `₹${n.toLocaleString('en-IN')}`;
};

const getVastuBand = (score) => {
    if (score == null || Number.isNaN(score)) {
        return null;
    }
    if (score < 50) {
        return {
            label: 'Poor',
            textClass: 'text-red-700',
            bgClass: 'bg-red-50',
            borderClass: 'border-red-300',
            dotColor: '#b91c1c',
        };
    }
    if (score < 70) {
        return {
            label: 'Needs Work',
            textClass: 'text-amber-700',
            bgClass: 'bg-amber-50',
            borderClass: 'border-amber-300',
            dotColor: '#b45309',
        };
    }
    if (score < 85) {
        return {
            label: 'Good',
            textClass: 'text-emerald-700',
            bgClass: 'bg-emerald-50',
            borderClass: 'border-emerald-300',
            dotColor: '#047857',
        };
    }
    return {
        label: 'Excellent Vastu',
        textClass: 'text-on-accent',
        bgClass: 'bg-accent/10',
        borderClass: 'border-accent/30',
        dotColor: '#B8763D',
    };
};

const CatalogItemCard = ({ item }) => {
    const name = item?.name || item?.title || 'Furniture item';
    const brand = item?.brand || item?.vendor || 'A2S Catalog';
    const price = item?.price ?? item?.estimate ?? 0;
    const image = item?.imageUrl || item?.image || item?.thumbnail;
    return (
        <li className="flex items-center gap-3 rounded-lg border border-premium bg-surface p-3">
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-main">
                {image ? (
                    <img
                        src={image}
                        alt={`${name} by ${brand}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div
                        className="flex h-full w-full items-center justify-center text-xs text-muted"
                        aria-hidden="true"
                    >
                        <ShoppingBag size={18} />
                    </div>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-main">{name}</p>
                <p className="truncate text-xs text-muted">{brand}</p>
            </div>
            <div className="text-sm font-semibold text-accent">
                {formatCurrency(price)}
            </div>
        </li>
    );
};

const RoomCard = ({ room }) => {
    const [expanded, setExpanded] = useState(false);
    const items = room?.catalogBundle?.items || [];
    const totalEstimate = room?.catalogBundle?.totalEstimate || 0;
    const previewItems = items.slice(0, 3);
    const restItems = items.slice(3);
    const band = getVastuBand(room?.vastuScore);
    const headingId = `room-${room.roomType}-heading`;

    return (
        <article
            aria-labelledby={headingId}
            className="overflow-hidden rounded-2xl border border-premium bg-surface shadow-sm"
        >
            <div className="grid grid-cols-1 md:grid-cols-5">
                <div className="md:col-span-2 bg-main">
                    {room.beforeDataUrl ? (
                        <img
                            src={room.beforeDataUrl}
                            alt={`Before staging — ${room.roomLabel}`}
                            className="h-full max-h-72 w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-48 items-center justify-center text-sm text-muted">
                            No before image
                        </div>
                    )}
                </div>
                <div className="md:col-span-3 bg-main">
                    {room.afterDataUrl ? (
                        <img
                            src={room.afterDataUrl}
                            alt={`After staging — ${room.roomLabel}`}
                            className="h-full max-h-72 w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-48 items-center justify-center text-sm text-muted">
                            No staged image
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3
                            id={headingId}
                            className="font-serif text-xl text-main"
                        >
                            {room.roomLabel || room.roomType}
                        </h3>
                        <p className="text-sm text-muted">
                            {items.length} curated items · {formatCurrency(totalEstimate)}
                        </p>
                    </div>
                    {band && (
                        <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${band.bgClass} ${band.borderClass} ${band.textClass}`}
                            aria-label={`Vastu score ${room.vastuScore} out of 100 — ${band.label}`}
                        >
                            <span
                                aria-hidden="true"
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ backgroundColor: band.dotColor }}
                            />
                            {band.label === 'Excellent Vastu' && (
                                <Award size={14} aria-hidden="true" />
                            )}
                            Vastu {room.vastuScore ?? '—'} · {band.label}
                        </span>
                    )}
                </div>

                {room?.vastuOverlay?.violations?.length > 0 && (
                    <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <Award size={14} className="text-accent" />
                            <span className="text-xs uppercase tracking-[0.2em] font-bold text-accent">
                                Vastu HUD findings
                            </span>
                        </div>
                        {room.vastuOverlay.summary && (
                            <p className="text-sm text-main leading-relaxed italic">{room.vastuOverlay.summary}</p>
                        )}
                        <ul className="space-y-2">
                            {room.vastuOverlay.violations.slice(0, 3).map((v, idx) => {
                                const sev = v.severity || 'medium';
                                const sevColor = sev === 'high' ? '#dc2626' : sev === 'medium' ? '#f59e0b' : '#16a34a';
                                return (
                                    <li key={idx} className="flex items-start gap-2 text-xs">
                                        <span
                                            className="mt-0.5 inline-block h-2 w-2 rounded-full shrink-0"
                                            style={{ backgroundColor: sevColor }}
                                            aria-hidden="true"
                                        />
                                        <div className="flex-1">
                                            <p className="font-semibold text-main">{v.issue}</p>
                                            <p className="text-muted mt-0.5">
                                                <span className="text-accent font-semibold">Fix:</span> {v.fix}
                                                {v.direction_hint && <span className="ml-2 text-accent">↑ {v.direction_hint}</span>}
                                            </p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                        {room.vastuOverlay.violations.length > 3 && (
                            <p className="text-[11px] text-muted">
                                + {room.vastuOverlay.violations.length - 3} more · open <span className="text-accent font-semibold">/vastu-hud</span> to see them drawn on the photo
                            </p>
                        )}
                    </div>
                )}

                <div>
                    <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
                        What's in this room
                    </h4>
                    <ul className="space-y-2">
                        {previewItems.map((item, idx) => (
                            <CatalogItemCard
                                key={item?.id || `${room.roomType}-prev-${idx}`}
                                item={item}
                            />
                        ))}
                    </ul>
                    {restItems.length > 0 && (
                        <>
                            <button
                                type="button"
                                onClick={() => setExpanded((v) => !v)}
                                aria-expanded={expanded}
                                aria-controls={`room-${room.roomType}-rest`}
                                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                            >
                                {expanded ? (
                                    <>
                                        Hide extra items <ChevronUp size={16} aria-hidden="true" />
                                    </>
                                ) : (
                                    <>
                                        See all {items.length} items{' '}
                                        <ChevronDown size={16} aria-hidden="true" />
                                    </>
                                )}
                            </button>
                            {expanded && (
                                <ul
                                    id={`room-${room.roomType}-rest`}
                                    className="mt-3 space-y-2"
                                >
                                    {restItems.map((item, idx) => (
                                        <CatalogItemCard
                                            key={item?.id || `${room.roomType}-rest-${idx}`}
                                            item={item}
                                        />
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                </div>
            </div>
        </article>
    );
};

const AnimatedTotal = ({ total }) => {
    const v = useCountUp(total, 1800);
    return (
        <p className="mt-4 flex items-baseline gap-2">
            <IndianRupee size={24} aria-hidden="true" className="text-accent sm:hidden" />
            <IndianRupee size={28} aria-hidden="true" className="text-accent hidden sm:inline-block" />
            <span className="font-serif text-3xl sm:text-4xl text-main md:text-5xl tabular-nums">
                {formatCurrency(v).replace('₹', '')}
            </span>
        </p>
    );
};

const AnimatedEmi = ({ emi }) => {
    const v = useCountUp(emi, 1800);
    return <span className="font-semibold text-accent tabular-nums">{formatCurrency(v)}</span>;
};

const DesignSummary = () => {
    const navigate = useNavigate();
    const [journey, setJourney] = useState(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            if (!raw) {
                navigate('/design', { replace: true });
                return;
            }
            const parsed = JSON.parse(raw);
            if (!parsed || !Array.isArray(parsed.rooms) || parsed.rooms.length === 0) {
                navigate('/design', { replace: true });
                return;
            }
            setJourney(parsed);
        } catch (err) {
            navigate('/design', { replace: true });
            return;
        } finally {
            setLoaded(true);
        }
    }, [navigate]);

    const rollup = useMemo(() => {
        if (!journey?.rooms) {
            return { total: 0, perRoom: [], emi: 0 };
        }
        const perRoom = journey.rooms.map((room) => ({
            roomType: room.roomType,
            roomLabel: room.roomLabel || room.roomType,
            total: Number(room?.catalogBundle?.totalEstimate || 0),
        }));
        const total = perRoom.reduce((sum, r) => sum + r.total, 0);
        const emi = Math.round(total / 36);
        return { total, perRoom, emi };
    }, [journey]);

    const handleRestart = () => {
        sessionStorage.removeItem(STORAGE_KEY);
        navigate('/design');
    };

    const handleSave = () => {
        const blob = new Blob([JSON.stringify(journey, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `a2s-design-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!loaded || !journey) {
        return (
            <main className="min-h-screen bg-main">
                <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted">
                    Loading your design…
                </div>
            </main>
        );
    }

    const styleLabel = journey.style
        ? journey.style.charAt(0).toUpperCase() + journey.style.slice(1)
        : 'Custom';
    const salesTeam = journey.builderName
        ? `${journey.builderName}'s sales team`
        : 'an A2S advisor';

    return (
        <main className="min-h-screen bg-main pb-16">
            {/* Hero strip */}
            <section
                aria-labelledby="summary-hero"
                className="border-b border-premium bg-surface"
            >
                <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:px-6 lg:px-8 pt-12 pb-8 sm:py-10 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="mb-2 inline-flex items-center gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-accent">
                            <Sparkles size={14} aria-hidden="true" /> Design Summary
                        </p>
                        <h1
                            id="summary-hero"
                            className="font-serif text-2xl sm:text-3xl text-main md:text-4xl"
                        >
                            Your home, fully designed.
                        </h1>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            {journey.builderName && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                                    <Building2 size={14} aria-hidden="true" />
                                    for {journey.builderName}
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1 rounded-full border border-premium bg-main px-3 py-1 text-xs font-medium text-main">
                                {styleLabel} style
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-premium bg-main px-3 py-1 text-xs font-medium text-main">
                                <CheckCircle2 size={14} aria-hidden="true" />
                                {journey.rooms.length} room
                                {journey.rooms.length === 1 ? '' : 's'} staged
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-shrink-0 gap-2">
                        <button
                            type="button"
                            onClick={handleRestart}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-premium bg-main px-4 py-2 text-sm font-medium text-main hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                            <AlertTriangle size={16} aria-hidden="true" />
                            Restart
                        </button>
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-6xl space-y-8 sm:space-y-10 px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
                {/* Cost rollup */}
                <section
                    aria-labelledby="cost-rollup"
                    className="rounded-2xl border border-premium bg-surface p-6 shadow-sm"
                >
                    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                        <div>
                            <h2
                                id="cost-rollup"
                                className="font-serif text-2xl text-main"
                            >
                                Total cost rollup
                            </h2>
                            <p className="mt-1 text-sm text-muted">
                                Estimated furniture and finishes across all rooms.
                            </p>
                            <AnimatedTotal total={rollup.total} emi={rollup.emi} />
                            <p className="mt-2 text-sm text-muted">
                                EMI from <AnimatedEmi emi={rollup.emi} />/month for 36 months
                            </p>
                        </div>

                        <div className="w-full max-w-sm">
                            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                                Per-room breakdown
                            </h3>
                            <ul className="space-y-2">
                                {rollup.perRoom.map((row) => (
                                    <li
                                        key={row.roomType}
                                        className="flex items-center justify-between rounded-md border border-premium bg-main px-3 py-2 text-sm"
                                    >
                                        <span className="text-main">{row.roomLabel}</span>
                                        <span className="font-semibold text-accent">
                                            {formatCurrency(row.total)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Per-room grid */}
                <section aria-labelledby="rooms-heading" className="space-y-6">
                    <h2
                        id="rooms-heading"
                        className="font-serif text-2xl text-main"
                    >
                        Your rooms
                    </h2>
                    <div className="grid grid-cols-1 gap-6">
                        {journey.rooms.map((room, idx) => (
                            <RoomCard
                                key={`${room.roomType}-${idx}`}
                                room={room}
                            />
                        ))}
                    </div>
                </section>

                {/* Final CTA strip */}
                <section
                    aria-labelledby="final-cta"
                    className="rounded-2xl border border-accent/30 bg-accent/10 p-6"
                >
                    <h2
                        id="final-cta"
                        className="font-serif text-2xl text-main"
                    >
                        Ready to make it real?
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                        Connect with {salesTeam}, save this design for later, or
                        start ordering furniture today.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <Link
                            to="/contact"
                            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                            style={{
                                backgroundColor: 'var(--accent)',
                                color: '#ffffff',
                            }}
                        >
                            <Phone size={16} aria-hidden="true" />
                            Talk to {journey.builderName ? `${journey.builderName}'s` : 'our'} sales team
                            <ArrowRight size={16} aria-hidden="true" />
                        </Link>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="inline-flex items-center gap-2 rounded-md border border-accent bg-main px-4 py-2 text-sm font-semibold text-accent hover:bg-accent/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                            <Save size={16} aria-hidden="true" />
                            Save this design
                        </button>
                        <Link
                            to="/shop"
                            className="inline-flex items-center gap-2 rounded-md border border-premium bg-surface px-4 py-2 text-sm font-semibold text-main hover:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                            <ShoppingBag size={16} aria-hidden="true" />
                            Order furniture now
                        </Link>
                    </div>
                </section>
            </div>
        </main>
    );
};

export default DesignSummary;
