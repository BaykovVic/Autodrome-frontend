import type { NextConfig } from "next";

const pilotBackendHost =
  process.env.AUTODROME_PILOT_BACKEND_HOST ?? "http://127.0.0.1";

const pilotBackendPorts: Record<string, number> = {
  candidate: 5213,
  vehicle: 5101,
  exam: 5201,
  exercise: 5301,
  "violation-rule": 5401,
  "reporting-document": 5501,
  biometry: 5601,
  "media-archive": 5701,
  "audio-trigger": 5801,
  "configuration-admin": 5901,
  "android-device-management": 6001,
  "virtual-vehicle": 6101,
  "identity-security": 6201,
  audit: 6301,
  "vehicle-telemetry": 6401,
  "api-gateway-bff": 6501,
  "deployment-operations": 6601,
  "reference-data": 6701,
  "autodrome-geometry": 6801,
  "traffic-control": 6901,
  "scheduling-integration": 7001,
  "central-sync": 7101,
  "vehicle-edge-gateway": 7201,
  "vehicle-simulator-rpi": 7301,
};

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_ADAPTER: process.env.NEXT_PUBLIC_API_ADAPTER ?? "mock",
    NEXT_PUBLIC_MOCK_SCENARIO:
      process.env.NEXT_PUBLIC_MOCK_SCENARIO ?? "normal",
  },
  async rewrites() {
    return Object.entries(pilotBackendPorts).map(([service, port]) => ({
      source: `/api/${service}/v1/:path*`,
      destination:
        service === "api-gateway-bff"
          ? `${pilotBackendHost}:${port}/api/v1/:path*`
          : `${pilotBackendHost}:${port}/v1/:path*`,
    }));
  },
};

export default nextConfig;
