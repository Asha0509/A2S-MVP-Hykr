package a2s.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "activities")
public class Activity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userEmail;
    private String action;
    private String details;
    private LocalDateTime timestamp;

    public Activity(String userEmail, String action, String details) {
        this.userEmail = userEmail;
        this.action = action;
        this.details = details;
        this.timestamp = LocalDateTime.now();
    }
}
