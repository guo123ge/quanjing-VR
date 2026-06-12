/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "sharp", "pdfjs-dist", "@napi-rs/canvas"],
  },
};

export default nextConfig;
