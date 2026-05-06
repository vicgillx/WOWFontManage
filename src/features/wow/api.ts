import { invokeCommand } from "../../lib/tauri";
import type { FontProfile, WowInstallation } from "./types";

export function getFontProfiles(): Promise<FontProfile[]> {
  return invokeCommand<FontProfile[]>("get_font_profiles");
}

export function scanWowInstallations(): Promise<WowInstallation[]> {
  return invokeCommand<WowInstallation[]>("scan_wow_installations");
}
