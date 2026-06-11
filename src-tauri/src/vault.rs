use crate::crypto::Argon2Params;
use serde::{Deserialize, Serialize};
use std::io::{Read, Write};
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};
use thiserror::Error;

const MAGIC: &[u8; 7] = b"CREDVLT";
pub const CURRENT_VERSION: u8 = 3;
const HEADER_SIZE_V1: usize = 44;
const HEADER_SIZE_V2: usize = 52;
const HEADER_SIZE_V3: usize = 68;

/// Plaintext header of a vault file.
/// v1: 44 bytes — no modified_at (defaults to created_at).
/// v2: 52 bytes — adds modified_at for sync.
/// v3: 68 bytes — adds vault_id for identity-based conflict detection.
#[derive(Debug, Clone)]
pub struct VaultHeader {
    pub version: u8,
    pub argon2_salt: [u8; 16],
    pub argon2_params: Argon2Params,
    pub created_at: u64,
    pub modified_at: u64,
    pub vault_id: [u8; 16],
}

fn header_size_for_version(version: u8) -> usize {
    match version {
        1 => HEADER_SIZE_V1,
        2 => HEADER_SIZE_V2,
        _ => HEADER_SIZE_V3,
    }
}

#[derive(Error, Debug)]
pub enum VaultError {
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
    #[error("invalid magic bytes — not a vault file")]
    InvalidMagic,
    #[error("unsupported vault version: {0}")]
    UnsupportedVersion(u8),
    #[error("unexpected end of file")]
    UnexpectedEof,
}

/// JSON body stored inside the encrypted vault payload.
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct VaultBody {
    pub schema_version: u32,
    pub vault_id: String,
    pub created_at: u64,
    pub modified_at: u64,
    pub entries: Vec<Entry>,
    pub deleted_entry_ids: Vec<String>,
}

/// A single credential entry.
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Entry {
    pub id: String,
    pub created_at: u64,
    pub modified_at: u64,
    pub title: String,
    pub username: String,
    pub password: String,
    pub url: Option<String>,
}

pub type SplitPayload<'a> = (&'a [u8; 12], &'a [u8], &'a [u8; 16]);

/// Split an encrypted payload into (nonce, ciphertext, auth_tag).
///
/// Payload layout: nonce[12] + ciphertext[var] + tag[16]
pub fn split_payload(payload: &[u8]) -> Result<SplitPayload<'_>, VaultError> {
    if payload.len() < 28 {
        return Err(VaultError::UnexpectedEof);
    }
    let (nonce, rest) = payload.split_at(12);
    let (ciphertext, tag) = rest.split_at(rest.len() - 16);
    Ok((
        nonce.try_into().map_err(|_| VaultError::UnexpectedEof)?,
        ciphertext,
        tag.try_into().map_err(|_| VaultError::UnexpectedEof)?,
    ))
}

/// Generate a unix timestamp for the current time.
pub fn now_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

/// Serialize a vault header into bytes (v1/v2/v3 format).
///
/// Layout:
///   [0..7]   magic:       "CREDVLT"
///   [7]      version:     u8
///   [8..24]  salt:        [u8; 16]
///   [24..28] memory_kb:   u32 LE
///   [28..32] iterations:  u32 LE
///   [32..36] parallelism: u32 LE
///   [36..44] created_at:  u64 LE
///   [44..52] modified_at: u64 LE (v2+)
///   [52..68] vault_id:    [u8; 16] (v3+)
pub fn write_vault_header(header: &VaultHeader) -> Vec<u8> {
    let size = header_size_for_version(header.version);
    let mut buf = Vec::with_capacity(size);

    buf.extend_from_slice(MAGIC);
    buf.push(header.version);
    buf.extend_from_slice(&header.argon2_salt);
    buf.extend_from_slice(&header.argon2_params.memory.to_le_bytes());
    buf.extend_from_slice(&header.argon2_params.iterations.to_le_bytes());
    buf.extend_from_slice(&header.argon2_params.parallelism.to_le_bytes());
    buf.extend_from_slice(&header.created_at.to_le_bytes());
    buf.extend_from_slice(&header.modified_at.to_le_bytes());

    if header.version >= 3 {
        buf.extend_from_slice(&header.vault_id);
    }

    debug_assert_eq!(buf.len(), size);
    buf
}

