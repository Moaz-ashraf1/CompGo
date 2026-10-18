# Road distance (OSRM)

Trip distance (and therefore the fare) is the **driving distance** from a
self-hosted OSRM server, so it matches Google Maps. If OSRM is unreachable
(or `OSRM_URL` is unset, e.g. local dev) the backend falls back to the
straight-line distance - see `src/utils/roadDistance.ts`.

## Server setup (already done on the VPS, in `/root/osrm`)

```bash
docker network create osrm_net
# one-off preprocessing of the Egypt extract (needs ~2.5GB RAM - add temporary swap on the 4GB VPS)
curl -L -o egypt.osm.pbf https://download.geofabrik.de/africa/egypt-latest.osm.pbf
R="docker run --rm -v /root/osrm:/data osrm/osrm-backend"
$R osrm-extract -p /opt/car.lua /data/egypt.osm.pbf
$R osrm-partition /data/egypt.osrm
$R osrm-customize /data/egypt.osrm
# the routing server (mmap = ~60MB RAM instead of ~1.7GB)
docker run -d --name osrm --restart unless-stopped --network osrm_net \
  --memory=1000m --memory-swap=1000m -v /root/osrm:/data \
  osrm/osrm-backend osrm-routed --algorithm mld --mmap /data/egypt.osrm
```

Both compose files join the external `osrm_net` network and set
`OSRM_URL=http://osrm:5000`.

## Refreshing the map (every few months)

Re-download the `.pbf`, re-run the three preprocessing commands above, then
`docker restart osrm`.
