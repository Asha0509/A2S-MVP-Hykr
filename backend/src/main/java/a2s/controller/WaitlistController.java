package a2s.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import a2s.model.User;
import a2s.repository.UserRepository;
import java.util.Optional;
import java.util.HashMap;
import java.util.Map;
import java.time.LocalDateTime;
import java.security.SecureRandom;

@RestController
@RequestMapping("/api/waitlist")
public class WaitlistController {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String REFERRAL_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    @Autowired
    UserRepository userRepository;

    @GetMapping("/status")
    @SuppressWarnings("null")
    public ResponseEntity<?> getWaitlistStatus() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            return ResponseEntity.status(401).body(Map.of("message", "Please log in to view waitlist status"));
        }
        String email = authentication.getName();
        
        Optional<User> userOpt = userRepository.findByEmail(email);
        boolean joined = userOpt.map(User::getJoinedPhase2Waitlist).orElse(false);
        long totalWaitlist = userRepository.countByJoinedPhase2WaitlistTrue();

        Map<String, Object> response = new HashMap<>();
        
        if (joined && userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getWaitlistJoinedAt() == null) {
                user.setWaitlistJoinedAt(LocalDateTime.now().minusDays(1)); // Default for legacy
                userRepository.save(user);
            }
            
            long countBefore = userRepository.countByJoinedPhase2WaitlistTrueAndWaitlistJoinedAtBefore(user.getWaitlistJoinedAt());
            long rank = countBefore + 1;

            if (user.getPhase2ReferralCode() == null || user.getPhase2ReferralCode().isBlank()) {
                user.setPhase2ReferralCode(generateUniqueReferralCode());
                userRepository.save(user);
            }
            
            response.put("joined", true);
            response.put("rank", "#" + String.format("%,d", rank));
            response.put("totalWaitlist", totalWaitlist);
            response.put("inviteCode", user.getPhase2ReferralCode());
        } else {
            response.put("joined", false);
            response.put("rank", "-");
            response.put("totalWaitlist", totalWaitlist);
            response.put("inviteCode", null);
        }
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/join")
    @SuppressWarnings("null")
    public ResponseEntity<?> joinWaitlist() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            return ResponseEntity.status(401).body(Map.of("message", "Please log in to join the waitlist"));
        }
        String email = authentication.getName();
        
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (!Boolean.TRUE.equals(user.getJoinedPhase2Waitlist())) {
                user.setJoinedPhase2Waitlist(true);
                user.setWaitlistJoinedAt(LocalDateTime.now());
                userRepository.save(user);
            }
            return ResponseEntity.ok(Map.of("message", "Successfully joined Phase 2 waitlist"));
        }
        
        return ResponseEntity.badRequest().body(Map.of("message", "User not found. Please log in again."));
    }

    private String generateUniqueReferralCode() {
        for (int attempts = 0; attempts < 20; attempts++) {
            StringBuilder code = new StringBuilder("A2S-");
            for (int i = 0; i < 8; i++) {
                code.append(REFERRAL_CHARS.charAt(RANDOM.nextInt(REFERRAL_CHARS.length())));
            }
            String referralCode = code.toString();
            if (!userRepository.existsByPhase2ReferralCode(referralCode)) {
                return referralCode;
            }
        }
        return "A2S-" + Long.toHexString(System.currentTimeMillis()).toUpperCase();
    }
}
