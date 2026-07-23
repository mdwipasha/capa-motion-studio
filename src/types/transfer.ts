export interface FileImportResult<TDocument = unknown> {
  readonly ok: boolean;
  readonly message: string;
  readonly document?: TDocument;
}

export interface FileImporter<TDocument = unknown> {
  readonly id: string;
  readonly label: string;
  readonly extensions: readonly string[];
  canImport: (file: File) => boolean;
  import: (file: File) => Promise<FileImportResult<TDocument>>;
}

export interface FileExporter<TDocument = unknown> {
  readonly id: string;
  readonly label: string;
  export: (document: TDocument, fileName: string) => Promise<FileImportResult>;
}
