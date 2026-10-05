/// <reference types="vite/client" />

/** 构建配置提供的应用版本，来自 package.json */
declare module 'virtual:app-version' {
  export const APP_VERSION: string
}
