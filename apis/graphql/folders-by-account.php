<?php
add_action( 'graphql_register_types', function() {
    register_graphql_object_type('Folder', [
        'description' => 'Folder in the mail inbox',
        'fields' => [
            'id' => [
                'type' => 'ID',
                'description' => 'The ID of the folder',
            ],
            'account_id' => [
                'type' => 'Int',
                'description' => 'The account ID the folder belongs to',
            ],
            'folder_id' => [
                'type' => 'String',
                'description' => 'The unique folder ID',
            ],
            'display_name' => [
                'type' => 'String',
                'description' => 'The display name of the folder',
            ],
            'parent_folder_id' => [
                'type' => 'String',
                'description' => 'The ID of the parent folder',
            ],
            'local_folder_parent_id' => [
                'type' => 'String',
                'description' => 'The ID of the local parent folder',
            ],
            'child_folder_count' => [
                'type' => 'Int',
                'description' => 'Number of child folders',
            ],
            'unread_item_count' => [
                'type' => 'Int',
                'description' => 'Number of unread items in the folder',
            ],
            'total_item_count' => [
                'type' => 'Int',
                'description' => 'Total number of items in the folder',
            ],
            'size_in_bytes' => [
                'type' => 'Int',
                'description' => 'Size of the folder in bytes',
            ],
            'is_hidden' => [
                'type' => 'Boolean',
                'description' => 'Whether the folder is hidden',
            ],
            'created_at' => [
                'type' => 'String',
                'description' => 'The date the folder was created',
            ],
            'updated_at' => [
                'type' => 'String',
                'description' => 'The date the folder was last updated',
            ],
        ]
    ]);

    // Register the folders query in GraphQL
    register_graphql_field('RootQuery', 'folders', [
        'type' => ['list_of' => 'Folder'],
        'args' => [
            'account_id' => [
                'type' => 'Int',
                'description' => 'The account ID to fetch folders for',
            ],
        ],
        'resolve' => function ($root, $args, $context, $info) {

            global $wpdb;

            // Sanitize input
            $account_id = isset($args['account_id']) ? intval($args['account_id']) : 0;

            // Query folders by account_id
            $results = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT * FROM ".MAIL_INBOX_FOLDERS_TABLE." WHERE account_id = %d",
                    $account_id
                )
            );

            // Return the result
            return !empty($results) ? $results : [];
        },
    ]);
});