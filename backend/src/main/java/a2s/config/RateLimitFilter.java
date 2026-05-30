package a2s.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory IP-based rate limiter for AI chat endpoints.
 * Allows a maximum of 20 requests per 60-second window per IP address
 * on /api/chat/** paths.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_REQUESTS = 20;
    private static final long WINDOW_MS = 60_000L;

    // Maps IP -> [count, windowStart]
    private final ConcurrentHashMap<String, long[]> requestCounts = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(@org.springframework.lang.NonNull HttpServletRequest request) {
        // Only rate-limit chat endpoints
        String path = request.getRequestURI();
        return !path.startsWith("/api/chat");
    }

    @Override
    protected void doFilterInternal(@org.springframework.lang.NonNull HttpServletRequest request,
            @org.springframework.lang.NonNull HttpServletResponse response,
            @org.springframework.lang.NonNull FilterChain filterChain) throws ServletException, IOException {

        String clientIp = getClientIp(request);
        long now = System.currentTimeMillis();

        long[] bucket = requestCounts.compute(clientIp, (ip, existing) -> {
            if (existing == null || (now - existing[1]) > WINDOW_MS) {
                // New window
                return new long[] { 1, now };
            }
            existing[0]++;
            return existing;
        });

        if (bucket[0] > MAX_REQUESTS) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(String.format(
                    "{\"error\":true,\"status\":429,\"message\":\"Rate limit exceeded. Please wait before sending more requests.\",\"timestamp\":\"%s\"}",
                    Instant.now().toString()));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
