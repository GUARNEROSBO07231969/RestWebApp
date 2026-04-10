package com.example.restaurant.repository;

import com.example.restaurant.model.SupplierInvoiceTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplierInvoiceTransactionRepository extends JpaRepository<SupplierInvoiceTransaction, Long> {
     List<SupplierInvoiceTransaction> findByRestaurantId(Long restaurantId);
}
