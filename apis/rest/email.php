<?php
add_action('wp_ajax_update_email_read_status', 'updateReadStatus');

function updateReadStatus() {
    global $wpdb;
    $table_name = $wpdb->prefix . 'mail_inbox_emails_read_status'; // Define your table name here
    
    $email_id = isset($_POST['email_id']) ? intval($_POST['email_id']) : 0;
    $is_read = isset($_POST['is_read']) ? intval($_POST['is_read']) : 0;
    $user_id = get_current_user_id();

    if ($is_read === 1) {
        // Insert or update read status
        $wpdb->insert(
            $table_name,
            [
                'email_id' => $email_id,
                'user_id' => $user_id,
                'created_at' => current_time('mysql'),
                'updated_at' => current_time('mysql')
            ],
            [
                '%d', // email_id
                '%d', // user_id
                '%s', // created_at
                '%s'  // updated_at
            ]
        );
        wp_send_json_success(['message' => 'Read status set to 1 (inserted)', 'email_id' => $email_id, 'user_id' => $user_id]);
    } else {
        $wpdb->delete(
            $table_name,
            [
                'email_id' => $email_id,
                'user_id' => $user_id
            ],
            [
                '%d', // email_id
                '%d'  // user_id
            ]
        );
        wp_send_json_success(['message' => 'Read status set to 0 (deleted)', 'email_id' => $email_id, 'user_id' => $user_id]);
    }
}