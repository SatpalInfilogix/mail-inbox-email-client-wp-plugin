<?php
// Security check to prevent direct access
if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

/**
 * Encrypts the given plain text using AES-256-CBC.
 *
 * @param string $plain_text The text to encrypt.
 * @return string|false The encrypted text or false on failure.
 */
function mail_inbox_encrypt($plain_text) {
    $key = hex2bin(MAIL_INBOX_ENCRYPTION_KEY);
    if ($key === false) {
        return false;
    }

    $iv_length = openssl_cipher_iv_length('aes-256-cbc');
    $iv = openssl_random_pseudo_bytes($iv_length);

    $ciphertext = openssl_encrypt($plain_text, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);
    if ($ciphertext === false) {
        return false;
    }

    // Store the IV with the ciphertext for later decryption
    return base64_encode($iv . $ciphertext);
}

/**
 * Decrypts the given encrypted text using AES-256-CBC.
 *
 * @param string $encrypted_text The encrypted text to decrypt.
 * @return string|false The decrypted plain text or false on failure.
 */
function mail_inbox_decrypt($encrypted_text) {
    $key = hex2bin(MAIL_INBOX_ENCRYPTION_KEY);
    if ($key === false) {
        return false;
    }

    $data = base64_decode($encrypted_text);
    if ($data === false) {
        return false;
    }

    $iv_length = openssl_cipher_iv_length('aes-256-cbc');
    $iv = substr($data, 0, $iv_length);
    $ciphertext = substr($data, $iv_length);

    return openssl_decrypt($ciphertext, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);
}