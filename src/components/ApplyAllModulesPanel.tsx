const modules = ["所有界面", "聊天窗口", "战斗文字", "姓名板", "任务地图", "状态栏数字"];

interface ApplyAllModulesPanelProps {
  compact?: boolean;
}

export function ApplyAllModulesPanel({ compact = false }: ApplyAllModulesPanelProps) {
  return (
    <section className={compact ? "apply-all-panel compact" : "apply-all-panel"}>
      <div>
        <p className="eyebrow">一键应用</p>
        <h2>应用到所有模块</h2>
        <p>
          将当前字体包同步写入该客户端模板中的全部字体文件名，覆盖界面、聊天、战斗、地图与数字显示。
        </p>
      </div>

      <div className="module-chip-grid">
        {modules.map((module) => (
          <span key={module}>{module}</span>
        ))}
      </div>

      <button className="primary-button wide" type="button">
        一键应用到所有模块
      </button>
    </section>
  );
}
