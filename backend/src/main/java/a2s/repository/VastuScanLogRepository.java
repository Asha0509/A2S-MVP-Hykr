package a2s.repository;

import a2s.model.VastuScanLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface VastuScanLogRepository extends JpaRepository<VastuScanLog, String> {
    Optional<VastuScanLog> findFirstByCacheKeyAndCreatedAtAfterOrderByCreatedAtDesc(String cacheKey, LocalDateTime after);

    long countByUserIdAndCacheHitFalseAndCreatedAtAfter(String userId, LocalDateTime after);

    Optional<VastuScanLog> findFirstByUserIdAndCacheHitFalseAndCreatedAtAfterOrderByCreatedAtAsc(String userId, LocalDateTime after);
}
