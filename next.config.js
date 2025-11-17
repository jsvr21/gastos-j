/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['firebase', 'firebase-admin'],
  },
  webpack: (config, { isServer, webpack }) => {
    // Ignorar undici en el cliente (Firebase no lo necesita en el navegador)
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'undici': false,
      }
      
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^undici$/,
          require.resolve('./lib/undici-stub.js')
        )
      )
    }

    // Excluir Firebase del bundle del servidor
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        'firebase/app': 'commonjs firebase/app',
        'firebase/auth': 'commonjs firebase/auth',
        'firebase/firestore': 'commonjs firebase/firestore',
        'firebase/analytics': 'commonjs firebase/analytics',
      })
    }

    // Configurar fallbacks para el cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }

    return config
  },
}

module.exports = nextConfig