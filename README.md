# WOWFont

跨平台魔兽世界字体管理应用，面向 Windows 10 和 macOS。项目使用 Tauri + React + TypeScript + Vite，界面层共用一套代码，文件系统能力由 Rust 命令层封装。

## 下载使用

普通用户不需要安装 Node.js、Rust 或 Cargo。请在 GitHub Releases 中下载对应系统的安装包：

- Windows：下载 `.msi` 或 `.exe` 安装包。
- macOS：下载 `.dmg` 或 `.app` 包。

## 开发模式

从源码运行前需要先安装 Node.js 和 Rust/Cargo。

前端预览模式：

```bash
npm install
npm run dev
```

桌面开发模式：

```bash
npm run tauri dev
```

## 当前能力

- 内置正式服、时光服、熊猫人怀旧服三类客户端字体模板。
- 支持将当前字体包一键应用到客户端模板中的所有字体模块。
- 自动扫描常见 WoW 安装目录：
  - Windows：`C:\Program Files*\World of Warcraft`、`D:\World of Warcraft` 等盘符根目录。
  - macOS：`/Applications/World of Warcraft`、`~/Applications/World of Warcraft`。
- Rust 命令层提供 `get_font_profiles`、`scan_wow_installations`、`backup_fonts`、`apply_font_pack`。
- 前端已搭建总览页、字体管理页、上传区、一键应用区和安全写入流程说明。

