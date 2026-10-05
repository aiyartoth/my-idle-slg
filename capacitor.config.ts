import type { CapacitorConfig } from '@capacitor/cli'

/** Android 包名。系统靠它识别已经安装的这款应用 */
const APP_ID = 'com.myidle.slg'

/** 安装到手机后，桌面上显示的名字 */
const APP_NAME = '放置军团'

/**
 * 把网页构建结果装进 Android 工程。先构建 dist，再同步后打 APK。
 */
const config: CapacitorConfig = {
  appId: APP_ID,
  appName: APP_NAME,
  webDir: 'dist',
}

export default config
