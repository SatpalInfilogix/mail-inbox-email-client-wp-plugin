<?php
global $wpdb;

define('MAIL_INBOX_TABLE_PREFIX', $wpdb->prefix . 'mail_inbox_');
define('MAIL_INBOX_ACCOUNTS_TABLE', MAIL_INBOX_TABLE_PREFIX. 'accounts');
define('MAIL_INBOX_FOLDERS_TABLE', MAIL_INBOX_TABLE_PREFIX. 'folders');
define('MAIL_INBOX_EMAILS_TABLE', MAIL_INBOX_TABLE_PREFIX. 'emails');
define('MAIL_INBOX_CATEGORIES_TABLE', MAIL_INBOX_TABLE_PREFIX. 'categories');
define('MAIL_INBOX_TAGS_TABLE', MAIL_INBOX_TABLE_PREFIX. 'tags');
define('MAIL_INBOX_EMAILS_ADDITIONAL_INFO_TABLE', MAIL_INBOX_TABLE_PREFIX. 'emails_additional_info');
define('MAIL_INBOX_EMAILS_ADDITIONAL_MULTIPLE_INFO_TABLE', MAIL_INBOX_TABLE_PREFIX. 'emails_additional_multiple_info');

define('MAIL_INBOX_SCOPES', 'openid profile offline_access Mail.Read User.Read');
define('GRAPH_API_BASE_ENDPOINT', 'https://graph.microsoft.com/v1.0/me/');

