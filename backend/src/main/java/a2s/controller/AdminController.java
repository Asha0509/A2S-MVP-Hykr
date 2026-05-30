package a2s.controller;

import a2s.model.Activity;
import a2s.model.User;
import a2s.repository.ActivityRepository;
import a2s.repository.UserRepository;
import a2s.repository.DesignRepository;
import a2s.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    ActivityRepository activityRepository;

    @Autowired
    DesignRepository designRepository;

    @Autowired
    ProductRepository productRepository;

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("userCount", userRepository.count());
        stats.put("designCount", designRepository.count());
        stats.put("productCount", productRepository.count());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/activities")
    public List<Activity> getRecentActivities() {
        return activityRepository.findTop10ByOrderByTimestampDesc();
    }

    @GetMapping("/designs")
    public ResponseEntity<?> getAllDesigns() {
        return ResponseEntity.ok(designRepository.findAll());
    }

    @GetMapping("/products")
    public ResponseEntity<?> getAllProducts() {
        return ResponseEntity.ok(productRepository.findAll());
    }
}
