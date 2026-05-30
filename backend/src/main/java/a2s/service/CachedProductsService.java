package a2s.service;

import a2s.model.ProductListItem;
import a2s.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CachedProductsService {

    // volatile + double-checked locking: safe under concurrent first-load
    private volatile boolean isLoaded = false;
    private volatile List<ProductListItem> cachedProducts = List.of();

    @Autowired
    private ProductRepository productRepository;

    public void loadCache() {
        if (isLoaded) return; // fast path — no lock needed once loaded
        synchronized (this) {
            if (isLoaded) return; // double-check inside lock
            long start = System.currentTimeMillis();
            cachedProducts = List.copyOf(productRepository.findAllListItems());
            isLoaded = true;
            System.out.println("Cached " + cachedProducts.size() + " products in "
                    + (System.currentTimeMillis() - start) + "ms");
        }
    }

    public void invalidateCache() {
        synchronized (this) {
            isLoaded = false;
            cachedProducts = List.of();
        }
    }

    public List<ProductListItem> getProductsPage(int page, int size) {
        if (!isLoaded) loadCache();

        int start = page * size;
        if (start >= cachedProducts.size()) return List.of();
        int end = Math.min(start + size, cachedProducts.size());
        return cachedProducts.subList(start, end);
    }

    public long getTotalCount() {
        if (!isLoaded) loadCache();
        return cachedProducts.size();
    }

    public List<ProductListItem> getAllCached() {
        if (!isLoaded) loadCache();
        return cachedProducts;
    }
}
