// V2.0 Optimized Vite Configuration for Production
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Bundle optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-popover'],
          'api-vendor': ['@supabase/supabase-js', '@tanstack/react-query'],
          
          // Feature chunks
          'faceit-components': [
            './src/components/faceit/FriendsList',
            './src/components/faceit/FriendsSection', 
            './src/components/faceit/PlayerModal'
          ],
          'services': [
            './src/services/optimizedApiService',
            './src/services/friendDataProcessor',
            './src/services/lcryptOptimizedService'
          ]
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production'
      }
    },
    // Source maps for debugging
    sourcemap: mode === 'development'
  },
  // Optimization options
  optimizeDeps: {
    include: [
      'react',
      'react-dom', 
      'react-router-dom',
      '@supabase/supabase-js',
      'lucide-react'
    ],
    exclude: ['@react-three/fiber', '@react-three/drei'] // Heavy 3D libs if not used
  },
  // Performance improvements
  esbuild: {
    // Tree shaking
    treeShaking: true,
    // Minify identifiers
    minifyIdentifiers: mode === 'production',
    // Remove unused imports
    minifySyntax: mode === 'production'
  }
}));