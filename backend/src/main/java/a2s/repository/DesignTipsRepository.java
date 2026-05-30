package a2s.repository;

import a2s.model.DesignTipsSubscriber;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DesignTipsRepository extends JpaRepository<DesignTipsSubscriber, Long> {
    Optional<DesignTipsSubscriber> findByEmail(String email);
    boolean existsByEmail(String email);
}
