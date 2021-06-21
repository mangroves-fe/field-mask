import { defineConfig } from 'rollup'
import typescript from '@rollup/plugin-typescript'

export default defineConfig({
  input: 'src/index.ts',
  output: [
    {
      dir: 'dist',
      entryFileNames: 'field-mask.es.js',
      format: 'es',
    },
    {
      file: 'dist/field-mask.umd.js',
      format: 'umd',
      name: 'FieldMask',
    },
  ],
  plugins: [
    typescript({
      declaration: true,
      declarationDir: 'dist/types',
      rootDir: './src',
      outDir: './dist',
      exclude: ['**/*.spec.ts'],
    }),
  ],
})
