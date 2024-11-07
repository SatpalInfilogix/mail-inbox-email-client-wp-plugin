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

        update_option('mail_inbox_client_id', mail_inbox_encrypt($client_id));
        update_option('mail_inbox_client_secret', mail_inbox_encrypt($client_secret));
        update_option('mail_inbox_agent_role', $agent_role);

        echo '<div class="updated"><p>Settings saved.</p></div>';
    }

    $client_id_encrypted = get_option('mail_inbox_client_id', '');
    $client_secret_encrypted = get_option('mail_inbox_client_secret', '');
    $agent_role = get_option('mail_inbox_agent_role', '');

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
            </table>
            <?php submit_button('Save Settings', 'primary', 'mail_inbox_save_settings'); ?>
        </form>
    </div>
    <?php
}
?>