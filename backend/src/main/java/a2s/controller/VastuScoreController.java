package a2s.controller;

import a2s.model.User;
import a2s.model.VastuCatalogClick;
import a2s.model.VastuScanLog;
import a2s.repository.VastuCatalogClickRepository;
import a2s.repository.UserRepository;
import a2s.repository.VastuScanLogRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/vastu")
public class VastuScoreController {

    private static final Logger logger = LoggerFactory.getLogger(VastuScoreController.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VastuScanLogRepository vastuScanLogRepository;

    @Autowired
    private VastuCatalogClickRepository vastuCatalogClickRepository;

    @Value("${LLM_SERVICE_URL:http://localhost:5001}")
    private String llmServiceUrl;

    @Value("${vastu.storage.path:./storage/vastu}")
    private String vastuStoragePath;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping("/status")
    @SuppressWarnings("null")
    public ResponseEntity<?> getStatus() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(401).body(Map.of("message", "Please log in to use Vastu Score."));
        }

        Optional<User> userOpt = userRepository.findByEmail(auth.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Please log in to use Vastu Score."));
        }

        String userId = userOpt.get().getId();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime windowStart = now.minusHours(24);
        long used = vastuScanLogRepository.countByUserIdAndCacheHitFalseAndCreatedAtAfter(userId, windowStart);

        long resetInSeconds = 0;
        if (used >= 3) {
            Optional<VastuScanLog> oldest = vastuScanLogRepository.findFirstByUserIdAndCacheHitFalseAndCreatedAtAfterOrderByCreatedAtAsc(userId, windowStart);
            if (oldest.isPresent()) {
                resetInSeconds = Math.max(0, Duration.between(now, oldest.get().getCreatedAt().plusHours(24)).getSeconds());
            }
        }

