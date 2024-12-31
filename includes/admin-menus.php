<?php

// Hook for adding admin menus
add_action('admin_menu', 'mail_inbox_add_admin_menu');

// Register the menu in the WordPress admin dashboard
function mail_inbox_add_admin_menu() {
    add_menu_page(
        'Mail Inbox',           // Page title
        'Emails',           // Menu title
        'mail_inbox_view_email', // Capability
        'mail-inbox',           // Menu slug
        'mail_inbox_display',   // Function to display the page content
        'dashicons-email-alt',  // Icon for the menu
        26                      // Position on the menu
    );

    add_submenu_page(
        'mail-inbox',                   // Parent slug
        'Connected Accounts',           // Page title
        'Connected Accounts',           // Menu title
        'manage_options',               // Capability
        'connected-accounts',           // Menu slug
        'connected_accounts'            // Function to display the page content
    );

    add_submenu_page(
        'mail-inbox',                   // Parent slug
        'Mail Inbox Categories',        // Page title
        'Manage Categories',            // Menu title
        'mail_inbox_categories',               // Capability
        'manage-categories',            // Menu slug
        'manage_categories'             // Function to display the page content
    );

    add_submenu_page(
        'mail-inbox',                   // Parent slug
        'Mail Inbox Tags',              // Page title
        'Manage Tags',                  // Menu title
        'mail_inbox_settings',               // Capability
        'manage-tags',                  // Menu slug
        'manage_tags'                   // Function to display the page content
    );

    add_submenu_page(
        'mail-inbox',               // Parent slug
        'Settings',                 // Page title
        'Settings',                 // Menu title
        'mail_inbox_tags',           // Capability
        'mail-inbox-settings',      // Menu slug
        'settings'                  // Function to display the page content
    );

    add_submenu_page(
        'mail-inbox',               // Parent slug
        'KPI Rules',                 // Page title
        'KPI Rules',                 // Menu title
        'mail_inbox_kpi_rules',           // Capability
        'kpi-rules',                // Menu slug
        'kpi_rules'                  // Function to display the page content
    );
}

// Function to display the plugin page content
require_once MAIL_INBOX_PLUGIN_DIR.'views/mail-inbox.php';
require_once MAIL_INBOX_PLUGIN_DIR.'views/manage-categories.php';
require_once MAIL_INBOX_PLUGIN_DIR.'views/manage-tags.php';
require_once MAIL_INBOX_PLUGIN_DIR.'views/connected-accounts.php';
require_once MAIL_INBOX_PLUGIN_DIR.'views/settings.php';
require_once MAIL_INBOX_PLUGIN_DIR.'views/kpi-rules.php';