/// Parse a vault header from raw bytes.
/// Supports v1 (44 bytes), v2 (52 bytes), and v3 (68 bytes) formats.
/// v1 files default modified_at to created_at.
/// v1/v2 files default vault_id to zeroes.
pub fn parse_vault_header(bytes: &[u8]) -> Result<VaultHeader, VaultError> {
    if bytes.len() < HEADER_SIZE_V1 {
        return Err(VaultError::UnexpectedEof);
    }

    if &bytes[..7] != MAGIC.as_slice() {
        return Err(VaultError::InvalidMagic);
    }

    let version = bytes[7];
    if version > CURRENT_VERSION {
        return Err(VaultError::UnsupportedVersion(version));
    }

    let header_size = header_size_for_version(version);
    if bytes.len() < header_size {
        return Err(VaultError::UnexpectedEof);
    }

    let mut salt = [0u8; 16];
    salt.copy_from_slice(&bytes[8..24]);

    let mut mem = [0u8; 4];
    mem.copy_from_slice(&bytes[24..28]);
    let memory = u32::from_le_bytes(mem);

    let mut iter = [0u8; 4];
    iter.copy_from_slice(&bytes[28..32]);
    let iterations = u32::from_le_bytes(iter);

    let mut par = [0u8; 4];
    par.copy_from_slice(&bytes[32..36]);
    let parallelism = u32::from_le_bytes(par);

    let mut created = [0u8; 8];
    created.copy_from_slice(&bytes[36..44]);
    let created_at = u64::from_le_bytes(created);

    let modified_at = if version == 1 {
        created_at
    } else {
        let mut modified = [0u8; 8];
        modified.copy_from_slice(&bytes[44..52]);
        u64::from_le_bytes(modified)
    };

    let vault_id = if version >= 3 {
        let mut vid = [0u8; 16];
        vid.copy_from_slice(&bytes[52..68]);
        vid
    } else {
        [0u8; 16]
    };

    Ok(VaultHeader {
        version,
        argon2_salt: salt,
        argon2_params: Argon2Params {
            memory,
            iterations,
            parallelism,
        },
        created_at,
        modified_at,
        vault_id,
    })
}

/// Write data to a file atomically.
///
/// Writes to a `.tmp` sibling file, then renames to the target path.
/// If the target already exists, it is removed first (Windows compat).
pub fn atomic_write(path: &Path, data: &[u8]) -> Result<(), VaultError> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    let tmp_path = path.with_extension("tmp");

    {
        let mut f = std::fs::File::create(&tmp_path)?;
        f.write_all(data)?;
        f.sync_all()?;
    }

    if path.exists() {
        std::fs::remove_file(path)?;
    }

    std::fs::rename(&tmp_path, path)?;

    Ok(())
}

