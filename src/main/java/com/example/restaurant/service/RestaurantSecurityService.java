package com.example.restaurant.service;

import com.example.restaurant.model.Restaurant;
import com.example.restaurant.model.RestaurantAdmin;
import com.example.restaurant.repository.RestaurantAdminRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class RestaurantSecurityService {
    private final RestaurantAdminRepository adminRepo;

    public RestaurantSecurityService(RestaurantAdminRepository adminRepo) {
        this.adminRepo = adminRepo;
    }

    public Restaurant getCurrentUserRestaurant() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        String username = auth.getName();
        // Superadmins can access all restaurants
        if (username.startsWith("admin")) return null;
        return adminRepo.findByUsername(username)
                .map(RestaurantAdmin::getRestaurant)
                .orElse(null);
    }

    public boolean isSuperAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return false;
        String username = auth.getName();
        return username.startsWith("admin");
    }
}
