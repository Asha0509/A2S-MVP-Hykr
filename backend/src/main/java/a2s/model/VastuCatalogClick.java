package a2s.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "vastu_catalog_clicks")
public class VastuCatalogClick {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "VARCHAR(36)")
    private String id;

    @Column(nullable = false)
    private String userId;

    private String cacheKey;

    @Column(nullable = false)
    private String catalogFilter;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String catalogUrl;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}
