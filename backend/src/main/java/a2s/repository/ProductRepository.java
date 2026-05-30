package a2s.repository;

import a2s.model.Product;
import a2s.model.ProductListItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {
    List<Product> findByCategory(String category);

    @Query("""
            select new a2s.model.ProductListItem(
                p.id,
                p.name,
                p.brand,
                p.category,
                p.aestheticStyle,
                p.roomType,
                p.price,
                p.color,
                p.material,
                p.vendor,
                p.affiliateLink,
                p.image
            )
            from Product p
            """)
    List<ProductListItem> findAllListItems();

        @Query(nativeQuery = true, value = """
            SELECT p.id, p.name, p.brand, p.category, p.aesthetic_style,
               p.room_type, p.price, p.color, p.material, p.vendor,
               p.affiliate_link, p.image
            FROM products p
            ORDER BY p.id
            LIMIT :limit OFFSET :offset
            """)
        List<Object[]> findListItemsRaw(@Param("limit") int limit, @Param("offset") int offset);

    @Query("select count(p) from Product p")
    long countAllProducts();

    Optional<Product> findBySourceUrl(String sourceUrl);

    @Query("""
            select p from Product p
            where lower(p.vendor) = lower(:vendor)
              and lower(p.canonicalName) = lower(:canonicalName)
            """)
    Optional<Product> findByVendorAndCanonicalName(
            @Param("vendor") String vendor,
            @Param("canonicalName") String canonicalName);
}
