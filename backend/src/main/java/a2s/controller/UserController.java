package a2s.controller;

import a2s.model.Activity;
import a2s.repository.ActivityRepository;
import a2s.repository.UserRepository;
import a2s.security.services.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    ActivityRepository activityRepository;

    @GetMapping("/profile")
    @SuppressWarnings("null")
    public ResponseEntity<?> getUserProfile() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication()
                .getPrincipal();

        return userRepository.findById(userDetails.getId())
                .map(user -> ResponseEntity.ok(user))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @SuppressWarnings({"unchecked", "null"})
    @PutMapping("/profile")
    public ResponseEntity<?> updateUserProfile(@RequestBody Map<String, Object> updates) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication()
                .getPrincipal();

        return userRepository.findById(userDetails.getId())
                .map(user -> {
            if (updates.containsKey("name"))
                user.setName((String) updates.get("name"));
            if (updates.containsKey("location"))
                user.setLocation((String) updates.get("location"));
            if (updates.containsKey("styleDNA"))
                user.setStyleDNA((String) updates.get("styleDNA"));
            if (updates.containsKey("styleSelections"))
                user.setStyleSelections((List<String>) updates.get("styleSelections"));
            if (updates.containsKey("tutorialCompleted"))
                user.setTutorialCompleted((Boolean) updates.get("tutorialCompleted"));

            userRepository.save(user);
            
            // Log if DNA was updated
            if (updates.containsKey("styleDNA")) {
                activityRepository.save(new Activity(user.getEmail(), "Style DNA Refined", "New DNA: " + user.getStyleDNA()));
            }

            return ResponseEntity.ok(user);
        })
        .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/saved-designs")
    @SuppressWarnings("null")
    public ResponseEntity<?> toggleSavedDesign(@RequestBody Map<String, String> payload) {
        String designId = payload.get("designId");
        if (designId == null) return ResponseEntity.badRequest().body("designId is required");
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication()
                .getPrincipal();

        return userRepository.findById(userDetails.getId())
                .map(user -> {
                    List<String> saved = user.getSavedDesigns();
                    if (saved == null) saved = new ArrayList<>();

                    if (saved.contains(designId)) {
                        saved.remove(designId);
                        activityRepository.save(new Activity(user.getEmail(), "Design Unsaved", "Removed design: " + designId));
                    } else {
                        saved.add(designId);
                        activityRepository.save(new Activity(user.getEmail(), "Design Saved", "Added design: " + designId));
                    }
                    user.setSavedDesigns(saved);
                    userRepository.save(user);
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/watchlist")
    @SuppressWarnings("null")
    public ResponseEntity<?> toggleWatchlist(@RequestBody Map<String, String> payload) {
        String productId = payload.get("productId");
        if (productId == null) return ResponseEntity.badRequest().body("productId is required");
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication()
                .getPrincipal();

        return userRepository.findById(userDetails.getId())
                .map(user -> {
                    List<String> watchlist = user.getWatchlist();
                    if (watchlist == null) watchlist = new ArrayList<>();

                    if (watchlist.contains(productId)) {
                        watchlist.remove(productId);
                        activityRepository.save(new Activity(user.getEmail(), "Watchlist Remove", "Removed product: " + productId));
                    } else {
                        watchlist.add(productId);
                        activityRepository.save(new Activity(user.getEmail(), "Watchlist Add", "Added product: " + productId));
                    }
                    user.setWatchlist(watchlist);
                    userRepository.save(user);
                    return ResponseEntity.ok(watchlist);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
