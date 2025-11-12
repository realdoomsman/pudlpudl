// WebSocket Integration for real-time price updates
export class PriceWebSocket {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private callbacks: Map<string, (data: any) => void> = new Map()

  connect() {
    // In production, connect to your WebSocket server
    // this.ws = new WebSocket('wss://api.pudl.fi/ws')
    
    // Mock implementation
    console.log('WebSocket: Connected to price feed')
    
    // Simulate price updates every 3 seconds
    setInterval(() => {
      this.callbacks.forEach((callback, token) => {
        const mockPrice = Math.random() * 100
        callback({ token, price: mockPrice, change24h: (Math.random() - 0.5) * 10 })
      })
    }, 3000)
  }

  subscribe(token: string, callback: (data: any) => void) {
    this.callbacks.set(token, callback)
  }

  unsubscribe(token: string) {
    this.callbacks.delete(token)
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

export const priceWS = new PriceWebSocket()
