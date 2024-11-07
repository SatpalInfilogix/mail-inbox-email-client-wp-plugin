<?php
include plugin_dir_path(__FILE__).'includes/rest-api-functions.php';
include plugin_dir_path(__FILE__).'includes/microsoft-api-functions.php';
include plugin_dir_path(__FILE__).'rest/category.php';
include plugin_dir_path(__FILE__).'rest/tag.php';

add_action('wp_ajax_get_account_auth_url', 'accountAuthUrl');
add_action('wp_ajax_sync_email_folders', 'syncEmailFolders');
add_action('wp_ajax_check_new_emails', 'checkNewEmails');
add_action('wp_ajax_sync_emails', 'syncEmails');
add_action('wp_ajax_associate_email_additional_information', 'associateEmailAdditionalInformation');
add_action('wp_ajax_create_kpi_rule', 'createKPIRule');

function accountAuthUrl(){
    $client_id_encrypted = get_option('mail_inbox_client_id', '');
    $redirect_uri = get_option('mail_inbox_redirect_uri', '');
    $client_id     = !empty($client_id_encrypted) ? mail_inbox_decrypt($client_id_encrypted) : '';

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
    $authorization_url = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?' . http_build_query($params);

    wp_send_json_success([
        'authorization_url' => $authorization_url
    ]);
}

function syncEmailFolders(){
    $account_id = isset($_POST['account_id']) ? intval($_POST['account_id']) : 0;

    $email_folders = getGraphMailFolders($account_id);
    
    if(isset($email_folders['error']['code'])){
        handle_auth_error($email_folders['error']['code']);
    }

    if (empty($email_folders)) {
        wp_send_json_error([
            'code' => 404,
            'message' => 'Folders not found!'
        ]);
    }

    array_walk($email_folders, function ($folder) use ($account_id) {
        updateOrCreateEmailFolder($account_id, $folder);
    });
    
    wp_send_json_success([
        'message' => 'Folders synced successfully'
    ]);
}

function checkNewEmails() {
    $account_id = isset($_POST['account_id']) ? intval($_POST['account_id']) : 0;
    $folder_id = isset($_POST['folder_id']) ? sanitize_text_field($_POST['folder_id']) : 0;

    $newEmails = getNewEmailsCount($account_id, $folder_id);
    if(isset($newEmails['error']['code'])){
        handle_auth_error($newEmails['error']['code']);
    }

    wp_send_json_success([
        'message' => 'New emails found',
        'folders' => $newEmails['folders'],
        'count' => $newEmails['count'],
    ]);
}

function syncEmails() {
    $account_id = isset($_POST['account_id']) ? intval($_POST['account_id']) : 0;
    $folder_id = isset($_POST['folder_id']) ? sanitize_text_field($_POST['folder_id']) : 0;

    $newEmails = getNewEmails($account_id, $folder_id);

    if (isset($newEmails['error']['code'])) {
        handle_auth_error($newEmails['error']['code']);
    }
    
    array_walk($newEmails, function ($email) use ($account_id) {
        updateOrCreateEmail($account_id, $email);
    });

    wp_send_json_success([
        'message' => count($newEmails).' emails synced successfully',
        'count' => count($newEmails)
    ]);
}


/**
 * Handle authentication-related errors.
 *
 * @param string $error_code The error code from the API response.
 */
function handle_auth_error($error_code) {
    if ($error_code === 'InvalidAuthenticationToken') {
        wp_send_json_error([
            'code' => 401,
            'message' => 'Session has expired. Please re-connect your account and try again.'
        ]);
    } else {
        wp_send_json_error([
            'code' => 500,
            'message' => 'An unexpected error occurred. Please try again later.'
        ]);
    }
    exit;
}

function associateEmailAdditionalInformation(){
    $email_id = isset($_POST['email_id']) ? intval($_POST['email_id']) : 0;
    $column = sanitize_text_field($_POST['column']);
    $value = sanitize_text_field($_POST['value']);

    global $wpdb;
    $table_name = MAIL_INBOX_EMAILS_ADDITIONAL_INFO_TABLE;

    if($column=='category_id'){
        $table_name = MAIL_INBOX_EMAILS_ADDITIONAL_MULTIPLE_INFO_TABLE;
        $email_assigned_category_exists = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table_name WHERE email_id = %d AND $column = %s", $email_id, $value));

        if($email_assigned_category_exists){
            $wpdb->delete(
                $table_name,
                [
                    'email_id' => $email_id,
                    $column    => $value
                ],
                ['%d', '%d']
            );
            $status = 'deleted';
        } else {
            $wpdb->insert(
                $table_name,
                [
                    'email_id' => $email_id,
                    $column => $value
                ],
                ['%d', '%d']
            );
            $status = 'inserted';
        }

        wp_send_json_success([
            'message' => 'Email additional information saved successfully!',
            'status' => $status
        ]);
    }
    
    // Check if the email_id exists in the table
    $email_exists = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table_name WHERE email_id = %d", $email_id));
    
    if ($email_exists) {
        // Update the tag_id for the existing email_id
        $wpdb->update(
            $table_name,
            [$column => $value],
            ['email_id' => $email_id],
            ['%d'],
            ['%d']
        );

        $status = 'updated';
    } else {
        // Insert a new record if the email_id does not exist
        $wpdb->insert(
            $table_name,
            [
                'email_id' => $email_id,
                $column => $value
            ],
            ['%d', '%d']
        );

        $status = 'inserted';
    }

    wp_send_json_success([
        'message' => 'Email additional information saved successfully!',
        'status' => $status
    ]);
}

function createKPIRule(){
    $time = isset($_POST['email_id']) ? intval($_POST['time']) : 0;
    $default_points = isset($_POST['defaultPoints']) ? intval($_POST['defaultPoints']) : 0;
    $category_id = isset($_POST['category']) ? intval($_POST['category']) : 0;
    $points = isset($_POST['points']) ? intval($_POST['points']) : 0;
    $tag_id = isset($_POST['tag']) ? intval($_POST['tag']) : 0;
    $action_type = sanitize_text_field($_POST['actionType']);

    global $wpdb;
    $table_name = MAIL_INBOX_KPI_RULES_TABLE;

    // Check if a similar rule already exists based on name, category, tag, and action type
    $existing_rule = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT * FROM $table_name WHERE category_id = %d AND tag_id = %d AND action_type = %s",
            $category_id,
            $tag_id,
            $action_type
        )
    );

    if ($existing_rule) {
        // Rule already exists, so return an error message
        wp_send_json_error(['message' => 'This KPI rule already exists. Please modify the existing rule or create a different one.']);
        return;
    }

    // Prepare data for insertion
    $data = [
        'time'           => $time,
        'default_points' => $default_points,
        'category_id'    => $category_id,
        'tag_id'         => $tag_id,
        'points'         => $points,
        'action_type'    => $action_type,
    ];


    // Attempt to insert the new rule
    $inserted = $wpdb->insert(MAIL_INBOX_KPI_RULES_TABLE, $data);

    // Handle response
    if ($inserted) {
        wp_send_json_success(['message' => 'KPI rule successfully added']);
    } else {
        wp_send_json_error(['message' => 'Failed to add KPI rule. Please try again.']);
    }
}