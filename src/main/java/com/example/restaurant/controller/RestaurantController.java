package com.example.restaurant.controller;

import com.example.restaurant.repository.*;
import com.example.restaurant.model.*;
import com.example.restaurant.service.RestaurantSecurityService;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {
    private final RestaurantRepository r;
    private final RestaurantSecurityService securityService;

    public RestaurantController(RestaurantRepository r, RestaurantSecurityService securityService) {
        this.r = r;
        this.securityService = securityService;
    }

    @GetMapping
    public List<Restaurant> all() {
        if (securityService.isSuperAdmin()) {
            return r.findAll();
        } else {
            Restaurant current = securityService.getCurrentUserRestaurant();
            if (current != null) return List.of(current);
            return List.of();
        }
    }
}