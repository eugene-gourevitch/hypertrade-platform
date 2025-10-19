#!/usr/bin/env python3
"""
Hyperliquid API integration module.
Provides trading operations, account data retrieval, and market information.
"""

import json
import sys
from typing import Any, Dict, List, Optional
from hyperliquid.info import Info
from hyperliquid.exchange import Exchange
from hyperliquid.utils import constants

# Environment variables will be passed via command line arguments
ACCOUNT_ADDRESS = None
API_SECRET = None
API_URL = constants.MAINNET_API_URL

def init_clients(account_address: str, api_secret: str, testnet: bool = False):
    """Initialize Hyperliquid clients."""
    global ACCOUNT_ADDRESS, API_SECRET, API_URL
    ACCOUNT_ADDRESS = account_address
    API_SECRET = api_secret
    API_URL = constants.TESTNET_API_URL if testnet else constants.MAINNET_API_URL

def get_info_client() -> Info:
    """Get Info client for read-only operations."""
    return Info(API_URL, skip_ws=True)

def get_exchange_client() -> Exchange:
    """Get Exchange client for trading operations."""
    if not ACCOUNT_ADDRESS or not API_SECRET:
        raise ValueError("Account address and API secret must be initialized")
    return Exchange(ACCOUNT_ADDRESS, API_SECRET, API_URL)

# ============================================================================
# Account Information
# ============================================================================

def get_user_state(address: Optional[str] = None) -> Dict[str, Any]:
    """Get user account state including balances and positions."""
    info = get_info_client()
    addr = address or ACCOUNT_ADDRESS
    return info.user_state(addr)

