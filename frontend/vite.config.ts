import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_TARGET || 'http://localhost:5000'

  return {
    plugins: react(),
    server: {
      allowedHosts: ['azt.kzii.site', 'myctut.kzii.site'],
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      sourcemap: false,
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('react/')) return 'vendor-react'
            if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('react-hot-toast')) return 'vendor-ui'
            if (id.includes('axios') || id.includes('date-fns') || id.includes('zustand')) return 'vendor-utils'
            if (id.includes('html5-qrcode') || id.includes('qrcode.react')) return 'vendor-qr'
            if (id.includes('xlsx')) return 'vendor-xlsx'
            return 'vendor-misc'
          },
        },
      },
    },
  }
})
