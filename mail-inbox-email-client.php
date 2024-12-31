<?php
/*
Plugin Name: Mail Inbox Email Client
Version: 1.0.3
Author: Satpal Singh Sekhon
License: GPL2
*/

// Security check to prevent direct access
if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

define('MAIL_INBOX_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('MAIL_INBOX_PLUGIN_URL', plugin_dir_url(__FILE__));
define('MAIL_INBOX_ENCRYPTION_KEY', 'e3f1c2d4a5b67890e1f2d3c4b5a69788e3f1c2d4a5b67890e1f2d3c4b5a69788');

require_once MAIL_INBOX_PLUGIN_DIR . 'includes/constants.php';

require_once MAIL_INBOX_PLUGIN_DIR . 'includes/functions.php';
require_once MAIL_INBOX_PLUGIN_DIR . 'includes/admin-menus.php';
require_once MAIL_INBOX_PLUGIN_DIR . 'includes/assets.php';
require_once MAIL_INBOX_PLUGIN_DIR . 'includes/email-oauth-callback.php';

require_once MAIL_INBOX_PLUGIN_DIR . 'apis/rest-api-endpoints.php';
require_once MAIL_INBOX_PLUGIN_DIR . 'apis/graphql-api-endpoints.php';

require_once MAIL_INBOX_PLUGIN_DIR . 'includes/activation.php';
register_activation_hook(__FILE__, 'mail_inbox_activate_plugin');

function add_email_capabilities() {
    // Define the new email capabilities
    $capabilities = [
        'mail_inbox_view_email',
        'mail_inbox_settings',
        'mail_inbox_categories',
        'mail_inbox_tags',
        'mail_inbox_kpi_rules',
    ];

    // Get roles that should have the new capabilities (modify as needed)
    $roles_to_add_capabilities = ['administrator', 'email_manager'];

    // Loop through each role to assign the capabilities
    foreach ($roles_to_add_capabilities as $role_name) {
        $role = get_role($role_name);
        if ($role) {
            foreach ($capabilities as $capability) {
                $role->add_cap($capability);
            }
        }
    }
}
add_action('admin_init', 'add_email_capabilities');
