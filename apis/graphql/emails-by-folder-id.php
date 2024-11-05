<?php
add_action('graphql_register_types', function () {
    // Register EmailAdditionalInfo type
    register_graphql_object_type('EmailAdditionalInfo', [
        'description' => __('Additional info for an email', 'your-text-domain'),
        'fields' => [
            'id' => ['type' => 'ID', 'description' => __('The ID of the additional info record', 'your-text-domain')],
            'email_id' => ['type' => 'ID', 'description' => __('The email ID', 'your-text-domain')],
            'tag_id' => ['type' => 'ID', 'description' => __('The tag ID', 'your-text-domain')],
            'tag_name' => ['type' => 'String', 'description' => __('The name of the tag', 'your-text-domain')],
            'agent_id' => ['type' => 'ID', 'description' => __('The agent ID', 'your-text-domain')],
            'created_at' => ['type' => 'String', 'description' => __('The creation time of the record', 'your-text-domain')],
            'updated_at' => ['type' => 'String', 'description' => __('The last update time of the record', 'your-text-domain')],
        ],
    ]);

     // Register Category type
     register_graphql_object_type('Category', [
        'description' => __('A category associated with an email', 'your-text-domain'),
        'fields' => [
            'id' => ['type' => 'ID', 'description' => __('The ID of the category', 'your-text-domain')],
            'name' => ['type' => 'String', 'description' => __('The name of the category', 'your-text-domain')],
        ],
    ]);

    // Register Attachment type
    register_graphql_object_type('Attachment', [
        'description' => __('An attachment associated with an email', 'your-text-domain'),
        'fields' => [
            'id' => ['type' => 'ID', 'description' => __('The ID of the attachment', 'your-text-domain')],
            'email_id' => ['type' => 'ID', 'description' => __('The email ID', 'your-text-domain')],
            'name' => ['type' => 'String', 'description' => __('The name of the attachment', 'your-text-domain')],
            'path' => ['type' => 'String', 'description' => __('The path to the attachment file', 'your-text-domain')],
            'content_type' => ['type' => 'String', 'description' => __('The MIME type of the attachment', 'your-text-domain')],
            'created_at' => ['type' => 'String', 'description' => __('The creation time of the attachment', 'your-text-domain')],
            'updated_at' => ['type' => 'String', 'description' => __('The last update time of the attachment', 'your-text-domain')],
        ],
    ]);

    // Register input type for filters
    register_graphql_input_type('EmailFiltersInput', [
        'description' => __('Filters for querying emails', 'your-text-domain'),
        'fields' => [
            'startDate' => [
                'type' => ['list_of' => 'String'],
                'description' => __('Date range filter in the format [start_date, end_date]', 'your-text-domain'),
            ],
            'endDate' => [
                'type' => ['list_of' => 'String'],
                'description' => __('Date range filter in the format [start_date, end_date]', 'your-text-domain'),
            ],
            'keyword' => [
                'type' => 'String',
                'description' => __('Keyword to search in email body content', 'your-text-domain'),
            ],
            'searchFrom' => [
                'type' => 'String',
                'description' => __('Text to search in email from Name or Email', 'your-text-domain'),
            ],
            'searchSubject' => [
                'type' => 'String',
                'description' => __('Text to search in Email Subject', 'your-text-domain'),
            ],
            'agentId' => [
                'type' => 'Int',
                'description' => __('Agent ID to filter in Emails', 'your-text-domain'),
            ],
        ],
    ]);

    // Register Email type with additionalInfo field
    register_graphql_object_type('Email', [
        'description' => __('An email entry', 'your-text-domain'),
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
            'attachments' => [
                'type' => ['list_of' => 'Attachment'],
                'description' => __('Attachments associated with the email', 'your-text-domain'),
                'resolve' => function ($email, $args, $context, $info) {
                    global $wpdb;
                    $query = "
                        SELECT *
                        FROM " . MAIL_INBOX_EMAILS_ATTACHMENTS_TABLE . "
                        WHERE email_id = %d
                    ";
                    $prepared_query = $wpdb->prepare($query, intval($email->id));
                    return $wpdb->get_results($prepared_query);
                },
            ],
        ],
    ]);

    // Register the query to get emails by folder_id with pagination
    register_graphql_field('RootQuery', 'getEmailsByFolderId', [
        'type' => ['list_of' => 'Email'],
        'args' => [
            'folder_id' => [
                'type' => 'ID',
                'description' => __('The folder ID to filter by', 'your-text-domain'),
            ],
            'limit' => [
                'type' => 'Int',
                'description' => __('The number of emails to return', 'your-text-domain'),
                'defaultValue' => 10,
            ],
            'offset' => [
                'type' => 'Int',
                'description' => __('The number of emails to skip', 'your-text-domain'),
                'defaultValue' => 0,
            ],
            'filters' => [
                'type' => 'EmailFiltersInput',
                'description' => __('Filters for date range, keyword, etc.', 'your-text-domain'),
            ],
        ],
        'resolve' => function ($source, $args, $context, $info) {
            global $wpdb;
        
            if (empty($args['folder_id'])) {
                return null; // No folder_id provided
            }
        
            $limit = isset($args['limit']) ? absint($args['limit']) : 10;
            $offset = isset($args['offset']) ? absint($args['offset']) : 0;
            $folder_id = intval($args['folder_id']);
        
            // Start constructing the query with the main table
            $query = "SELECT e.* FROM " . MAIL_INBOX_EMAILS_TABLE . " AS e";
        
            // If agentId filter is provided, join with the additional info table
            if (!empty($args['filters']['agentId'])) {
                $query .= " LEFT JOIN " . MAIL_INBOX_EMAILS_ADDITIONAL_INFO_TABLE . " AS ai ON e.id = ai.email_id";
            }
        
            // Initial WHERE clause for folder_id filter
            $query .= " WHERE e.folder_id = %d";
            $query_params = [$folder_id];
        
            // Apply filters if provided
            if (!empty($args['filters'])) {
                $filters = $args['filters'];
        
                // Date range filter
                if (!empty($filters['startDate'][0]) && !empty($filters['endDate'][0])) {
                    $query .= " AND e.received_datetime BETWEEN %s AND %s";
                    $query_params[] = $filters['startDate'][0];
                    $query_params[] = $filters['endDate'][0];
                } elseif (!empty($filters['startDate'][0])) {
                    $query .= " AND e.received_datetime >= %s";
                    $query_params[] = $filters['startDate'][0];
                } elseif (!empty($filters['endDate'][0])) {
                    $query .= " AND e.received_datetime <= %s";
                    $query_params[] = $filters['endDate'][0];
                }
        
                // Search by From filter
                if (!empty($filters['searchFrom'])) {
                    $searchFrom = '%' . $wpdb->esc_like($filters['searchFrom']) . '%';
                    $query .= " AND (JSON_UNQUOTE(JSON_EXTRACT(e.from, '$.emailAddress.name')) LIKE %s 
                                OR JSON_UNQUOTE(JSON_EXTRACT(e.from, '$.emailAddress.address')) LIKE %s)";
                    $query_params[] = $searchFrom;
                    $query_params[] = $searchFrom;
                }
        
                // Search by Subject filter
                if (!empty($filters['searchSubject'])) {
                    $searchSubject = '%' . $wpdb->esc_like(wp_strip_all_tags(trim($filters['searchSubject']))) . '%';
                    $query .= " AND LOWER(REPLACE(REPLACE(REPLACE(e.subject, '<', ''), '>', ''), '/', '')) LIKE LOWER(%s)";
                    $query_params[] = $searchSubject;
                }
        
                // Keyword filter
                if (!empty($filters['keyword'])) {
                    $keyword = '%' . $wpdb->esc_like(wp_strip_all_tags(trim($filters['keyword']))) . '%';
                    $query .= " AND e.body_content LIKE %s";
                    $query_params[] = $keyword;
                }
        
                // Agent ID filter
                if (!empty($filters['agentId'])) {
                    $agentId = $filters['agentId'];

                    if($agentId > 0){
                        $query .= " AND ai.agent_id = %d";
                        $query_params[] = intval($agentId);
                    } else if ($agentId === -1) {
                        // Filter for cases where agent_id is NULL or 0
                        $query .= " AND (ai.agent_id IS NULL OR ai.agent_id = 0)";
                    } 
                }
            }
        
            // Add limit and offset
            $query .= " ORDER BY e.id DESC LIMIT %d OFFSET %d";
            $query_params[] = $limit;
            $query_params[] = $offset;
        
            // Prepare and execute the query
            $prepared_query = $wpdb->prepare($query, ...$query_params);
            $emails = $wpdb->get_results($prepared_query);
        
            return $emails;
        },
    ]);
});
