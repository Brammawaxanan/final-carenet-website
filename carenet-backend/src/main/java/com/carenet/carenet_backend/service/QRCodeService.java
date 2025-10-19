package com.carenet.carenet_backend.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.nio.file.FileSystems;
import java.nio.file.Path;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class QRCodeService {
    
    private static final String QR_CODE_DIRECTORY = "qrcodes/";
    private static final int QR_CODE_WIDTH = 300;
    private static final int QR_CODE_HEIGHT = 300;
    
    /**
     * Generate QR code and return Base64 encoded string
     * @param data Data to encode in QR code
     * @return Base64 encoded QR code image
     */
    public String generateQRCodeBase64(String data) throws WriterException, IOException {
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        
        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
        hints.put(EncodeHintType.MARGIN, 1);
        
        BitMatrix bitMatrix = qrCodeWriter.encode(data, BarcodeFormat.QR_CODE, 
                QR_CODE_WIDTH, QR_CODE_HEIGHT, hints);
        
        BufferedImage qrImage = MatrixToImageWriter.toBufferedImage(bitMatrix);
        
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(qrImage, "PNG", baos);
        byte[] imageBytes = baos.toByteArray();
        
        return Base64.getEncoder().encodeToString(imageBytes);
    }
    
    /**
     * Generate QR code and save to file
     * @param data Data to encode
     * @param fileName File name (without path)
     * @return File path where QR code is saved
     */
    public String generateQRCodeFile(String data, String fileName) throws WriterException, IOException {
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        
        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
        hints.put(EncodeHintType.MARGIN, 1);
        
        BitMatrix bitMatrix = qrCodeWriter.encode(data, BarcodeFormat.QR_CODE, 
                QR_CODE_WIDTH, QR_CODE_HEIGHT, hints);
        
        // Create directory if not exists
        File directory = new File(QR_CODE_DIRECTORY);
        if (!directory.exists()) {
            directory.mkdirs();
        }
        
        String filePath = QR_CODE_DIRECTORY + fileName + ".png";
        Path path = FileSystems.getDefault().getPath(filePath);
        
        MatrixToImageWriter.writeToPath(bitMatrix, "PNG", path);
        
        System.out.println("✅ QR Code generated: " + filePath);
        return filePath;
    }
    
    /**
     * Generate verification key for assignment QR code
     * @param assignmentId Assignment ID
     * @param bookingId Booking ID
     * @return Unique verification key
     */
    public String generateVerificationKey(Long assignmentId, Long bookingId) {
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase() + 
               "-" + assignmentId + "-" + bookingId;
    }
    
    /**
     * Generate QR code data string for assignment
     * @param assignmentId Assignment ID
     * @param bookingId Booking ID
     * @param verificationKey Verification key
     * @return Formatted data string
     */
    public String generateQRData(Long assignmentId, Long bookingId, String verificationKey) {
        return String.format(
            "CARENET_ASSIGNMENT|ID:%d|BOOKING:%d|KEY:%s|VERIFY:https://carenet.com/verify/%s",
            assignmentId, bookingId, verificationKey, verificationKey
        );
    }
    
    /**
     * Verify QR code data
     * @param qrData Scanned QR data
     * @param expectedKey Expected verification key
     * @return true if valid
     */
    public boolean verifyQRCode(String qrData, String expectedKey) {
        return qrData != null && qrData.contains(expectedKey);
    }
}
