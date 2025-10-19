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

# Global clients (initialized once)
info_client = None
ACCOUNT_ADDRESS = None

def init_clients(account_address: str, api_secret: str, testnet: bool = False):
    """Initialize clients once."""
    global info_client, ACCOUNT_ADDRESS
    ACCOUNT_ADDRESS = account_address
    api_url = constants.TESTNET_API_URL if testnet else constants.MAINNET_API_URL
    
    if info_client is None:
        info_client = Info(api_url, skip_ws=True)

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

