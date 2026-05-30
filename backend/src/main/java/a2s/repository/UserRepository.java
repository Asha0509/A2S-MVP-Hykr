package a2s.repository;

import a2s.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.time.LocalDateTime;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    Boolean existsByEmail(String email);
    Optional<User> findByResetPasswordToken(String token);

    long countByJoinedPhase2WaitlistTrue();
    long countByJoinedPhase2WaitlistTrueAndWaitlistJoinedAtBefore(LocalDateTime date);
    boolean existsByPhase2ReferralCode(String phase2ReferralCode);
}
