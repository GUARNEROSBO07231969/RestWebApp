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
    public double spent;
    public double totalAmount;
    public LocalDateTime date;

    @PrePersist
    @PreUpdate
    void calc() {
        totalAmount = cashAmount + visaAmount - spent;
        if (date == null) date = LocalDateTime.now();
    }

    @Column(name = "store_name")
    public String getStoreName() {
        return storeName;
    }

    public void setStoreName(String storeName) {
        this.storeName = storeName;
    }
}