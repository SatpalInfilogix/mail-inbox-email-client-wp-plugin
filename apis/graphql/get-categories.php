<?php
add_action('graphql_register_types', function() {
    register_graphql_object_type('MailInboxCategory', [
        'description' => __('A custom object type for Mail Inbox Categories', 'your-textdomain'),
        'fields' => [
            'id' => [
                'type' => 'ID',
                'description' => __('The unique ID of the category', 'your-textdomain'),
            ],
            'name' => [
                'type' => 'String',
                'description' => __('The name of the category', 'your-textdomain'),
            ],
            'fontColor' => [
                'type' => 'String',
                'description' => __('The font color of the category', 'your-textdomain'),
            ],
            'backgroundColor' => [
                'type' => 'String',
                'description' => __('The background color of the category', 'your-textdomain'),
            ],
            'status' => [
                'type' => 'String',
                'description' => __('The status of the category', 'your-textdomain'),
            ],
            'createdAt' => [
                'type' => 'String',
                'description' => __('The creation date of the category', 'your-textdomain'),
            ],
            'updatedAt' => [
                'type' => 'String',
                'description' => __('The last update date of the category', 'your-textdomain'),
            ],
        ],
    ]);

    register_graphql_field('RootQuery', 'mailInboxCategories', [
        'type' => ['list_of' => 'MailInboxCategory'],
        'description' => __('Retrieve a list of Mail Inbox Categories', 'your-textdomain'),
        'args' => [
            'status' => [
                'type' => 'String',
                'description' => __('Filter tags by status', 'your-textdomain'),
            ],
        ],
        'resolve' => function($root, $args, $context, $info) {
            global $wpdb;
            $table_name = MAIL_INBOX_CATEGORIES_TABLE;
            
            // Base SQL query
            $sql = "SELECT * FROM {$table_name}";

            // Initialize parameters array for prepared statement
            $params = [];

            // Add WHERE clause if 'status' argument is provided
            if (!empty($args['status'])) {
                $sql .= " WHERE status = %s";
                $params[] = $args['status'];
            }

            // Prepare the SQL statement if parameters exist
            if (!empty($params)) {
                $sql = $wpdb->prepare($sql, $params);
            }

            // Execute the query
            $results = $wpdb->get_results($sql);

            return array_map(function($row) {
                return [
                    'id' => $row->id,
                    'name' => $row->name,
                    'fontColor' => $row->font_color,
                    'backgroundColor' => $row->background_color,
                    'status' => $row->status,
                    'createdAt' => $row->created_at,
                    'updatedAt' => $row->updated_at,
                ];
            }, $results);
        },
    ]);
});
