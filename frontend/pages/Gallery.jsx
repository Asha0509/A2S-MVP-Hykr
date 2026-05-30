import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Sparkles, Search, X, IndianRupee, Eye, ArrowUp, SlidersHorizontal,
    ArrowUpRight, Home, Sofa, ChevronDown, Grid3X3, Rows3, TrendingUp, Layout,
    Compass, Layers, Award, Box
} from 'lucide-react';
import DesignCard from '../components/DesignCard';
import ProductCard from '../components/ProductCard';
import RelatedProducts from '../components/RelatedProducts';
import ImageGallery from '../components/ImageGallery';
import FilterSidebar from '../components/FilterSidebar';
import SkeletonCard from '../components/SkeletonCard';
import ProductDetailModal from '../components/ProductDetailModal';
import { INITIAL_FILTER_STATE, FURNITURE_CATEGORY_GROUPS, matchesItemTypeGroup } from '../constants';
import { getInitialFiltersFromOnboarding } from '../utils/storage';
import { getDesigns, getProducts, getDesignsCached, getProductsCached } from '../services/api';
import { openProductInNewTab } from '../utils/productLinks';

const PRODUCTS_PAGE_SIZE = 200;
const INITIAL_VISIBLE_ITEMS = 24;
const LOAD_MORE_STEP = 24;

