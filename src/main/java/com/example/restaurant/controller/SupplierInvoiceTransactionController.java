package com.example.restaurant.controller;

import com.example.restaurant.model.SupplierInvoiceTransaction;
import com.example.restaurant.repository.SupplierInvoiceTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierInvoiceTransactionController {
    @Autowired
    private SupplierInvoiceTransactionRepository repository;

    @GetMapping
    public List<SupplierInvoiceTransaction> getByRestaurant(@RequestParam Long restaurantId) {
        return repository.findByRestaurantId(restaurantId);
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
