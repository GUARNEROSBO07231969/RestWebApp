package com.example.restaurant.security;

import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {
    private final UserDetailsService userDetailsService;
    public SecurityConfig(UserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }
    @Bean
    SecurityFilterChain filter(HttpSecurity h) throws Exception {
        h.csrf(c -> c.disable())
         .authorizeHttpRequests(a -> a
             .requestMatchers("/login", "/css/**", "/js/**").permitAll() // Allow public access
             .anyRequest().authenticated()
         )
         .formLogin(f -> f
             .loginPage("/login")
             .permitAll()
             .defaultSuccessUrl("/", true)
         )
         .logout(l -> l.permitAll())
         .userDetailsService(userDetailsService);
        return h.build();
    }
}