export interface RuntimeStatus {
  readonly python: boolean;
  readonly ffmpeg: boolean;
  readonly aiModel: boolean;
  readonly portableMode: boolean;
  readonly dataDirectory: string;
  readonly logDirectory: string;
}

export interface ReleaseInfo {
  readonly version: string;
  readonly buildDate: string;
  readonly license: string;
}
