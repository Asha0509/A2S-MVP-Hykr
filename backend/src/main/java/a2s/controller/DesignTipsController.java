package a2s.controller;

import a2s.model.DesignTipsSubscriber;
import a2s.repository.DesignTipsRepository;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/subscribers")
public class DesignTipsController {
    
    @Autowired
    private DesignTipsRepository designTipsRepository;

    @PostMapping("/tips")
    public ResponseEntity<?> subscribeToTips(@RequestBody SubscribeRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Email is required"));
        }

        String email = request.getEmail().trim().toLowerCase();

        if (designTipsRepository.existsByEmail(email)) {
            return ResponseEntity.ok(new MessageResponse("You are already subscribed to our design tips!"));
        }

        DesignTipsSubscriber sub = new DesignTipsSubscriber();
        sub.setEmail(email);
        designTipsRepository.save(sub);

        return ResponseEntity.ok(new MessageResponse("Thank you! You've been added to our Design Tips list."));
    }

    @Data
    public static class SubscribeRequest {
        private String email;
    }

    @Data
    public static class MessageResponse {
        private String message;
        public MessageResponse(String message) { this.message = message; }
    }
}
