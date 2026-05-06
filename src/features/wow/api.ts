import { invokeCommand } from "../../lib/tauri";
import type { ApplyFontConfigRequest, FontProfile, WowInstallation } from "./types";

export function getFontProfiles(): Promise<FontProfile[]> {
  return invokeCommand<FontProfile[]>("get_font_profiles");
}

export function scanWowInstallations(rootPath?: string | null): Promise<WowInstallation[]> {
  return invokeCommand<WowInstallation[]>("scan_wow_installations", {
    rootPath: rootPath ?? null,
  });
}

export function applyFontConfig(request: ApplyFontConfigRequest): Promise<string> {
  return invokeCommand<string>("apply_font_config", { request });
}
