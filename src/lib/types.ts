export type Entry = {
  id: string;
  createdAt: number;
  modifiedAt: number;
  title: string;
  username: string;
  password: string;
  url?: string;
};

export type VaultConfig = {
  vaultPath: string;
  lockTimeoutMs: number;
  clipboardTimeoutMs: number;
  clipboardAutoClear: boolean;
};

export type GeneratorOpts = {
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
};
