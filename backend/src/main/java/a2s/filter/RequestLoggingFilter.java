package a2s.filter;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

/**
 * RequestLoggingFilter: Logs all incoming requests and outgoing responses
 * Useful for debugging issues like 503 errors and tracking request flow
 */
@Component
public class RequestLoggingFilter implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        if (!(request instanceof HttpServletRequest && response instanceof HttpServletResponse)) {
            chain.doFilter(request, response);
            return;
        }

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // Generate unique request ID for tracking across logs
        String requestId = UUID.randomUUID().toString().substring(0, 8);
        MDC.put("requestId", requestId);

        String method = httpRequest.getMethod();
        String uri = httpRequest.getRequestURI();
        String queryString = httpRequest.getQueryString();
        long startTime = System.currentTimeMillis();

        logger.info("[REQUEST] {} {} {} | ID: {}",
                method,
                uri,
                queryString != null ? "?" + queryString : "",
                requestId);

        try {
            // Log content type and length if present
            String contentType = httpRequest.getContentType();
            int contentLength = httpRequest.getContentLength();
            if (contentType != null || contentLength > 0) {
                logger.debug("[REQUEST_BODY] ContentType: {}, Size: {} bytes",
                        contentType != null ? contentType : "N/A",
                        contentLength > 0 ? contentLength : "N/A");
            }

            chain.doFilter(request, response);

            long duration = System.currentTimeMillis() - startTime;
            int status = httpResponse.getStatus();

            logger.info("[RESPONSE] {} {} {} | Status: {} | Duration: {}ms | ID: {}",
                    method,
                    uri,
                    queryString != null ? "?" + queryString : "",
                    status,
                    duration,
                    requestId);

            // Log warnings for slow or error responses
            if (duration > 5000) {
                logger.warn("[SLOW_REQUEST] {} {} took {}ms", method, uri, duration);
            }
            if (status >= 500) {
                logger.error("[SERVER_ERROR] {} {} returned status {}", method, uri, status);
            } else if (status >= 400) {
                logger.warn("[CLIENT_ERROR] {} {} returned status {}", method, uri, status);
            }

        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            logger.error("[REQUEST_ERROR] {} {} | Duration: {}ms | Exception: {} | ID: {}",
                    method,
                    uri,
                    duration,
                    e.getMessage(),
                    requestId,
                    e);
            throw e;
        } finally {
            MDC.remove("requestId");
        }
    }

    @Override
    public void init(FilterConfig filterConfig) {
        logger.info("RequestLoggingFilter initialized");
    }

    @Override
    public void destroy() {
        logger.info("RequestLoggingFilter destroyed");
    }
}
