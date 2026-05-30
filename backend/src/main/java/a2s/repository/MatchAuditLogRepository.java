package a2s.repository;

import a2s.model.MatchAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MatchAuditLogRepository extends JpaRepository<MatchAuditLog, Long> {

    List<MatchAuditLog> findByProductIdOrderByResolvedAtDesc(String productId);

    List<MatchAuditLog> findByCandidateId(String candidateId);

    List<MatchAuditLog> findByMatchTypeAndConfidenceScoreLessThan(String matchType, Double threshold);
}
