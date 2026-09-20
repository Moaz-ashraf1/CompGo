# Setting up dev.api.ingateapp.tech

Goal: a second, fully isolated backend + database running next to
production, reachable at `https://dev.api.ingateapp.tech`, so the mobile
apps (or anyone) can point at a real "dev" base URL instead of only
`localhost`.

This assumes the server that already runs `api.ingateapp.tech` is a
Linux box you can SSH into (matches the existing `docker-compose.yml` /
`dockerfile` in this repo). If it's actually hosted on a platform like
Render/Railway/Fly instead of a plain server, steps 1-3 below still apply
conceptually, but step 4 (DNS/reverse proxy) is normally handled in that
platform's dashboard instead - see the platform's docs for "custom
domain".

## 1. Get the code on the server

```bash
ssh <your-user>@<server-ip>
cd /path/to/CompGo   # wherever the repo already lives on the server
git fetch origin
git checkout dev_update
git pull
```

## 2. Configure dev secrets

```bash
cd backend
cp .env.dev.example .env.dev
nano .env.dev   # fill in DEV_DB_PASSWORD and DEV_ACCESS_TOKEN_SECRET
```

Use values that are **different** from the production `.env` - this
keeps dev fully separated (its own DB, its own token signing key) so
nothing there can ever touch production data or accept a production
token.

## 3. Start the dev stack

```bash
docker compose -f docker-compose.dev.yml --env-file .env.dev up -d --build
```

This runs, isolated from production:
- a dev Postgres (container `compgo-postgres-dev`, host port 5434)
- the backend (container `compgo-backend-dev`, host port **3001**),
  running `prisma migrate deploy` automatically on every start so it's
  always up to date with whatever migrations are in the branch

Check it came up clean:

```bash
docker compose -f docker-compose.dev.yml --env-file .env.dev logs -f backend-dev
# Ctrl+C once you see "Server running"
curl http://localhost:3001/captainapi/v1/me   # expect a 401 (no token) - proves it's alive
```

Optional - seed it with test data (1000 captains, test client/admin,
pricing, compound boundary - see `prisma/seed.ts`):

```bash
docker compose -f docker-compose.dev.yml --env-file .env.dev exec backend-dev npx tsx prisma/seed.ts
```

## 4. Point dev.api.ingateapp.tech at port 3001

**DNS**: in whatever manages DNS for `ingateapp.tech` (Cloudflare,
Namecheap, etc.), add a record:
- Type: `A` (or `CNAME` to the same target `api.ingateapp.tech` already
  uses, if that's how the existing record is set up)
- Name/Host: `dev.api` (or `dev`, depending on whether `api` itself is
  already a subdomain record or the whole domain)
- Value: the same server IP that `api.ingateapp.tech` already points to

**Reverse proxy**: however `api.ingateapp.tech` currently routes to port
3000 (this repo doesn't include that config, so it's whatever's already
set up on the server - most likely nginx), add an equivalent block for
the new subdomain pointing at port 3001 instead. An nginx example:

```nginx
server {
    server_name dev.api.ingateapp.tech;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then get it a certificate the same way the main domain has one, e.g. with
certbot:

```bash
sudo certbot --nginx -d dev.api.ingateapp.tech
```

(If DNS is proxied through Cloudflare with the orange cloud on, Cloudflare
terminates TLS at the edge and this certbot step may not be needed -
depends on the SSL/TLS mode already chosen for the zone.)

## 5. Verify

```bash
curl https://dev.api.ingateapp.tech/captainapi/v1/me
# {"status":"fail","message":"Missing or invalid Authorization header"}
```

That response means the dev API is live and reachable at the new domain.
Point the Flutter apps' `ApiEndpoints.baseUrl` at
`https://dev.api.ingateapp.tech` (instead of the production URL) to test
against it.

## Notes

- The two stacks share nothing: different containers, different Docker
  network (Compose project `compgo-dev` vs the production project),
  different named volume (`pgdata_dev`), different ports. You can stop,
  reset, or `docker compose -f docker-compose.dev.yml down -v` the dev
  stack at any time without any risk to production.
- To reset the dev database from scratch: `docker compose -f
  docker-compose.dev.yml --env-file .env.dev down -v` then repeat step 3.
- To update dev after new commits land on `dev_update`: `git pull` then
  `docker compose -f docker-compose.dev.yml --env-file .env.dev up -d
  --build` again - migrations reapply automatically on start.
