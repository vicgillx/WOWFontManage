interface SidebarProps {
  activeView: "overview" | "fonts";
  onViewChange: (view: "overview" | "fonts") => void;
}

const items = [
  { id: "overview" as const, label: "总览", hint: "客户端状态与备份" },
  { id: "fonts" as const, label: "字体管理", hint: "导入、预览与应用" },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="sidebar glass-panel">
      <div className="brand">
        <div className="brand-mark">WF</div>
        <div>
          <p className="eyebrow">Font Forge</p>
          <h1>WOWFont</h1>
        </div>
      </div>

      <nav className="nav-list" aria-label="主导航">
        {items.map((item) => (
          <button
            key={item.id}
            className={item.id === activeView ? "nav-item active" : "nav-item"}
            type="button"
            onClick={() => onViewChange(item.id)}
          >
            <span>{item.label}</span>
            <small>{item.hint}</small>
          </button>
        ))}
      </nav>

      <div className="sidebar-card">
        <p className="eyebrow">跨平台目标</p>
        <p>Windows 10 优先，macOS 共享界面和字体配置模型。</p>
      </div>
    </aside>
  );
}
