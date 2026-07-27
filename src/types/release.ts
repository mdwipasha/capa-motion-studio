export interface RuntimeStatus {
  readonly python: boolean;
  readonly ffmpeg: boolean;
  readonly aiRuntime: boolean;
  readonly aiRuntimeReady: boolean;
  readonly aiRuntimeMode: "bundled" | "system-python" | "missing";
  readonly aiRuntimePath: string;
  readonly aiRuntimeDownloadUrl: string;
  readonly aiRuntimeDownloadConfigured: boolean;
  readonly aiModel: boolean;
  readonly aiModelPath: string;
  readonly portableMode: boolean;
  readonly dataDirectory: string;
  readonly logDirectory: string;
}

export interface ReleaseInfo {
  readonly version: string;
  readonly buildDate: string;
  readonly license: string;
}
