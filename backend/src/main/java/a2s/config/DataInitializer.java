package a2s.config;

import a2s.model.Design;
import a2s.model.Product;
import a2s.repository.DesignRepository;
import a2s.repository.ProductRepository;
import a2s.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    @SuppressWarnings("null")
    CommandLineRunner initDatabase(DesignRepository designRepo, ProductRepository productRepo,
                                   UserRepository userRepo, PasswordEncoder encoder) {
        return args -> {
            if (designRepo.count() == 0) {
                System.out.println("[DB] Empty database detected — seeding sample data...");
                seedSampleData(designRepo, productRepo);
                System.out.println("[DB] Seeded " + designRepo.count() + " designs, " + productRepo.count() + " products.");
            } else {
                System.out.println("[DB] Database has " + designRepo.count() + " designs, " + productRepo.count() + " products.");
            }
        };
    }

    private void seedSampleData(DesignRepository designRepo, ProductRepository productRepo) {
        String[][] items = {
            {"VIMLE 2-seat sofa", "IKEA", "sofa", "48990", "neutral", "living_room", "ethnic",
             "https://www.ikea.com/in/en/images/products/vimle-2-seat-sofa-hallarp-beige__0949414_pe799724_s5.jpg",
             "https://www.ikea.com/in/en/p/vimle-2-seat-sofa-hallarp-beige-s09399000/"},
            {"LANDSKRONA 2-seat sofa", "IKEA", "sofa", "59990", "warm", "kids_room", "minimal",
             "https://www.ikea.com/in/en/images/products/landskrona-2-seat-sofa-gunnared-dark-grey-wood__0602101_pe680170_s5.jpg",
             "https://www.ikea.com/in/en/p/landskrona-2-seat-sofa-gunnared-dark-grey-wood-s29270280/"},
            {"BRIMNES Day-bed", "IKEA", "bed", "33470", "neutral", "bedroom", "functional",
             "https://www.ikea.com/in/en/images/products/brimnes-day-bed-w-2-drawers-2-mattresses-white__1101878_pe867187_s5.jpg",
             "https://www.ikea.com/in/en/p/brimnes-day-bed-w-2-drawers-2-mattresses-white-00521288/"},
            {"KALLAX Shelf unit", "IKEA", "storage", "12990", "neutral", "study", "minimal",
             "https://www.ikea.com/in/en/images/products/kallax-shelf-unit-white__0644757_pe702939_s5.jpg",
             "https://www.ikea.com/in/en/p/kallax-shelf-unit-white-80275887/"},
            {"MALM Desk", "IKEA", "desk", "15990", "dark wood", "study", "classic",
             "https://www.ikea.com/in/en/images/products/malm-desk-black-brown__0735967_pe740309_s5.jpg",
             "https://www.ikea.com/in/en/p/malm-desk-black-brown-60214159/"},
            {"HEMNES Bed frame", "IKEA", "bed", "27990", "warm", "bedroom", "classic",
             "https://www.ikea.com/in/en/images/products/hemnes-bed-frame-white-stain__0948863_pe799334_s5.jpg",
             "https://www.ikea.com/in/en/p/hemnes-bed-frame-white-stain-s59031085/"},
            {"EKTORP 3-seat sofa", "IKEA", "sofa", "39990", "neutral", "living_room", "classic",
             "https://www.ikea.com/in/en/images/products/ektorp-3-seat-sofa-hallarp-beige__0818584_pe774497_s5.jpg",
             "https://www.ikea.com/in/en/p/ektorp-3-seat-sofa-hallarp-beige-s09320357/"},
            {"LACK Coffee table", "IKEA", "table", "2490", "dark wood", "living_room", "minimal",
             "https://www.ikea.com/in/en/images/products/lack-coffee-table-black-brown__0702214_pe724347_s5.jpg",
             "https://www.ikea.com/in/en/p/lack-coffee-table-black-brown-40104291/"},
        };

        for (String[] item : items) {
            Product p = new Product();
            p.setName(item[0]);
            p.setBrand(item[1]);
            p.setCategory(item[2]);
            p.setPrice(Double.parseDouble(item[3]));
            p.setColor(item[4]);
            p.setVendor("IKEA");
            p.setImage(item[7]);
            p.setAffiliateLink(item[8]);

            Design d = new Design();
            d.setTitle(item[0]);
            d.setDescription(item[8]);
            d.setImage(item[7]);
            d.setRoomType(item[5]);
            d.setStyle(item[6]);
            d.setTotalCost(Double.parseDouble(item[3]));
            d.setTags(List.of(item[2], item[6]));
            d.setProducts(List.of(p));
            designRepo.save(d);
        }
    }
}
