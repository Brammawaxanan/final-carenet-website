package com.carenet.carenet_backend.service;

import com.google.zxing.WriterException;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class ReceiptGeneratorService {
    
    private final QRCodeService qrCodeService;
    
    private static final String RECEIPTS_DIRECTORY = "receipts/";
    private static final DateTimeFormatter DATE_FORMATTER = 
        DateTimeFormatter.ofPattern("MMM dd, yyyy hh:mm a").withZone(ZoneId.systemDefault());
    
    /**
     * Generate PDF receipt for payment
     */
    public String generateReceipt(
            Long bookingId,
            String clientName,
            String clientEmail,
            String caregiverName,
            String serviceType,
            String packageType,
            double amount,
            String paymentMethod,
            Instant paymentDate) throws IOException, WriterException {
        
        // Create receipts directory if not exists
        File directory = new File(RECEIPTS_DIRECTORY);
        if (!directory.exists()) {
            directory.mkdirs();
        }
        
        String fileName = "receipt_" + bookingId + "_" + System.currentTimeMillis() + ".pdf";
        String filePath = RECEIPTS_DIRECTORY + fileName;
        
        // Initialize PDF
        PdfWriter writer = new PdfWriter(filePath);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);
        
        // Set margins
        document.setMargins(40, 40, 40, 40);
        
        // Header with company name
        addHeader(document);
        
        // Receipt title
        addReceiptTitle(document, bookingId);
        
        // Client and booking information
        addBookingDetails(document, clientName, clientEmail, caregiverName, 
                         serviceType, packageType, paymentDate);
        
        // Payment details table
        addPaymentDetails(document, amount, paymentMethod);
        
        // QR Code for verification
        addQRCode(document, bookingId);
        
        // Footer
        addFooter(document);
        
        document.close();
        
        System.out.println("✅ Receipt generated: " + filePath);
        return filePath;
    }
    
    private void addHeader(Document document) {
        // Company name with gradient-like color
        Paragraph header = new Paragraph("CareNet")
                .setFontSize(28)
                .setBold()
                .setFontColor(new DeviceRgb(102, 126, 234))
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(5);
        document.add(header);
        
        Paragraph tagline = new Paragraph("Your Trusted Care Platform")
                .setFontSize(12)
                .setFontColor(ColorConstants.GRAY)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(20);
        document.add(tagline);
        
        // Horizontal line
        document.add(new Paragraph()
                .setBorderTop(new com.itextpdf.layout.borders.SolidBorder(
                        new DeviceRgb(102, 126, 234), 2))
                .setMarginBottom(20));
    }
    
    private void addReceiptTitle(Document document, Long bookingId) {
        Paragraph title = new Paragraph("PAYMENT RECEIPT")
                .setFontSize(20)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(10);
        document.add(title);
        
        Paragraph receiptNumber = new Paragraph("Receipt #" + bookingId)
                .setFontSize(14)
                .setFontColor(ColorConstants.GRAY)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(20);
        document.add(receiptNumber);
    }
    
    private void addBookingDetails(Document document, String clientName, String clientEmail,
                                  String caregiverName, String serviceType, 
                                  String packageType, Instant paymentDate) {
        // Create info table
        Table table = new Table(2).useAllAvailableWidth();
        table.setMarginBottom(20);
        
        addInfoRow(table, "Client Name:", clientName);
        addInfoRow(table, "Client Email:", clientEmail);
        addInfoRow(table, "Caregiver:", caregiverName);
        addInfoRow(table, "Service Type:", serviceType);
        addInfoRow(table, "Package:", packageType);
        addInfoRow(table, "Payment Date:", DATE_FORMATTER.format(paymentDate));
        
        document.add(table);
    }
    
    private void addInfoRow(Table table, String label, String value) {
        table.addCell(new Cell()
                .add(new Paragraph(label).setBold())
                .setBorder(Border.NO_BORDER)
                .setPadding(5));
        table.addCell(new Cell()
                .add(new Paragraph(value))
                .setBorder(Border.NO_BORDER)
                .setPadding(5));
    }
    
    private void addPaymentDetails(Document document, double amount, String paymentMethod) {
        // Payment details box
        Table paymentTable = new Table(2).useAllAvailableWidth();
        paymentTable.setMarginTop(10).setMarginBottom(20);
        paymentTable.setBackgroundColor(new DeviceRgb(240, 244, 255));
        
        paymentTable.addCell(new Cell()
                .add(new Paragraph("Payment Method:").setBold())
                .setBorder(Border.NO_BORDER)
                .setPadding(15));
        paymentTable.addCell(new Cell()
                .add(new Paragraph(paymentMethod))
                .setBorder(Border.NO_BORDER)
                .setPadding(15));
        
        paymentTable.addCell(new Cell()
                .add(new Paragraph("Total Amount:").setBold().setFontSize(16))
                .setBorder(Border.NO_BORDER)
                .setPadding(15));
        paymentTable.addCell(new Cell()
                .add(new Paragraph("$" + String.format("%.2f", amount))
                        .setBold()
                        .setFontSize(18)
                        .setFontColor(new DeviceRgb(16, 185, 129)))
                .setBorder(Border.NO_BORDER)
                .setPadding(15)
                .setTextAlignment(TextAlignment.RIGHT));
        
        document.add(paymentTable);
    }
    
    private void addQRCode(Document document, Long bookingId) throws WriterException, IOException {
        // Generate small QR code for receipt verification
        String qrData = "CARENET_RECEIPT|BOOKING:" + bookingId + "|VERIFY:https://carenet.com/receipt/" + bookingId;
        String qrBase64 = qrCodeService.generateQRCodeBase64(qrData);
        
        byte[] qrBytes = Base64.getDecoder().decode(qrBase64);
        Image qrImage = new Image(ImageDataFactory.create(qrBytes));
        qrImage.scaleToFit(80, 80);
        
        Paragraph qrLabel = new Paragraph("Scan to verify")
                .setFontSize(10)
                .setFontColor(ColorConstants.GRAY)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(20);
        document.add(qrLabel);
        
        Paragraph qrContainer = new Paragraph()
                .add(qrImage)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(20);
        document.add(qrContainer);
    }
    
    private void addFooter(Document document) {
        Paragraph footer = new Paragraph("Thank you for choosing CareNet!")
                .setFontSize(12)
                .setBold()
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(20)
                .setMarginBottom(10);
        document.add(footer);
        
        Paragraph contact = new Paragraph("For support, contact us at support@carenet.com | +1-555-0100")
                .setFontSize(10)
                .setFontColor(ColorConstants.GRAY)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(10);
        document.add(contact);
        
        Paragraph copyright = new Paragraph("© 2025 CareNet. All rights reserved.")
                .setFontSize(9)
                .setFontColor(ColorConstants.LIGHT_GRAY)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(copyright);
    }
}