def get_open_orders(address: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get user's open orders."""
    info = get_info_client()
    addr = address or ACCOUNT_ADDRESS
    return info.open_orders(addr)

def get_user_fills(address: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get user's recent fills (trades)."""
    info = get_info_client()
    addr = address or ACCOUNT_ADDRESS
    return info.user_fills(addr)

def get_user_funding_history(address: Optional[str] = None, start_time: Optional[int] = None, end_time: Optional[int] = None) -> List[Dict[str, Any]]:
    """Get user's funding payment history."""
    info = get_info_client()
    addr = address or ACCOUNT_ADDRESS
    return info.user_funding(addr, start_time, end_time)

# ============================================================================
# Market Information
# ============================================================================

def get_meta() -> Dict[str, Any]:
    """Get metadata for all perpetual assets."""
    info = get_info_client()
    return info.meta()

def get_spot_meta() -> Dict[str, Any]:
    """Get metadata for all spot assets."""
    info = get_info_client()
    return info.spot_meta()

def get_all_mids() -> Dict[str, str]:
    """Get mid prices for all assets."""
    info = get_info_client()
    return info.all_mids()

def get_l2_snapshot(coin: str) -> Dict[str, Any]:
    """Get L2 order book snapshot for a coin."""
    info = get_info_client()
    return info.l2_snapshot(coin)

def get_candles_snapshot(coin: str, interval: str = "1m", start_time: Optional[int] = None, end_time: Optional[int] = None) -> List[Dict[str, Any]]:
    """Get candlestick data for a coin."""
    info = get_info_client()
    return info.candles_snapshot(coin, interval, start_time, end_time)

def get_funding_history(coin: str, start_time: Optional[int] = None, end_time: Optional[int] = None) -> List[Dict[str, Any]]:
    """Get funding rate history for a coin."""
    info = get_info_client()
    return info.funding_history(coin, start_time, end_time)

# ============================================================================
# Trading Operations
# ============================================================================

def place_order(
    coin: str,
    is_buy: bool,
    size: float,
    price: float,
    order_type: Dict[str, Any] = {"limit": {"tif": "Gtc"}},
    reduce_only: bool = False,
    cloid: Optional[str] = None
) -> Dict[str, Any]:
    """Place a new order."""
    exchange = get_exchange_client()
    
    order_request = {
        "a": get_asset_index(coin),
        "b": is_buy,
        "p": str(price),
        "s": str(size),
        "r": reduce_only,
        "t": order_type,
    }
    
    if cloid:
        order_request["c"] = cloid
    
    return exchange.order(order_request)

def place_market_order(
    coin: str,
    is_buy: bool,
    size: float,
    slippage: float = 0.05
) -> Dict[str, Any]:
    """Place a market order with slippage protection."""
    # Get current mid price
    all_mids = get_all_mids()
    mid_price = float(all_mids.get(coin, 0))
    
    if mid_price == 0:
        raise ValueError(f"Could not get mid price for {coin}")
    
    # Calculate limit price with slippage
    if is_buy:
        limit_price = mid_price * (1 + slippage)
    else:
        limit_price = mid_price * (1 - slippage)
    
    # Use IOC (Immediate or Cancel) order type for market-like execution
    return place_order(
        coin=coin,
        is_buy=is_buy,
        size=size,
        price=limit_price,
        order_type={"limit": {"tif": "Ioc"}}
    )

def cancel_order(coin: str, oid: int) -> Dict[str, Any]:
    """Cancel an order by order ID."""
    exchange = get_exchange_client()
    return exchange.cancel({"a": get_asset_index(coin), "o": oid})

def cancel_order_by_cloid(coin: str, cloid: str) -> Dict[str, Any]:
    """Cancel an order by client order ID."""
    exchange = get_exchange_client()
    return exchange.cancel({"a": get_asset_index(coin), "c": cloid})

def cancel_all_orders(coin: Optional[str] = None) -> Dict[str, Any]:
    """Cancel all orders for a coin or all coins."""
    exchange = get_exchange_client()
    if coin:
        return exchange.cancel({"a": get_asset_index(coin), "o": None})
    else:
        # Cancel all orders across all assets
        open_orders = get_open_orders()
        results = []
        for order in open_orders:
            try:
                result = cancel_order(order["coin"], order["oid"])
                results.append(result)
            except Exception as e:
                results.append({"error": str(e), "order": order})
        return {"results": results}

def modify_order(
    coin: str,
    oid: int,
    new_price: Optional[float] = None,
    new_size: Optional[float] = None
) -> Dict[str, Any]:
    """Modify an existing order."""
    exchange = get_exchange_client()
    
    modify_request = {
        "oid": oid,
        "order": {
            "a": get_asset_index(coin),
            "b": True,  # Will be ignored, just placeholder
            "p": str(new_price) if new_price else "0",
            "s": str(new_size) if new_size else "0",
            "r": False,
            "t": {"limit": {"tif": "Gtc"}},
        }
    }
    
    return exchange.modify(modify_request)

def update_leverage(coin: str, leverage: int, is_cross: bool = True) -> Dict[str, Any]:
    """Update leverage for a coin."""
    exchange = get_exchange_client()
    return exchange.update_leverage(leverage, coin, is_cross)

def update_isolated_margin(coin: str, is_buy: bool, amount: float) -> Dict[str, Any]:
    """Update isolated margin for a position."""
    exchange = get_exchange_client()
    return exchange.update_isolated_margin(amount, coin, is_buy)

# ============================================================================
# Transfer & Bridge Operations
# ============================================================================

def usd_transfer(destination: str, amount: float) -> Dict[str, Any]:
    """Transfer USD between Hyperliquid accounts."""
    exchange = get_exchange_client()
    return exchange.usd_transfer(destination, amount)

def spot_transfer(destination: str, token: str, amount: str) -> Dict[str, Any]:
    """Transfer spot tokens between Hyperliquid accounts."""
    exchange = get_exchange_client()
    return exchange.spot_transfer(destination, token, amount)

def withdraw_from_bridge(destination: str, amount: float) -> Dict[str, Any]:
    """Withdraw USDC from Hyperliquid to EVM chain (Arbitrum)."""
    exchange = get_exchange_client()
    return exchange.withdraw_from_bridge(destination, amount)

def get_spot_balances(address: Optional[str] = None) -> Dict[str, Any]:
    """Get spot token balances."""
    info = get_info_client()
    addr = address or ACCOUNT_ADDRESS
    user_state = info.user_state(addr)
    return user_state.get("spotBalances", [])

def place_stop_loss_order(
    coin: str,
    is_buy: bool,
    size: float,
    trigger_price: float,
    limit_price: Optional[float] = None
) -> Dict[str, Any]:
    """Place a stop loss order (trigger order)."""
    exchange = get_exchange_client()
    
    # If no limit price specified, use trigger price with small slippage
    if limit_price is None:
        slippage = 0.01  # 1% slippage
        limit_price = trigger_price * (1 + slippage) if is_buy else trigger_price * (1 - slippage)
    
    order_request = {
        "a": get_asset_index(coin),
        "b": is_buy,
        "p": str(limit_price),
        "s": str(size),
        "r": True,  # reduce only for stop loss
        "t": {
            "trigger": {
                "triggerPx": str(trigger_price),
                "isMarket": False,
                "tpsl": "sl"  # stop loss
            }
        },
    }
    
    return exchange.order(order_request)

def place_take_profit_order(
    coin: str,
    is_buy: bool,
    size: float,
    trigger_price: float,
    limit_price: Optional[float] = None
) -> Dict[str, Any]:
    """Place a take profit order (trigger order)."""
    exchange = get_exchange_client()
    
    # If no limit price specified, use trigger price with small slippage
    if limit_price is None:
        slippage = 0.01  # 1% slippage
        limit_price = trigger_price * (1 - slippage) if is_buy else trigger_price * (1 + slippage)
    
    order_request = {
        "a": get_asset_index(coin),
        "b": is_buy,
        "p": str(limit_price),
        "s": str(size),
        "r": True,  # reduce only for take profit
        "t": {
            "trigger": {
                "triggerPx": str(trigger_price),
                "isMarket": False,
                "tpsl": "tp"  # take profit
            }
        },
    }
    
    return exchange.order(order_request)

def place_bracket_order(
    coin: str,
    is_buy: bool,
    size: float,
    entry_price: float,
    stop_loss_price: float,
    take_profit_price: float
) -> Dict[str, Any]:
    """Place a bracket order (entry + stop loss + take profit)."""
    results = []
    
    # Place entry order
    entry_result = place_limit_order(coin, is_buy, size, entry_price)
    results.append({"type": "entry", "result": entry_result})
    
    # Place stop loss (opposite side, reduce only)
    sl_result = place_stop_loss_order(coin, not is_buy, size, stop_loss_price)
    results.append({"type": "stop_loss", "result": sl_result})
    
    # Place take profit (opposite side, reduce only)
    tp_result = place_take_profit_order(coin, not is_buy, size, take_profit_price)
    results.append({"type": "take_profit", "result": tp_result})
    
    return {"bracket_orders": results}

# ============================================================================
# Helper Functions
# ============================================================================

def get_asset_index(coin: str) -> int:
    """Get asset index for a coin from metadata."""
    meta = get_meta()
    universe = meta.get("universe", [])
    
    for idx, asset in enumerate(universe):
        if asset.get("name") == coin:
            return idx
    
    raise ValueError(f"Asset {coin} not found in universe")

def format_position(position: Dict[str, Any]) -> Dict[str, Any]:
    """Format position data for frontend."""
    return {
        "coin": position.get("coin"),
        "size": float(position.get("szi", 0)),
        "entry_price": float(position.get("entryPx", 0)),
        "position_value": float(position.get("positionValue", 0)),
        "unrealized_pnl": float(position.get("unrealizedPnl", 0)),
        "return_on_equity": float(position.get("returnOnEquity", 0)),
        "leverage": float(position.get("leverage", {}).get("value", 0)),
        "liquidation_px": float(position.get("liquidationPx", 0)) if position.get("liquidationPx") else None,
    }

def format_balance(balance: Dict[str, Any]) -> Dict[str, Any]:
    """Format balance data for frontend."""
    return {
        "coin": balance.get("coin"),
        "total": float(balance.get("total", 0)),
        "hold": float(balance.get("hold", 0)),
        "available": float(balance.get("total", 0)) - float(balance.get("hold", 0)),
    }

# ============================================================================
# CLI Interface
# ============================================================================

def main():
    """CLI interface for testing."""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command specified"}))
        sys.exit(1)
    
    command = sys.argv[1]
    
    # Initialize clients if credentials are provided
    if len(sys.argv) >= 4:
        account_address = sys.argv[2]
        api_secret = sys.argv[3]
        testnet = sys.argv[4].lower() == "true" if len(sys.argv) > 4 else False
        init_clients(account_address, api_secret, testnet)
    
    try:
        if command == "get_user_state":
            result = get_user_state()
        elif command == "get_open_orders":
            result = get_open_orders()
        elif command == "get_user_fills":
            result = get_user_fills()
        elif command == "get_meta":
            result = get_meta()
        elif command == "get_spot_meta":
            result = get_spot_meta()
        elif command == "get_all_mids":
            result = get_all_mids()
        elif command == "get_l2_snapshot":
            coin = sys.argv[5] if len(sys.argv) > 5 else "BTC"
            result = get_l2_snapshot(coin)
        elif command == "place_market_order":
            if len(sys.argv) < 8:
                result = {"error": "Missing arguments: coin, is_buy, size"}
            else:
                coin = sys.argv[5]
                is_buy = sys.argv[6].lower() == "true"
                size = float(sys.argv[7])
                result = place_market_order(coin, is_buy, size)
        elif command == "cancel_all_orders":
            result = cancel_all_orders()
        else:
            result = {"error": f"Unknown command: {command}"}
        
        print(json.dumps(result, default=str))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()

