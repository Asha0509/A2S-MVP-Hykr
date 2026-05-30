package a2s.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * One row per (product, vendor) price observation scraped.
 * Replaces the single AlternativeVendor embedded field — now supports N vendors.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "site_prices", indexes = {
    @Index(name = "idx_site_price_product", columnList = "product_id"),
    @Index(name = "idx_site_price_vendor",  columnList = "vendor"),
    @Index(name = "idx_site_price_product_vendor", columnList = "product_id,vendor", unique = true)
})
public class SitePrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", columnDefinition = "VARCHAR(36)", nullable = false)
    private String productId;

    @Column(nullable = false)
    private String vendor; // IKEA, Amazon, Flipkart, Pepperfry, UrbanLadder, WoodenStreet, HomeLane, Nilkamal

    private Double price;

    @Column(length = 1000)
    private String affiliateLink;

    private Boolean inStock = true;

    private LocalDateTime scrapedAt;

    private Integer priceRank; // 1 = cheapest across all vendors for this product
}
