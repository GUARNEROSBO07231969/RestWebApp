package com.example.restaurant.model;

import jakarta.persistence.*;
import java.time.*;

@Entity
public class Sale {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(optional = false)
    public Restaurant restaurant;

    public double cashAmount;
    public double visaAmount;
    public String storeName; // new field for store name
    public Double expenseAmount; // use expenseAmount instead of spent
    public double totalAmount;
    public Double netSaleAmount; // new field for Gross Net Amount
    public LocalDateTime date;

    @PrePersist
    @PreUpdate
    void calc() {
        totalAmount = cashAmount + visaAmount - (expenseAmount != null ? expenseAmount : 0);
        if (date == null) date = LocalDateTime.now();
        // Optionally, calculate netSaleAmount if you want it derived
        // netSaleAmount = cashAmount + visaAmount;
    }

    @Column(name = "store_name")
    public String getStoreName() {
        return storeName;
    }

    public void setStoreName(String storeName) {
        this.storeName = storeName;
    }

    public Double getExpenseAmount() { return expenseAmount; }
    public void setExpenseAmount(Double expenseAmount) { this.expenseAmount = expenseAmount; }

    public Double getNetSaleAmount() { return netSaleAmount; }
    public void setNetSaleAmount(Double netSaleAmount) { this.netSaleAmount = netSaleAmount; }
}