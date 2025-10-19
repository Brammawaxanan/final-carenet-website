package com.carenet.carenet_backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.File;

@Service
@RequiredArgsConstructor
public class EmailService {
    
    private final JavaMailSender mailSender;
    
    /**
     * Send email with PDF receipt attachment
     * @param toEmail Recipient email
     * @param subject Email subject
     * @param body Email body (HTML supported)
     * @param attachmentPath Path to PDF receipt
     */
    @Async
    public void sendEmailWithAttachment(String toEmail, String subject, String body, String attachmentPath) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom("carenet.noreply@gmail.com");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, true); // true = HTML
            
            // Attach PDF receipt if path provided
            if (attachmentPath != null && !attachmentPath.isEmpty()) {
                File attachment = new File(attachmentPath);
                if (attachment.exists()) {
                    FileSystemResource file = new FileSystemResource(attachment);
                    helper.addAttachment("CareNet_Receipt.pdf", file);
                }
            }
            
            mailSender.send(message);
            System.out.println("✅ Email sent successfully to: " + toEmail);
            
        } catch (MessagingException e) {
            System.err.println("❌ Failed to send email to " + toEmail + ": " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Send simple text email
     */
    @Async
    public void sendSimpleEmail(String toEmail, String subject, String body) {
        sendEmailWithAttachment(toEmail, subject, body, null);
    }
    
    /**
     * Generate HTML email body for payment receipt
     */
    public String generateReceiptEmailBody(String clientName, Long bookingId, double amount) {
        return """
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0;">CareNet</h1>
                        <p style="color: white; margin: 5px 0 0 0;">Your Trusted Care Platform</p>
                    </div>
                    
                    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #667eea; margin-top: 0;">Payment Received</h2>
                        
                        <p>Dear <strong>%s</strong>,</p>
                        
                        <p>Thank you for your payment! We've successfully received your payment for <strong>Booking #%d</strong>.</p>
                        
                        <div style="background: #f0f4ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin: 0 0 10px 0; color: #667eea;">Payment Summary</h3>
                            <table style="width: 100%%;">
                                <tr>
                                    <td style="padding: 8px 0;"><strong>Booking ID:</strong></td>
                                    <td style="padding: 8px 0; text-align: right;">#%d</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0;"><strong>Amount Paid:</strong></td>
                                    <td style="padding: 8px 0; text-align: right; color: #10b981; font-size: 18px; font-weight: bold;">Rs. %.2f</td>
                                </tr>
                            </table>
                        </div>
                        
                        <p>Your detailed receipt is attached to this email as a PDF document.</p>
                        
                        <p style="margin-top: 30px;">If you have any questions, feel free to contact our support team.</p>
                        
                        <p style="margin-top: 30px;">
                            Best regards,<br>
                            <strong>The CareNet Team</strong>
                        </p>
                    </div>
                    
                    <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
                        <p>© 2025 CareNet. All rights reserved.</p>
                        <p>This is an automated email. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(clientName, bookingId, bookingId, amount);
    }
}
