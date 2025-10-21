/**
 * Hyperliquid WebSocket Integration
 * Provides real-time market data updates
 */

import WebSocket from 'ws';
import EventEmitter from 'events';

export class HyperliquidWebSocket extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting: boolean = false;
  private subscriptions: Set<string> = new Set();
  private pingInterval: NodeJS.Timeout | null = null;
  private readonly WS_URL = 'wss://api.hyperliquid.xyz/ws';
  private readonly RECONNECT_DELAY = 5000;
  private readonly PING_INTERVAL = 30000;

  constructor() {
    super();
    this.connect();
  }

  private connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    console.log('[HyperWS] Connecting to Hyperliquid WebSocket...');

    try {
      this.ws = new WebSocket(this.WS_URL);

      this.ws.on('open', () => {
        this.isConnecting = false;
        console.log('[HyperWS] ✅ Connected to Hyperliquid WebSocket');
        this.emit('connected');
        
        // Re-subscribe to all previous subscriptions
        this.subscriptions.forEach(sub => {
          this.send(JSON.parse(sub));
        });

        // Start ping/pong to keep connection alive
        this.startPing();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          console.error('[HyperWS] Failed to parse message:', error);
        }
      });

      this.ws.on('error', (error) => {
        console.error('[HyperWS] WebSocket error:', error);
        this.emit('error', error);
      });

      this.ws.on('close', () => {
        console.log('[HyperWS] WebSocket disconnected');
        this.cleanup();
        this.scheduleReconnect();
      });

    } catch (error) {
      console.error('[HyperWS] Failed to create WebSocket:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private handleMessage(message: any) {
    const channel = message.channel;
    
    switch (channel) {
      case 'allMids':
        this.emit('allMids', message.data);
        break;
      case 'l2Book':
        this.emit('l2Book', message.data);
        break;
      case 'trades':
        this.emit('trades', message.data);
        break;
      case 'user':
        this.emit('user', message.data);
        break;
      case 'userFills':
        this.emit('userFills', message.data);
        break;
      case 'candle':
        this.emit('candle', message.data);
        break;
      default:
        // Unknown channel
        break;
    }
  }

  private startPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, this.PING_INTERVAL);
  }

  private cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.ws) {
      this.ws.removeAllListeners();
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }

    this.isConnecting = false;
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      return;
    }

    console.log(`[HyperWS] Reconnecting in ${this.RECONNECT_DELAY / 1000}s...`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.RECONNECT_DELAY);
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  /**
   * Subscribe to all mid prices
   */
  public subscribeAllMids() {
    const sub = { method: 'subscribe', subscription: { type: 'allMids' } };
    this.subscriptions.add(JSON.stringify(sub));
    this.send(sub);
    console.log('[HyperWS] Subscribed to allMids');
  }

  /**
   * Subscribe to order book for a specific coin
   */
  public subscribeL2Book(coin: string) {
    const sub = { method: 'subscribe', subscription: { type: 'l2Book', coin } };
    this.subscriptions.add(JSON.stringify(sub));
    this.send(sub);
    console.log(`[HyperWS] Subscribed to L2 book for ${coin}`);
  }

  /**
   * Subscribe to trades for a specific coin
   */
  public subscribeTrades(coin: string) {
    const sub = { method: 'subscribe', subscription: { type: 'trades', coin } };
    this.subscriptions.add(JSON.stringify(sub));
    this.send(sub);
    console.log(`[HyperWS] Subscribed to trades for ${coin}`);
  }

  /**
   * Subscribe to user events (fills, funding, etc)
   */
  public subscribeUser(user: string) {
    const sub = { method: 'subscribe', subscription: { type: 'user', user } };
    this.subscriptions.add(JSON.stringify(sub));
    this.send(sub);
    console.log(`[HyperWS] Subscribed to user events for ${user}`);
  }

  /**
   * Subscribe to user fills
   */
  public subscribeUserFills(user: string) {
    const sub = { method: 'subscribe', subscription: { type: 'userFills', user } };
    this.subscriptions.add(JSON.stringify(sub));
    this.send(sub);
    console.log(`[HyperWS] Subscribed to user fills for ${user}`);
  }

  /**
   * Subscribe to candles for a specific coin and interval
   */
  public subscribeCandles(coin: string, interval: string = '1m') {
    const sub = { method: 'subscribe', subscription: { type: 'candle', coin, interval } };
    this.subscriptions.add(JSON.stringify(sub));
    this.send(sub);
    console.log(`[HyperWS] Subscribed to ${interval} candles for ${coin}`);
  }

  /**
   * Unsubscribe from a channel
   */
  public unsubscribe(subscription: any) {
    const sub = { method: 'unsubscribe', subscription };
    const subStr = JSON.stringify({ method: 'subscribe', subscription });
    this.subscriptions.delete(subStr);
    this.send(sub);
  }

  /**
   * Check if WebSocket is connected
   */
  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Close WebSocket connection
   */
  public close() {
    console.log('[HyperWS] Closing WebSocket connection');
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.cleanup();
  }
}

// Singleton instance
export const hyperliquidWS = new HyperliquidWebSocket();

