use rand::Rng;
use serde::Deserialize;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GeneratorOpts {
    pub uppercase: bool,
    pub lowercase: bool,
    pub numbers: bool,
    pub symbols: bool,
}

/// Generate a random password of the given length using the specified character sets.
/// Falls back to lowercase-only if no character set is selected.
pub fn generate_password(length: u32, opts: &GeneratorOpts) -> String {
    let length = length.clamp(8, 64) as usize;

    let uppercase = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let lowercase = b"abcdefghijklmnopqrstuvwxyz";
    let numbers = b"0123456789";
    let symbols = b"!@#$%^&*()_+-=[]{}|;':\",./<>?";

    let mut chars: Vec<u8> = Vec::new();
    if opts.uppercase {
        chars.extend_from_slice(uppercase);
    }
    if opts.lowercase {
        chars.extend_from_slice(lowercase);
    }
    if opts.numbers {
        chars.extend_from_slice(numbers);
    }
    if opts.symbols {
        chars.extend_from_slice(symbols);
    }

    if chars.is_empty() {
        chars.extend_from_slice(lowercase);
    }

    let mut rng = rand::thread_rng();
    (0..length)
        .map(|_| {
            let idx = rng.gen_range(0..chars.len());
            chars[idx] as char
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn generates_password_of_correct_length() {
        let opts = GeneratorOpts {
            uppercase: true,
            lowercase: true,
            numbers: true,
            symbols: true,
        };
        let pw = generate_password(16, &opts);
        assert_eq!(pw.len(), 16);
    }

    #[test]
    fn clamps_length_to_min_8() {
        let opts = GeneratorOpts {
            uppercase: true,
            lowercase: true,
            numbers: true,
            symbols: true,
        };
        let pw = generate_password(3, &opts);
        assert_eq!(pw.len(), 8);
    }

    #[test]
    fn clamps_length_to_max_64() {
        let opts = GeneratorOpts {
            uppercase: true,
            lowercase: true,
            numbers: true,
            symbols: true,
        };
        let pw = generate_password(128, &opts);
        assert_eq!(pw.len(), 64);
    }

    #[test]
    fn all_opts_false_falls_back_to_lowercase() {
        let opts = GeneratorOpts {
            uppercase: false,
            lowercase: false,
            numbers: false,
            symbols: false,
        };
        let pw = generate_password(16, &opts);
        assert_eq!(pw.len(), 16);
        assert!(pw.chars().all(|c| c.is_ascii_lowercase()));
    }

    #[test]
    fn generates_only_from_selected_sets() {
        let opts = GeneratorOpts {
            uppercase: true,
            lowercase: false,
            numbers: false,
            symbols: false,
        };
        let pw = generate_password(32, &opts);
        assert!(pw.chars().all(|c| c.is_ascii_uppercase()));
    }

    #[test]
    fn produces_different_passwords() {
        let opts = GeneratorOpts {
            uppercase: true,
            lowercase: true,
            numbers: true,
            symbols: true,
        };
        let pw1 = generate_password(16, &opts);
        let pw2 = generate_password(16, &opts);
        assert_ne!(pw1, pw2);
    }
}
