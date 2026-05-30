package a2s.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "VARCHAR(36)")
    private String id;

    private String name;

    @Column(unique = true)
    private String email;

    @JsonIgnore
    private String password;

    @JsonIgnore
    private String resetPasswordToken;
    @JsonIgnore
    private LocalDateTime resetPasswordExpiry;

    private String location;
    private String memberSince;
    private String styleDNA;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_style_selections", joinColumns = @JoinColumn(name = "user_id", columnDefinition = "VARCHAR(36)"))
    @Column(name = "style_id", columnDefinition = "VARCHAR(36)")
    private List<String> styleSelections = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_saved_designs", joinColumns = @JoinColumn(name = "user_id", columnDefinition = "VARCHAR(36)"))
    @Column(name = "design_id", columnDefinition = "VARCHAR(36)")
    private List<String> savedDesigns = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_watchlist", joinColumns = @JoinColumn(name = "user_id", columnDefinition = "VARCHAR(36)"))
    @Column(name = "product_id", columnDefinition = "VARCHAR(36)")
    private List<String> watchlist = new ArrayList<>();

    private Boolean subscribedToNewsletter = false;
    private Boolean tutorialCompleted = false;
    private String phoneNumber;
    private Boolean joinedPhase2Waitlist = false;
    private LocalDateTime waitlistJoinedAt;
    private String phase2ReferralCode;

    private String provider;
    private String providerId;

    private Integer consultantCredits = 5;
    private Integer vastuCredits = 3;
    private LocalDate creditsResetDate;

    public static final int DAILY_CONSULTANT_CREDITS = 5;
    public static final int DAILY_VASTU_CREDITS = 3;

    public void resetCreditsIfNewDay() {
        LocalDate today = LocalDate.now();
        if (creditsResetDate == null || creditsResetDate.isBefore(today)) {
            consultantCredits = DAILY_CONSULTANT_CREDITS;
            vastuCredits = DAILY_VASTU_CREDITS;
            creditsResetDate = today;
        }
    }
}
