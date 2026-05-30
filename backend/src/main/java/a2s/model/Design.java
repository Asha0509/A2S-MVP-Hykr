package a2s.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.persistence.*;

import java.util.List;
import java.util.ArrayList;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "designs")
public class Design {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "VARCHAR(36)")
    private String id;

    private String title;

    @Column(length = 1000)
    private String description;

    private String image;
    
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "design_gallery", joinColumns = @JoinColumn(name = "design_id", columnDefinition = "VARCHAR(36)"))
    @Column(name = "image_url", columnDefinition = "VARCHAR(255)")
    private List<String> gallery = new ArrayList<>();
    
    private String roomType;
    private String style;
    private Double totalCost;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "design_tags", joinColumns = @JoinColumn(name = "design_id", columnDefinition = "VARCHAR(36)"))
    @Column(name = "tag", columnDefinition = "VARCHAR(255)")
    private List<String> tags = new ArrayList<>();

    @OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "design_id", columnDefinition = "VARCHAR(36)")
    private List<Product> products = new ArrayList<>();
}
