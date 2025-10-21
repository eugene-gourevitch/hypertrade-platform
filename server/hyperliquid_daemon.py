#!/usr/bin/env python3.11
"""
Persistent Hyperliquid API daemon.
Stays running and handles requests via stdin/stdout to avoid recreating clients.
"""

import json
import sys
from hyperliquid.info import Info
from hyperliquid.exchange import Exchange
from hyperliquid.utils import constants
from eth_account.signers.local import LocalAccount
from eth_account import Account

# Global clients (initialized once)
info_client = None
exchange_client = None
ACCOUNT_ADDRESS = None
API_SECRET = None

def init_clients(account_address: str, api_secret: str, testnet: bool = False):
    """Initialize clients once."""
    global info_client, exchange_client, ACCOUNT_ADDRESS, API_SECRET
    ACCOUNT_ADDRESS = account_address
    API_SECRET = api_secret
    api_url = constants.TESTNET_API_URL if testnet else constants.MAINNET_API_URL
    
    if info_client is None:
        info_client = Info(api_url, skip_ws=True)
    
    if exchange_client is None:
        # Create LocalAccount from private key
        wallet = Account.from_key(API_SECRET)
        exchange_client = Exchange(wallet, api_url)

def handle_request(request: dict) -> dict:
    """Handle a single API request."""
    try:
        command = request.get("command")
        args = request.get("args", {})
        
        if command == "get_user_state":
            address = args.get("address") or ACCOUNT_ADDRESS
            result = info_client.user_state(address)
            return {"success": True, "data": result}
            
        elif command == "get_all_mids":
            result = info_client.all_mids()
            return {"success": True, "data": result}
            
        elif command == "get_meta":
            result = info_client.meta()
            return {"success": True, "data": result}
            
        elif command == "get_l2_snapshot":
            coin = args.get("coin")
            result = info_client.l2_snapshot(coin)
            return {"success": True, "data": result}
            
        elif command == "get_open_orders":
            address = args.get("address") or ACCOUNT_ADDRESS
            result = info_client.open_orders(address)
            return {"success": True, "data": result}
            
        elif command == "get_candles":
            coin = args.get("coin")
            interval = args.get("interval", "1h")
            start_time = args.get("startTime")
            end_time = args.get("endTime")
            result = info_client.candles_snapshot(coin, interval, int(start_time), int(end_time))
            return {"success": True, "data": result}
        
        # Trading commands
        elif command == "place_order":
            coin = args.get("coin")
            is_buy = args.get("is_buy")
            sz = args.get("sz")  # Size
            limit_px = args.get("limit_px")  # Limit price
            order_type = args.get("order_type", {"limit": {"tif": "Gtc"}})  # Default to GTC limit
            reduce_only = args.get("reduce_only", False)
            
            result = exchange_client.order(coin, is_buy, sz, limit_px, order_type, reduce_only)
            return {"success": True, "data": result}
        
        elif command == "cancel_order":
            coin = args.get("coin")
            oid = args.get("oid")  # Order ID
            
            result = exchange_client.cancel(coin, oid)
            return {"success": True, "data": result}
        
        elif command == "cancel_all_orders":
            coin = args.get("coin")
            
            result = exchange_client.cancel_all(coin)
            return {"success": True, "data": result}
        
        elif command == "close_position":
            coin = args.get("coin")
            sz = args.get("sz", None)  # Optional: partial close size
            
            # Get current position to determine side
            user_state = info_client.user_state(ACCOUNT_ADDRESS)
            position = None
            for pos in user_state.get("assetPositions", []):
                if pos["position"]["coin"] == coin:
                    position = pos["position"]
                    break
            
            if not position:
                return {"success": False, "error": f"No open position for {coin}"}
            
            position_size = float(position["szi"])
            if position_size == 0:
                return {"success": False, "error": f"Position size is zero for {coin}"}
            
            # Determine close size
            close_size = abs(sz) if sz else abs(position_size)
            
            # Close is opposite side of position
            is_buy = position_size < 0  # If short, buy to close
            
            # Use market order for closing (trigger order)
            order_type = {"trigger": {"isMarket": True, "triggerPx": 0, "tpsl": "tp"}}
            
            result = exchange_client.order(coin, is_buy, close_size, 0, order_type, reduce_only=True)
            return {"success": True, "data": result}
        
        elif command == "modify_order":
            oid = args.get("oid")
            coin = args.get("coin")
            is_buy = args.get("is_buy")
            sz = args.get("sz")
            limit_px = args.get("limit_px")
            order_type = args.get("order_type", {"limit": {"tif": "Gtc"}})
            reduce_only = args.get("reduce_only", False)
            
            result = exchange_client.modify(oid, coin, is_buy, sz, limit_px, order_type, reduce_only)
            return {"success": True, "data": result}

        else:
            return {"success": False, "error": f"Unknown command: {command}"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}

def main():
    """Main daemon loop."""
    # Read initialization from first line
    init_line = sys.stdin.readline()
    init_data = json.loads(init_line)
    init_clients(
        init_data["account_address"],
        init_data["api_secret"],
        init_data.get("testnet", False)
    )
    
    # Signal ready
    print(json.dumps({"ready": True}), flush=True)
    
    # Process requests
    for line in sys.stdin:
        if not line.strip():
            continue
        try:
            request = json.loads(line)
            response = handle_request(request)
            print(json.dumps(response), flush=True)
        except Exception as e:
            print(json.dumps({"success": False, "error": str(e)}), flush=True)

if __name__ == "__main__":
    main()

