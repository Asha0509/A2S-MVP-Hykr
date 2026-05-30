package a2s.repository;

import a2s.model.SitePrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SitePriceRepository extends JpaRepository<SitePrice, Long> {

    List<SitePrice> findByProductIdOrderByPriceRankAsc(String productId);

    Optional<SitePrice> findByProductIdAndVendor(String productId, String vendor);

    void deleteByProductId(String productId);
}
