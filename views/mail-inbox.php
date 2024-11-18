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
    } else if(!class_exists('WPGraphQL')){ ?>
        <script>
            window.mailInbox = {
                siteUrl: '<?php echo get_site_url(); ?>',
                nonce: '<?php echo wp_create_nonce('wp_rest'); ?>'
            }
        </script>

        <div id="plugin-not-installed"></div>
    <?php echo '<script type="module" src="' . MAIL_INBOX_PLUGIN_URL . 'assets/js/required-plugin-not-installed.js"></script>';
    } else {
        $auto_refresh = get_option('mail_inbox_auto_refresh', 'off');
        $auto_refresh_seconds = get_option('mail_inbox_auto_refresh_seconds', '');
        if($auto_refresh=='on' && $auto_refresh_seconds){
            ?><script>
                jQuery(function(){
                    setTimeout(function(){
                        window.location.reload();
                    }, <?php echo esc_js($auto_refresh_seconds * 1000); ?>)
                });
            </script><?php
        }
        ?>
        <div id="mail-inbox-app"></div>
        <script>
            window.mailInbox = {
                siteUrl: '<?php echo get_site_url(); ?>',
                adminUrl: '<?php echo admin_url(); ?>',
                isWoocommerceInstalled: <?php echo class_exists('WooCommerce') ? 'true' : 'false'; ?>,
                isAwesomeSupportInstalled: <?php echo is_plugin_active( 'awesome-support/awesome-support.php' ) ? 'true' : 'false' ?>,
            }
        </script>
        <?php
        echo '<script type="module" src="' . MAIL_INBOX_PLUGIN_URL . 'assets/js/mail-inbox.js"></script>';
    }
}
?>