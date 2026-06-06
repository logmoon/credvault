use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use argon2::{Algorithm, Argon2, Params, Version};
use rand::rngs::OsRng;
use rand::{Rng, RngCore};
use thiserror::Error;
use zeroize::Zeroizing;

pub type EncryptResult = ([u8; 12], Vec<u8>, [u8; 16]);

#[derive(Error, Debug)]
pub enum CryptoError {
    #[error("key derivation failed")]
    KeyDerivation,
    #[error("encryption failed")]
    Encryption,
    #[error("wrong password or corrupted data")]
    Decryption,
}

/// Argon2id parameters stored in the vault header.
#[derive(Debug)]
pub struct Argon2Params {
    pub memory: u32,
    pub iterations: u32,
    pub parallelism: u32,
}

impl Default for Argon2Params {
    fn default() -> Self {
        Self {
            memory: 65_536,
            iterations: 3,
            parallelism: 4,
        }
    }
}

/// Derive a 256-bit key from a password using Argon2id.
pub fn derive_key(
    password: &str,
    salt: &[u8; 16],
    params: &Argon2Params,
) -> Result<Zeroizing<[u8; 32]>, CryptoError> {
    let argon2_params =
        Params::new(params.memory, params.iterations, params.parallelism, Some(32))
            .map_err(|_| CryptoError::KeyDerivation)?;

    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, argon2_params);
    let mut key = Zeroizing::new([0u8; 32]);
    argon2
        .hash_password_into(password.as_bytes(), salt, key.as_mut())
        .map_err(|_| CryptoError::KeyDerivation)?;
    Ok(key)
}

/// Encrypt plaintext with AES-256-GCM.
/// Returns (nonce, ciphertext, auth_tag).
pub fn encrypt(key: &[u8; 32], plaintext: &[u8]) -> Result<EncryptResult, CryptoError> {
    let cipher = Aes256Gcm::new(key.into());

    let nonce_bytes: [u8; 12] = OsRng.gen();
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext_with_tag = cipher
        .encrypt(nonce, plaintext)
        .map_err(|_| CryptoError::Encryption)?;

    let ciphertext_len = ciphertext_with_tag.len() - 16;
    let ciphertext = ciphertext_with_tag[..ciphertext_len].to_vec();
    let mut tag = [0u8; 16];
    tag.copy_from_slice(&ciphertext_with_tag[ciphertext_len..]);

    Ok((nonce_bytes, ciphertext, tag))
}

/// Decrypt ciphertext with AES-256-GCM.
/// Returns plaintext on success, Err on wrong password or tampered data.
pub fn decrypt(
    key: &[u8; 32],
    nonce: &[u8; 12],
    ciphertext: &[u8],
    tag: &[u8; 16],
) -> Result<Vec<u8>, CryptoError> {
    let cipher = Aes256Gcm::new(key.into());
    let nonce = Nonce::from_slice(nonce);

    let mut ciphertext_with_tag = ciphertext.to_vec();
    ciphertext_with_tag.extend_from_slice(tag);

    cipher
        .decrypt(nonce, ciphertext_with_tag.as_ref())
        .map_err(|_| CryptoError::Decryption)
}

/// Generate a random 16-byte salt for Argon2id key derivation.
pub fn generate_salt() -> [u8; 16] {
    let mut salt = [0u8; 16];
    OsRng.fill_bytes(&mut salt);
    salt
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn encrypt_decrypt_round_trip() {
        let password = "correct horse battery staple";
        let salt = generate_salt();
        let params = Argon2Params::default();
        let key = derive_key(password, &salt, &params).unwrap();
        let plaintext = b"Hello, vault! This is a test message.";

        let (nonce, ciphertext, tag) = encrypt(&key, plaintext).unwrap();
        let decrypted = decrypt(&key, &nonce, &ciphertext, &tag).unwrap();

        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn wrong_password_returns_error() {
        let password = "correct password";
        let wrong_password = "wrong password";
        let salt = generate_salt();
        let params = Argon2Params::default();

        let key = derive_key(password, &salt, &params).unwrap();
        let wrong_key = derive_key(wrong_password, &salt, &params).unwrap();
        let plaintext = b"Sensitive data";

        let (nonce, ciphertext, tag) = encrypt(&key, plaintext).unwrap();
        let result = decrypt(&wrong_key, &nonce, &ciphertext, &tag);

        assert!(result.is_err());
    }

    #[test]
    fn tampered_ciphertext_returns_error() {
        let password = "test password";
        let salt = generate_salt();
        let params = Argon2Params::default();
        let key = derive_key(password, &salt, &params).unwrap();
        let plaintext = b"Data integrity matters";

        let (nonce, mut ciphertext, tag) = encrypt(&key, plaintext).unwrap();

        ciphertext[0] ^= 0xff;

        let result = decrypt(&key, &nonce, &ciphertext, &tag);
        assert!(result.is_err());
    }

    #[test]
    fn tampered_tag_returns_error() {
        let password = "test password";
        let salt = generate_salt();
        let params = Argon2Params::default();
        let key = derive_key(password, &salt, &params).unwrap();
        let plaintext = b"Tag integrity matters";

        let (nonce, ciphertext, mut tag) = encrypt(&key, plaintext).unwrap();

        tag[0] ^= 0xff;

        let result = decrypt(&key, &nonce, &ciphertext, &tag);
        assert!(result.is_err());
    }

    #[test]
    fn tampered_nonce_returns_error() {
        let password = "test password";
        let salt = generate_salt();
        let params = Argon2Params::default();
        let key = derive_key(password, &salt, &params).unwrap();
        let plaintext = b"Nonce integrity matters";

        let (mut nonce, ciphertext, tag) = encrypt(&key, plaintext).unwrap();

        nonce[0] ^= 0xff;

        let result = decrypt(&key, &nonce, &ciphertext, &tag);
        assert!(result.is_err());
    }

    #[test]
    fn derive_key_produces_32_bytes() {
        let password = "test";
        let salt = generate_salt();
        let params = Argon2Params::default();
        let key = derive_key(password, &salt, &params).unwrap();

        assert_eq!(key.len(), 32);
    }

    #[test]
    fn different_passwords_produce_different_keys() {
        let salt = generate_salt();
        let params = Argon2Params::default();

        let key1 = derive_key("password1", &salt, &params).unwrap();
        let key2 = derive_key("password2", &salt, &params).unwrap();

        assert_ne!(&*key1, &*key2);
    }

    #[test]
    fn different_salts_produce_different_keys() {
        let password = "test password";
        let salt1 = generate_salt();
        let salt2 = generate_salt();
        let params = Argon2Params::default();

        let key1 = derive_key(password, &salt1, &params).unwrap();
        let key2 = derive_key(password, &salt2, &params).unwrap();

        assert_ne!(&*key1, &*key2);
    }

    #[test]
    fn encrypt_produces_unique_nonces() {
        let password = "test password";
        let salt = generate_salt();
        let params = Argon2Params::default();
        let key = derive_key(password, &salt, &params).unwrap();
        let plaintext = b"Same data each time";

        let (nonce1, _, _) = encrypt(&key, plaintext).unwrap();
        let (nonce2, _, _) = encrypt(&key, plaintext).unwrap();

        assert_ne!(nonce1, nonce2);
    }
}
