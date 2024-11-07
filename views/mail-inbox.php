<?php
function mail_inbox_display()
{
    $client_id_encrypted = get_option('mail_inbox_client_id', '');
    $client_secret_encrypted = get_option('mail_inbox_client_secret', '');
    $redirect_uri = home_url();

    $client_id     = !empty($client_id_encrypted) ? mail_inbox_decrypt($client_id_encrypted) : '';
    $client_secret = !empty($client_secret_encrypted) ? mail_inbox_decrypt($client_secret_encrypted) : '';

    global $wpdb;
    $query = "SELECT COUNT(*) FROM " . MAIL_INBOX_ACCOUNTS_TABLE;
    $connected_accounts = $wpdb->get_var($query);

    if (empty($client_id) || empty($client_secret) || empty($redirect_uri)) { ?>
        <div id="mis-configuration"></div>
        <div data-mail-inbox-settings-path="<?php echo admin_url('admin.php?page=mail-inbox-settings'); ?>"></div>
    <?php echo '<script type="module" src="' . MAIL_INBOX_PLUGIN_URL . 'assets/js/mis-configuration.js"></script>';
    } else if (!$connected_accounts) {
        $state = wp_generate_password(24, false);
        set_transient('mail_inbox_oauth_state_' . $state, 1, 15 * MINUTE_IN_SECONDS);

        $params = [
            'client_id' => $client_id,
            'response_type' => 'code',
            'redirect_uri' => $redirect_uri,
            'response_mode' => 'query',
            'scope' => MAIL_INBOX_SCOPES,
            'state' => $state,
        ];
        $authorization_url = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?' . http_build_query($params); ?>

        <div id="no-account-connected"></div>
        <div data-authorization-url="<?php echo $authorization_url; ?>"></div>
    <?php echo '<script type="module" src="' . MAIL_INBOX_PLUGIN_URL . 'assets/js/no-account-connected.js"></script>';
    } else {
        /* $connected_account = $connected_accounts[0];
            $access_token = mail_inbox_decrypt($connected_account->access_token);

            $response = wp_remote_get('https://graph.microsoft.com/v1.0/me/mailFolders', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $access_token,
                    'Accept' => 'application/json',
                ],
            ]);
            echo '<pre>';
            print_r(json_decode($response['body']));
            die();  */
        ?>
        <div id="mail-inbox-app"></div>
        <script>
            window.mailInbox = {
                siteUrl: '<?php echo get_site_url() ?>'
            }
        </script>
        <?php
        echo '<script type="module" src="' . MAIL_INBOX_PLUGIN_URL . 'assets/js/mail-inbox.js"></script>';
    }
}
?>