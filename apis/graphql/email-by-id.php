<?php
add_action( 'graphql_register_types', function() {
    register_graphql_object_type( 'Email', [
        'description' => __( 'An email entry', 'your-text-domain' ),
        'fields' => [
            'id' => ['type' => 'ID', 'description' => __('The ID of the email', 'your-text-domain')],
            'account_id' => ['type' => 'ID', 'description' => __('The account ID associated with the email', 'your-text-domain')],
            'folder_id' => ['type' => 'ID', 'description' => __('The folder ID associated with the email', 'your-text-domain')],
            'email_id' => ['type' => 'String', 'description' => __('The unique email ID', 'your-text-domain')],
            'categories' => ['type' => 'String', 'description' => __('Categories associated with the email', 'your-text-domain')],
            'has_attachments' => ['type' => 'Boolean', 'description' => __('Whether the email has attachments', 'your-text-domain')],
            'subject' => ['type' => 'String', 'description' => __('The subject of the email', 'your-text-domain')],
            'body_preview' => ['type' => 'String', 'description' => __('Preview of the email body', 'your-text-domain')],
            'importance' => ['type' => 'String', 'description' => __('The importance level of the email', 'your-text-domain')],
            'parent_folder_id' => ['type' => 'String', 'description' => __('The ID of the parent folder', 'your-text-domain')],
            'conversation_id' => ['type' => 'String', 'description' => __('The conversation ID', 'your-text-domain')],
            'is_delivery_receipt_requested' => ['type' => 'Boolean', 'description' => __('If delivery receipt is requested', 'your-text-domain')],
            'is_read_receipt_requested' => ['type' => 'Boolean', 'description' => __('If read receipt is requested', 'your-text-domain')],
            'is_read' => ['type' => 'Boolean', 'description' => __('Whether the email is read', 'your-text-domain')],
            'is_draft' => ['type' => 'Boolean', 'description' => __('Whether the email is a draft', 'your-text-domain')],
            'web_link' => ['type' => 'String', 'description' => __('The web link to view the email', 'your-text-domain')],
            'body_content_type' => ['type' => 'String', 'description' => __('The content type of the email body', 'your-text-domain')],
            'body_content' => ['type' => 'String', 'description' => __('The full content of the email body', 'your-text-domain')],
            'to_recipients' => ['type' => 'String', 'description' => __('The recipients of the email', 'your-text-domain')],
            'cc_recipients' => ['type' => 'String', 'description' => __('The CC recipients of the email', 'your-text-domain')],
            'bcc_recipients' => ['type' => 'String', 'description' => __('The BCC recipients of the email', 'your-text-domain')],
            'sender' => ['type' => 'String', 'description' => __('The sender address of the email', 'your-text-domain')],
            'reply_to' => ['type' => 'String', 'description' => __('The reply-to addresses of the email', 'your-text-domain')],
            'flag_status' => ['type' => 'String', 'description' => __('The flag status of the email', 'your-text-domain')],
            'created_datetime' => ['type' => 'String', 'description' => __('The datetime when the email was created', 'your-text-domain')],
            'last_modified_datetime' => ['type' => 'String', 'description' => __('The datetime when the email was last modified', 'your-text-domain')],
            'received_datetime' => ['type' => 'String', 'description' => __('The datetime when the email was received', 'your-text-domain')],
            'sent_datetime' => ['type' => 'String', 'description' => __('The datetime when the email was sent', 'your-text-domain')],
            'created_at' => ['type' => 'String', 'description' => __('The creation time of the record', 'your-text-domain')],
            'updated_at' => ['type' => 'String', 'description' => __('The last update time of the record', 'your-text-domain')],
            'additionalInfo' => [
                'type' => 'EmailAdditionalInfo',
                'description' => __('Additional info associated with the email', 'your-text-domain'),
                'resolve' => function ($email, $args, $context, $info) {
                    global $wpdb;
                    $query = "
                        SELECT ai.*, t.name AS tag_name
                        FROM " . MAIL_INBOX_EMAILS_ADDITIONAL_INFO_TABLE . " AS ai
                        LEFT JOIN " . MAIL_INBOX_TAGS_TABLE . " AS t ON ai.tag_id = t.id
                        WHERE ai.email_id = %d
                    ";
                    $prepared_query = $wpdb->prepare($query, intval($email->id));
                    $additional_info = $wpdb->get_row($prepared_query);
                    return $additional_info;
                }
            ],
            'categories' => [
                'type' => ['list_of' => 'Category'],
                'description' => __('Categories associated with the email', 'your-text-domain'),
                'resolve' => function ($email, $args, $context, $info) {
                    global $wpdb;
                    $query = "
                        SELECT c.id, c.name
                        FROM " . MAIL_INBOX_EMAILS_ADDITIONAL_MULTIPLE_INFO_TABLE . " AS em
                        LEFT JOIN " . MAIL_INBOX_CATEGORIES_TABLE . " AS c ON em.category_id = c.id
                        WHERE em.email_id = %d
                    ";
                    $prepared_query = $wpdb->prepare($query, intval($email->id));
                    return $wpdb->get_results($prepared_query);
                },
            ],
        ],
    ]);

    // Register the query
    register_graphql_field( 'RootQuery', 'getEmailById', [
        'type' => 'Email',
        'args' => [
            'id' => [
                'type' => 'ID',
                'description' => __( 'The ID of the email', 'your-text-domain' ),
            ],
            'account_id' => [
                'type' => 'ID',
                'description' => __( 'The account ID to filter by', 'your-text-domain' ),
            ],
        ],
        'resolve' => function( $source, $args, $context, $info ) {
            global $wpdb;

            $query = "SELECT * FROM " . MAIL_INBOX_EMAILS_TABLE . " WHERE 1=1";
            if ( ! empty( $args['id'] ) ) {
                $query .= " AND id = %d";
                $params[] = intval( $args['id'] );
            }
            if ( ! empty( $args['account_id'] ) ) {
                $query .= " AND account_id = %d";
                $params[] = intval( $args['account_id'] );
            }

            $query = $wpdb->prepare( $query, $params );
            $email = $wpdb->get_row( $query );

            return $email;
        },
    ]);
});
