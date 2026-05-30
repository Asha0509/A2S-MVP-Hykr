package a2s.repository;

import a2s.model.Design;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DesignRepository extends JpaRepository<Design, String> {

    List<Design> findByRoomType(String roomType);

    List<Design> findByStyle(String style);
}
