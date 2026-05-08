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
    public Double netsaleAmount; // new field for Gross Net Amount
    public LocalDateTime date;

    public Double doordashAmount;
    public Double grubhubAmount;
    public Double ubereatsAmount;
    public Double onlineAmount;

    @PrePersist
    @PreUpdate
    void calc() {
        totalAmount = cashAmount
                   + visaAmount
                   + (doordashAmount != null ? doordashAmount : 0)
                   + (grubhubAmount != null ? grubhubAmount : 0)
                   + (ubereatsAmount != null ? ubereatsAmount : 0)
                   + (onlineAmount != null ? onlineAmount : 0)
                   - (expenseAmount != null ? expenseAmount : 0);
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

    @Column(name = "calculated_sale_amount")
    public Double getNetsaleAmount() { return netsaleAmount; }
    public void setNetsaleAmount(Double netsaleAmount) { this.netsaleAmount = netsaleAmount; }

    @Transient
    public Double getNetSaleAmount() { return netsaleAmount; }
    public void setNetSaleAmount(Double v) { this.netsaleAmount = v; }
    @Transient
    public Double getNet_sale_amount() { return netsaleAmount; }
    public void setNet_sale_amount(Double v) { this.netsaleAmount = v; }

    public Double getDoordashAmount() { return doordashAmount; }
    public void setDoordashAmount(Double doordashAmount) { this.doordashAmount = doordashAmount; }
    public Double getGrubhubAmount() { return grubhubAmount; }
    public void setGrubhubAmount(Double grubhubAmount) { this.grubhubAmount = grubhubAmount; }
    public Double getUbereatsAmount() { return ubereatsAmount; }
    public void setUbereatsAmount(Double ubereatsAmount) { this.ubereatsAmount = ubereatsAmount; }
    public Double getOnlineAmount() { return onlineAmount; }
    public void setOnlineAmount(Double onlineAmount) { this.onlineAmount = onlineAmount; }

    @Column(name = "captured_sale_amount")
    public Double capturedSaleAmount;

    public Double getCapturedSaleAmount() { return capturedSaleAmount; }
    public void setCapturedSaleAmount(Double capturedSaleAmount) { this.capturedSaleAmount = capturedSaleAmount; }
}