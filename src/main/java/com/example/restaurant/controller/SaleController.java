package com.example.restaurant.controller;

import com.example.restaurant.repository.*;
import com.example.restaurant.model.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/sales")
public class SaleController {
    private final SaleRepository s;
    private final RestaurantRepository r;

    public SaleController(SaleRepository s, RestaurantRepository r) {
        this.s = s;
        this.r = r;
    }

    @GetMapping
    public List<Sale> all(@RequestParam Long restaurantId) {
        return s.findByRestaurant(r.findById(restaurantId).orElseThrow());
    }

    @PostMapping
    public Sale add(@RequestBody Map<String, Object> b) {
        Restaurant res = r.findById(((Number) b.get("restaurantId")).longValue()).orElseThrow();
        Sale o = new Sale();
        o.restaurant = res;
        o.cashAmount = ((Number) b.getOrDefault("cashAmount", 0)).doubleValue();
        o.visaAmount = ((Number) b.getOrDefault("visaAmount", 0)).doubleValue();
        o.storeName = (String) b.getOrDefault("storeName", null);
        o.expenseAmount = b.get("expenseAmount") != null ? ((Number) b.get("expenseAmount")).doubleValue() : 0;
        o.netsaleAmount = b.get("netsaleAmount") != null ? ((Number) b.get("netsaleAmount")).doubleValue() : o.cashAmount + o.visaAmount;
        o.doordashAmount = b.get("doordashAmount") != null ? ((Number) b.get("doordashAmount")).doubleValue() : 0;
        o.grubhubAmount = b.get("grubhubAmount") != null ? ((Number) b.get("grubhubAmount")).doubleValue() : 0;
        o.ubereatsAmount = b.get("ubereatsAmount") != null ? ((Number) b.get("ubereatsAmount")).doubleValue() : 0;
        o.onlineAmount = b.get("onlineAmount") != null ? ((Number) b.get("onlineAmount")).doubleValue() : 0;
        return s.save(o);
    }

    @PutMapping("/{id}")
    public Sale edit(@PathVariable Long id, @RequestBody Map<String, Object> b) {
        Sale o = s.findById(id).orElseThrow();
        if (b.containsKey("restaurantId")) o.restaurant = r.findById(((Number) b.get("restaurantId")).longValue()).orElseThrow();
        if (b.containsKey("cashAmount")) o.cashAmount = ((Number) b.get("cashAmount")).doubleValue();
        if (b.containsKey("visaAmount")) o.visaAmount = ((Number) b.get("visaAmount")).doubleValue();
        if (b.containsKey("storeName")) o.storeName = (String) b.get("storeName");
        if (b.containsKey("expenseAmount")) o.expenseAmount = b.get("expenseAmount") != null ? ((Number) b.get("expenseAmount")).doubleValue() : 0;
        if (b.containsKey("netsaleAmount")) o.netsaleAmount = b.get("netsaleAmount") != null ? ((Number) b.get("netsaleAmount")).doubleValue() : o.cashAmount + o.visaAmount;
        if (b.containsKey("doordashAmount")) o.doordashAmount = b.get("doordashAmount") != null ? ((Number) b.get("doordashAmount")).doubleValue() : 0;
        if (b.containsKey("grubhubAmount")) o.grubhubAmount = b.get("grubhubAmount") != null ? ((Number) b.get("grubhubAmount")).doubleValue() : 0;
        if (b.containsKey("ubereatsAmount")) o.ubereatsAmount = b.get("ubereatsAmount") != null ? ((Number) b.get("ubereatsAmount")).doubleValue() : 0;
        if (b.containsKey("onlineAmount")) o.onlineAmount = b.get("onlineAmount") != null ? ((Number) b.get("onlineAmount")).doubleValue() : 0;
        return s.save(o);
    }

    @DeleteMapping("/{id}")
    public void del(@PathVariable Long id) {
        s.deleteById(id);
    }
}