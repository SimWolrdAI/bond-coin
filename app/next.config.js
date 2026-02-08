/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Для Vercel не нужно output: 'standalone', но оставим для совместимости
}

module.exports = nextConfig
