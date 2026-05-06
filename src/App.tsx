import { message, open } from "@tauri-apps/plugin-dialog";
import { useEffect, useMemo, useState } from "react";
import { FontUploadPanel } from "./components/FontUploadPanel";
import { Sidebar } from "./components/Sidebar";
import { applyFontConfig, getFontProfiles, scanWowInstallations } from "./features/wow/api";
import type { ApplyFontConfigRequest, FontProfile, WowInstallation, WowProductId } from "./features/wow/types";

type View = "overview" | "fonts";
type FontModuleId = "interface" | "quest" | "combat" | "chat" | "nameplate" | "status";

interface FontSelection {
  label: string;
  sourceFontPath: string | null;
}

interface FontConfigPreset {
  id: string;
  name: string;
  selections: Record<FontModuleId, FontSelection>;
}

const fontModules: Array<{ id: FontModuleId; label: string; hint: string; preview: string }> = [
  { id: "interface", label: "全局界面字体", hint: "主界面、背包、菜单与按钮", preview: "魔兽世界：为了部落！为了联盟！" },
  { id: "quest", label: "任务日志与邮件", hint: "剧情文本、任务面板与邮件正文", preview: "Quest Logs / 任务文本预览" },
  { id: "combat", label: "战斗伤害数字", hint: "暴击、治疗、状态栏数字", preview: "CRIT 14,285  -842" },
  { id: "chat", label: "聊天与工具提示", hint: "聊天窗口、物品提示与说明", preview: "[Party] Pulling next pack." },
  { id: "nameplate", label: "姓名板字体", hint: "单位姓名、敌方目标名称", preview: "迪菲亚抢劫者 1420 / 1420" },
  { id: "status", label: "状态栏数字", hint: "生命值、资源条与地图数字", preview: "70级 兽人战士" },
];

const defaultFontSelection: FontSelection = { label: "游戏自带默认字体", sourceFontPath: null };

function createDefaultSelections(): Record<FontModuleId, FontSelection> {
  return fontModules.reduce(
    (acc, module) => {
      acc[module.id] = defaultFontSelection;
      return acc;
    },
    {} as Record<FontModuleId, FontSelection>,
  );
}

function fileNameFromPath(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  return normalized.slice(normalized.lastIndexOf("/") + 1);
}

function untitledName(existingNames: string[]): string {
  if (!existingNames.includes("未命名")) {
    return "未命名";
  }

  let index = 1;
  while (existingNames.includes(`未命名${index}`)) {
    index += 1;
  }
  return `未命名${index}`;
}

function moduleTargets(profile: FontProfile, moduleId: FontModuleId): string[] {
  const candidates: Record<FontModuleId, string[]> = {
    interface: ["FRIZQT__.TTF", "ARHei.TTF", "ARKai_C.TTF", "ARKai_T.TTF", "ZYKai_C.TTF", "ZYKai_T.TTF"],
    quest: ["ARKai_C.TTF", "MORPHEUS.TTF", "ZYKai_C.TTF"],
    combat: ["FZBWJW.TTF", "FZXHJW.TTF", "ZYHei.TTF"],
    chat: ["ARIALN.TTF", "FRIZQT__.TTF"],
    nameplate: ["ARHei.TTF", "ZYHei.TTF"],
    status: ["FZBWJW.TTF", "ARIALN.TTF", "ZYHei.TTF"],
  };

  const targets = candidates[moduleId].filter((fileName) =>
    profile.templateFileNames.some((template) => template.toLowerCase() === fileName.toLowerCase()),
  );

  return targets.length > 0 ? targets : profile.templateFileNames.slice(0, 1);
}

