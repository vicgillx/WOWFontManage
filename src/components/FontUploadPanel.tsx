const previewSamples = [
  "艾泽拉斯之心 Heart of Azeroth",
  "伤害 128,640 暴击!",
  "熊猫人怀旧服 字体预览",
];

export function FontUploadPanel() {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">字体导入</p>
          <h2>创建 WOWFont 字体包</h2>
        </div>
        <button type="button" className="primary-button">
          安装所有字体
        </button>
      </div>

      <div className="upload-zone">
        <div className="upload-glyph">Aa</div>
        <div>
          <h3>拖入字体文件，或从本地选择</h3>
          <p>默认只接受 `.ttf`。应用时会复制源文件，并按所选客户端模板同步到所有字体模块。</p>
        </div>
      </div>

      <div className="preview-grid">
        {previewSamples.map((sample) => (
          <div className="font-preview" key={sample}>
            {sample}
          </div>
        ))}
      </div>
    </section>
  );
}
