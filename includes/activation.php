<?php
// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Handles plugin activation tasks.
 */
function mail_inbox_activate_plugin() {
    //schedule_mail_inbox_cron_event();
    
    global $wpdb;

    $role = get_role('administrator'); // Temporarily get an admin role to initialize the cap
    if ($role && !$role->has_cap('email_access')) {
        $role->add_cap('email_access');
    }

    // Get the correct character set and collation
    $charset_collate = $wpdb->get_charset_collate();

    // SQL statement to create the accounts table
    $sql_accounts = "CREATE TABLE ".MAIL_INBOX_ACCOUNTS_TABLE." (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        email VARCHAR(100) NOT NULL,
        username VARCHAR(100) NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expires_in BIGINT(20) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY  (id),
        UNIQUE KEY email (email),
        INDEX idx_username (username),
        INDEX idx_created_at (created_at),
        INDEX idx_expires_in (expires_in)
    ) $charset_collate;";

    // SQL statement to create the folders table without foreign key constraints
    $sql_folders = "CREATE TABLE ".MAIL_INBOX_FOLDERS_TABLE." (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        account_id BIGINT(20) UNSIGNED NOT NULL,
        folder_id VARCHAR(255) NOT NULL,
        local_folder_parent_id BIGINT(20) UNSIGNED DEFAULT NULL,
        display_name VARCHAR(255) NOT NULL,
        parent_folder_id VARCHAR(255) NOT NULL,
        child_folder_count INT UNSIGNED NOT NULL DEFAULT 0,
        unread_item_count INT UNSIGNED NOT NULL DEFAULT 0,
        total_item_count INT UNSIGNED NOT NULL DEFAULT 0,
        size_in_bytes BIGINT(20) UNSIGNED NOT NULL DEFAULT 0,
        is_hidden TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY  (id),
        INDEX idx_account_id (account_id),
        INDEX idx_folder_id (folder_id),
        INDEX idx_local_folder_parent_id (local_folder_parent_id),
        INDEX idx_parent_folder_id (parent_folder_id),
        INDEX idx_unread_item_count (unread_item_count),
        INDEX idx_total_item_count (total_item_count),
        INDEX idx_size_in_bytes (size_in_bytes),
        INDEX idx_is_hidden (is_hidden),
        INDEX idx_created_at (created_at),
        INDEX idx_updated_at (updated_at)
    ) $charset_collate ENGINE=InnoDB;";
    
    // SQL statement to create the emails table without foreign key constraints
    $sql_emails = "CREATE TABLE ".MAIL_INBOX_EMAILS_TABLE." (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        account_id BIGINT(20) UNSIGNED NOT NULL,
        folder_id BIGINT(20) UNSIGNED DEFAULT NULL,
        email_id VARCHAR(255) NOT NULL,
        categories TEXT,
        has_attachments TINYINT(1) DEFAULT 0,
        subject TEXT,
        body_preview TEXT,
        importance VARCHAR(50) DEFAULT 'normal',
        parent_folder_id VARCHAR(255),
        conversation_id VARCHAR(255),
        is_delivery_receipt_requested TINYINT(1) DEFAULT 0,
        is_read_receipt_requested TINYINT(1) DEFAULT 0,
        is_read TINYINT(1) DEFAULT 0,
        is_draft TINYINT(1) DEFAULT 0,
        web_link TEXT,
        body_content_type VARCHAR(50),
        body_content LONGTEXT,
        sender LONGTEXT DEFAULT NULL,
        `from` LONGTEXT DEFAULT NULL,
        to_recipients LONGTEXT,
        cc_recipients LONGTEXT,
        bcc_recipients LONGTEXT,
        reply_to LONGTEXT,
        flag_status VARCHAR(50) DEFAULT 'notFlagged',
        created_datetime DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        last_modified_datetime DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        received_datetime DATETIME DEFAULT NULL,
        sent_datetime DATETIME DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY (id),
        INDEX idx_account_id (account_id),
        INDEX idx_folder_id (folder_id),
        INDEX idx_conversation_id (conversation_id),
        INDEX idx_is_read (is_read),
        INDEX idx_has_attachments (has_attachments),
        INDEX idx_created_datetime (created_datetime),
        INDEX idx_last_modified_datetime (last_modified_datetime),
        INDEX idx_created_at (created_at),
        INDEX idx_updated_at (updated_at)
    ) $charset_collate ENGINE=InnoDB;";

    // SQL statement to create the email attachments table without foreign key constraints
    $sql_emails_attachments = "CREATE TABLE " . MAIL_INBOX_EMAILS_ATTACHMENTS_TABLE . " (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        email_id BIGINT(20) UNSIGNED NOT NULL,
        name VARCHAR(255) DEFAULT NULL,
        path VARCHAR(255) DEFAULT NULL,
        content_type VARCHAR(255) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY (id),
        INDEX idx_email_id (email_id),
        INDEX idx_created_at (created_at),
        INDEX idx_updated_at (updated_at)
    ) $charset_collate;";

    // SQL statement to create the categories table
    $sql_categories = "CREATE TABLE ".MAIL_INBOX_CATEGORIES_TABLE." (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        font_color VARCHAR(7) NOT NULL,
        background_color VARCHAR(7) NOT NULL,
        status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY idx_name (name),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at),
        INDEX idx_updated_at (updated_at)
    ) $charset_collate;";

    // SQL statement to create the tags table
    $sql_tags = "CREATE TABLE ".MAIL_INBOX_TAGS_TABLE." (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        font_color VARCHAR(7) NOT NULL,
        background_color VARCHAR(7) NOT NULL,
        status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY idx_name (name),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at),
        INDEX idx_updated_at (updated_at)
    ) $charset_collate;";

    // SQL statement to create the email additional info table
    $sql_emails_additional_info = "CREATE TABLE " . MAIL_INBOX_EMAILS_ADDITIONAL_INFO_TABLE . " (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        email_id BIGINT(20) UNSIGNED NOT NULL,
        tag_id BIGINT(20) UNSIGNED DEFAULT NULL,
        agent_id BIGINT(20) UNSIGNED DEFAULT NULL,
        user_id BIGINT(20) UNSIGNED DEFAULT NULL,
        ticket_id BIGINT(20) UNSIGNED DEFAULT NULL,
        order_id BIGINT(20) UNSIGNED DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY (id),
        INDEX idx_email_id (email_id),
        INDEX idx_tag_id (tag_id),
        INDEX idx_agent_id (agent_id),
        INDEX idx_user_id (user_id),
        INDEX idx_ticket_id (ticket_id),
        INDEX idx_order_id (order_id),
        INDEX idx_created_at (created_at),
        INDEX idx_updated_at (updated_at)
    ) $charset_collate;";

    // SQL statement to create the email additional multiple info table
    $sql_emails_additional_multiple_info = "CREATE TABLE " . MAIL_INBOX_EMAILS_ADDITIONAL_MULTIPLE_INFO_TABLE . " (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        email_id BIGINT(20) UNSIGNED NOT NULL,
        category_id BIGINT(20) UNSIGNED DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY (id),
        INDEX idx_email_id (email_id),
        INDEX idx_category_id (category_id),
        INDEX idx_created_at (created_at),
        INDEX idx_updated_at (updated_at)
    ) $charset_collate;";

    // SQL statement to create the kpi rules table
    $sql_email_kpi_rules = "CREATE TABLE " . MAIL_INBOX_KPI_RULES_TABLE . " (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        category_id BIGINT(20) UNSIGNED DEFAULT NULL,
        tag_id BIGINT(20) UNSIGNED DEFAULT NULL,
        default_points BIGINT(20) UNSIGNED DEFAULT NULL,
        time BIGINT(20) UNSIGNED DEFAULT NULL,
        points BIGINT(20) UNSIGNED DEFAULT NULL,
        action_type VARCHAR(150) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY (id),
        INDEX idx_category_id (category_id),
        INDEX idx_tag_id (tag_id),
        INDEX idx_created_at (created_at),
        INDEX idx_updated_at (updated_at)
    ) $charset_collate;";

    // SQL statement to create an emails read status table
    $sql_email_read_status = "CREATE TABLE " . MAIL_INBOX_EMAILS_READ_STATUS_TABLE . " (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        email_id BIGINT(20) UNSIGNED DEFAULT NULL,
        user_id BIGINT(20) UNSIGNED DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY (id),
        INDEX idx_email_id (email_id),
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at),
        INDEX idx_updated_at (updated_at)
    ) $charset_collate;";

    // Include the required file for dbDelta
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');

    // Execute the SQL statements
    dbDelta($sql_accounts);
    dbDelta($sql_folders);
    dbDelta($sql_emails);
    dbDelta($sql_emails_attachments);
    dbDelta($sql_categories);
    dbDelta($sql_tags);
    dbDelta($sql_emails_additional_info);
    dbDelta($sql_emails_additional_multiple_info);
    dbDelta($sql_email_kpi_rules);
    dbDelta($sql_email_read_status);

    // Function to check and add foreign key constraint
    function add_foreign_key($table_name, $constraint_name, $foreign_key, $reference_table, $reference_key) {
        global $wpdb;
        $exists = $wpdb->get_var("
            SELECT CONSTRAINT_NAME 
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
            WHERE CONSTRAINT_TYPE = 'FOREIGN KEY' 
              AND TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = '{$table_name}' 
              AND CONSTRAINT_NAME = '{$constraint_name}'
        ");
        if (!$exists) {
            $wpdb->query("ALTER TABLE {$table_name} ADD CONSTRAINT {$constraint_name} FOREIGN KEY ({$foreign_key}) REFERENCES {$reference_table}({$reference_key}) ON DELETE CASCADE;");
        }
    }

    // Add foreign key constraints
    add_foreign_key(MAIL_INBOX_FOLDERS_TABLE, 'fk_account_id', 'account_id', MAIL_INBOX_ACCOUNTS_TABLE, 'id');
    add_foreign_key(MAIL_INBOX_EMAILS_TABLE, 'fk_account_id_email', 'account_id', MAIL_INBOX_ACCOUNTS_TABLE, 'id');
    add_foreign_key(MAIL_INBOX_EMAILS_TABLE, 'fk_folder_id_email', 'folder_id', MAIL_INBOX_FOLDERS_TABLE, 'id');
    add_foreign_key(MAIL_INBOX_EMAILS_ATTACHMENTS_TABLE, 'fk_email_id_attachment', 'email_id', MAIL_INBOX_EMAILS_TABLE, 'id');
    add_foreign_key(MAIL_INBOX_EMAILS_ADDITIONAL_INFO_TABLE, 'fk_email_id_additional_info', 'email_id', MAIL_INBOX_EMAILS_TABLE, 'id');
    add_foreign_key(MAIL_INBOX_EMAILS_ADDITIONAL_MULTIPLE_INFO_TABLE, 'fk_email_id_additional_multiple_info', 'email_id', MAIL_INBOX_EMAILS_TABLE, 'id');
}
