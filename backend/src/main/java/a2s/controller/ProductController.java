package a2s.controller;

import a2s.model.Product;
import a2s.model.ProductListItem;
import a2s.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import a2s.service.CachedProductsService;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    ProductRepository productRepository;
    @Autowired
    CachedProductsService cachedProductsService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        
        if (size > 500) size = 500; // Max 500 per request
        if (page < 0) page = 0;
        
        List<ProductListItem> pageItems = cachedProductsService.getProductsPage(page, size);
        long total = cachedProductsService.getTotalCount();
        
        Map<String, Object> response = new HashMap<>();
        response.put("items", pageItems);
        response.put("page", page);
        response.put("size", pageItems.size());
        response.put("total", total);
        response.put("hasMore", (long)((page + 1) * size) < total);
        
        return ResponseEntity.ok()
            .cacheControl(CacheControl.maxAge(60, java.util.concurrent.TimeUnit.SECONDS))
            .body(response);
    }

    @GetMapping("/category/{category}")
    public List<Product> getProductsByCategory(@PathVariable String category) {
        return productRepository.findByCategory(category);
    }

    /**
     * Sample bundle endpoint for the "Build Your Home" buyer flow.
     * Returns a small, deterministic, room-appropriate product bundle picked
     * from the in-memory cache so the buyer journey can render instantly
     * without paginating the full catalog.
     */
    @GetMapping("/sample-bundle")
    public ResponseEntity<Map<String, Object>> getSampleBundle(
            @RequestParam String roomType,
            @RequestParam(defaultValue = "modern") String style,
            @RequestParam(required = false) String brands,
            @RequestParam(defaultValue = "6") int limit) {
        if (limit < 1) limit = 1;
        if (limit > 12) limit = 12;
        final int cap = limit;
        final String roomKey = roomType == null ? "" : roomType.trim().toLowerCase(Locale.ROOT);
        final String styleKey = style == null ? "" : style.trim().toLowerCase(Locale.ROOT);

        // Map the canonical room key to alternate category/productType tokens
        // so e.g. "bedroom" also catches products whose category is "bed".
        Set<String> roomAliases = roomAliases(roomKey);

        Set<String> brandFilter = (brands == null || brands.isBlank())
                ? Set.of()
                : java.util.Arrays.stream(brands.split(","))
                    .map(s -> s.trim().toLowerCase(Locale.ROOT))
                    .filter(s -> !s.isBlank())
                    .collect(Collectors.toSet());

        List<ProductListItem> pool = cachedProductsService.getAllCached().stream()
                .filter(p -> p.price() != null && p.price() > 0)
                .filter(p -> matchesRoom(p, roomKey, roomAliases))
                .filter(p -> styleKey.isBlank()
                        || (p.aestheticStyle() != null
                            && p.aestheticStyle().toLowerCase(Locale.ROOT).contains(styleKey)))
                .filter(p -> brandFilter.isEmpty()
                        || (p.brand() != null
                            && brandFilter.contains(p.brand().trim().toLowerCase(Locale.ROOT))))
                .collect(Collectors.toCollection(ArrayList::new));

        // Deterministic shuffle so the same (roomType, style) always returns
        // the same order — important for stable UX and cacheable responses.
        long seed = (roomKey + "|" + styleKey).hashCode();
        java.util.Collections.shuffle(pool, new java.util.Random(seed));

        List<Map<String, Object>> items = pool.stream()
                .limit(cap)
                .map(p -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", p.id());
                    item.put("productName", p.name());
                    item.put("brand", p.brand());
                    item.put("priceValue", p.price());
                    item.put("priceCurrency", "INR");
                    item.put("imageUrl", p.image());
                    item.put("productType", p.category());
                    item.put("roomType", p.roomType());
                    item.put("style", p.aestheticStyle());
                    return item;
                })
                .collect(Collectors.toList());

        double totalEstimate = items.stream()
                .map(it -> (Double) it.get("priceValue"))
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .sum();

        Map<String, Object> response = new HashMap<>();
        response.put("roomType", roomKey);
        response.put("style", styleKey);
        response.put("items", items);
        response.put("totalEstimate", totalEstimate);
        response.put("currency", "INR");

        return ResponseEntity.ok()
            .cacheControl(CacheControl.maxAge(60, java.util.concurrent.TimeUnit.SECONDS))
            .body(response);
    }

    private Set<String> roomAliases(String roomKey) {
        switch (roomKey) {
            case "living_room": return Set.of("living room", "living", "drawing room", "sofa", "couch", "tv unit", "coffee table");
            case "bedroom":     return Set.of("bedroom", "bed", "wardrobe", "dresser", "nightstand", "mattress");
            case "kitchen":     return Set.of("kitchen", "dining", "cookware", "appliance", "modular kitchen");
            case "pooja_room":  return Set.of("pooja room", "pooja", "puja", "mandir", "temple");
            default:            return Set.of(roomKey);
        }
    }

    private boolean matchesRoom(ProductListItem p, String roomKey, Set<String> aliases) {
        String room = p.roomType() == null ? "" : p.roomType().toLowerCase(Locale.ROOT);
        String cat  = p.category() == null ? "" : p.category().toLowerCase(Locale.ROOT);
        // Direct hit on the canonical key (e.g. "bedroom"), then alias scan
        // against both roomType and category (which acts as productType here).
        if (!roomKey.isBlank() && (room.contains(roomKey) || cat.contains(roomKey))) {
            return true;
        }
        for (String alias : aliases) {
            if (room.contains(alias) || cat.contains(alias)) {
                return true;
            }
        }
        return false;
    }

    @GetMapping("/{id}/insights")
    public ResponseEntity<ProductInsightsResponse> getProductInsights(@PathVariable String id) {
        Optional<Product> optionalProduct = productRepository.findById(id);
        if (optionalProduct.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Product current = optionalProduct.get();
        List<Product> allProducts = productRepository.findAll();

        List<PriceOption> priceOptions = buildPriceComparison(current, allProducts);
        List<SimilarProduct> similarProducts = buildSimilarProducts(current, allProducts);

        ProductInsightsResponse response = new ProductInsightsResponse(priceOptions, similarProducts);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/import")
    public ResponseEntity<Map<String, Object>> importProducts(@RequestBody List<ProductImportRequest> payload) {
        int created = 0;
        int updated = 0;

        for (ProductImportRequest req : payload) {
            if (req == null || req.name() == null || req.name().isBlank() || req.price() == null) {
                continue;
            }

            String vendor = safe(req.vendor(), "Marketplace");
            String canonical = canonicalize(req.name());

            // Prefer exact-URL match (same page scraped again), then canonical-name match
            Product product = null;
            if (req.sourceUrl() != null && !req.sourceUrl().isBlank()) {
                product = productRepository.findBySourceUrl(req.sourceUrl()).orElse(null);
            }
            if (product == null && !canonical.isBlank()) {
                product = productRepository.findByVendorAndCanonicalName(vendor, canonical).orElse(null);
            }
            boolean isNew = (product == null);
            if (isNew) {
                product = new Product();
                product.setId(UUID.randomUUID().toString());
            }

            product.setName(req.name());
            product.setCanonicalName(canonical);
            product.setBrand(cleanBrandFallback(req.brand(), req.vendor()));
            product.setCategory(safe(req.category(), "decor"));
            product.setRoomType(safe(req.roomType(), "Living Room"));
            product.setAestheticStyle(safe(req.aestheticStyle(), "Contemporary"));
            product.setPrice(req.price());
            product.setDimensions(req.dimensions());
            product.setColor(req.color());
            product.setColorHex(req.colorHex());
            product.setMaterial(req.material());
            product.setModel(req.model());
            product.setVendor(vendor);
            product.setSourceUrl(req.sourceUrl());
            product.setDescription(req.description());
            product.setAffiliateLink(req.affiliateLink());
            product.setImage(req.image());
            product.setRating(req.rating());
            product.setReviewCount(req.reviewCount());
            product.setSeaterCount(req.seaterCount());
            product.setPieceCount(req.pieceCount());
            product.setDrawerCount(req.drawerCount());
            product.setWeightKg(req.weightKg());
            product.setWarrantyMonths(req.warrantyMonths());
            product.setAssemblyRequired(req.assemblyRequired());
            product.setScrapedAt(LocalDateTime.now());

            if (req.featureTags() != null && !req.featureTags().isEmpty()) {
                product.setFeatureTags(req.featureTags());
            }
            if (req.gallery() != null && !req.gallery().isEmpty()) {
                product.setGallery(req.gallery());
            }

            productRepository.save(product);
            if (isNew) created++; else updated++;
        }

        cachedProductsService.invalidateCache();

        Map<String, Object> result = new HashMap<>();
        result.put("created", created);
        result.put("updated", updated);
        result.put("total", productRepository.count());
        return ResponseEntity.ok(result);
    }

    // Normalize product name to a stable dedup key: lowercase, strip punctuation, collapse whitespace
    private String canonicalize(String name) {
        if (name == null) return "";
        return name.toLowerCase(Locale.ROOT)
                   .replaceAll("[^a-z0-9 ]", " ")
                   .replaceAll("\\s+", " ")
                   .trim();
    }

    private List<PriceOption> buildPriceComparison(Product current, List<Product> allProducts) {
        Map<String, Product> bestByVendor = new HashMap<>();

        List<Product> comparable = allProducts.stream()
                .filter(p -> p.getPrice() != null)
                .filter(p -> p.getVendor() != null && !p.getVendor().isBlank())
                .filter(p -> p.getAffiliateLink() != null && !p.getAffiliateLink().isBlank())
                .filter(p -> isExactOrReplicaMatch(current, p))
                .collect(Collectors.toList());

        if (current.getPrice() != null && current.getVendor() != null && current.getAffiliateLink() != null) {
            comparable.add(current);
        }

        for (Product item : comparable) {
            String vendorKey = normalize(item.getVendor());
            Product existing = bestByVendor.get(vendorKey);
            if (existing == null || item.getPrice() < existing.getPrice()) {
                bestByVendor.put(vendorKey, item);
            }
        }

        List<Product> distinctVendors = bestByVendor.values().stream()
                .sorted(Comparator.comparing(Product::getPrice))
                .collect(Collectors.toList());

        List<PriceOption> options = new ArrayList<>();
        for (int i = 0; i < distinctVendors.size() && i < 4; i++) {
            Product item = distinctVendors.get(i);
            options.add(new PriceOption(
                    item.getVendor(),
                    item.getPrice(),
                    item.getAffiliateLink(),
                    i == 0
            ));
        }

        return options;
    }

    private List<SimilarProduct> buildSimilarProducts(Product current, List<Product> allProducts) {
        List<Product> ranked = allProducts.stream()
                .filter(p -> !Objects.equals(p.getId(), current.getId()))
                .filter(p -> Objects.equals(normalize(p.getCategory()), normalize(current.getCategory())))
                .sorted((a, b) -> Double.compare(similarityScore(current, b), similarityScore(current, a)))
                .collect(Collectors.toList());

        List<SimilarProduct> primary = ranked.stream()
                .filter(p -> hasVariantDifference(current, p) || similarityScore(current, p) >= 0.35)
                .limit(4)
                .map(this::toSimilarProduct)
                .collect(Collectors.toList());

        if (primary.size() >= 2) {
            return primary;
        }

        Set<String> seen = primary.stream().map(SimilarProduct::id).collect(Collectors.toSet());
        for (Product fallback : ranked) {
            if (seen.contains(fallback.getId())) {
                continue;
            }
            primary.add(toSimilarProduct(fallback));
            if (primary.size() >= 2) {
                break;
            }
        }

        return primary;
    }

    private boolean isExactOrReplicaMatch(Product base, Product candidate) {
        if (base == null || candidate == null) {
            return false;
        }

        if (Objects.equals(base.getId(), candidate.getId())) {
            return true;
        }

        if (!Objects.equals(normalize(base.getCategory()), normalize(candidate.getCategory()))) {
            return false;
        }

        if (!hasMatchingColor(base, candidate)) {
            return false;
        }

        if (!hasMatchingDimensions(base, candidate)) {
            return false;
        }

        // Accept exact title match or very high replica-style name overlap.
        return isSameModelName(base, candidate) || tokenOverlap(base.getName(), candidate.getName()) >= 0.75;
    }

    private boolean hasMatchingColor(Product base, Product candidate) {
        String baseColor = normalize(base.getColor());
        String candidateColor = normalize(candidate.getColor());

        if (baseColor.isBlank() || candidateColor.isBlank()) {
            // If either side lacks color metadata, don't force-fail.
            return true;
        }

        return baseColor.equals(candidateColor);
    }

    private boolean hasMatchingDimensions(Product base, Product candidate) {
        List<Double> baseDims = parseDimensionNumbers(base.getDimensions());
        List<Double> candidateDims = parseDimensionNumbers(candidate.getDimensions());

        if (baseDims.isEmpty() || candidateDims.isEmpty()) {
            // If dimensions are missing on one side, allow by metadata fallback.
            return true;
        }

        // Require at least two close dimensions for "same product" confidence.
        int closeMatches = 0;
        int limit = Math.min(baseDims.size(), candidateDims.size());
        for (int i = 0; i < limit; i++) {
            double a = baseDims.get(i);
            double b = candidateDims.get(i);
            if (Math.abs(a - b) <= 2.5) {
                closeMatches++;
            }
        }
        return closeMatches >= Math.min(2, limit);
    }

    private boolean isSameModelName(Product base, Product candidate) {
        String baseName = normalize(base.getName());
        String candidateName = normalize(candidate.getName());
        if (baseName.equals(candidateName)) {
            return true;
        }

        Set<String> baseModelTokens = extractModelTokens(baseName);
        Set<String> candidateModelTokens = extractModelTokens(candidateName);

        if (!baseModelTokens.isEmpty() && !candidateModelTokens.isEmpty()) {
            for (String token : baseModelTokens) {
                if (candidateModelTokens.contains(token)) {
                    return true;
                }
            }
        }

        return false;
    }

    private Set<String> extractModelTokens(String name) {
        if (name == null || name.isBlank()) {
            return Set.of();
        }

        Set<String> tokens = new HashSet<>();
        for (String token : name.split("\\s+")) {
            String clean = token.replaceAll("[^a-z0-9-]", "");
            if (clean.length() >= 3 && clean.matches(".*\\d.*")) {
                tokens.add(clean);
            }
        }
        return tokens;
    }

    private double tokenOverlap(String a, String b) {
        Set<String> aTokens = tokenize(a);
        Set<String> bTokens = tokenize(b);
        if (aTokens.isEmpty() || bTokens.isEmpty()) {
            return 0.0;
        }

        long shared = aTokens.stream().filter(bTokens::contains).count();
        return (double) shared / Math.max(aTokens.size(), bTokens.size());
    }

    private List<Double> parseDimensionNumbers(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }

        List<Double> values = new ArrayList<>();
        String[] parts = raw.toLowerCase(Locale.ROOT)
                .replace("cm", "")
                .replace("mm", "")
                .replace("in", "")
                .replace("x", " ")
                .replace("*", " ")
                .trim()
                .split("\\s+");

        for (String part : parts) {
            try {
                values.add(Double.parseDouble(part));
            } catch (NumberFormatException ignored) {
                // Ignore non-numeric tokens.
            }
        }
        return values;
    }

    private SimilarProduct toSimilarProduct(Product p) {
        return new SimilarProduct(
                p.getId(),
                p.getName(),
                p.getBrand(),
                p.getPrice(),
                p.getVendor(),
                p.getAffiliateLink(),
                p.getImage(),
                p.getColor(),
                p.getAestheticStyle()
        );
    }

    private boolean hasVariantDifference(Product base, Product candidate) {
        String baseColor = normalize(base.getColor());
        String candidateColor = normalize(candidate.getColor());
        String baseStyle = normalize(base.getAestheticStyle());
        String candidateStyle = normalize(candidate.getAestheticStyle());
        return !Objects.equals(baseColor, candidateColor) || !Objects.equals(baseStyle, candidateStyle);
    }

    private double similarityScore(Product a, Product b) {
        Set<String> aTokens = tokenize(a.getName());
        Set<String> bTokens = tokenize(b.getName());

        if (aTokens.isEmpty() || bTokens.isEmpty()) {
            return 0.0;
        }

        long shared = aTokens.stream().filter(bTokens::contains).count();
        double tokenScore = (double) shared / Math.max(aTokens.size(), bTokens.size());
        double brandScore = Objects.equals(normalize(a.getBrand()), normalize(b.getBrand())) ? 0.2 : 0.0;
        double categoryScore = Objects.equals(normalize(a.getCategory()), normalize(b.getCategory())) ? 0.2 : 0.0;

        return Math.min(1.0, tokenScore + brandScore + categoryScore);
    }

    private Set<String> tokenize(String input) {
        if (input == null || input.isBlank()) {
            return Set.of();
        }
        return List.of(input.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9 ]", " ").split("\\s+"))
                .stream()
                .filter(token -> token.length() > 2)
                .filter(token -> !List.of("for", "with", "and", "set", "the", "room").contains(token))
                .collect(Collectors.toSet());
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String safe(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private String cleanBrandFallback(String brand, String vendor) {
        if (brand != null && !brand.isBlank()) {
            return brand.trim();
        }
        if (vendor != null && !vendor.isBlank()) {
            return vendor.trim();
        }
        return "Marketplace";
    }

    public record PriceOption(String vendor, Double price, String link, boolean cheapest) {}

    public record SimilarProduct(
            String id,
            String name,
            String brand,
            Double price,
            String vendor,
            String link,
            String image,
            String color,
            String style
    ) {}

    public record ProductInsightsResponse(
            List<PriceOption> priceAcrossPlatforms,
            List<SimilarProduct> similarProducts
    ) {}

    public record ProductImportRequest(
            String name,
            String brand,
            String model,
            String category,
            String roomType,
            String aestheticStyle,
            Double price,
            String dimensions,
            String color,
            String colorHex,
            String material,
            String vendor,
            String sourceUrl,
            String description,
            String affiliateLink,
            String image,
            List<String> gallery,
            Double rating,
            Integer reviewCount,
            Integer seaterCount,
            Integer pieceCount,
            Integer drawerCount,
            Double weightKg,
            Integer warrantyMonths,
            Boolean assemblyRequired,
            List<String> featureTags
    ) {}
}
