<?php
function settings() {
    // Check if user is allowed access
    if (!current_user_can('manage_options')) {
        wp_die('You do not have sufficient permissions to access this page.');
    }

    // Handle form submission
    if (isset($_POST['mail_inbox_save_settings'])) {
        check_admin_referer('mail_inbox_save_settings_verify');

        $client_id = sanitize_text_field($_POST['mail_client_id']);
        $client_secret = sanitize_text_field($_POST['mail_client_secret']);
        $agent_role = sanitize_text_field($_POST['mail_agent_role']);
        $orderDescriptionField = sanitize_text_field($_POST['mail_order_description_acf_field']);
        $auto_refresh = isset($_POST['auto_refresh']) ? 'on' : 'off';
        $auto_refresh_seconds = sanitize_text_field($_POST['auto_refresh_seconds']);

        update_option('mail_inbox_client_id', mail_inbox_encrypt($client_id));
        update_option('mail_inbox_client_secret', mail_inbox_encrypt($client_secret));
        update_option('mail_inbox_agent_role', $agent_role);
        update_option('mail_inbox_order_description_acf_field', $orderDescriptionField);
        update_option('mail_inbox_auto_refresh', $auto_refresh);
        update_option('mail_inbox_auto_refresh_seconds', $auto_refresh_seconds);

        echo '<div class="updated"><p>Settings saved.</p></div>';
    }

    if (isset($_POST['mail_inbox_clean_records'])) {
        check_admin_referer('mail_inbox_clean_records_verify');

        global $wpdb;

        $tables = [
            MAIL_INBOX_ACCOUNTS_TABLE,
            MAIL_INBOX_FOLDERS_TABLE,
            MAIL_INBOX_EMAILS_TABLE,
            MAIL_INBOX_EMAILS_ATTACHMENTS_TABLE,
            MAIL_INBOX_CATEGORIES_TABLE,
            MAIL_INBOX_TAGS_TABLE,
            MAIL_INBOX_EMAILS_ADDITIONAL_INFO_TABLE,
            MAIL_INBOX_EMAILS_ADDITIONAL_MULTIPLE_INFO_TABLE,
            MAIL_INBOX_KPI_RULES_TABLE,
            MAIL_INBOX_EMAILS_READ_STATUS_TABLE,
        ];

        // Disable foreign key checks to avoid constraint errors during truncation
        $wpdb->query("SET FOREIGN_KEY_CHECKS = 0;");

        // Loop through each table and truncate it
        foreach ($tables as $table) {
            $wpdb->query("TRUNCATE TABLE $table;");
        }

        // Re-enable foreign key checks
        $wpdb->query("SET FOREIGN_KEY_CHECKS = 1;");
        echo '<div class="updated"><p>Plugin data have been cleaned.</p></div>';
    }

    $client_id_encrypted = get_option('mail_inbox_client_id', '');
    $client_secret_encrypted = get_option('mail_inbox_client_secret', '');
    $agent_role = get_option('mail_inbox_agent_role', '');
    $order_description_field_name = get_option('mail_inbox_order_description_acf_field', '');
    $auto_refresh = get_option('mail_inbox_auto_refresh', 'off');
    $auto_refresh_seconds = get_option('mail_inbox_auto_refresh_seconds', '');

    $client_id = $client_id_encrypted ? mail_inbox_decrypt($client_id_encrypted) : '';
    $client_secret = $client_secret_encrypted ? mail_inbox_decrypt($client_secret_encrypted) : '';

    if (($client_id_encrypted && $client_id === false) || ($client_secret_encrypted && $client_secret === false)) {
        echo '<div class="error"><p>Decryption failed. Please re-enter your settings.</p></div>';
        $client_id = '';
        $client_secret = '';
    }

    global $wp_roles;
    $roles = $wp_roles->roles;
    ?>
    <div class="wrap">
        <h1>Mail Inbox Settings</h1>
        <form method="post" action="">
            <?php wp_nonce_field('mail_inbox_save_settings_verify'); ?>
            <table class="form-table">
                <tr valign="top">
                    <th scope="row"><label for="mail_client_id">Client ID</label></th>
                    <td><input type="text" name="mail_client_id" id="mail_client_id" value="<?php echo esc_attr($client_id); ?>" class="regular-text" /></td>
                </tr>
                <tr valign="top">
                    <th scope="row"><label for="mail_client_secret">Client Secret</label></th>
                    <td><input type="password" name="mail_client_secret" id="mail_client_secret" value="<?php echo esc_attr($client_secret); ?>" class="regular-text" /></td>
                </tr>
                <tr valign="top">
                    <th scope="row"><label for="mail_agent_role">Agent Role</label></th>
                    <td>
                        <select name="mail_agent_role" id="mail_agent_role">
                            <option value="">-- Select Role --</option>
                            <?php
                            foreach ($roles as $role_key => $role_data) {
                                echo "<option value='" . esc_attr($role_key) . "' " . ($agent_role == $role_key ? 'selected' : '') . ">" . esc_html($role_data['name']) . "</option>";
                            }
                            ?>
                        </select>
                    </td>
                </tr>
                <tr valign="top">
                    <th scope="row"><label for="mail_order_description_acf_field">ACF Order Description Field Name</label></th>
                    <td><input type="text" name="mail_order_description_acf_field" id="mail_order_description_acf_field" value="<?php echo esc_attr($order_description_field_name); ?>" class="regular-text" /></td>
                </tr>
                <tr valign="top">
                    <th scope="row"><label for="auto_refresh">Auto refresh</label></th>
                    <td>
                        <label class="wp-switch">
                            <input type="checkbox" name="auto_refresh" id="auto_refresh" <?php checked($auto_refresh, 'on'); ?>>
                            <span class="wp-toggle-slider"></span>
                        </label>
                    </td>
                </tr>
                <tr>
                    <th scope="row" colspan="2">
                        <label for="auto_refresh_seconds">Auto refresh after <input type="number" name="auto_refresh_seconds" min="1" id="auto_refresh_seconds" style="width: 75px" value="<?php echo esc_attr($auto_refresh_seconds); ?>"> Seconds</label>
                    </th>
                </tr>
            </table>
            <?php submit_button('Save Settings', 'primary', 'mail_inbox_save_settings'); ?>
        </form>

        <form method="post" action="" style="margin-top: 20px;">
            <?php wp_nonce_field('mail_inbox_clean_records_verify'); ?>
            <p><input type="submit" name="mail_inbox_clean_records" class="button button-secondary" value="Clean Plugin Data" onclick="return confirm('Are you sure you want to delete all plugin data? This action cannot be undone.');" /></p>
        </form>
    </div>

    <link rel="stylesheet" href="<?php echo MAIL_INBOX_PLUGIN_URL . 'assets/css/settings.css' ?>">
    <?php
}
?>