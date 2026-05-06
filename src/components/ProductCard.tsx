import type { FontProfile, WowInstallation } from "../features/wow/types";

interface ProductCardProps {
  profile: FontProfile;
  installation?: WowInstallation;
}

export function ProductCard({ profile, installation }: ProductCardProps) {
  return (
    <article className="product-card">
      <div className="card-header">
        <div>
          <p className="eyebrow">客户端分类</p>
          <h3>{profile.name}</h3>
        </div>
        <span className={installation ? "status-pill ready" : "status-pill"}>
          {installation ? "已识别" : "待定位"}
        </span>
      </div>

      <p className="muted">{profile.description}</p>

      <div className="path-box">
        {installation?.fontsPath ?? profile.directoryMarkers.join(" / ")}
      </div>

      <div className="template-list">
        {profile.templateFileNames.slice(0, 5).map((fileName) => (
          <span key={fileName}>{fileName}</span>
        ))}
        {profile.templateFileNames.length > 5 ? <span>+{profile.templateFileNames.length - 5}</span> : null}
      </div>
    </article>
  );
}
