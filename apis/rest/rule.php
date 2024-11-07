<?php
add_action('wp_ajax_create_kpi_rule', 'createKPIRule');
add_action('wp_ajax_update_kpi_rule', 'updateKPIRule');

function createKPIRule(){
    $time = isset($_POST['time']) ? intval($_POST['time']) : 0;
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


function updateKPIRule() {
    // Get the rule ID from the request
    $rule_id = isset($_POST['id']) ? intval($_POST['id']) : 0;
    
    // Validate and sanitize other input parameters
    $time = isset($_POST['time']) ? intval($_POST['time']) : 0;
    $default_points = isset($_POST['defaultPoints']) ? intval($_POST['defaultPoints']) : 0;
    $category_id = isset($_POST['category']) ? intval($_POST['category']) : 0;
    $points = isset($_POST['points']) ? intval($_POST['points']) : 0;
    $tag_id = isset($_POST['tag']) ? intval($_POST['tag']) : 0;
    $action_type = sanitize_text_field($_POST['actionType']);
    
    global $wpdb;
    $table_name = MAIL_INBOX_KPI_RULES_TABLE;

    // Check if the rule exists
    $existing_rule = $wpdb->get_row(
        $wpdb->prepare("SELECT * FROM $table_name WHERE id = %d", $rule_id)
    );

    if (!$existing_rule) {
        // Rule does not exist, so return an error message
        wp_send_json_error(['message' => 'The KPI rule does not exist.']);
        return;
    }

    // Check if a similar rule already exists based on category, tag, and action type, excluding the current rule
    $duplicate_rule = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT * FROM $table_name WHERE category_id = %d AND tag_id = %d AND action_type = %s AND id != %d",
            $category_id,
            $tag_id,
            $action_type,
            $rule_id
        )
    );

    if ($duplicate_rule) {
        // A similar rule already exists, so return an error message
        wp_send_json_error(['message' => 'A KPI rule with the same category, tag, and action type already exists.']);
        return;
    }

    // Prepare data for updating
    $data = [
        'time'           => $time,
        'default_points' => $default_points,
        'category_id'    => $category_id,
        'tag_id'         => $tag_id,
        'points'         => $points,
        'action_type'    => $action_type,
    ];

    // Prepare where clause for updating the specific rule
    $where = ['id' => $rule_id];

    // Attempt to update the rule
    $updated = $wpdb->update($table_name, $data, $where);

    // Handle response
    if ($updated !== false) {
        wp_send_json_success(['message' => 'KPI rule successfully updated']);
    } else {
        wp_send_json_error(['message' => 'Failed to update KPI rule. Please try again.']);
    }
}
