import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // !! PERINGATAN !!
    // Ini mengizinkan build tetap selesai meski ada error TypeScript
    ignoreBuildErrors: true,
  },
  eslint: {
    // Mengabaikan error linting agar build lebih lancar
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;