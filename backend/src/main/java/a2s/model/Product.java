package a2s.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "products", indexes = {
    @Index(name = "idx_product_room_type",      columnList = "room_type"),
    @Index(name = "idx_product_category",       columnList = "category"),
    @Index(name = "idx_product_brand",          columnList = "brand"),
    @Index(name = "idx_product_vendor",         columnList = "vendor"),
    @Index(name = "idx_product_canonical_name", columnList = "canonical_name"),
    @Index(name = "idx_product_listing_status", columnList = "listing_status"),
    @Index(name = "idx_product_variant_of",     columnList = "variant_of"),
    @Index(name = "idx_product_source_url",     columnList = "source_url")
})
public class Product {

    public enum MatchType      { EXACT, VARIANT, SIMILAR, UNIQUE }
    public enum ListingStatus  { ACTIVE, INACTIVE, CONFLICT, PENDING_REVIEW }

    // ── Identity ────────────────────────────────────────────
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "VARCHAR(36)")
    private String id;

    private String name;

    @Column(name = "canonical_name")
    private String canonicalName; // normalized name used for dedup

    private String brand;
    private String category;
    private String model; // model number / code from product page

    // ── A2S-specific ─────────────────────────────────────────
    private String aestheticStyle; // Minimal, Contemporary, Luxury, Boho, Industrial, Scandinavian, etc.
    private String roomType;       // Living Room, Bedroom, Kitchen, Dining Room, Study, Pooja Room, etc.

    // ── Pricing & sourcing ───────────────────────────────────
    private Double price;
    private String vendor;

    @Column(name = "source_url", length = 1000)
    private String sourceUrl;

    private String affiliateLink;

    private LocalDateTime scrapedAt;

    // ── Physical attributes ───────────────────────────────────
    private String dimensions;
    private String color;
    private String colorHex;
    private String colorFamily;    // e.g. "brown" for "walnut brown"
    private String material;
    private String materialFamily; // e.g. "wood" for "solid sheesham"
    private String finishType;     // matte / gloss / natural / lacquer
    private String legMaterial;

    private Integer seaterCount;
    private Integer pieceCount;
    private Integer drawerCount;
    private Double  weightKg;
    private Integer warrantyMonths;
    private Boolean assemblyRequired;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_feature_tags",
        joinColumns = @JoinColumn(name = "product_id", columnDefinition = "VARCHAR(36)"))
    @Column(name = "tag")
    private List<String> featureTags = new ArrayList<>();

    // ── Media ────────────────────────────────────────────────
    private String image;

    @Column(name = "image_phash", length = 64)
    private String imagePhash; // perceptual hash for visual dedup

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "product_dominant_colors",
        joinColumns = @JoinColumn(name = "product_id", columnDefinition = "VARCHAR(36)"))
    @Column(name = "hex_color", columnDefinition = "VARCHAR(10)")
    private List<String> dominantColors = new ArrayList<>();

    @JsonIgnore
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "product_gallery",
        joinColumns = @JoinColumn(name = "product_id", columnDefinition = "VARCHAR(36)"))
    @Column(name = "image_url", columnDefinition = "VARCHAR(255)")
    private List<String> gallery = new ArrayList<>();

    // ── Reviews ──────────────────────────────────────────────
    private Double  rating;
    private Integer reviewCount;

    // ── Description ──────────────────────────────────────────
    @Column(length = 2000)
    private String description;

    // ── Dedup / match metadata ────────────────────────────────
    @Enumerated(EnumType.STRING)
    private MatchType matchType;

    @Column(name = "variant_of", columnDefinition = "VARCHAR(36)")
    private String variantOf; // FK to parent product id

    private Double confidenceScore;

    private Boolean conflictFlag;

    @Column(length = 1000)
    private String conflictNotes;

    @Enumerated(EnumType.STRING)
    private ListingStatus listingStatus = ListingStatus.ACTIVE;

    // ── Design link (keep for LLM context) ───────────────────
    @Column(name = "design_id", columnDefinition = "VARCHAR(36)")
    private String designId;

    // ── Lifecycle hook ────────────────────────────────────────
    @PostLoad
    @PrePersist
    @PreUpdate
    private void normalizeBrand() {
        if (brand == null || brand.isBlank() || "Unknown".equalsIgnoreCase(brand.trim())) {
            brand = (vendor != null && !vendor.isBlank()) ? vendor.trim() : "Marketplace";
        }
    }
}
