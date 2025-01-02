<?php
add_action('wp_ajax_mail_inbox_create_category', 'mailInboxCreateCategory');
add_action('wp_ajax_mail_inbox_update_category', 'mailInboxUpdateCategory');

function mailInboxCreateCategory(){
    global $wpdb;
    $name = sanitize_text_field($_POST['name']);
    $font_color = sanitize_hex_color($_POST['font_color']);
    $background_color = sanitize_hex_color($_POST['background_color']);

    // Check if the category name already exists
    $existing_category = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM " . MAIL_INBOX_CATEGORIES_TABLE . " WHERE name = %s",
        $name
    ));

    if ($existing_category > 0) {
        wp_send_json_error(['message' => 'A category with this name already exists.']);
        return;
    }

    // Insert into the table
    $result = $wpdb->insert(
        MAIL_INBOX_CATEGORIES_TABLE,
        [
            'name' => $name,
            'font_color' => $font_color,
            'background_color' => $background_color,
        ],
        ['%s', '%s', '%s', '%s', '%s', '%s']
    );

    if ($result) {
        wp_send_json_success(['message' => 'Category created successfully.']);
    } else {
        wp_send_json_error(['message' => 'Failed to create category.']);
    }
}

function mailInboxUpdateCategory() {
    global $wpdb;
    $id = intval($_POST['id']);
    $name = sanitize_text_field($_POST['name']);
    $font_color = sanitize_hex_color($_POST['font_color']);
    $background_color = sanitize_hex_color($_POST['background_color']);
    $status = sanitize_text_field($_POST['status']);

    // Check if the category exists by ID
    $existing_category = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM " . MAIL_INBOX_CATEGORIES_TABLE . " WHERE id = %d",
        $id
    ));

    if ($existing_category === 0) {
        wp_send_json_error(['message' => 'The category does not exist.']);
        return;
    }

    // Check if another category with the same name exists
    $duplicate_category = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM " . MAIL_INBOX_CATEGORIES_TABLE . " WHERE name = %s AND id != %d",
        $name,
        $id
    ));

    if ($duplicate_category > 0) {
        wp_send_json_error(['message' => 'A category with this name already exists.']);
        return;
    }

    // Update the category in the table
    $result = $wpdb->update(
        MAIL_INBOX_CATEGORIES_TABLE,
        [
            'name' => $name,
            'font_color' => $font_color,
            'background_color' => $background_color,
            'status' => $status,
        ],
        ['id' => $id],
        ['%s', '%s', '%s'],
        ['%d']
    );

    if ($result !== false) {
        wp_send_json_success(['message' => 'Category updated successfully.']);
    } else {
        wp_send_json_error(['message' => 'Failed to update category.']);
    }
}
