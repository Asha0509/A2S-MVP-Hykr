package a2s.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Audit trail of every dedup decision made by the match engine.
 * Lets us replay, review, and override matches without re-running the full pipeline.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "match_audit_log", indexes = {
    @Index(name = "idx_audit_product",   columnList = "product_id"),
    @Index(name = "idx_audit_candidate", columnList = "candidate_id")
})
public class MatchAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", columnDefinition = "VARCHAR(36)")
    private String productId;

    @Column(name = "candidate_id", columnDefinition = "VARCHAR(36)")
    private String candidateId;

    // EXACT | VARIANT | SIMILAR | DIFFERENT
    @Column(length = 20)
    private String matchType;

    private Double confidenceScore;

    // Comma-separated list of signals that fired, e.g. "name_token,color,dimension_w"
    @Column(length = 500)
    private String signalsUsed;

    private LocalDateTime resolvedAt;

    // "engine" for automated decisions, "manual" for admin overrides
    @Column(length = 50)
    private String resolvedBy = "engine";
}
