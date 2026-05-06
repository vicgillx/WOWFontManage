import { useEffect, useMemo, useState } from "react";
import { ApplyAllModulesPanel } from "./components/ApplyAllModulesPanel";
import { FontUploadPanel } from "./components/FontUploadPanel";
import { ProductCard } from "./components/ProductCard";
import { Sidebar } from "./components/Sidebar";
import { getFontProfiles, scanWowInstallations } from "./features/wow/api";
import type { FontProfile, WowInstallation } from "./features/wow/types";

type View = "overview" | "fonts";

export function App() {
  const [activeView, setActiveView] = useState<View>("overview");
  const [profiles, setProfiles] = useState<FontProfile[]>([]);
  const [installations, setInstallations] = useState<WowInstallation[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    void getFontProfiles().then(setProfiles);
    void scanWowInstallations().then(setInstallations);
  }, []);

  const installationByProduct = useMemo(
    () => new Map(installations.map((installation) => [installation.productId, installation])),
    [installations],
  );

  async function handleScan() {
    setIsScanning(true);
    try {
      setInstallations(await scanWowInstallations());
    } finally {
      setIsScanning(false);
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
          <button className="secondary-button" type="button" onClick={handleScan} disabled={isScanning}>
            {isScanning ? "扫描中..." : "扫描 WoW 目录"}
          </button>
        </header>

        {activeView === "overview" ? (
          <section className="content-stack">
            <div className="hero-panel">
              <div>
                <p className="eyebrow">WOWFont</p>
                <h1>一处配置，统一应用到所有游戏字体模块</h1>
                <p>
                  正式服、时光服、熊猫人怀旧服共用字体包模型。选择字体包后，可一键同步到界面、聊天、
                  战斗文字、地图和状态栏数字等模块。
                </p>
              </div>
              <div className="hero-stat">
                <strong>{installations.length}</strong>
                <span>已识别客户端</span>
              </div>
            </div>

            <ApplyAllModulesPanel compact />

            <div className="product-grid">
              {profiles.map((profile) => (
                <ProductCard
                  key={profile.id}
                  profile={profile}
                  installation={installationByProduct.get(profile.id)}
                />
              ))}
            </div>
          </section>
        ) : (
          <section className="content-stack">
            <FontUploadPanel />
            <ApplyAllModulesPanel />
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
