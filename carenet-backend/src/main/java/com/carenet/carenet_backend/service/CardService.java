package com.carenet.carenet_backend.service;

import com.carenet.carenet_backend.dto.SaveCardRequest;
import com.carenet.carenet_backend.model.ClientCard;
import com.carenet.carenet_backend.repository.ClientCardRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.time.Instant;
import java.util.List;
import java.util.Base64;


@Service
public class CardService {

    @Autowired
    private ClientCardRepository cardRepository;

    /**
     * Get all saved cards for a user
     */
    public List<ClientCard> getUserCards(Long userId) {
        return cardRepository.findByUserIdOrderByAddedAtDesc(userId);
    }

    /**
     * Save a new card for a user
     * NOTE: In production, integrate with Stripe/PayPal for proper tokenization
     */
    @Transactional
    public ClientCard saveCard(Long userId, SaveCardRequest request) {
        // Validate card number (basic check)
        String cardNumber = request.getCardNumber().replaceAll("\\s+", "");
        if (!isValidCardNumber(cardNumber)) {
            throw new IllegalArgumentException("Invalid card number");
        }

        // Extract last 4 digits
        String last4 = cardNumber.substring(cardNumber.length() - 4);

        // Detect card brand
        String brand = detectCardBrand(cardNumber);

        // Generate secure token (in production, use Stripe/PayPal tokenization)
        String cardToken = generateCardToken(userId, cardNumber);

        // Check if card already exists
        if (cardRepository.existsByUserIdAndCardToken(userId, cardToken)) {
            throw new IllegalArgumentException("This card is already saved");
        }

        // Create new card record
        ClientCard card = new ClientCard();
        card.setUserId(userId);
        card.setCardHolder(request.getCardHolder());
        card.setLast4(last4);
        card.setCardToken(cardToken);
        card.setBrand(brand);
        card.setExpiryMonth(request.getExpiryMonth());
        card.setExpiryYear(request.getExpiryYear());
        card.setAddedAt(Instant.now());

        // Set as default if requested or if it's the first card
        boolean isFirstCard = cardRepository.countByUserId(userId) == 0;
        if (Boolean.TRUE.equals(request.getSetAsDefault()) || isFirstCard) {
            // Remove default from other cards
            setDefaultCard(userId, null);
            card.setIsDefault(true);
        } else {
            card.setIsDefault(false);
        }

        return cardRepository.save(card);
    }

    /**
     * Delete a saved card
     */
    @Transactional
    public boolean deleteCard(Long userId, Long cardId) {
        ClientCard card = cardRepository.findByIdAndUserId(cardId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Card not found"));

        // If deleting default card, set another as default
        if (Boolean.TRUE.equals(card.getIsDefault())) {
            List<ClientCard> otherCards = cardRepository.findByUserIdOrderByAddedAtDesc(userId);
            for (ClientCard otherCard : otherCards) {
                if (!otherCard.getId().equals(cardId)) {
                    otherCard.setIsDefault(true);
                    cardRepository.save(otherCard);
                    break;
                }
            }
        }

        cardRepository.delete(card);
        return true;
    }

    /**
     * Set a card as default
     */
    @Transactional
    public ClientCard setDefaultCard(Long userId, Long cardId) {
        // Remove default from all cards
        List<ClientCard> allCards = cardRepository.findByUserIdOrderByAddedAtDesc(userId);
        for (ClientCard card : allCards) {
            card.setIsDefault(false);
            cardRepository.save(card);
        }

        // Set new default if cardId provided
        if (cardId != null) {
            ClientCard card = cardRepository.findByIdAndUserId(cardId, userId)
                    .orElseThrow(() -> new IllegalArgumentException("Card not found"));
            card.setIsDefault(true);
            return cardRepository.save(card);
        }

        return null;
    }

    /**
     * Get a specific card
     */
    public ClientCard getCard(Long userId, Long cardId) {
        return cardRepository.findByIdAndUserId(cardId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Card not found"));
    }

    /**
     * Validate card number using Luhn algorithm
     */
    private boolean isValidCardNumber(String cardNumber) {
        if (cardNumber == null || cardNumber.length() < 13 || cardNumber.length() > 19) {
            return false;
        }

        // Check if it's all digits
        if (!cardNumber.matches("\\d+")) {
            return false;
        }

        // Luhn algorithm
        int sum = 0;
        boolean alternate = false;
        for (int i = cardNumber.length() - 1; i >= 0; i--) {
            int n = Integer.parseInt(cardNumber.substring(i, i + 1));
            if (alternate) {
                n *= 2;
                if (n > 9) {
                    n = n - 9; // Correct Luhn algorithm: subtract 9 (same as adding digits)
                }
            }
            sum += n;
            alternate = !alternate;
        }
        return (sum % 10 == 0);
    }

    /**
     * Detect card brand from number
     */
    private String detectCardBrand(String cardNumber) {
        if (cardNumber.startsWith("4")) {
            return "VISA";
        } else if (cardNumber.startsWith("5")) {
            return "MASTERCARD";
        } else if (cardNumber.startsWith("3")) {
            return "AMEX";
        } else if (cardNumber.startsWith("6")) {
            return "DISCOVER";
        }
        return "UNKNOWN";
    }

    /**
     * Generate secure token for card
     * NOTE: In production, use proper payment gateway tokenization (Stripe, PayPal, etc.)
     */
    private String generateCardToken(Long userId, String cardNumber) {
        try {
            String input = userId + ":" + cardNumber + ":" + System.currentTimeMillis();
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes());
            return "tok_" + Base64.getUrlEncoder().withoutPadding().encodeToString(hash).substring(0, 32);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate card token", e);
        }
    }
}
