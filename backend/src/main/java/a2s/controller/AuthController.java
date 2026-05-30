package a2s.controller;

import a2s.model.Activity;
import a2s.model.User;
import a2s.repository.ActivityRepository;
import a2s.repository.UserRepository;
import a2s.security.jwt.JwtUtils;
import a2s.security.services.UserDetailsImpl;
import jakarta.validation.Valid;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired
    ActivityRepository activityRepository;

    @PostMapping("/login")
    @SuppressWarnings("null")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        System.out.println("[AUTH] Login attempt for: " + loginRequest.getEmail());
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail().trim().toLowerCase(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);

            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            
            // Fetch styleDNA from database
            String styleDNA = userRepository.findById(userDetails.getId())
                                            .map(User::getStyleDNA)
                                            .orElse("");

            System.out.println("[AUTH] Login successful for: " + loginRequest.getEmail() + " (ID: " + userDetails.getId() + ")");

            // Log activity
            activityRepository.save(new Activity(loginRequest.getEmail().trim().toLowerCase(), "User Login", "Successful authentication"));

            return ResponseEntity.ok(new JwtResponse(jwt,
                    userDetails.getId(),
                    userDetails.getUsername(),
                    userDetails.getName(),
                    userDetails.getLocation(),
                    styleDNA));
        } catch (Exception e) {
            System.err.println("[AUTH] Login failed: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        String email = signUpRequest.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        // Create new user's account
        User user = new User();
        user.setName(signUpRequest.getName().trim());
        user.setEmail(email);
        user.setPassword(encoder.encode(signUpRequest.getPassword()));
        user.setLocation(signUpRequest.getLocation());
        user.setMemberSince(LocalDate.now().toString());
        user.setSubscribedToNewsletter(signUpRequest.isSubscribe());

        System.out.println("[AUTH] Registering user: " + signUpRequest.getEmail());
        userRepository.save(user);
        System.out.println("[AUTH] User registered successfully: " + signUpRequest.getEmail());

        // Log activity
        activityRepository.save(new Activity(email, "User Registration", "New account created from " + (user.getLocation() != null ? user.getLocation() : "Not specified")));

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        Optional<User> userOptional = userRepository.findByEmail(request.getEmail());
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            String token = UUID.randomUUID().toString();
            user.setResetPasswordToken(token);
            user.setResetPasswordExpiry(LocalDateTime.now().plusHours(1));
            userRepository.save(user);

            // Simulation of email sending
            System.out.println("==================================================");
            System.out.println("PASSWORD RESET REQUEST FOR: " + user.getEmail());
            System.out.println("RESET TOKEN: " + token);
            System.out.println("LINK: http://localhost:5173/reset-password?token=" + token);
            System.out.println("==================================================");

            return ResponseEntity
                    .ok(new MessageResponse("If your email is registered, you will receive a reset link shortly."));
        }

        // Anti-enumeration: always return the same message
        return ResponseEntity
                .ok(new MessageResponse("If your email is registered, you will receive a reset link shortly."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        Optional<User> userOptional = userRepository.findByResetPasswordToken(request.getToken());

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (user.getResetPasswordExpiry().isAfter(LocalDateTime.now())) {
                user.setPassword(encoder.encode(request.getNewPassword()));
                user.setResetPasswordToken(null);
                user.setResetPasswordExpiry(null);
                userRepository.save(user);
                return ResponseEntity.ok(new MessageResponse("Password reset successful!"));
            } else {
                return ResponseEntity.badRequest().body(new MessageResponse("Error: Token has expired!"));
            }
        }

        return ResponseEntity.badRequest().body(new MessageResponse("Error: Invalid token!"));
    }

    // DTOs
    @Data
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    public static class SignupRequest {
        @jakarta.validation.constraints.NotBlank
        private String name;
        @jakarta.validation.constraints.NotBlank
        @jakarta.validation.constraints.Email
        private String email;
        @jakarta.validation.constraints.NotBlank
        private String password;
        private String location;
        private boolean subscribe;
    }

    @Data
    public static class ForgotPasswordRequest {
        @jakarta.validation.constraints.NotBlank
        @jakarta.validation.constraints.Email
        private String email;
    }

    @Data
    public static class ResetPasswordRequest {
        @jakarta.validation.constraints.NotBlank
        private String token;
        @jakarta.validation.constraints.NotBlank
        private String newPassword;
    }

    @Data
    public static class JwtResponse {
        private String token;
        private String type = "Bearer";
        private String id;
        private String email;
        private String name;
        private String location;
        private String styleDNA;

        public JwtResponse(String accessToken, String id, String email, String name, String location, String styleDNA) {
            this.token = accessToken;
            this.id = id;
            this.email = email;
            this.name = name;
            this.location = location;
            this.styleDNA = styleDNA;
        }
    }

    @Data
    public static class MessageResponse {
        private String message;

        public MessageResponse(String message) {
            this.message = message;
        }
    }
}
