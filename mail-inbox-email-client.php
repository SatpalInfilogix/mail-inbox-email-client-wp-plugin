<?php
/*
Plugin Name: Mail Inbox Email Client
Version: 1.0.2
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
require_once MAIL_INBOX_PLUGIN_DIR . 'includes/mail-inbox-cron-job.php';

require_once MAIL_INBOX_PLUGIN_DIR . 'apis/rest-api-endpoints.php';
require_once MAIL_INBOX_PLUGIN_DIR . 'apis/graphql-api-endpoints.php';

require_once MAIL_INBOX_PLUGIN_DIR . 'includes/activation.php';
register_activation_hook(__FILE__, 'mail_inbox_activate_plugin');


function deactivate_mail_inbox_email_client() {
    remove_mail_inbox_cron_job();
}
register_deactivation_hook(__FILE__, 'deactivate_mail_inbox_email_client');
