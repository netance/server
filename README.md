# Netance server
This is Netance social server implementation on Node.js

You can use it according to GPL3 license.

## Hosting an instance
- Copy this repository to your server
- Install all dependencies with ```npm instal```.
- Choose or run an instance of [TON HTTP API](https://github.com/toncenter/ton-http-api).
- Rename config_example.json to config.json and modify it as you wish:
  - ```"address"``` (TON blockchain address for sending transactions)
  - ```"amount"``` (**recommended** amount of toncoins people will send for each post)
  - ```"ton_provider"``` (URL to your TON HTTP API, for ex: https://toncenter.com/api/v2)
  - ```"privacy"``` (URL to your privacy policy)
  - ```"terms"``` (URL to your rules)
- Set up a systemd service
- Set up nginx reverse proxy to port 3001
