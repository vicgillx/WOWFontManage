export type WowProductId = "retail" | "classic-era" | "mists-classic";

export interface FontProfile {
  id: WowProductId;
  name: string;
  description: string;
  directoryMarkers: string[];
  templateFileNames: string[];
}

export interface WowInstallation {
  productId: WowProductId;
  productName: string;
  rootPath: string;
  productPath: string;
  fontsPath: string;
  exists: boolean;
}
