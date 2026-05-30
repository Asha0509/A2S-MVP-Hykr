package a2s.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class OAuthConfigurationValidator implements ApplicationRunner {

    @Value("${spring.security.oauth2.client.registration.google.client-id:}")
    private String googleClientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret:}")
    private String googleClientSecret;

    @Value("${app.oauth2.redirect-uri:http://localhost:3000/#/dashboard}")
    private String redirectUri;

    @Override
    public void run(ApplicationArguments args) {
        if (isLocalRedirect(redirectUri)) {
            return;
        }

        if (isInvalidGoogleConfig(googleClientId, googleClientSecret)) {
            throw new IllegalStateException(
                    "Invalid Google OAuth configuration for non-local environment. " +
                    "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to valid values.");
        }
    }

    private boolean isLocalRedirect(String uri) {
        if (uri == null) {
            return true;
        }
        String lower = uri.toLowerCase();
        return lower.contains("localhost") || lower.contains("127.0.0.1");
    }

    private boolean isInvalidGoogleConfig(String clientId, String clientSecret) {
        return isBlank(clientId)
                || isBlank(clientSecret)
                || "your-client-id".equals(clientId)
                || "your-client-secret".equals(clientSecret);
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
