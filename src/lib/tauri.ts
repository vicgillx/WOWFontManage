import { invoke as tauriInvoke } from "@tauri-apps/api/core";

export async function invokeCommand<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<T> {
  if (!("__TAURI_INTERNALS__" in window)) {
    return mockCommand<T>(command);
  }

  return tauriInvoke<T>(command, args);
}

function mockCommand<T>(command: string): Promise<T> {
  if (command === "get_font_profiles") {
    return Promise.resolve([
      {
        id: "retail",
        name: "正式服",
        description: "国服正式服，通常对应 _retail_ 客户端目录。",
        directoryMarkers: ["_retail_"],
        templateFileNames: [
          "ARHei.TTF",
          "ARKai_C.TTF",
          "ARKai_T.TTF",
          "FRIZQT__.TTF",
          "ARIALN.TTF",
          "FZBWJW.TTF",
          "FZXHJW.TTF",
        ],
      },
      {
        id: "classic-era",
        name: "时光服",
        description: "经典旧世/时光服，优先识别 _classic_era_，兼容 _classic_。",
        directoryMarkers: ["_classic_era_", "_classic_"],
        templateFileNames: [
          "FRIZQT__.TTF",
          "ARIALN.TTF",
          "ARKai_T.TTF",
          "ARHei.TTF",
          "ARKai_C.TTF",
          "ZYHei.TTF",
          "ZYKai_C.TTF",
          "ZYKai_T.TTF",
        ],
      },
      {
        id: "mists-classic",
        name: "熊猫人怀旧服",
        description: "熊猫人怀旧服，通常对应 _classic_ 客户端目录。",
        directoryMarkers: ["_classic_"],
        templateFileNames: [
          "FRIZQT__.TTF",
          "ARIALN.TTF",
          "ARKai_T.TTF",
          "ARHei.TTF",
          "ARKai_C.TTF",
          "ZYHei.TTF",
          "ZYKai_C.TTF",
          "ZYKai_T.TTF",
        ],
      },
    ] as T);
  }

  if (command === "scan_wow_installations") {
    return Promise.resolve([] as T);
  }

  throw new Error(`浏览器预览模式尚未模拟命令：${command}`);
}
