package a2s.config;

import a2s.service.CachedProductsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.EnableAsync;

@Configuration
@EnableAsync
public class CacheInitializationConfig {

    @Autowired
    private CachedProductsService cachedProductsService;

    // Listen for ApplicationReadyEvent rather than implementing ApplicationRunner
    // so the cache loads AFTER DataInitializer's CommandLineRunner has finished
    // seeding the empty DB on first boot. Previously the cache initialized to 0
    // products and never refreshed until restart.
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        System.out.println("[CACHE] Starting product cache initialization...");
        long start = System.currentTimeMillis();
        cachedProductsService.loadCache();
        long duration = System.currentTimeMillis() - start;
        System.out.println("[CACHE] Product cache initialized in " + duration + "ms");
    }
}
