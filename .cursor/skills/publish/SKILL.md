---
name: publish
description: 打包发布放置军团。用户说打包发布时，先检查代码，通过后升级版本、打 debug APK、按 save-code 提交，再把 APK 拷到项目根目录并带上版本号，删掉根目录里的旧版本 APK。
---

# 打包发布

用户说「打包发布」时按下面顺序做完。任一步失败就停，不要继续后面的步骤，也不要自行回滚已写上的版本号。

本仓库是单项目。版本以根目录 `package.json` 的 `version` 为准。页面版本从这里读。Android 的 `versionName` 必须改成同一个号。

## 1. 检查代码，无误再升级版本

在仓库根目录跑：

```bash
npm test
npx tsc --noEmit
```

有失败就停，把失败摘要告诉用户。不要改代码，不要升级版本，不要打包。

两项都通过后，按「升级版本」做一次 minor bump：`MINOR + 1`，`PATCH` 置 0。`1.4.0` → `1.5.0`。只改版本号，不重排文件。

- `package.json` 的 `"version"`
- `android/app/build.gradle` 的 `versionName`，写成同一个号
- 同文件的 `versionCode` 加 1，否则手机不会覆盖安装

版本不是 `X.Y.Z` 时停下来问，不要猜。

## 2. 打包 APK

```bash
npm run apk
```

这是 debug 包，会先构建网页再 `assembleDebug`。耗时常超过两分钟，等待时间留够。产物：

`android/app/build/outputs/apk/debug/app-debug.apk`

打包失败就停。版本号此时已经写上，但不要提交，也不要拷 APK。

## 3. 保存代码

按 save-code 技能提交，只 commit，不 push。

「打包发布」已经授权这次提交。`package.json` 和 `android/app/build.gradle` 的版本号不要再停下来问。

仍然要停下来问的情况：含密文件、与这次发布无关的改动、save-code 里其他必须确认的高风险。APK 被 gitignore，不要加进提交。

## 4. 把 APK 放到项目根目录

提交成功后，把刚打出的包拷到仓库根目录：

`放置军团-<version>.apk`

`<version>` 用这次升级后的号，例如 `放置军团-1.5.0.apk`。

然后删除仓库根目录里其他 `放置军团-*.apk`。只动根目录这些旧包，不要删 `android/app/build/` 里的构建产物。

## 做完后汇报

用几句中文说明：旧版本 → 新版本、提交 hash 前 7 位和标题、根目录 APK 文件名。
