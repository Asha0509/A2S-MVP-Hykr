package a2s.health;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * VastuEndpointHealthIndicator: Monitors the Vastu analysis endpoint health
 * Checks connectivity to LLM service and validates endpoint responsiveness
 */
@Component
public class VastuEndpointHealthIndicator implements HealthIndicator {

    private static final Logger logger = LoggerFactory.getLogger(VastuEndpointHealthIndicator.class);
    private final RestTemplate restTemplate;
    private static final String LLM_HEALTH_URL = "http://a2s-llm:5001/health";
    private long lastCheckTime = 0;
    private Health lastHealth = null;
    private static final long CACHE_DURATION_MS = 30000; // Cache health check for 30 seconds

    public VastuEndpointHealthIndicator(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Override
    public Health health() {
        long now = System.currentTimeMillis();

        // Cache health checks to avoid excessive LLM calls
        if (lastHealth != null && (now - lastCheckTime) < CACHE_DURATION_MS) {
            return lastHealth;
        }

        lastCheckTime = now;
        Map<String, Object> details = new HashMap<>();
        details.put("timestamp", LocalDateTime.now().toString());
        details.put("endpoint", "/api/vastu/analyse");
        details.put("llm_service", "a2s-llm:5001");

        try {
            // Check LLM service health
            String llmResponse = restTemplate.getForObject(LLM_HEALTH_URL, String.class);
            logger.debug("Vastu endpoint health check: LLM service is UP");
            details.put("llm_status", "UP");
            details.put("llm_response_time_ms", System.currentTimeMillis() - now);
            details.put("multipart_processing", "ENABLED");
            details.put("max_file_size", "50MB");
            details.put("status", "Ready to accept Vastu analysis requests");

            lastHealth = Health.up()
                    .withDetails(details)
                    .build();
            return lastHealth;

        } catch (Exception e) {
            logger.warn("Vastu endpoint health check failed: LLM service is unreachable", e);
            details.put("llm_status", "DOWN");
            details.put("error", e.getMessage());
            details.put("status", "Vastu analysis unavailable - LLM service issue");

            lastHealth = Health.down()
                    .withDetails(details)
                    .withException(e)
                    .build();
            return lastHealth;
        }
    }
}
