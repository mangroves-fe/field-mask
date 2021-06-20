import { defineConfig } from 'rollup'
import path from 'path'
import typescript from '@rollup/plugin-typescript'

export default defineConfig(() => {
  const outputDir = 'dist'
  const outputFileName = 'field-mask'
  return {
    input: path.resolve(process.cwd(), 'src/index.ts'),
    output: [
      {
        file: path.resolve(outputDir, `${outputFileName}.es.js`),
        format: 'es',
      },
      {
        file: path.resolve(outputDir, `${outputFileName}.umd.js`),
        format: 'umd',
        name: 'FieldMask',
      },
    ],
    plugins: [
      typescript(),
    ],
  }
})
