package com.example.restaurant.repository;

import com.example.restaurant.model.RestaurantAdmin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RestaurantAdminRepository extends JpaRepository<RestaurantAdmin, Long> {
    Optional<RestaurantAdmin> findByUsername(String username);
}
