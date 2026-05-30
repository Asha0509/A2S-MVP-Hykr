package a2s.model;

public record ProductListItem(
        String id,
        String name,
        String brand,
        String category,
        String aestheticStyle,
        String roomType,
        Double price,
        String color,
        String material,
        String vendor,
        String affiliateLink,
        String image
) {}
