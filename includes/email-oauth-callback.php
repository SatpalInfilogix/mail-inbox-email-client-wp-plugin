<?php
// Ensure the file is not accessed directly
if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

/**
 * Handles the OAuth callback for the admin.
 */
function handle_oauth_callback() {
    if (
        isset($_GET['code']) &&
        isset($_GET['state'])
    ) {
        $received_state = sanitize_text_field($_GET['state']);

        // Verify state parameter for CSRF protection
        if (!get_transient('mail_inbox_oauth_state_' . $received_state)) {
            wp_die('Invalid state parameter');
        }

        // Delete the transient to prevent reuse
        delete_transient('mail_inbox_oauth_state_' . $received_state);

        $code = sanitize_text_field($_GET['code']);
        $tokens = exchange_code_for_token($code);

        if ($tokens) {
            authenticate_user_with_microsoft($tokens);
        } else {
            wp_die('Authentication failed. Please try again.');
        }
    }
}

add_action('init', 'handle_oauth_callback');

function authenticate_user_with_microsoft($tokens) {
    // Get user info from Microsoft Graph API
    $user_info = get_user_info($tokens['access_token']);

    global $wpdb;

    if ($user_info && (isset($user_info['mail']) || isset($user_info['userPrincipalName']))) {
        $username      = isset($user_info['displayName']) ? sanitize_text_field($user_info['displayName']) : 'Unknown';
        $email         = isset($user_info['mail']) ? sanitize_email($user_info['mail']) : sanitize_email($user_info['userPrincipalName']);
        
        $access_token  = sanitize_text_field($tokens['access_token']);
        $refresh_token = sanitize_text_field($tokens['refresh_token']);
        $expires_in    = time() + intval($tokens['expires_in']);
        
        $existing_account = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM " . MAIL_INBOX_ACCOUNTS_TABLE . " WHERE email = %s", $email
        ));

        
        if ($existing_account) {
            // Update the existing entry
            $updated = $wpdb->update(
                MAIL_INBOX_ACCOUNTS_TABLE,
                [
                    'username'      => $username,
                    'access_token'  => mail_inbox_encrypt($access_token),
                    'refresh_token' => mail_inbox_encrypt($refresh_token),
                    'expires_in'    => $expires_in,
                    'created_at'    => current_time('mysql')
                ],
                ['email' => $email], // Update where email matches
                ['%s', '%s', '%s', '%d', '%s'], // Data formats
                ['%s'] // Where formats
            );
        
            // Check if the update was successful
            if ($updated === false) {
                wp_die('Failed to update email account. Please try again or contact site administrator');
            } else {
                $redirect_url = admin_url('admin.php?page=mail-inbox&message=updated');
                wp_redirect($redirect_url);
                exit;
            }
        } else {
            // Insert new entry if no existing account was found
            $inserted = $wpdb->insert(MAIL_INBOX_ACCOUNTS_TABLE, [
                'username'      => $username,
                'email'         => $email,
                'access_token'  => mail_inbox_encrypt($access_token),
                'refresh_token' => mail_inbox_encrypt($refresh_token),
                'expires_in'    => $expires_in,
                'created_at'    => current_time('mysql')
            ], ['%s', '%s', '%s', '%s', '%d', '%s']);
        
            // Check if the insertion was successful
            if ($inserted === false) {
                wp_die('Failed to save email account. Please try again or contact site administrator');
            } else {
                $redirect_url = admin_url('admin.php?page=mail-inbox&message=success');
                wp_redirect($redirect_url);
                exit;
            }
        }        
    } else {
        wp_die('Failed to retrieve user information from Microsoft.');
    }
}

function get_user_info($access_token) {
    $response = wp_remote_get('https://graph.microsoft.com/v1.0/me', [
        'headers' => [
            'Authorization' => 'Bearer ' . $access_token,
            'Accept' => 'application/json',
        ],
    ]);
    
    if (is_wp_error($response)) {
        error_log('User info fetch error: ' . $response->get_error_message());
        return false;
    } else {
        $body = json_decode($response['body'], true);
        if (isset($body['id'])) {
            return $body;
        } else {
            error_log('User info response error: ' . $response['body']);
            return false;
        }
    }
}


function exchange_code_for_token($code) {
    // Retrieve settings
    $client_id_encrypted = get_option('mail_inbox_client_id', '');
    $client_secret_encrypted = get_option('mail_inbox_client_secret', '');
    $redirect_uri = home_url();

    $client_id     = !empty($client_id_encrypted) ? mail_inbox_decrypt($client_id_encrypted) : '';
    $client_secret = !empty($client_secret_encrypted) ? mail_inbox_decrypt($client_secret_encrypted) : '';

    $token_request_data = [
        'client_id' => $client_id,
        'scope' => MAIL_INBOX_SCOPES,
        'code' => $code,
        'redirect_uri' => $redirect_uri,
        'grant_type' => 'authorization_code',
        'client_secret' => $client_secret,
    ];

    $response = wp_remote_post('https://login.microsoftonline.com/common/oauth2/v2.0/token', [
        'body' => $token_request_data,
    ]);

    
    if (is_wp_error($response)) {
        // Handle error
        error_log('Token request error: ' . $response->get_error_message());
        return false;
    } else {
        $body = json_decode($response['body'], true);
        if (isset($body['access_token'])) {
            return $body;
        } else {
            error_log('Token response error: ' . $response['body']);
            return false;
        }
    }
}
