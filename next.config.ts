/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * This code is the property of NXA Software.
 */

import type { NextConfig } from "next";
import path from "path";
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1'],
  transpilePackages: [
    '@mlightcad/cad-simple-viewer',
    '@mlightcad/three-renderer',
    '@mlightcad/data-model',
    '@mlightcad/mtext-renderer',
    'three'
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/admin/projects/:id/markup/assets/:path*',
        destination: '/admin/blueprints/assets/:path*',
      },
      {
        source: '/admin/projects/:id/assets/:path*',
        destination: '/admin/blueprints/assets/:path*',
      }
    ];
  },
  webpack(config) {
    config.experiments = { ...config.experiments, asyncWebAssembly: true, layers: true };
    
    // Three.js Çoklu Instance Çakışmasını Önle
    config.resolve.alias = {
      ...config.resolve.alias,
      three: path.resolve(__dirname, 'node_modules/three')
    };
    
    // GELİŞTİRME AŞAMASINDA MİNİFİCATION'I TAMAMEN KAPAT (CAD kütüphanesi mangling hatasını önlemek için)
    config.optimization = {
      ...config.optimization,
      minimize: false,
    };
    
    // Ignore warnings from web-ifc packages to prevent build failures
    config.ignoreWarnings = [
      { module: /web-ifc-viewer/ },
      { module: /web-ifc-three/ }
    ];
    
    return config;
  },
};

export default withPWA(nextConfig);