        return ResponseEntity.ok(Map.of(
                "used", used,
                "remaining", Math.max(0, 3 - used),
                "limit", 3,
                "reset_in_seconds", resetInSeconds
        ));
    }

    @PostMapping(value = "/analyse", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    @SuppressWarnings("null")
    public ResponseEntity<?> analyse(
            @RequestParam("room_type") String roomType,
            @RequestParam("facing_direction") String facingDirection,
            @RequestParam(value = "floor", required = false) String floor,
            @RequestParam("images") MultipartFile[] images) {

        long startTime = System.currentTimeMillis();
        logger.info("[VASTU_ANALYSE_START] room_type={}, facing_direction={}, floor={}, image_count={}",
                roomType, facingDirection, floor, images != null ? images.length : 0);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            logger.warn("[VASTU_AUTH_FAILED] No valid authentication");
            return ResponseEntity.status(401).body(Map.of("message", "Please log in to use Vastu Score."));
        }

        Optional<User> userOpt = userRepository.findByEmail(auth.getName());
        if (userOpt.isEmpty()) {
            logger.warn("[VASTU_USER_NOT_FOUND] email={}", auth.getName());
            return ResponseEntity.status(401).body(Map.of("message", "Please log in to use Vastu Score."));
        }

        if (images == null || images.length == 0 || images.length > 3) {
            logger.warn("[VASTU_INVALID_IMAGE_COUNT] count={}", images != null ? images.length : 0);
            return ResponseEntity.badRequest().body(Map.of("message", "Please upload between 1 and 3 images."));
        }

        try {
            List<byte[]> imageBytes = new ArrayList<>();
            for (int i = 0; i < images.length; i++) {
                MultipartFile image = images[i];
                if (image == null || image.isEmpty()) {
                    logger.warn("[VASTU_EMPTY_IMAGE] index={}", i);
                    return ResponseEntity.badRequest().body(Map.of("message", "One of the uploaded files is empty."));
                }
                if (image.getSize() > 10L * 1024L * 1024L) {
                    logger.warn("[VASTU_FILE_TOO_LARGE] index={}, size_mb={}", i, image.getSize() / 1024.0 / 1024.0);
                    return ResponseEntity.badRequest().body(Map.of("message", "Please upload a JPG, PNG, or HEIC photo under 10MB."));
                }

                String originalName = image.getOriginalFilename() == null ? "" : image.getOriginalFilename().toLowerCase();
                String contentType = image.getContentType() == null ? "" : image.getContentType().toLowerCase();
                boolean validType = contentType.startsWith("image/") || originalName.endsWith(".heic") || originalName.endsWith(".jpg")
                        || originalName.endsWith(".jpeg") || originalName.endsWith(".png");

                if (!validType) {
                    logger.warn("[VASTU_INVALID_IMAGE_TYPE] index={}, content_type={}, filename={}", i, contentType, originalName);
                    return ResponseEntity.badRequest().body(Map.of("message", "Please upload a JPG, PNG, or HEIC photo under 10MB."));
                }

                logger.debug("[VASTU_IMAGE_ACCEPTED] index={}, size_kb={}, type={}", i, image.getSize() / 1024.0, contentType);
                imageBytes.add(image.getBytes());
            }

            User user = userOpt.get();
            String cacheKey = buildCacheKey(roomType, facingDirection, floor, imageBytes);
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime cacheWindowStart = now.minusDays(7);

            Optional<VastuScanLog> cached = vastuScanLogRepository
                    .findFirstByCacheKeyAndCreatedAtAfterOrderByCreatedAtDesc(cacheKey, cacheWindowStart);
            if (cached.isPresent() && cached.get().getResponseJson() != null) {
                logger.info("[VASTU_CACHE_HIT] cache_key={}, user_id={}", cacheKey, user.getId());
                Map<String, Object> cachedResponse = objectMapper.readValue(cached.get().getResponseJson(), new TypeReference<>() {});
                long used = vastuScanLogRepository.countByUserIdAndCacheHitFalseAndCreatedAtAfter(user.getId(), now.minusHours(24));
                cachedResponse.put("cache_hit", true);
                cachedResponse.put("scans_used_today", used);
                cachedResponse.put("scans_remaining", Math.max(0, 3 - used));

                persistScanLog(user.getId(), cacheKey, roomType, facingDirection, floor, true, cachedResponse, List.of());
                logger.info("[VASTU_ANALYSE_COMPLETE] cache_hit=true, duration_ms={}", System.currentTimeMillis() - startTime);
                return ResponseEntity.ok(cachedResponse);
            }

            LocalDateTime windowStart = now.minusHours(24);
            long used = vastuScanLogRepository.countByUserIdAndCacheHitFalseAndCreatedAtAfter(user.getId(), windowStart);
            if (used >= 3) {
                logger.warn("[VASTU_RATE_LIMIT_EXCEEDED] user_id={}, used={}, limit=3", user.getId(), used);
                Optional<VastuScanLog> oldest = vastuScanLogRepository.findFirstByUserIdAndCacheHitFalseAndCreatedAtAfterOrderByCreatedAtAsc(user.getId(), windowStart);
                long resetInSeconds = 0;
                if (oldest.isPresent()) {
                    resetInSeconds = Math.max(0, Duration.between(now, oldest.get().getCreatedAt().plusHours(24)).getSeconds());
                }

                return ResponseEntity.status(429).body(Map.of(
                        "message", "You have used your 3 Vastu scans for today. Come back tomorrow.",
                        "reset_in_seconds", resetInSeconds,
                        "used", used,
                        "limit", 3
                ));
            }

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("room_type", roomType);
            body.add("facing_direction", facingDirection);
            if (floor != null && !floor.isBlank()) {
                body.add("floor", floor);
            }

            List<String> savedImagePaths = persistImages(user.getId(), images);

            for (int i = 0; i < images.length; i++) {
                MultipartFile image = images[i];
                byte[] bytes = imageBytes.get(i);
                ByteArrayResource resource = new ByteArrayResource(bytes) {
                    @Override
                    public String getFilename() {
                        return image.getOriginalFilename() == null ? "room.jpg" : image.getOriginalFilename();
                    }
                };

                HttpHeaders imageHeaders = new HttpHeaders();
                imageHeaders.setContentType(MediaType.parseMediaType(
                        image.getContentType() == null ? "image/jpeg" : image.getContentType()
                ));
                body.add("images", new HttpEntity<>(resource, imageHeaders));
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            logger.info("[VASTU_LLM_CALL_START] url={}, room_type={}, facing_direction={}", 
                    llmServiceUrl + "/api/vastu/analyse", roomType, facingDirection);
            long llmStartTime = System.currentTimeMillis();

            ResponseEntity<String> llmResponse;
            try {
                llmResponse = restTemplate.exchange(
                        llmServiceUrl + "/api/vastu/analyse",
                        HttpMethod.POST,
                        requestEntity,
                        String.class
                );
                long llmDuration = System.currentTimeMillis() - llmStartTime;
                logger.info("[VASTU_LLM_CALL_SUCCESS] status={}, duration_ms={}", 
                        llmResponse.getStatusCode(), llmDuration);
            } catch (HttpStatusCodeException llmError) {
                long llmDuration = System.currentTimeMillis() - llmStartTime;
                logger.error("[VASTU_LLM_CALL_FAILED] status={}, duration_ms={}, error={}",
                        llmError.getStatusCode(), llmDuration, llmError.getMessage());
                
                String errorBody = llmError.getResponseBodyAsString();
                if (errorBody != null && !errorBody.isBlank()) {
                    logger.error("[VASTU_LLM_ERROR_BODY] {}", errorBody);
                    try {
                        Map<String, Object> llmErrorPayload = objectMapper.readValue(errorBody, new TypeReference<>() {});
                        return ResponseEntity.status(llmError.getStatusCode()).body(llmErrorPayload);
                    } catch (Exception ignored) {
                        return ResponseEntity.status(llmError.getStatusCode()).body(Map.of(
                                "message", errorBody
                        ));
                    }
                }
                return ResponseEntity.status(llmError.getStatusCode()).body(Map.of(
                        "message", "Vastu analysis service returned an error."
                ));
            } catch (Exception e) {
                long llmDuration = System.currentTimeMillis() - llmStartTime;
                logger.error("[VASTU_LLM_CALL_EXCEPTION] duration_ms={}, exception={}",
                        llmDuration, e.getMessage(), e);
                throw e;
            }

            if (!llmResponse.getStatusCode().is2xxSuccessful() || llmResponse.getBody() == null) {
                logger.error("[VASTU_INVALID_LLM_RESPONSE] status={}, has_body={}", 
                        llmResponse.getStatusCode(), llmResponse.getBody() != null);
                return ResponseEntity.status(503).body(Map.of("message", "Vastu score service is currently unavailable."));
            }

            Map<String, Object> responseBody = objectMapper.readValue(llmResponse.getBody(), new TypeReference<>() {});
            responseBody.put("cache_hit", false);
            responseBody.put("scans_used_today", used + 1);
            responseBody.put("scans_remaining", Math.max(0, 3 - (used + 1)));

            persistScanLog(user.getId(), cacheKey, roomType, facingDirection, floor, false, responseBody, savedImagePaths);
            
            long totalDuration = System.currentTimeMillis() - startTime;
            logger.info("[VASTU_ANALYSE_COMPLETE] cache_hit=false, score={}, duration_ms={}", 
                    responseBody.get("score"), totalDuration);
            return ResponseEntity.ok(responseBody);

        } catch (Exception e) {
            long totalDuration = System.currentTimeMillis() - startTime;
            logger.error("[VASTU_ANALYSE_ERROR] duration_ms={}, exception={}", totalDuration, e.getMessage(), e);
            return ResponseEntity.status(503).body(Map.of(
                    "message", "Taking a bit longer than usual. Please try again.",
                    "details", e.getMessage()
            ));
        }
    }

    @PostMapping("/catalog-click")
    @SuppressWarnings("null")
    public ResponseEntity<?> trackCatalogClick(@RequestBody Map<String, String> payload) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(401).body(Map.of("message", "Please log in to use Vastu Score."));
        }

        Optional<User> userOpt = userRepository.findByEmail(auth.getName());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Please log in to use Vastu Score."));
        }

        String catalogFilter = payload.getOrDefault("catalog_filter", "");
        String catalogUrl = payload.getOrDefault("catalog_url", "");
        String cacheKey = payload.get("cache_key");

        if (catalogUrl.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "catalog_url is required"));
        }

        VastuCatalogClick click = new VastuCatalogClick();
        click.setUserId(userOpt.get().getId());
        click.setCacheKey(cacheKey);
        click.setCatalogFilter(catalogFilter);
        click.setCatalogUrl(catalogUrl);
        click.setCreatedAt(LocalDateTime.now());
        vastuCatalogClickRepository.save(click);

        return ResponseEntity.ok(Map.of("success", true));
    }

    private void persistScanLog(String userId,
                                String cacheKey,
                                String roomType,
                                String facingDirection,
                                String floor,
                                boolean cacheHit,
                                Map<String, Object> responseBody,
                                List<String> imagePaths) {
        try {
            VastuScanLog log = new VastuScanLog();
            log.setUserId(userId);
            log.setCacheKey(cacheKey);
            log.setRoomType(roomType);
            log.setFacingDirection(facingDirection);
            log.setFloorNumber(floor);
            log.setCacheHit(cacheHit);
            log.setCreatedAt(LocalDateTime.now());
            log.setImageRetainUntil(LocalDateTime.now().plusDays(90));
            log.setResponseJson(objectMapper.writeValueAsString(responseBody));
            log.setDetectedObjectsJson(objectMapper.writeValueAsString(responseBody.getOrDefault("detected_objects", List.of())));
            log.setSuggestionsJson(objectMapper.writeValueAsString(responseBody.getOrDefault("suggestions", List.of())));

            Object suggestionsObj = responseBody.get("suggestions");
            List<String> catalogLinks = new ArrayList<>();
            if (suggestionsObj instanceof List<?> suggestions) {
                for (Object suggestionObj : suggestions) {
                    if (suggestionObj instanceof Map<?, ?> suggestionMap) {
                        Object filter = suggestionMap.get("catalog_filter");
                        if (filter != null) {
                            catalogLinks.add("/#/gallery?filter=" + String.valueOf(filter));
                        }
                    }
                }
            }
            log.setCatalogLinksJson(objectMapper.writeValueAsString(catalogLinks));
            log.setImagePathsJson(objectMapper.writeValueAsString(imagePaths));
            vastuScanLogRepository.save(log);
        } catch (Exception ignored) {
        }
    }

    private List<String> persistImages(String userId, MultipartFile[] images) {
        List<String> storedPaths = new ArrayList<>();
        try {
            File dir = Path.of(vastuStoragePath).toFile();
            if (!dir.exists()) {
                dir.mkdirs();
            }

            LocalDateTime cutoff = LocalDateTime.now().minusDays(90);
            File[] files = dir.listFiles();
            if (files != null) {
                for (File file : files) {
                    LocalDateTime modified = LocalDateTime.ofEpochSecond(file.lastModified() / 1000, 0, java.time.ZoneOffset.UTC);
                    if (modified.isBefore(cutoff)) {
                        file.delete();
                    }
                }
            }

            for (MultipartFile image : images) {
                String originalName = image.getOriginalFilename() == null ? "image.jpg" : image.getOriginalFilename();
                String ext = ".jpg";
                int dotIndex = originalName.lastIndexOf('.');
                if (dotIndex >= 0) {
                    ext = originalName.substring(dotIndex);
                }

                String fileName = userId + "_" + UUID.randomUUID() + ext;
                File out = new File(dir, fileName);
                try (FileOutputStream fos = new FileOutputStream(out)) {
                    fos.write(image.getBytes());
                }
                storedPaths.add(out.getAbsolutePath());
            }
        } catch (Exception ignored) {
        }
        return storedPaths;
    }

    private String buildCacheKey(String roomType, String facingDirection, String floor, List<byte[]> images) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("MD5");
        digest.update(roomType.getBytes(StandardCharsets.UTF_8));
        digest.update(facingDirection.getBytes(StandardCharsets.UTF_8));
        if (floor != null) {
            digest.update(floor.getBytes(StandardCharsets.UTF_8));
        }
        for (byte[] image : images) {
            digest.update(image);
        }

        byte[] hash = digest.digest();
        StringBuilder sb = new StringBuilder();
        for (byte b : hash) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
