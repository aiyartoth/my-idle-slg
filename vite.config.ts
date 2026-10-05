import { readFileSync } from 'node:fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/** 资源栏上显示的版本，跟 package.json 保持一致 */
const appVersion = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version as string

/**
 * 把 package.json 的版本交给页面。资源栏用 virtual:app-version 读取。
 *
 * @param version 当前应用版本
 * @returns Vite 插件
 */
function appVersionPlugin(version: string) {
  const virtualId = 'virtual:app-version'
  const resolvedId = `\0${virtualId}`
  return {
    name: 'app-version',
    resolveId(source: string) {
      if (source === virtualId) return resolvedId
    },
    load(id: string) {
      if (id === resolvedId) return `export const APP_VERSION = ${JSON.stringify(version)}\n`
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), appVersionPlugin(appVersion)],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
