package com.example.restaurant.controller;

import com.example.restaurant.model.Restaurant;
import com.example.restaurant.model.SupplierInvoiceTransaction;
import com.example.restaurant.repository.SupplierInvoiceTransactionRepository;
import com.example.restaurant.service.RestaurantSecurityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierInvoiceTransactionController {
    private final SupplierInvoiceTransactionRepository repository;
    private final RestaurantSecurityService securityService;

    @Autowired
    public SupplierInvoiceTransactionController(SupplierInvoiceTransactionRepository repository, RestaurantSecurityService securityService) {
        this.repository = repository;
        this.securityService = securityService;
    }

    @GetMapping
    public List<SupplierInvoiceTransaction> getByRestaurant(@RequestParam Long restaurantId) {
        if (securityService.isSuperAdmin()) {
            return repository.findByRestaurantId(restaurantId);
        } else {
            Restaurant current = securityService.getCurrentUserRestaurant();
            if (current == null || !current.getId().equals(restaurantId)) return List.of();
            return repository.findByRestaurantId(current.getId());
        }
    }

    @PostMapping
    public SupplierInvoiceTransaction create(@RequestBody SupplierInvoiceTransaction tx) {
        tx.setId(null); // Ensure new
        return repository.save(tx);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SupplierInvoiceTransaction> update(@PathVariable Long id, @RequestBody SupplierInvoiceTransaction tx) {
        Optional<SupplierInvoiceTransaction> existing = repository.findById(id);
        if (existing.isEmpty()) return ResponseEntity.notFound().build();
        tx.setId(id);
        return ResponseEntity.ok(repository.save(tx));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
