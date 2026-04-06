/**
 * Simple event bus for cross-component communication
 * Used for payment confirmation events to trigger Activity page refresh
 */

class EventBus {
  constructor() {
    this.listeners = {}
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name (e.g., 'payment:confirmed')
   * @param {Function} callback - Handler function
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)

    // Return unsubscribe function
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback)
    }
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (!this.listeners[event]) return

    this.listeners[event].forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error)
      }
    })
  }

  /**
   * Remove all listeners for an event
   * @param {string} event - Event name
   */
  off(event) {
    delete this.listeners[event]
  }
}

// Create singleton instance
const eventBus = new EventBus()

export default eventBus