/// Read a vault file and parse its header.
///
/// Reads 68 bytes (v3 header size), then determines actual header size from
/// the version byte. For v1 files, bytes 44..52 in header_buf are payload.
/// For v2 files, bytes 52..68 in header_buf are payload.
/// Returns `(VaultHeader, encrypted_payload)`.
pub fn read_vault(path: &Path) -> Result<(VaultHeader, Vec<u8>), VaultError> {
    let mut file = std::fs::File::open(path)?;

    // Always read enough for a v3 header. parse_vault_header handles v1/v2/v3.
    let mut header_buf = [0u8; HEADER_SIZE_V3];
    file.read_exact(&mut header_buf)?;

    let header = parse_vault_header(&header_buf)?;

    let header_size = header_size_for_version(header.version);
    let mut payload = Vec::new();
    // Bytes in header_buf beyond the actual header size are the start of the payload
    if header_size < HEADER_SIZE_V3 {
        payload.extend_from_slice(&header_buf[header_size..HEADER_SIZE_V3]);
    }
    file.read_to_end(&mut payload)?;

    Ok((header, payload))
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Unique path per call site so parallel tests don't conflict.
    macro_rules! temp_vault_path {
        () => {{
            let dir = std::env::temp_dir().join("credvault_tests");
            std::fs::create_dir_all(&dir).unwrap();
            dir.join(format!("vault_{}.cvault", line!()))
        }};
    }

    fn sample_vault_id() -> [u8; 16] {
        [
            0x55, 0x0e, 0x84, 0x00, 0xe2, 0x9b, 0x41, 0xd4,
            0xa7, 0x16, 0x44, 0x66, 0x55, 0x44, 0x00, 0x00,
        ]
    }

    fn sample_header_v1() -> VaultHeader {
        VaultHeader {
            version: 1,
            argon2_salt: [
                0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d,
                0x0e, 0x0f, 0x10,
            ],
            argon2_params: Argon2Params {
                memory: 65_536,
                iterations: 3,
                parallelism: 4,
            },
            created_at: 1_700_000_000,
            modified_at: 1_700_000_000,
            vault_id: [0u8; 16],
        }
    }

    fn sample_header_v2() -> VaultHeader {
        VaultHeader {
            version: 2,
            argon2_salt: [
                0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d,
                0x0e, 0x0f, 0x10,
            ],
            argon2_params: Argon2Params {
                memory: 65_536,
                iterations: 3,
                parallelism: 4,
            },
            created_at: 1_700_000_000,
            modified_at: 1_700_100_000,
            vault_id: [0u8; 16],
        }
    }

    fn sample_header_v3() -> VaultHeader {
        VaultHeader {
            version: 3,
            argon2_salt: [
                0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d,
                0x0e, 0x0f, 0x10,
            ],
            argon2_params: Argon2Params {
                memory: 65_536,
                iterations: 3,
                parallelism: 4,
            },
            created_at: 1_700_000_000,
            modified_at: 1_700_100_000,
            vault_id: sample_vault_id(),
        }
    }

    #[test]
    fn header_v3_write_read_round_trip() {
        let original = sample_header_v3();
        let bytes = write_vault_header(&original);
        assert_eq!(bytes.len(), HEADER_SIZE_V3);

        let parsed = parse_vault_header(&bytes).unwrap();
        assert_eq!(parsed.version, original.version);
        assert_eq!(parsed.argon2_salt, original.argon2_salt);
        assert_eq!(parsed.argon2_params.memory, original.argon2_params.memory);
        assert_eq!(parsed.argon2_params.iterations, original.argon2_params.iterations);
        assert_eq!(parsed.argon2_params.parallelism, original.argon2_params.parallelism);
        assert_eq!(parsed.created_at, original.created_at);
        assert_eq!(parsed.modified_at, original.modified_at);
        assert_eq!(parsed.vault_id, original.vault_id);
    }

    #[test]
    fn header_v2_write_read_round_trip() {
        let original = sample_header_v2();
        let bytes = write_vault_header(&original);
        assert_eq!(bytes.len(), HEADER_SIZE_V2);

        let parsed = parse_vault_header(&bytes).unwrap();
        assert_eq!(parsed.version, original.version);
        assert_eq!(parsed.argon2_salt, original.argon2_salt);
        assert_eq!(parsed.argon2_params.memory, original.argon2_params.memory);
        assert_eq!(
            parsed.argon2_params.iterations,
            original.argon2_params.iterations
        );
        assert_eq!(
            parsed.argon2_params.parallelism,
            original.argon2_params.parallelism
        );
        assert_eq!(parsed.created_at, original.created_at);
        assert_eq!(parsed.modified_at, original.modified_at);
        // v2 doesn't store vault_id in header — should be zeroed
        assert_eq!(parsed.vault_id, [0u8; 16]);
    }

    #[test]
    fn header_v1_backward_compatible() {
        // Write a v1 header (44 bytes) and verify parse handles it
        let original = sample_header_v1();
        let mut bytes = Vec::with_capacity(HEADER_SIZE_V1);
        bytes.extend_from_slice(MAGIC);
        bytes.push(1);
        bytes.extend_from_slice(&original.argon2_salt);
        bytes.extend_from_slice(&original.argon2_params.memory.to_le_bytes());
        bytes.extend_from_slice(&original.argon2_params.iterations.to_le_bytes());
        bytes.extend_from_slice(&original.argon2_params.parallelism.to_le_bytes());
        bytes.extend_from_slice(&original.created_at.to_le_bytes());

        // Parsing a v1 header from a v3-sized buffer (68 bytes)
        let mut padded = bytes.clone();
        padded.resize(HEADER_SIZE_V3, 0xFF);
        let parsed = parse_vault_header(&padded).unwrap();
        assert_eq!(parsed.version, 1);
        assert_eq!(parsed.created_at, original.created_at);
        // v1 should default modified_at to created_at
        assert_eq!(parsed.modified_at, original.created_at);
        // v1 should default vault_id to zeroes
        assert_eq!(parsed.vault_id, [0u8; 16]);

        // Parsing from exactly 44 bytes should also work
        let parsed2 = parse_vault_header(&bytes).unwrap();
        assert_eq!(parsed2.version, 1);
        assert_eq!(parsed2.modified_at, original.created_at);
        assert_eq!(parsed2.vault_id, [0u8; 16]);
    }

    #[test]
    fn header_v1_payload_offset_correct() {
        // Verify that a v1 file's payload starts at byte 44, not 52/68
        let original = sample_header_v1();
        let mut header_bytes = Vec::with_capacity(HEADER_SIZE_V1);
        header_bytes.extend_from_slice(MAGIC);
        header_bytes.push(1);
        header_bytes.extend_from_slice(&original.argon2_salt);
        header_bytes.extend_from_slice(&original.argon2_params.memory.to_le_bytes());
        header_bytes.extend_from_slice(&original.argon2_params.iterations.to_le_bytes());
        header_bytes.extend_from_slice(&original.argon2_params.parallelism.to_le_bytes());
        header_bytes.extend_from_slice(&original.created_at.to_le_bytes());

        let payload_bytes = b"THIS_IS_THE_PAYLOAD_NONCE_CIPHERTEXT_TAG";
        let mut vault_data = header_bytes.clone();
        vault_data.extend_from_slice(payload_bytes);

        let path = temp_vault_path!();
        std::fs::write(&path, &vault_data).unwrap();

        let (parsed, payload) = read_vault(&path).unwrap();
        assert_eq!(parsed.version, 1);
        assert_eq!(parsed.modified_at, original.created_at);
        assert_eq!(payload, payload_bytes);

        std::fs::remove_file(&path).unwrap();
    }

    #[test]
    fn header_v2_payload_offset_correct() {
        // Verify that a v2 file's payload starts at byte 52, not 68
        let header = sample_header_v2();
        let header_bytes = write_vault_header(&header);
        assert_eq!(header_bytes.len(), HEADER_SIZE_V2);

        let payload_bytes = b"PAYLOAD_DATA_AFTER_V2_HEADER";
        let mut vault_data = header_bytes.clone();
        vault_data.extend_from_slice(payload_bytes);

        let path = temp_vault_path!();
        std::fs::write(&path, &vault_data).unwrap();

        let (parsed, payload) = read_vault(&path).unwrap();
        assert_eq!(parsed.version, 2);
        assert_eq!(payload, payload_bytes);

        std::fs::remove_file(&path).unwrap();
    }

    #[test]
    fn header_v3_payload_offset_correct() {
        // Verify that a v3 file's payload starts at byte 68
        let header = sample_header_v3();
        let header_bytes = write_vault_header(&header);
        assert_eq!(header_bytes.len(), HEADER_SIZE_V3);

        let payload_bytes = b"PAYLOAD_AFTER_V3_HEADER_WITH_VAULT_ID";
        let mut vault_data = header_bytes;
        vault_data.extend_from_slice(payload_bytes);

        let path = temp_vault_path!();
        std::fs::write(&path, &vault_data).unwrap();

        let (parsed, payload) = read_vault(&path).unwrap();
        assert_eq!(parsed.version, 3);
        assert_eq!(parsed.vault_id, header.vault_id);
        assert_eq!(payload, payload_bytes);

        std::fs::remove_file(&path).unwrap();
    }

    #[test]
    fn invalid_magic_returns_error() {
        let mut bytes = write_vault_header(&sample_header_v2());
        bytes[0] = 0x00; // corrupt magic

        let result = parse_vault_header(&bytes);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), VaultError::InvalidMagic));
    }

    #[test]
    fn unsupported_version_returns_error() {
        let mut header = sample_header_v3();
        header.version = 255;
        let bytes = write_vault_header(&header);

        let result = parse_vault_header(&bytes);
        assert!(result.is_err());
        assert!(matches!(
            result.unwrap_err(),
            VaultError::UnsupportedVersion(255)
        ));
    }

    #[test]
    fn truncated_header_returns_error() {
        let bytes = [0u8; 10];
        let result = parse_vault_header(&bytes);
        assert!(matches!(result.unwrap_err(), VaultError::UnexpectedEof));
    }

    #[test]
    fn empty_bytes_returns_error() {
        let bytes = [];
        let result = parse_vault_header(&bytes);
        assert!(matches!(result.unwrap_err(), VaultError::UnexpectedEof));
    }

    #[test]
    fn read_file_not_found_returns_error() {
        let path = temp_vault_path!();
        // Do not create the file
        let result = read_vault(&path);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), VaultError::Io(_)));
    }

    #[test]
    fn atomic_write_succeeds_and_content_matches() {
        let path = temp_vault_path!();
        let data = b"Hello, vault!";

        atomic_write(&path, data).unwrap();

        let mut buf = Vec::new();
        std::fs::File::open(&path)
            .unwrap()
            .read_to_end(&mut buf)
            .unwrap();
        assert_eq!(buf, data);

        // Cleanup
        std::fs::remove_file(&path).unwrap();
    }

    #[test]
    fn atomic_write_leaves_no_tmp() {
        let path = temp_vault_path!();
        let tmp_path = path.with_extension("tmp");

        atomic_write(&path, b"content").unwrap();
        assert!(path.exists());
        assert!(!tmp_path.exists());

        std::fs::remove_file(&path).unwrap();
    }

    #[test]
    fn atomic_write_overwrites_existing_file() {
        let path = temp_vault_path!();
        std::fs::write(&path, b"old content").unwrap();

        atomic_write(&path, b"new content").unwrap();

        let mut buf = String::new();
        std::fs::File::open(&path)
            .unwrap()
            .read_to_string(&mut buf)
            .unwrap();
        assert_eq!(buf, "new content");

        std::fs::remove_file(&path).unwrap();
    }

    #[test]
    fn full_vault_v2_write_read_round_trip() {
        let path = temp_vault_path!();
        let header = sample_header_v2();
        let payload = b"encrypted nonce+ciphertext+tag bytes here";

        let mut vault_bytes = write_vault_header(&header);
        vault_bytes.extend_from_slice(payload);
        std::fs::write(&path, &vault_bytes).unwrap();

        let (parsed_header, parsed_payload) = read_vault(&path).unwrap();
        assert_eq!(parsed_header.version, header.version);
        assert_eq!(parsed_header.argon2_salt, header.argon2_salt);
        assert_eq!(parsed_header.created_at, header.created_at);
        assert_eq!(parsed_header.modified_at, header.modified_at);
        assert_eq!(parsed_payload, payload);

        std::fs::remove_file(&path).unwrap();
    }

    #[test]
    fn now_timestamp_is_reasonable() {
        let ts = now_timestamp();
        // Must be after 2020-01-01 (actual test date is 2026)
        assert!(ts > 1_577_836_800);
        // Must be before 2030-01-01
        assert!(ts < 1_892_822_400);
    }
}
