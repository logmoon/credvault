import { invoke } from '@tauri-apps/api/core';
import { type Entry, type GeneratorOpts, type SyncStatus } from './types';

export async function createVault(password: string, path: string): Promise<void> {
  return invoke<void>('create_vault', { password, path });
}

export async function unlockVault(password: string, path: string): Promise<Entry[]> {
  return invoke<Entry[]>('unlock_vault', { password, path });
}

export async function lockVault(): Promise<void> {
  return invoke<void>('lock_vault');
}

export async function saveVault(entries: Entry[]): Promise<void> {
  return invoke<void>('save_vault', { entries });
}

export async function generatePassword(length: number, opts: GeneratorOpts): Promise<string> {
  return invoke<string>('generate_password', { length, opts });
}

export async function vaultExists(path: string): Promise<boolean> {
  return invoke<boolean>('vault_exists', { path });
}

export async function checkSync(localPath: string, syncPath: string): Promise<SyncStatus> {
  try {
    return await invoke<SyncStatus>('check_sync', { localPath, syncPath });
  } catch {
    return { status: 'ok' };
  }
}

export async function resolveConflict(
  keep: 'local' | 'sync',
  conflictPath: string,
  localPath: string,
  syncPath: string,
): Promise<void> {
  return invoke<void>('resolve_conflict', { keep, conflictPath, localPath, syncPath });
}

export async function clearClipboard(): Promise<void> {
  return invoke<void>('clear_clipboard');
}

export async function saveConfig(config: {
  vaultPath: string;
  syncPath?: string;
  lockTimeoutMs: number;
  clipboardTimeoutMs: number;
  clipboardAutoClear: boolean;
}): Promise<void> {
  return invoke<void>('save_config', { config });
}

export async function loadConfig(): Promise<{
  vaultPath: string;
  syncPath?: string;
  lockTimeoutMs: number;
  clipboardTimeoutMs: number;
  clipboardAutoClear: boolean;
}> {
  return invoke('load_config');
}

export async function pickVaultPath(): Promise<string | null> {
  return invoke<string | null>('pick_vault_path');
}

export async function getDefaultVaultPath(): Promise<string> {
  return invoke<string>('get_default_vault_path');
}

export async function changeVaultPath(newPath: string): Promise<void> {
  return invoke<void>('change_vault_path', { newPath });
}
