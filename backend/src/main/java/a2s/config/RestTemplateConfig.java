package a2s.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * RestTemplateConfig: Configures RestTemplate with timeouts and error handling
 */
@Configuration
public class RestTemplateConfig {

    /**
     * Creates a RestTemplate with configured connection and read timeouts
     * to prevent hanging requests to external services (like LLM)
     */
    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
                .setConnectTimeout(Duration.ofSeconds(10))
                .setReadTimeout(Duration.ofSeconds(30))
                .build();
    }
}