const Gallery = () => {
    const [filters, setFilters] = useState(() => getInitialFiltersFromOnboarding());
    const [designs, setDesigns] = useState([]);
    const [standaloneProducts, setStandaloneProducts] = useState([]);
    const [sortBy, setSortBy] = useState('recommended');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewType, setViewType] = useState('furniture');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [previewItem, setPreviewItem] = useState(null);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [compareProducts, setCompareProducts] = useState([]);
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_ITEMS);
    const [isCatalogSyncing, setIsCatalogSyncing] = useState(false);
    const heroRef = useRef(null);
    const [heroScrolled, setHeroScrolled] = useState(false);

    const normalizeRoomType = useCallback((value) => {
        const raw = String(value || '').trim();
        if (!raw) return '';
        const key = raw.toLowerCase().replace(/_/g, ' ').trim();
        const map = {
            'living room': 'Living Room',
            'livingroom': 'Living Room',
            'living': 'Living Room',
            'bedroom': 'Bedroom',
            'master bedroom': 'Bedroom',
            'guest bedroom': 'Bedroom',
            'dining': 'Dining Room',
            'dining room': 'Dining Room',
            'kitchen': 'Kitchen',
            'office': 'Home Office',
            'home office': 'Home Office',
            'home-office': 'Home Office',
            'study': 'Home Office',
            'bathroom': 'Bathroom',
            'balcony': 'Balcony',
            'pooja room': 'Pooja Room',
            'pooja': 'Pooja Room',
        };
        return map[key] || raw.replace(/\b\w/g, ch => ch.toUpperCase());
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 400);
            if (heroRef.current) {
                setHeroScrolled(window.scrollY > heroRef.current.offsetHeight * 0.5);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: 'smooth' }), []);

    const fetchData = useCallback(async () => {
        try {
            const cachedDesigns = getDesignsCached();
            const cachedProducts = getProductsCached();
            const safeCachedDesigns = Array.isArray(cachedDesigns) ? cachedDesigns : [];
            const safeCachedProducts = Array.isArray(cachedProducts)
                ? cachedProducts.slice(0, PRODUCTS_PAGE_SIZE)
                : [];
            const hasCache = safeCachedDesigns.length > 0 || safeCachedProducts.length > 0;

            if (hasCache) {
                setDesigns(safeCachedDesigns);
                setStandaloneProducts(safeCachedProducts);
                setIsLoading(false);
            } else {
                setIsLoading(true);
            }
            setError(null);
            setIsCatalogSyncing(false);

            // Fetch designs immediately
            const designsData = await getDesigns();
            setDesigns(designsData);
            setIsLoading(false);

            // Fetch only first page initially; remaining pages are loaded explicitly via button.
            const productsResponse = await getProducts(0, PRODUCTS_PAGE_SIZE);
            const firstItems = productsResponse.items || productsResponse || [];
            const seenIds = new Set();
            const uniqueProducts = [];
            firstItems.forEach((item) => {
                if (!seenIds.has(item.id)) {
                    seenIds.add(item.id);
                    uniqueProducts.push(item);
                }
            });
            setStandaloneProducts(uniqueProducts);

            // Keep loading the remaining catalog pages in background so filters have full coverage.
            const preloadFullCatalog = async () => {
                setIsCatalogSyncing(true);
                let page = 1;
                let hasMore = Boolean(productsResponse.hasMore) || firstItems.length >= PRODUCTS_PAGE_SIZE;
                const merged = [...uniqueProducts];

                while (hasMore && page < 500) {
                    const response = await getProducts(page, PRODUCTS_PAGE_SIZE);
                    const pageItems = response.items || response || [];

                    if (!pageItems.length) {
                        break;
                    }

                    pageItems.forEach((item) => {
                        if (!seenIds.has(item.id)) {
                            seenIds.add(item.id);
                            merged.push(item);
                        }
                    });

                    // Periodically publish progress so filters update as data arrives.
                    if (page % 2 === 0) {
                        setStandaloneProducts([...merged]);
                        await new Promise((resolve) => setTimeout(resolve, 0));
                    }

                    hasMore = Boolean(response.hasMore) || pageItems.length >= PRODUCTS_PAGE_SIZE;
                    page += 1;
                }

                setStandaloneProducts(merged);
                setIsCatalogSyncing(false);
            };

            preloadFullCatalog().catch((syncErr) => {
                console.warn('Catalog background sync failed:', syncErr);
                setIsCatalogSyncing(false);
            });
        } catch (err) {
            console.error('Failed to fetch gallery data:', err);
            if (!designs.length && !standaloneProducts.length) {
                setError('Unable to load items. Please check your connection.');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const furnitureItems = useMemo(() => {
        const products = [...standaloneProducts];
        const seenIds = new Set(standaloneProducts.map(p => p.id));
        designs.forEach(design => {
            (design.products || []).forEach(product => {
                if (!seenIds.has(product.id)) { seenIds.add(product.id); products.push(product); }
            });
        });
        return products;
    }, [designs, standaloneProducts]);

    // Dynamic Categories derived from data
    const dynamicCategories = useMemo(() => {
        const cats = [
            { id: 'all', label: 'All Items', icon: Grid3X3, filter: '' }
        ];

        if (viewType === 'rooms') {
            const roomTypes = [...new Set(designs.map(d => d.roomType).filter(Boolean))];
            roomTypes.forEach(rt => {
                let Icon = Layout;
                if (rt.toLowerCase().includes('living')) Icon = Sofa;
                if (rt.toLowerCase().includes('bed')) Icon = Home;
                if (rt.toLowerCase().includes('kitchen')) Icon = Sparkles;
                if (rt.toLowerCase().includes('dining')) Icon = Rows3;
                if (rt.toLowerCase().includes('office')) Icon = TrendingUp;

                cats.push({ id: rt.toLowerCase().replace(/\s+/g, '-'), label: rt, icon: Icon, filter: rt });
            });
        } else {
            const productCats = [...new Set(furnitureItems.map(p => p.category).filter(Boolean))];
            productCats.forEach(pc => {
                cats.push({ id: pc.toLowerCase().replace(/\s+/g, '-'), label: pc, icon: Box, filter: pc });
            });
        }
        return cats;
    }, [designs, furnitureItems, viewType]);

    const filteredItems = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (viewType === 'rooms') {
            const results = designs.filter(design => {
                const matchesPrice = design.totalCost >= (filters.minPrice || 0) && design.totalCost <= (filters.maxPrice || 1000000);
                const matchesStyle = !filters.styles?.length || filters.styles.some(s => (design.style?.toLowerCase() || '').includes(s.toLowerCase()));
                const matchesRoom = !filters.roomTypes?.length || filters.roomTypes.some(r => (design.roomType?.toLowerCase() || '').includes(r.toLowerCase()) || (design.title?.toLowerCase() || '').includes(r.toLowerCase()));
                const matchesSearch = !query || (design.title || '').toLowerCase().includes(query) || (design.style || '').toLowerCase().includes(query) || (design.roomType || '').toLowerCase().includes(query);
                const targetCategory = dynamicCategories.find(c => c.id === activeCategory);
                const matchesCategory = activeCategory === 'all' || (design.roomType?.toLowerCase().includes(targetCategory?.filter?.toLowerCase() || '') || design.category?.toLowerCase().includes(targetCategory?.filter?.toLowerCase() || ''));
                return matchesPrice && matchesStyle && matchesRoom && matchesSearch && matchesCategory;
            });
            return [...results].sort((a, b) => sortBy === 'price-low' ? a.totalCost - b.totalCost : sortBy === 'price-high' ? b.totalCost - a.totalCost : 0);
        } else {
            const results = furnitureItems.filter(product => {
                const matchesPrice = product.price >= (filters.minPrice || 0) && product.price <= (filters.maxPrice || 1000000);
                const targetCategory = dynamicCategories.find(c => c.id === activeCategory);
                const matchesCategory = activeCategory === 'all' || (product.category?.toLowerCase().includes(targetCategory?.filter?.toLowerCase() || ''));
                // "Item Type" filter (sidebar) — map each selected group label to its
                // alias set, then check whether product.category contains any alias.
                // Sofa label matches "sofa"/"loveseat", Storage matches "storage"/"wardrobe", etc.
                const matchesItemType = !filters.roomTypes?.length || filters.roomTypes.some(label => matchesItemTypeGroup(product.category, label));
                const normalizedProductRoom = normalizeRoomType(product.roomType);
                const matchesProductRoomType = !filters.productRoomTypes?.length || filters.productRoomTypes.some(room => {
                    const normalizedFilterRoom = normalizeRoomType(room);
                    return normalizedProductRoom === normalizedFilterRoom;
                });
                // Style is mostly null on scraped products. Treat null as "compatible"
                // so the filter narrows the typed subset without erasing the gallery.
                const productStyle = String(product.aestheticStyle || product.style || '').toLowerCase();
                const matchesStyle = !filters.styles?.length || !productStyle || filters.styles.some(s => productStyle.includes(s.toLowerCase()));
                const matchesSearch = !query || (product.name || '').toLowerCase().includes(query) || (product.brand || '').toLowerCase().includes(query);
                return matchesPrice && matchesCategory && matchesStyle && matchesSearch && matchesItemType && matchesProductRoomType;
            });
            return [...results].sort((a, b) => sortBy === 'price-low' ? a.price - b.price : sortBy === 'price-high' ? b.price - a.price : 0);
        }
    }, [designs, furnitureItems, filters, sortBy, searchQuery, viewType, activeCategory, dynamicCategories, normalizeRoomType]);

    const furnitureMedianPrice = useMemo(() => {
        const prices = (filteredItems || []).map(p => Number(p.price || 0)).filter(v => v > 0).sort((a, b) => a - b);
        if (!prices.length) return 0;
        const mid = Math.floor(prices.length / 2);
        return prices.length % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;
    }, [filteredItems]);

    const displayFurnitureItems = useMemo(() => {
        if (viewType !== 'furniture') return [];
        const groups = new Map();

        const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

        filteredItems.forEach((item) => {
            const category = normalize(item.category);
            const name = normalize(item.name || item.product_name)
                .replace(/\b(ikea|amazon|amazon in|flipkart|wooden street|woodenstreet|pepperfry|urban ladder|urbanladder)\b/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            const key = `${category}|${name}`;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(item);
        });

        return Array.from(groups.values()).map((items) => {
            const sorted = [...items].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
            const primary = { ...sorted[0] };
            const vendors = [...new Set(sorted.map(i => i.vendor).filter(Boolean))];
            const chips = [];

            if (primary.price && furnitureMedianPrice && Number(primary.price) <= furnitureMedianPrice) {
                chips.push('Best value');
            }
            if (filters.styles?.length && String(primary.aestheticStyle || primary.style || '').toLowerCase().includes(String(filters.styles[0]).toLowerCase())) {
                chips.push('Matches your style');
            }
            if (vendors.length > 1) {
                chips.push('Cross-vendor match');
            }

            return {
                ...primary,
                groupedItems: sorted,
                vendorChips: vendors,
                duplicateCount: sorted.length,
                relevanceChips: chips,
            };
        }).sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    }, [filteredItems, viewType, filters.styles, furnitureMedianPrice]);

    const currentItems = viewType === 'furniture' ? displayFurnitureItems : filteredItems;
    const visibleItems = useMemo(
        () => currentItems.slice(0, visibleCount),
        [currentItems, visibleCount]
    );

    useEffect(() => {
        setVisibleCount(INITIAL_VISIBLE_ITEMS);
    }, [viewType, searchQuery, filters, activeCategory, sortBy]);

    const handleGalleryLoadMore = useCallback(async () => {
        setVisibleCount((prev) => Math.min(prev + LOAD_MORE_STEP, currentItems.length));
    }, [currentItems.length]);

    const handleCompareToggle = useCallback((product) => {
        setCompareProducts((prev) => {
            const exists = prev.some((p) => p.id === product.id);
            if (exists) return prev.filter((p) => p.id !== product.id);
            if (prev.length >= 3) return [...prev.slice(1), product];
            return [...prev, product];
        });
    }, []);

    const handleFindSimilar = useCallback((product) => {
        const firstWords = String(product.name || '').split(' ').slice(0, 2).join(' ');
        setSearchQuery(firstWords);
        setActiveCategory('all');
    }, []);

    useEffect(() => {
        if (viewType !== 'furniture' && compareProducts.length) {
            setCompareProducts([]);
        }
    }, [viewType, compareProducts.length]);

    const filterCounts = useMemo(() => {
        const counts = { rooms: {}, styles: {}, productRooms: {} };
        designs.forEach(d => {
            const room = d.roomType;
            const style = d.style;
            if (room) counts.rooms[room] = (counts.rooms[room] || 0) + 1;
            if (style) counts.styles[style] = (counts.styles[style] || 0) + 1;
        });
        furnitureItems.forEach(p => {
            const cat = p.category;
            const roomType = normalizeRoomType(p.roomType);
            if (cat) {
                // Bucket every product into each matching curated group so the
                // sidebar shows a real count next to each "Item Type" chip.
                Object.keys(FURNITURE_CATEGORY_GROUPS).forEach(label => {
                    if (matchesItemTypeGroup(cat, label)) {
                        counts.rooms[label] = (counts.rooms[label] || 0) + 1;
                    }
                });
            }
            if (roomType) counts.productRooms[roomType] = (counts.productRooms[roomType] || 0) + 1;
        });
        return counts;
    }, [designs, furnitureItems, normalizeRoomType]);

    const styleCount = useMemo(() => new Set(designs.map(d => d.style).filter(Boolean)).size, [designs]);

    const activeFilterCount = (filters.roomTypes?.length || 0) + (filters.productRoomTypes?.length || 0) + (filters.styles?.length || 0) + (filters.maxPrice < 200000 ? 1 : 0);

    const trendingSearches = useMemo(() => {
        const tags = designs.flatMap(d => d.tags || []);
        const styles = designs.map(d => d.style).filter(Boolean);
        return [...new Set([...styles, ...tags])].slice(0, 5);
    }, [designs]);

    // Lock scroll when modal is open
    useEffect(() => {
        if (previewItem) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [previewItem]);

    return (
        <div className="min-h-screen bg-main pb-24 transition-all duration-1000 relative overflow-hidden">
            {/* Ambient Background Orbs */}
            <div className="ambient-orb ambient-orb-1 opacity-60" />
            <div className="ambient-orb ambient-orb-2 opacity-60" />

            {/* ── IMMERSIVE 3D ROOM HERO ─────────────────────────────────── */}
            <header ref={heroRef} className="relative overflow-hidden min-h-[85vh] flex items-end group">
                {/* Full-bleed 3D Room Background */}
                <div className="absolute inset-0">
                    <img
                        src="/gallery.png"
                        alt="Immersive Living Space"
                        className="w-full h-full object-cover"
                        loading="eager"
                    />
                    <div className="absolute inset-0 shadow-[inset_0_0_150px_40px_rgba(0,0,0,0.3)]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-[var(--color-main)] via-[var(--color-main)]/60 to-transparent" />
                    <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/20 to-transparent" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-8 pb-24 w-full">
                    <div className="max-w-4xl lg:max-w-none">
                        <div className="flex items-center gap-4 mb-8 animate-fade-in-up">
                            <div className="w-16 h-px bg-accent shadow-[0_0_20px_rgba(29,97,114,0.8)]" />
                            <span className="text-[11px] font-black text-accent uppercase tracking-[0.7em] drop-shadow-2xl">The Unspoken</span>
                        </div>

                        <h1 className="font-serif text-6xl md:text-8xl font-black text-white leading-[0.95] tracking-tighter mb-10 animate-fade-in-up drop-shadow-[0_10px_40px_rgba(0,0,0,0.8)]" style={{ animationDelay: '0.15s' }}>
                            <span className="font-light italic opacity-90">Where </span>
                            <span className="font-bold">Light</span>
                            <br />
                            <span className="text-gradient-gold not-italic drop-shadow-[0_2px_30px_rgba(29,97,114,0.5)] tracking-wide">Meets Silence...</span>
                        </h1>

                        <p className="text-base md:text-lg text-white/80 font-light leading-relaxed max-w-md italic animate-fade-in-up drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]" style={{ animationDelay: '0.35s' }}>
                            A collection of narratives that breathe within the walls, waiting for a story that has not yet been told...
                        </p>
                    </div>
                </div>
            </header>

            <div className="max-w-[1500px] mx-auto px-8 pt-12 relative z-20">
                <div className="flex flex-col lg:flex-row items-center gap-5 mb-8 animate-fade-in-up">
                    <div className="relative flex-1 group w-full">
                        <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-accent transition-all" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Search`}
                            className="w-full pl-16 pr-14 py-5 rounded-full bg-white border border-neutral-200 text-[13px] font-bold text-neutral-800 tracking-wider focus:outline-none focus:border-accent/50 focus:shadow-xl shadow-sm transition-all placeholder:text-neutral-400 placeholder:italic"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-5 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-neutral-100 text-neutral-400">
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-3 px-8 py-5 rounded-full border text-[11px] font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 ${isFilterOpen ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white border-neutral-200 text-neutral-800 hover:border-accent/40 hover:shadow-xl'}`}
                        >
                            <SlidersHorizontal size={16} className={`${isFilterOpen ? 'rotate-180' : ''} transition-transform duration-500`} />
                            Filters & Sort
                            {!isFilterOpen && (activeFilterCount > 0 || sortBy !== 'recommended') && (
                                <span className="w-6 h-6 rounded-full bg-accent text-on-accent text-[10px] flex items-center justify-center font-black animate-scale-in">
                                    {(activeFilterCount || 0) + (sortBy !== 'recommended' ? 1 : 0)}
                                </span>
                            )}
                        </button>

                        <div className="px-5 py-4 rounded-full text-[10px] font-black uppercase tracking-widest text-muted italic whitespace-nowrap">
                            Curated results
                        </div>
                    </div>
                </div>

                {isFilterOpen && (
                    <div className="fixed inset-0 z-[70] animate-fade-in">
                        <div className="absolute inset-0 bg-main/50 backdrop-blur-xl" onClick={() => setIsFilterOpen(false)} />
                        <aside className="absolute left-8 top-32 bottom-32 w-[440px] z-10 animate-fade-in-left">
                            <FilterSidebar
                                filters={filters}
                                setFilters={setFilters}
                                viewType={viewType}
                                counts={filterCounts}
                                sortBy={sortBy}
                                setSortBy={setSortBy}
                                onClose={() => setIsFilterOpen(false)}
                            />
                        </aside>
                    </div>
                )}

                {viewType === 'furniture' && compareProducts.length > 0 && (
                    <div className="mb-8 p-5 rounded-3xl bg-white border border-premium shadow-premium animate-fade-in-up">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-main">Compare Items</h3>
                            <button onClick={() => setCompareProducts([])} className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-accent transition-colors">Clear</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {compareProducts.map((item) => (
                                <div key={item.id} className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">{item.vendor || 'Marketplace'}</p>
                                    <p className="text-sm font-black text-main mb-2 line-clamp-2">{item.name}</p>
                                    <p className="text-xs font-bold text-neutral-600">Price: ₹{Number(item.price || 0).toLocaleString('en-IN')}</p>
                                    <p className="text-xs font-bold text-neutral-600">Material: {item.material || 'Premium'}</p>
                                    <p className="text-xs font-bold text-neutral-600">Dimensions: {item.dimensions || 'Hand-measured'}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div className={`grid gap-10 ${viewType === 'rooms' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} style={{ animationDelay: `${i * 0.1}s` }} className="animate-fade-in-up">
                                <SkeletonCard type={viewType === 'rooms' ? 'room' : 'product'} />
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="py-48 text-center glass-premium rounded-[64px] border-2 border-dashed border-red-100 max-w-4xl mx-auto shadow-2xl">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 text-red-500 border border-red-100">
                            <X size={40} />
                        </div>
                        <h2 className="font-serif text-4xl font-black text-red-400 italic mb-4">Connection Lost</h2>
                        <p className="text-neutral-400 mb-10 max-w-sm mx-auto">{error}</p>
                        <button onClick={() => fetchData()} className="btn-premium btn-premium-gold px-12 py-5 shadow-lg">Try Again</button>
                    </div>
                ) : currentItems.length > 0 ? (
                    <>
                    <div className={`grid gap-10 ${viewType === 'rooms' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                        {visibleItems.map((item, index) =>
                            viewType === 'rooms'
                                ? <div key={item.id} style={{ animationDelay: `${index * 0.05}s` }} className="animate-fade-in-up"><DesignCard design={item} onQuickPreview={setPreviewItem} /></div>
                                : <div key={item.id} style={{ animationDelay: `${index * 0.04}s` }} className="animate-fade-in-up"><ProductCard product={item} onQuickView={setPreviewItem} onCompareToggle={handleCompareToggle} isCompared={compareProducts.some(p => p.id === item.id)} onFindSimilar={handleFindSimilar} /></div>
                        )}
                    </div>
                    {(visibleItems.length < currentItems.length || (viewType === 'furniture' && isCatalogSyncing)) && (
                        <div className="mt-12 flex justify-center">
                            <button
                                type="button"
                                onClick={handleGalleryLoadMore}
                                disabled={isCatalogSyncing && visibleItems.length >= currentItems.length}
                                className="btn-premium btn-premium-outline px-10 py-4 shadow-lg"
                            >
                                {visibleItems.length < currentItems.length
                                    ? `Load more (${currentItems.length - visibleItems.length} remaining)`
                                    : (isCatalogSyncing ? 'Syncing full catalog...' : 'All items loaded')}
                            </button>
                        </div>
                    )}
                    </>
                ) : (
                    <div className="py-48 text-center glass-premium rounded-[64px] border-2 border-dashed border-neutral-100 max-w-4xl mx-auto">
                        <div className="w-24 h-24 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-8 text-neutral-300 border border-neutral-100 animate-pulse">
                            <Search size={48} />
                        </div>
                        <h2 className="font-serif text-4xl font-black text-neutral-300 italic mb-4">No Matches Found</h2>
                        <p className="text-neutral-400 text-sm mb-10 max-w-sm mx-auto">Our gallery currently has no matches for your specific selection. Try resetting filters.</p>
                        <button onClick={() => { setFilters({ ...INITIAL_FILTER_STATE }); setSearchQuery(''); setActiveCategory('all'); }} className="btn-premium btn-premium-outline px-12 py-5 shadow-lg">Reset All</button>
                    </div>
                )}

                {viewType === 'furniture' && previewItem && (
                    <ProductDetailModal
                        product={previewItem}
                        onClose={() => setPreviewItem(null)}
                    />
                )}
            </div>

            {viewType === 'rooms' && previewItem && (
                <div className="fixed top-[63px] md:top-[71px] inset-x-0 bottom-0 z-50 flex flex-col md:flex-row bg-white animate-fade-in overflow-hidden" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setPreviewItem(null)} className="absolute top-10 right-10 z-[60] p-4 bg-main/5 hover:bg-main/10 rounded-full text-main transition-transform hover:rotate-90">
                        <X size={24} />
                    </button>

                    <div className="flex-1 min-h-[400px] relative bg-neutral-50 flex items-center justify-center p-12 overflow-hidden">
                        <ImageGallery mainImage={previewItem.image} gallery={previewItem.gallery} title={previewItem.title} />
                    </div>

                    <div className="w-full lg:w-[480px] shrink-0 flex flex-col bg-white overflow-y-auto">
                        <div className="p-12 pb-20">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="font-serif text-[44px] font-black text-main leading-[0.95] mb-4 tracking-tighter italic">
                                    {previewItem.title}
                                </h2>
                            </div>

                            <p className="text-lg text-neutral-500 font-light leading-relaxed mb-12">
                                {previewItem.description || "A beautiful space designed for you. Every piece is chosen to look and feel right in your home."}
                            </p>

                            <div className="grid grid-cols-2 gap-8 p-10 bg-surface rounded-[40px] border border-premium mb-12 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full translate-x-8 -translate-y-8" />
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Award size={14} className="text-accent" />
                                        <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Style</span>
                                    </div>
                                    <span className="text-sm font-black text-main uppercase tracking-widest">{previewItem.style}</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Home size={14} className="text-accent" />
                                        <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Room Type</span>
                                    </div>
                                    <span className="text-sm font-black text-main uppercase tracking-widest">{previewItem.roomType}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 mb-12">
                                <span className="text-[11px] font-black text-neutral-300 uppercase tracking-[0.4em]">Total Price</span>
                                <div className="flex items-center gap-3 text-main font-black">
                                    <IndianRupee size={32} className="text-accent" />
                                    <span className="text-6xl tracking-tighter">
                                        {previewItem.totalCost?.toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>

                            <Link to={`/design/${previewItem.id}`} className="btn-premium btn-premium-gold w-full py-6 rounded-3xl flex items-center justify-center gap-4 text-lg shadow-gold/20 shadow-2xl group">
                                View Full Design
                                <ArrowUpRight size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {showBackToTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed right-8 bottom-8 z-50 p-6 rounded-full bg-main text-white shadow-2xl hover:bg-accent transition-all duration-500 hover:scale-110 animate-fade-in-up"
                >
                    <ArrowUp size={24} />
                </button>
            )}

            {isSortOpen && <div className="fixed inset-0 z-20" onClick={() => setIsSortOpen(false)} />}
        </div>
    );
};

export default Gallery;
