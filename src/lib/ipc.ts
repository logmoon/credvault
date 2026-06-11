import { invoke } from '@tauri-apps/api/core';
import { type Entry, type GeneratorOpts } from './types';

export async function createVault(password: string, path: string): Promise<void> {
  return invoke<void>('create_vault', { password, path });
}

export async function unlockVault(password: string, path: string): Promise<{ entries: Entry[]; vaultId: string }> {
  return invoke('unlock_vault', { password, path });
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

export async function clearClipboard(): Promise<void> {
  return invoke<void>('clear_clipboard');
}

export async function saveConfig(config: {
  vaultPath: string;
  vaultName: string;
  lockTimeoutMs: number;
  clipboardTimeoutMs: number;
  clipboardAutoClear: boolean;
  recentVaults: { vaultId: string; name: string; path: string }[];
}): Promise<void> {
  return invoke<void>('save_config', { config });
}

export async function loadConfig(): Promise<{
  vaultPath: string;
  vaultName: string;
  lockTimeoutMs: number;
  clipboardTimeoutMs: number;
  clipboardAutoClear: boolean;
  recentVaults: { vaultId: string; name: string; path: string }[];
}> {
  return invoke('load_config');
}

export async function pickVaultPath(): Promise<string | null> {
  return invoke<string | null>('pick_vault_path');
}

export async function pickFolder(): Promise<string | null> {
  return invoke<string | null>('pick_folder');
}

export async function getDefaultVaultPath(): Promise<string> {
  return invoke<string>('get_default_vault_path');
}

export async function changeVaultPath(newPath: string): Promise<void> {
  return invoke<void>('change_vault_path', { newPath });
}

export async function checkConflicts(vaultPath: string): Promise<string[]> {
  return invoke<string[]>('check_conflicts', { vaultPath });
}

export async function getConflictsInfo(
  vaultPath: string,
  conflictPaths: string[],
): Promise<{ vaultModifiedAt: number; conflicts: { path: string; fileName: string; modifiedAt: number }[] }> {
  return invoke('get_conflicts_info', { vaultPath, conflictPaths });
}

export async function resolveConflicts(
  vaultPath: string,
  keeperPath: string,
  conflictPaths: string[],
): Promise<string> {
  return invoke<string>('resolve_conflicts', { vaultPath, keeperPath, conflictPaths });
}

export async function showInFolder(path: string): Promise<void> {
  return invoke<void>('show_in_folder', { path });
}

export async function sanitizeVaultName(name: string): Promise<string> {
  return invoke<string>('sanitize_vault_name', { name });
}

export async function switchVault(path: string): Promise<{ exists: boolean; vaultName: string; vaultId: string }> {
  return invoke('switch_vault', { path });
}