export function App() {
  const [activeView, setActiveView] = useState<View>("overview");
  const [profiles, setProfiles] = useState<FontProfile[]>([]);
  const [installations, setInstallations] = useState<WowInstallation[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<WowProductId[]>(["retail", "classic-era", "mists-classic"]);
  const [moduleSelections, setModuleSelections] = useState<Record<FontModuleId, FontSelection>>(createDefaultSelections);
  const [presets, setPresets] = useState<FontConfigPreset[]>([
    { id: "modern", name: "现代简约", selections: createDefaultSelections() },
    { id: "classic", name: "经典魔幻", selections: createDefaultSelections() },
    { id: "pixel", name: "像素风", selections: createDefaultSelections() },
  ]);
  const [activePresetId, setActivePresetId] = useState<string | null>("modern");

  useEffect(() => {
    void getFontProfiles().then(setProfiles);
    void scanWowInstallations()
      .then(setInstallations)
      .catch(() => {
        setInstallations([]);
      });
  }, []);

  const installationByProduct = useMemo(
    () => new Map(installations.map((installation) => [installation.productId, installation])),
    [installations],
  );

  function isTauri(): boolean {
    return "__TAURI_INTERNALS__" in window;
  }

  async function handleScanAuto() {
    setIsScanning(true);
    try {
      setInstallations(await scanWowInstallations());
    } catch (e) {
      if (isTauri()) {
        await message(String(e), { title: "扫描失败", kind: "error" });
      } else {
        window.alert(String(e));
      }
    } finally {
      setIsScanning(false);
    }
  }

  async function handleScanManual() {
    if (!isTauri()) {
      window.alert("请在桌面版中使用「手动选择」。");
      return;
    }
    setIsScanning(true);
    try {
      const selected = await open({
        directory: true,
        title: "选择魔兽世界根目录",
        multiple: false,
      });
      if (selected === null) {
        return;
      }
      const root = typeof selected === "string" ? selected : selected[0];
      setInstallations(await scanWowInstallations(root));
    } catch (e) {
      await message(String(e), { title: "扫描失败", kind: "error" });
    } finally {
      setIsScanning(false);
    }
  }

  function toggleProduct(productId: WowProductId) {
    setSelectedProductIds((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId],
    );
  }

  async function chooseModuleFont(moduleId: FontModuleId) {
    if (!isTauri()) {
      window.alert("请在桌面版中选择本地字体。");
      return;
    }

    const selected = await open({
      title: "选择字体文件",
      filters: [{ name: "TrueType 字体", extensions: ["ttf"] }],
      multiple: false,
    });

    if (selected === null) {
      return;
    }

    setModuleSelections((current) => ({
      ...current,
      [moduleId]: {
        label: fileNameFromPath(selected),
        sourceFontPath: selected,
      },
    }));
    setActivePresetId(null);
  }

  function resetModuleFont(moduleId: FontModuleId) {
    setModuleSelections((current) => ({
      ...current,
      [moduleId]: defaultFontSelection,
    }));
    setActivePresetId(null);
  }

  function saveCurrentPreset() {
    const name = untitledName(presets.map((preset) => preset.name));
    const preset = {
      id: crypto.randomUUID(),
      name,
      selections: structuredClone(moduleSelections),
    };
    setPresets((current) => [preset, ...current]);
    setActivePresetId(preset.id);
  }

  function usePreset(preset: FontConfigPreset) {
    setModuleSelections(structuredClone(preset.selections));
    setActivePresetId(preset.id);
  }

  async function applyCurrentConfig() {
    const targets = selectedProductIds
      .map((productId) => {
        const profile = profiles.find((item) => item.id === productId);
        const installation = installationByProduct.get(productId);
        return profile && installation ? { profile, installation } : null;
      })
      .filter((item): item is { profile: FontProfile; installation: WowInstallation } => item !== null);

    if (targets.length === 0) {
      await message("请至少勾选一个已识别路径的客户端。", { title: "WOWFont", kind: "warning" });
      return;
    }

    try {
      await Promise.all(
        targets.map(({ profile, installation }) => {
          const request: ApplyFontConfigRequest = {
            productPath: installation.productPath,
            assignments: fontModules.map((module) => ({
              sourceFontPath: moduleSelections[module.id].sourceFontPath,
              targetFileNames: moduleTargets(profile, module.id),
            })),
          };
          return applyFontConfig(request);
        }),
      );

      await message("配置已应用到所选客户端。", { title: "WOWFont", kind: "info" });
    } catch (e) {
      await message(String(e), { title: "应用失败", kind: "error" });
    }
  }

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Windows 10 / macOS</p>
            <h2>{activeView === "overview" ? "客户端总览" : "字体管理"}</h2>
          </div>
          <div className="topbar-scan-actions" role="group" aria-label="扫描 WoW 安装目录">
            <button
              className="secondary-button"
              type="button"
              onClick={() => void handleScanManual()}
              disabled={isScanning}
            >
              {isScanning ? "处理中..." : "手动选择"}
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => void handleScanAuto()}
              disabled={isScanning}
            >
              {isScanning ? "扫描中..." : "扫描"}
            </button>
          </div>
        </header>

        {activeView === "overview" ? (
          <section className="dashboard-grid">
            <section className="dashboard-card path-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">folder_managed 游戏安装路径</p>
                  <h2>客户端路径状态</h2>
                </div>
                <button className="secondary-button" type="button" onClick={() => void handleScanAuto()} disabled={isScanning}>
                  {isScanning ? "扫描中..." : "扫描变更"}
                </button>
              </div>
              <div className="client-path-list">
                {profiles.map((profile) => {
                  const installation = installationByProduct.get(profile.id);
                  return (
                    <label className="client-row" key={profile.id}>
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(profile.id)}
                        onChange={() => toggleProduct(profile.id)}
                      />
                      <span className="client-row-main">
                        <strong>{profile.name}</strong>
                        <small>{installation?.productPath ?? "未设置路径"}</small>
                      </span>
                      <span className={installation ? "status-pill ready" : "status-pill"}>
                        {installation ? "已验证" : "未设置"}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            <section className="dashboard-card deploy-card">
              <p className="eyebrow">rocket_launch 同步与部署</p>
              <h2>选择安装目标</h2>
              <div className="target-chip-grid">
                {profiles.map((profile) => {
                  const isReady = installationByProduct.has(profile.id);
                  return (
                    <button
                      key={profile.id}
                      type="button"
                      className={selectedProductIds.includes(profile.id) ? "target-chip active" : "target-chip"}
                      onClick={() => toggleProduct(profile.id)}
                      disabled={!isReady}
                    >
                      {profile.name}
                      {!isReady ? " (未设置路径)" : ""}
                    </button>
                  );
                })}
              </div>
              <div className="progress-box">
                <span>字体部署进度</span>
                <strong>准备就绪</strong>
              </div>
              <button className="primary-button wide" type="button" onClick={() => void applyCurrentConfig()}>
                使用当前设置
              </button>
            </section>

            <section className="dashboard-card quick-settings-card">
              <p className="eyebrow">tune 字体快速设置</p>
              <h2>一键应用到所有模块</h2>
              <div className="module-setting-list">
                {fontModules.map((module) => (
                  <article className="module-setting-row" key={module.id}>
                    <div>
                      <strong>{module.label}</strong>
                      <small>{module.hint}</small>
                    </div>
                    <span>{moduleSelections[module.id].label}</span>
                    <div className="module-actions">
                      <button className="secondary-button" type="button" onClick={() => void chooseModuleFont(module.id)}>
                        选择字体
                      </button>
                      <button className="ghost-button" type="button" onClick={() => resetModuleFont(module.id)}>
                        默认
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <div className="font-preview-wide">
                <small>预览 ({moduleSelections.interface.label})</small>
                <strong>{fontModules[0].preview}</strong>
                <span>0123456789 !@#$%^&*()</span>
              </div>
            </section>

            <section className="dashboard-card preset-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">bookmarks 配置预设</p>
                  <h2>配置列表</h2>
                </div>
                <button className="secondary-button" type="button" onClick={saveCurrentPreset}>
                  保存当前配置
                </button>
              </div>
              <div className="preset-list">
                {presets.map((preset) => (
                  <article className={preset.id === activePresetId ? "preset-item active" : "preset-item"} key={preset.id}>
                    <div>
                      <strong>{preset.name}</strong>
                      <small>{preset.id === activePresetId ? "当前选中配置" : "点击使用后载入设置"}</small>
                    </div>
                    <button className="secondary-button" type="button" onClick={() => usePreset(preset)}>
                      使用
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <section className="dashboard-card wow-preview-card">
              <p className="eyebrow">preview 界面预览模块</p>
              <h2>正在同步：将当前配置应用到所选目标</h2>
              <div className="wow-preview-window">
                <div>
                  <small>web_asset 70级 兽人战士</small>
                  <strong>角色面板</strong>
                  <span>{moduleSelections.interface.label}</span>
                </div>
                <div>
                  <small>badge 姓名板</small>
                  <strong>迪菲亚抢劫者</strong>
                  <span>{moduleSelections.nameplate.label}</span>
                </div>
                <div>
                  <small>swords 战斗文字</small>
                  <strong>14,285  -842</strong>
                  <span>{moduleSelections.combat.label}</span>
                </div>
                <div>
                  <small>chat 聊天/剧情</small>
                  <strong>[Party] Pulling next pack.</strong>
                  <span>{moduleSelections.chat.label}</span>
                </div>
              </div>
            </section>
          </section>
        ) : (
          <section className="content-stack">
            <FontUploadPanel />
            <section className="panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">应用策略</p>
                  <h2>安全写入流程</h2>
                </div>
              </div>
              <ol className="flow-list">
                <li>定位目标客户端的 `Fonts` 目录，不存在时由后端创建。</li>
                <li>写入前生成时间戳备份，保留恢复入口。</li>
                <li>一键应用时复制源字体，并按客户端模板生成所有模块所需的 `*.TTF` 文件。</li>
                <li>原子替换目标字体文件，并提示重启游戏生效。</li>
              </ol>
            </section>
          </section>
        )}
      </main>
    </div>
  );
}
