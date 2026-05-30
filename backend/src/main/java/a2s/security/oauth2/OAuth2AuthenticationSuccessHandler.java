package a2s.security.oauth2;

import a2s.model.User;
import a2s.repository.UserRepository;
import a2s.security.jwt.JwtUtils;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Optional;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserRepository userRepository;

    @Value("${app.oauth2.redirect-uri:http://localhost:3000/#/dashboard}")
    private String redirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken authToken = (org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken) authentication;
        String provider = authToken.getAuthorizedClientRegistrationId();
        
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        if (email == null) {
            throw new ServletException("Email not found from OAuth2 provider");
        }
        String name = oAuth2User.getAttribute("name");

        Optional<User> userOptional = userRepository.findByEmail(email);
        User user;
        if (userOptional.isPresent()) {
            user = userOptional.get();
            if (user.getProvider() == null) {
                user.setProvider(provider);
                user.setProviderId(oAuth2User.getName());
                userRepository.save(user);
            }
        } else {
            user = new User();
            user.setName(name != null ? name : email.split("@")[0]);
            user.setEmail(email);
            user.setProvider(provider);
            user.setProviderId(oAuth2User.getName());
            user.setPassword(""); // No password for social users
            userRepository.save(user);
        }

        String token = jwtUtils.generateTokenFromUsername(user.getEmail());

        @SuppressWarnings("null")
        String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("token", token)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
