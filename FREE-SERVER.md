# Free dedicated game server (no paid hosting)

`game-server.js` runs the match so nobody's phone is the host. It is tiny: 8 players use ~13 % of ONE CPU core and ~85 KB/s per player,
so it runs fine on a spare PC, an Android phone, or Oracle's free VM. The game never needs editing when the server address changes:
**only the room creator** opens the game with `?server=wss://YOUR-ADDRESS`, the address travels to everybody else through the room lobby.
(Optional: set `window.CSK_SERVER_URL` in `index.html` if the address is permanent.)

## Option A - your own PC or Android phone + free Cloudflare quick tunnel (no card, no account)
1. Install Node 18+ (nodejs.org). On Android use Termux: `pkg install nodejs` (and `pkg install cloudflared` if your Termux has it, otherwise download the arm64 binary from Cloudflare's GitHub releases).
2. In the folder with the server files (`game-server.js`, `server-sim.js`, `server-room.js`, `game-server-package.json`):
   ```
   cp game-server-package.json package.json      (Windows: copy game-server-package.json package.json)
   npm install
   node game-server.js
   ```
3. In a second window install `cloudflared` (Windows: `winget install Cloudflare.cloudflared`) and run:
   ```
   cloudflared tunnel --url http://localhost:8080
   ```
   It prints `https://something-random.trycloudflare.com`. Your server address is the same name with **wss://**: `wss://something-random.trycloudflare.com`.
4. The room creator opens the game as `https://YOUR-SITE/?server=wss://something-random.trycloudflare.com`, creates the room, shares the room code. Joiners just open the normal game link and join: they pick the address up from the lobby.
5. Check: `https://something-random.trycloudflare.com/health` shows `ok 0 rooms`. In the match the top readout shows `... ms - SERVER`.

Catches: the address changes every time you restart the tunnel (fine, see step 4); the PC/phone must stay on while people play; your upload speed matters (4 players ~ 1.5 Mbps, 8 players ~ 5.5 Mbps); players go player -> Cloudflare -> your connection, so use a wired or strong-WiFi connection in India and keep the machine awake. Quick tunnels have no uptime promise.

## Option B - Oracle Cloud "Always Free" VM in Mumbai (free forever, always on, needs a card for identity check only)
1. Sign up at cloud.oracle.com. **Pick Mumbai as your Home Region: it cannot be changed later.**
2. Create a VM: Compute > Instances > Create, Ubuntu, shape `VM.Standard.A1.Flex` (ARM; 1-2 cores and 6-12 GB is plenty) or the free `VM.Standard.E2.1.Micro`. If you get "Out of capacity", retry later / try another availability domain.
   Oracle has been shrinking the free ARM allowance (one source says 2 cores / 12 GB since June 2026), and may reclaim VMs that sit idle for a long time. Check the current limits on Oracle's page.
3. SSH in, then:
   ```
   sudo apt update && sudo apt install -y nodejs npm
   # copy the server files here, then:
   cp game-server-package.json package.json && npm install
   sudo npm i -g pm2 && pm2 start game-server.js && pm2 save && pm2 startup
   ```
4. TLS without any domain or firewall work: run `cloudflared tunnel --url http://localhost:8080` on the VM (same as Option A, also under pm2) and use the printed `wss://` address. For a permanent address use a free DuckDNS name + Caddy (`reverse_proxy localhost:8080`) and open ports 80/443 in the VM's security list.
5. Put the permanent `wss://` address in `index.html` (`window.CSK_SERVER_URL`) so nobody has to type `?server=`.

## Free options that do NOT fit (checked Oct 2026)
- Fly.io: needs a card and is no longer free. Koyeb: needs a card with a $29 hold.
- Render free: no card, but the server sleeps after ~15 min idle (about 1 min to wake) and has no India region, so ping would be roughly 50-100 ms.

## What ping to expect
Real network round trip: roughly 10-30 ms on home WiFi/fibre in the same city, 30-70 ms on Indian mobile data. No software can promise under 20 ms for everyone,
but no player is slower than their own connection and the host no longer matters.

Env vars: `PORT` (default 8080), `SNAP_HZ` (20-60, default 30), `ALLOWED_ORIGINS=https://yoursite,...` (optional).

## No server at all: Firebase + free TURN (fallback mode)
Leave `CSK_SERVER_URL` empty. Players then connect directly (WebRTC) with Firebase only for the handshake. To help players on strict mobile networks connect directly-or-relayed instead of falling back to slow Firebase, paste a free TURN account's ICE servers into `window.CSK_ICE_SERVERS` in `index.html` (see the comment there). Check the provider's current free allowance first. Ping is best when the direct link connects; a relayed link adds the relay's distance.
