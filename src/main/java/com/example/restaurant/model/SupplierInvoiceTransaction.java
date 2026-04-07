package com.example.restaurant.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "supplier_invoice_transactions")
public class SupplierInvoiceTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "restaurant_id", nullable = false)
    private Long restaurantId;

    @Column(name = "supplier_name", nullable = false)
    private String supplierName;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Column(name = "invoice_number", nullable = false)
    private String invoiceNumber;

    @Column(name = "check_number")
    private String checkNumber;

    @Column(name = "invoice_amount", nullable = false)
    private Double invoiceAmount;

    @Column(name = "notes")
    private String notes;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getRestaurantId() { return restaurantId; }
    public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }
    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }
    public LocalDate getTransactionDate() { return transactionDate; }
    public void setTransactionDate(LocalDate transactionDate) { this.transactionDate = transactionDate; }
    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
    public String getCheckNumber() { return checkNumber; }
    public void setCheckNumber(String checkNumber) { this.checkNumber = checkNumber; }
    public Double getInvoiceAmount() { return invoiceAmount; }
    public void setInvoiceAmount(Double invoiceAmount) { this.invoiceAmount = invoiceAmount; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
