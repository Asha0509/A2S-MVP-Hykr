package a2s.controller;

import a2s.model.NewsletterSubscription;
import a2s.repository.NewsletterRepository;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/newsletter")
public class NewsletterController {
    
    @Autowired
    private NewsletterRepository newsletterRepository;

    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(@RequestBody SubscribeRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Email is required"));
        }

        if (newsletterRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.ok(new MessageResponse("You are already subscribed to our design tips!"));
        }

        NewsletterSubscription sub = new NewsletterSubscription();
        sub.setEmail(request.getEmail());
        newsletterRepository.save(sub);

        return ResponseEntity.ok(new MessageResponse("Thank you! You have been subscribed to A2S Design Tips."));
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
