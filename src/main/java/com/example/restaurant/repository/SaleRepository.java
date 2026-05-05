package com.example.restaurant.repository;

import com.example.restaurant.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.*;

public interface SaleRepository extends JpaRepository<Sale,Long>{
    List<Sale> findByRestaurant(Restaurant r);

    @Query("SELECT s FROM Sale s WHERE s.restaurant = :restaurant ORDER BY s.id ASC")
    List<Sale> findByRestaurantOrderByIdAsc(@Param("restaurant") Restaurant restaurant);
}