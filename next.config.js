/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: "https",
        hostname: "*.fbcdn.net",
      },
      {
        protocol: "https",
        hostname: "platform-lookaside.fbsbx.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/posts/:path*',
        destination: '/api/v1/posts/:path*',
      },
      {
        source: '/api/products/:path*',
        destination: '/api/v1/products/:path*',
      },
      {
        source: '/api/rules/:path*',
        destination: '/api/v1/rules/:path*',
      },
    ];
  },
};

export default config;
