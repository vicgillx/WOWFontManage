export interface FontAsset {
  id: string;
  familyName: string;
  fileName: string;
  sourcePath: string;
  previewText: string;
  tags: string[];
  importedAt: string;
}

export interface FontPackDraft {
  name: string;
  sourceFontPath: string;
  targetFileNames: string[];
}
