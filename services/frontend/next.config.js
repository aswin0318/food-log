/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // ── API Rewrites (Docker Compose proxy) ─────────────────────────────────
  // Routes /api/* calls to the correct backend service.
  // In K8s, Envoy Gateway / HAProxy handles this instead.
  async rewrites() {
    const AUTH_URL = process.env.AUTH_SERVICE_URL || "http://auth-service:8000";
    const FOOD_URL = process.env.FOOD_SERVICE_URL || "http://food-service:8001";
    const MACRO_URL = process.env.MACRO_SERVICE_URL || "http://macro-service:8002";
    const COMPLIANCE_URL = process.env.COMPLIANCE_SERVICE_URL || "http://compliance-service:8003";

    return [
      {
        source: "/api/auth/:path*",
        destination: `${AUTH_URL}/api/auth/:path*`,
      },
      {
        source: "/api/food/:path*",
        destination: `${FOOD_URL}/api/food/:path*`,
      },
      {
        source: "/api/macro/:path*",
        destination: `${MACRO_URL}/api/macro/:path*`,
      },
      {
        source: "/api/compliance/:path*",
        destination: `${COMPLIANCE_URL}/api/compliance/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
