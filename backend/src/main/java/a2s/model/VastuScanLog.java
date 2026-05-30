package a2s.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "vastu_scan_logs")
public class VastuScanLog {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "VARCHAR(36)")
    private String id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false, length = 64)
    private String cacheKey;

    @Column(nullable = false)
    private String roomType;

    @Column(nullable = false)
    private String facingDirection;

    private String floorNumber;

    @Column(nullable = false)
    private boolean cacheHit = false;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String responseJson;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String detectedObjectsJson;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String suggestionsJson;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String catalogLinksJson;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String imagePathsJson;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime imageRetainUntil;
}
