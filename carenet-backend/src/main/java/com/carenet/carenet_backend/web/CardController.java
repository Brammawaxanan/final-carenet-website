package com.carenet.carenet_backend.web;

import com.carenet.carenet_backend.dto.SaveCardRequest;
import com.carenet.carenet_backend.model.ClientCard;
import com.carenet.carenet_backend.service.CardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for managing saved payment cards
 */
@RestController
@RequestMapping("/api/cards")
@CrossOrigin(origins = "*")
public class CardController {

    @Autowired
    private CardService cardService;

    /**
     * Get all saved cards for the current user
     * GET /api/cards/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserCards(@PathVariable Long userId) {
        try {
            List<ClientCard> cards = cardService.getUserCards(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("cards", cards);
            response.put("count", cards.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to fetch cards: " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Save a new card
     * POST /api/cards/save
     */
    @PostMapping("/save")
    public ResponseEntity<?> saveCard(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.valueOf(request.get("userId").toString());
            
            // Map request to SaveCardRequest DTO
            SaveCardRequest saveRequest = new SaveCardRequest();
            saveRequest.setCardHolder((String) request.get("cardHolder"));
            saveRequest.setCardNumber((String) request.get("cardNumber"));
            saveRequest.setExpiryMonth((String) request.get("expiryMonth"));
            saveRequest.setExpiryYear((String) request.get("expiryYear"));
            saveRequest.setCvv((String) request.get("cvv"));
            saveRequest.setSetAsDefault((Boolean) request.getOrDefault("setAsDefault", false));
            
            ClientCard savedCard = cardService.saveCard(userId, saveRequest);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Card saved successfully");
            response.put("card", savedCard);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to save card: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Delete a saved card
     * DELETE /api/cards/{cardId}
     */
    @DeleteMapping("/{cardId}")
    public ResponseEntity<?> deleteCard(
            @PathVariable Long cardId,
            @RequestParam Long userId) {
        try {
            boolean deleted = cardService.deleteCard(userId, cardId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Card deleted successfully");
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to delete card: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Set a card as default
     * PUT /api/cards/{cardId}/set-default
     */
    @PutMapping("/{cardId}/set-default")
    public ResponseEntity<?> setDefaultCard(
            @PathVariable Long cardId,
            @RequestParam Long userId) {
        try {
            ClientCard card = cardService.setDefaultCard(userId, cardId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Default card updated");
            response.put("card", card);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to set default card: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Get a specific card
     * GET /api/cards/{cardId}
     */
    @GetMapping("/{cardId}")
    public ResponseEntity<?> getCard(
            @PathVariable Long cardId,
            @RequestParam Long userId) {
        try {
            ClientCard card = cardService.getCard(userId, cardId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("card", card);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Card not found");
            return ResponseEntity.status(404).body(error);
        }
    }
}
