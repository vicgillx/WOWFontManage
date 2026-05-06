import { getCurrentWebview } from "@tauri-apps/api/webview";
import { message, open } from "@tauri-apps/plugin-dialog";
import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";

const previewSamples = [
  "Friz Quadrata",
  "Arial Narrow",
  "Skurri",
  "Morpheus Custom",
];

function isTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

function fileNameFromPath(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const idx = normalized.lastIndexOf("/");
  return idx >= 0 ? normalized.slice(idx + 1) : normalized;
}

function firstTtfPath(paths: string[]): string | undefined {
  return paths.find((p) => /\.ttf$/i.test(p));
}

export function FontUploadPanel() {
  const [sourcePath, setSourcePath] = useState<string | null>(null);
  const [dragHint, setDragHint] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setPathOrWarn = useCallback(async (path: string | undefined) => {
    if (!path) {
      if (isTauri()) {
        await message("请选择扩展名为 .ttf 的字体文件。", { title: "WOWFont", kind: "warning" });
      }
      return;
    }
    setSourcePath(path);
  }, []);

  const pickViaDialog = useCallback(async () => {
    if (isTauri()) {
      const selected = await open({
        title: "选择字体文件",
        filters: [{ name: "TrueType 字体", extensions: ["ttf"] }],
        multiple: false,
      });
      if (selected === null) {
        return;
      }
      if (!/\.ttf$/i.test(selected)) {
        await setPathOrWarn(undefined);
        return;
      }
      await setPathOrWarn(selected);
      return;
    }

    fileInputRef.current?.click();
  }, [setPathOrWarn]);

  const onHiddenFileInputChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) {
        return;
      }
      const anyPath = (file as File & { path?: string }).path;
      if (anyPath && typeof anyPath === "string") {
        await setPathOrWarn(anyPath);
        return;
      }
      if (isTauri()) {
        await message("无法读取所选文件的本地路径，请重试或改用拖放到窗口。", {
          title: "WOWFont",
          kind: "info",
        });
      } else {
        window.alert("请在桌面版中使用；浏览器预览无法访问本地文件路径。");
      }
    },
    [setPathOrWarn],
  );

  useEffect(() => {
    if (!isTauri()) {
      return;
    }

    let unlisten: (() => void) | undefined;

    void getCurrentWebview()
      .onDragDropEvent(async (e) => {
        const payload = e.payload;
        if (payload.type === "enter") {
          setDragHint(true);
          return;
        }
        if (payload.type === "leave") {
          setDragHint(false);
          return;
        }
        if (payload.type === "drop") {
          setDragHint(false);
          const path = firstTtfPath(payload.paths);
          await setPathOrWarn(path);
        }
      })
      .then((fn) => {
        unlisten = fn;
      });

    return () => {
      unlisten?.();
    };
  }, [setPathOrWarn]);

  return (
    <section className="font-manager-layout">
      <input
        ref={fileInputRef}
        type="file"
        accept=".ttf"
        className="visually-hidden"
        aria-hidden
        tabIndex={-1}
        onChange={onHiddenFileInputChange}
      />

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">cloud_upload 新增字体</p>
            <h2>向本地字体库添加新的字体资源</h2>
          </div>
        </div>

        <div
          className={`upload-zone upload-zone--interactive${dragHint ? " upload-zone--dropping" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => void pickViaDialog()}
          onKeyDown={(ev) => {
            if (ev.key === "Enter" || ev.key === " ") {
              ev.preventDefault();
              void pickViaDialog();
            }
          }}
        >
          <div className="upload-glyph">cloud_upload</div>
          <div>
            <h3>将字体文件拖动至此添加</h3>
            <p>支持 TTF 字体文件。导入后可在总览中将字体绑定到界面、战斗文字、聊天等模块。</p>
            <button
              type="button"
              className="link-button"
              onClick={(e) => {
                e.stopPropagation();
                void pickViaDialog();
              }}
            >
              点击上传文件
            </button>
            {sourcePath ? (
              <p className="upload-selected">
                已选择：<strong>{fileNameFromPath(sourcePath)}</strong>
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">我的字体库</p>
            <h2>管理已存储在 WOWFont 中的所有字体</h2>
          </div>
        </div>
        <div className="font-library-grid">
          {previewSamples.map((sample, index) => (
            <article className="font-library-card" key={sample}>
              <div className="font-library-preview">{index === 2 ? "CRIT 99!" : "Aa Bb 123"}</div>
              <strong>{sample}</strong>
              <small>{index === 2 ? "使用中" : "可用于配置预设"}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">settings_ethernet 全局同步设置</p>
            <h2>配置字体同步的具体路径与规则</h2>
          </div>
          <button type="button" className="secondary-button">
            浏览
          </button>
        </div>
        <div className="sync-rule-row">
          <span>游戏字体映射目录</span>
          <strong>Fonts / Interface font aliases</strong>
        </div>
        <label className="toggle-row">
          <input type="checkbox" defaultChecked />
          <span>保存库时自动增量同步</span>
        </label>
      </section>
    </section>
  );
}
