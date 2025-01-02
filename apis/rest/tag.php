<?php
add_action('wp_ajax_mail_inbox_create_tag', 'mailInboxCreateTag');
add_action('wp_ajax_mail_inbox_update_tag', 'mailInboxUpdateTag');

function mailInboxCreateTag(){
    global $wpdb;
    $name = sanitize_text_field($_POST['name']);
    $font_color = sanitize_hex_color($_POST['font_color']);
    $background_color = sanitize_hex_color($_POST['background_color']);

    // Check if the tag name already exists
    $existing_tag = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM " . MAIL_INBOX_TAGS_TABLE . " WHERE name = %s",
        $name
    ));

    if ($existing_tag > 0) {
        wp_send_json_error(['message' => 'A tag with this name already exists.']);
        return;
    }

    // Insert into the table
    $result = $wpdb->insert(
        MAIL_INBOX_TAGS_TABLE,
        [
            'name' => $name,
            'font_color' => $font_color,
            'background_color' => $background_color,
        ],
        ['%s', '%s', '%s', '%s', '%s', '%s']
    );

    if ($result) {
        wp_send_json_success(['message' => 'Tag created successfully.']);
    } else {
        wp_send_json_error(['message' => 'Failed to create tag.']);
    }
}

function mailInboxUpdateTag() {
    global $wpdb;
    $id = intval($_POST['id']);
    $name = sanitize_text_field($_POST['name']);
    $font_color = sanitize_hex_color($_POST['font_color']);
    $background_color = sanitize_hex_color($_POST['background_color']);
    $status = sanitize_text_field($_POST['status']);

    // Check if the tag exists by ID
    $existing_tag = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM " . MAIL_INBOX_TAGS_TABLE . " WHERE id = %d",
        $id
    ));

    if ($existing_tag === 0) {
        wp_send_json_error(['message' => 'The tag does not exist.']);
        return;
    }

    // Check if another tag with the same name exists
    $duplicate_tag = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM " . MAIL_INBOX_TAGS_TABLE . " WHERE name = %s AND id != %d",
        $name,
        $id
    ));

    if ($duplicate_tag > 0) {
        wp_send_json_error(['message' => 'A tag with this name already exists.']);
        return;
    }

    // Update the tag in the table
    $result = $wpdb->update(
        MAIL_INBOX_TAGS_TABLE,
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
        wp_send_json_success(['message' => 'Tag updated successfully.']);
    } else {
        wp_send_json_error(['message' => 'Failed to update tag.']);
    }
}
