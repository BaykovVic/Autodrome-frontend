# Autodrome Frontend Pilot Runtime

This folder contains the human-operated frontend runtime for the CV stand.
It runs the Next.js operator console in Docker and proxies browser calls from
`/api/<service>/v1` to backend services on the same stand.

The runtime intentionally does not install Node.js on the host and does not
touch the existing FaceAuth, PostgreSQL, go2rtc, or RTSP services.

## Stand Layout

- frontend home: `/home/cv/autodrome-pilot-frontend`
- frontend source: `/home/cv/autodrome-pilot-frontend/source`
- public URL: `http://<stand-host>:13000`
- backend proxy target: `http://127.0.0.1:<service-port>`

## Operator Flow

```sh
cd /home/cv/autodrome-pilot-frontend/source/deploy/pilot
./pilotctl.sh install
./pilotctl.sh update
./pilotctl.sh start
./pilotctl.sh smoke
```

Useful commands:

```sh
./pilotctl.sh status
./pilotctl.sh logs
./pilotctl.sh restart
./pilotctl.sh stop
```

## API Proxy Contract

The frontend stays in `NEXT_PUBLIC_API_ADAPTER=live` mode and keeps relative
base URLs such as `/api/candidate/v1`. `next.config.ts` rewrites these URLs to
the backend services on the stand, for example:

- `/api/candidate/v1/:path*` -> `http://127.0.0.1:5213/v1/:path*`
- `/api/vehicle/v1/:path*` -> `http://127.0.0.1:5101/v1/:path*`
- `/api/exam/v1/:path*` -> `http://127.0.0.1:5201/v1/:path*`
- `/api/android-device-management/v1/:path*` -> `http://127.0.0.1:6001/v1/:path*`

This keeps browser traffic on the frontend origin and avoids exposing every
backend service directly to the LAN.

