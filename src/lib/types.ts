export type Entry = {
  id: string;
  createdAt: number;
  modifiedAt: number;
  title: string;
  username: string;
  password: string;
  url?: string;
};

export type RecentVault = {
  vaultId: string;
  name: string;
  path: string;
};

export type VaultConfig = {
  vaultPath: string;
  vaultName: string;
  lockTimeoutMs: number;
  clipboardTimeoutMs: number;
  clipboardAutoClear: boolean;
  recentVaults: RecentVault[];
};

export type GeneratorOpts = {
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
};

export type ConflictFile = {
  path: string;
  fileName: string;
  modifiedAt: number;
};
