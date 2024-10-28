<?php
add_action('graphql_register_types', function() {
    // Register the MailAccount type
    register_graphql_object_type('MailAccount', [
        'description' => 'Mail Account Information',
        'fields' => [
            'id' => [
                'type' => 'ID',
                'description' => 'The unique identifier of the account',
            ],
            'email' => [
                'type' => 'String',
                'description' => 'The email associated with the account',
            ],
            'username' => [
                'type' => 'String',
                'description' => 'The username for the email account',
            ],
            'accessToken' => [
                'type' => 'String',
                'description' => 'Access token for the account',
            ],
            'refreshToken' => [
                'type' => 'String',
                'description' => 'Refresh token for the account',
            ],
            'expiresIn' => [
                'type' => 'Int',
                'description' => 'Expiration time for the access token',
            ],
            'createdAt' => [
                'type' => 'String',
                'description' => 'Account creation timestamp',
            ],
            'updatedAt' => [
                'type' => 'String',
                'description' => 'Account last updated timestamp',
            ],
            'folders' => [
                'type' => ['list_of' => 'Folder'],  // Add folders field here
                'description' => 'Folders associated with this account',
                'resolve' => function($account) {
                    global $wpdb;

                    // Query folders by account_id
                    $results = $wpdb->get_results(
                        $wpdb->prepare(
                            "SELECT * FROM ".MAIL_INBOX_FOLDERS_TABLE." WHERE account_id = %d",
                            $account['id']
                        )
                    );

                    // Convert the results to an array
                    $folders = !empty($results) ? $results : [];

                    // Define the custom order for folder names
                    $predefinedOrder = [
                        'Inbox',
                        'Drafts',
                        'Sent Items',
                        'Junk Email',
                        'Outbox',
                        'Trash',
                        'Deleted Items',
                    ];

                    // Sort the folders based on the predefined order and then alphabetically
                    usort($folders, function($a, $b) use ($predefinedOrder) {
                        $aName = $a->display_name;
                        $bName = $b->display_name;

                        // Get the position in the predefined order or use a high value for non-predefined folders
                        $aPosition = array_search($aName, $predefinedOrder);
                        $bPosition = array_search($bName, $predefinedOrder);

                        // If both are in the predefined order, sort by their position
                        if ($aPosition !== false && $bPosition !== false) {
                            return $aPosition - $bPosition;
                        }

                        // If one of them is in the predefined order, prioritize it
                        if ($aPosition !== false) return -1;
                        if ($bPosition !== false) return 1;

                        // If neither is in the predefined order, sort alphabetically
                        return strcmp($aName, $bName);
                    });

                    // Return the sorted folders
                    return $folders;
                }
            ],
        ]
    ]);

    // Register the RootQuery to fetch mail accounts
    register_graphql_field('RootQuery', 'mailAccounts', [
        'type' => ['list_of' => 'MailAccount'],
        'description' => 'Query to fetch mail accounts from the database',
        'resolve' => function() {
            global $wpdb;
            // Fetch mail accounts from the database
            $results = $wpdb->get_results("SELECT * FROM ".MAIL_INBOX_ACCOUNTS_TABLE);

            // Map the results to return the account data
            return array_map(function($row) {
                return [
                    'id' => $row->id,
                    'email' => $row->email,
                    'username' => $row->username,
                    'accessToken' => $row->access_token,
                    'refreshToken' => $row->refresh_token,
                    'expiresIn' => $row->expires_in,
                    'createdAt' => $row->created_at,
                    'updatedAt' => $row->updated_at,
                ];
            }, $results);
        }
    ]);
});
