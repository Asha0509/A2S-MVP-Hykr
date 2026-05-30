-- Catalog query hot-paths (B1 in ENHANCEMENTS.md).
-- These three columns are the most common WHERE / ORDER BY targets:
--   - room_type  (filter sidebar in Gallery + admin)
--   - category   (faceted browse)
--   - brand      (faceted browse + dedup-quality reports)
--
-- The app currently uses spring.jpa.hibernate.ddl-auto=update so these indexes
-- can also be expressed as @Index annotations on the JPA entities. Keeping
-- them here as a plain SQL artifact too, so they can be applied to any
-- environment (Neon, local docker, staging) by a DBA without running the app.
--
-- Safe to re-run: CREATE INDEX IF NOT EXISTS is idempotent.
-- CONCURRENTLY avoids locking the table for writes during creation.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_room_type
    ON product_list_item (room_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_category
    ON product_list_item (category);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_brand
    ON product_list_item (brand);

-- Composite for the most common combined filter: "show me all <category>
-- products for <room_type>". Order matters: high-cardinality column first.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_room_category
    ON product_list_item (room_type, category);

ANALYZE product_list_item;
