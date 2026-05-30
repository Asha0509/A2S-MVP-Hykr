package a2s.security;

import a2s.config.RateLimitFilter;
import a2s.security.jwt.AuthEntryPointJwt;
import a2s.security.jwt.AuthTokenFilter;
import a2s.security.services.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableMethodSecurity
public class WebSecurityConfig {
    @Autowired
    UserDetailsServiceImpl userDetailsService;

    @Autowired
    private AuthEntryPointJwt unauthorizedHandler;

    @Autowired
    private a2s.security.jwt.JwtUtils jwtUtils;

    @Autowired
    private RateLimitFilter rateLimitFilter;

    @Autowired
    private a2s.security.oauth2.OAuth2AuthenticationSuccessHandler oAuth2AuthenticationSuccessHandler;

    @Value("${cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter(jwtUtils, userDetailsService);
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Parse allowed origins from env/config + always allow LAN patterns
        List<String> origins = new java.util.ArrayList<>(Arrays.asList(allowedOrigins.split(",")));
        origins.add("http://192.168.*:3000");
        origins.add("http://10.*:3000");
        origins.add("http://172.*:3000");
        origins.add("http://127.0.0.1:3000");
        origins.add("http://localhost:8501");
        origins.add("http://127.0.0.1:8501");
        origins.add("http://10.*:8501");
        origins.add("http://192.168.*:8501");
        origins.add("http://172.*:8501");
        configuration.setAllowedOriginPatterns(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(org.springframework.security.config.Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(new AntPathRequestMatcher("/api/users/login")).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/api/users/register")).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/api/users/forgot-password")).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/api/users/reset-password")).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/api/gallery", "GET")).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/api/gallery/*", "GET")).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/api/products", "GET")).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/api/products/*", "GET")).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/api/products/**", "GET")).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/api/products/import", "POST")).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/api/newsletter/**")).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/api/subscribers/**")).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/error")).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/favicon.ico")).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/login/oauth2/code/**")).permitAll()
                        .requestMatchers(new AntPathRequestMatcher("/oauth2/authorization/**")).permitAll()
                        .anyRequest().authenticated())
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(oAuth2AuthenticationSuccessHandler))
                .headers(headers -> headers
                        .frameOptions(frame -> frame.sameOrigin())
                        .cacheControl(cache -> cache.disable())
                        .contentTypeOptions(cto -> {
                        })
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31536000)));

        // Rate limit filter runs before auth to block abusive traffic early
        http.addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class);
        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
