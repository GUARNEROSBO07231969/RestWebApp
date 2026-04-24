package com.example.restaurant.security;

import com.example.restaurant.model.RestaurantAdmin;
import com.example.restaurant.repository.RestaurantAdminRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class RestaurantAdminUserDetailsService implements UserDetailsService {
    private final RestaurantAdminRepository adminRepo;
    public RestaurantAdminUserDetailsService(RestaurantAdminRepository adminRepo) {
        this.adminRepo = adminRepo;
    }
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        RestaurantAdmin admin = adminRepo.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        List<GrantedAuthority> authorities = new ArrayList<>();
        if (username.startsWith("admin")) {
            authorities.add(new SimpleGrantedAuthority("ROLE_SUPERADMIN"));
        } else {
            authorities.add(new SimpleGrantedAuthority("ROLE_MANAGER"));
        }
        return org.springframework.security.core.userdetails.User
                .withUsername(admin.getUsername())
                .password("{noop}" + admin.getPassword())
                .authorities(authorities)
                .build();
    }
}
