# tg-audio-extractor-bot

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.1.21. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

# Socks5 NordVPN Proxy List
```
curl --silent --globoff "https://api.nordvpn.com/v1/servers?filters[servers_technologies][identifier]=socks&limit=0" | \
jq '.[] | {
    name: .name,
    created_at: .created_at,
    hostname: .hostname,
    ip: .station,
    load: .load,
    status: .status,
    location: (.locations[0].country.city.name + ", " + .locations[0].country.name)
}'
```