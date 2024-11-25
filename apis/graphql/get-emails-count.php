<?php
function getEmailsWithTagCount($folder_id = null) {
    global $wpdb;

    // Base query to count emails with assigned tags
    $query = "
        SELECT COUNT(DISTINCT e.id) AS email_count
        FROM " . MAIL_INBOX_EMAILS_TABLE . " AS e
        INNER JOIN " . MAIL_INBOX_EMAILS_ADDITIONAL_INFO_TABLE . " AS ai
        ON e.id = ai.email_id
        WHERE ai.tag_id IS NOT NULL
        AND ai.tag_id > 0
    ";

    // Add folder_id condition if provided
    if (!empty($folder_id)) {
        $query .= $wpdb->prepare(" AND e.folder_id = %d", $folder_id);
    } else {
        die('hhhhhh');
    }

    // Execute the query
    $email_count = $wpdb->get_var($query);

    return $email_count;
}

function getEmailsWithoutTagCount($folder_id = null) {
    global $wpdb;

    // Base query to count emails without assigned tags
    $query = "
        SELECT COUNT(DISTINCT e.id) AS email_count
        FROM " . MAIL_INBOX_EMAILS_TABLE . " AS e
        WHERE NOT EXISTS (
            SELECT 1
            FROM " . MAIL_INBOX_EMAILS_ADDITIONAL_INFO_TABLE . " AS ai
            WHERE ai.email_id = e.id
              AND ai.tag_id IS NOT NULL
              AND ai.tag_id > 0
        )
    ";

    // Add folder_id condition if provided
    if (!empty($folder_id)) {
        $query .= $wpdb->prepare(" AND e.folder_id = %d", $folder_id);
    }

    // Execute the query
    $email_count = $wpdb->get_var($query);

    return $email_count;
}

add_action('graphql_register_types', function() {
    register_graphql_object_type('EmailCounts', [
        'description' => 'Counts for assigned and unassigned emails',
        'fields'      => [
            'assignedEmailsCount' => [
                'type'        => 'Int',
                'description' => 'The number of assigned emails',
                'resolve'     => function($root, $args, $context, $info) {
                    // $root will contain the folder_id passed from the parent resolver
                    $folder_id = $root['folder_id'] ?? null;
                    return (int) getEmailsWithTagCount($folder_id);
                },
            ],
            'unassignedEmailsCount' => [
                'type'        => 'Int',
                'description' => 'The number of unassigned emails',
                'resolve'     => function($root, $args, $context, $info) {
                    // $root will contain the folder_id passed from the parent resolver
                    $folder_id = $root['folder_id'] ?? null;
                    return (int) getEmailsWithoutTagCount($folder_id);
                },
            ],
        ],
    ]);

    register_graphql_field('RootQuery', 'emailCounts', [
        'type'        => 'EmailCounts',
        'description' => 'Get counts of assigned and unassigned emails',
        'args'        => [
            'folder_id' => [
                'type'        => 'Int',
                'description' => 'Folder ID to filter emails',
            ],
        ],
        'resolve'     => function($root, $args, $context, $info) {
            // Pass folder_id as part of the root object to child resolvers
            $folder_id = $args['folder_id'] ?? null;
            return ['folder_id' => $folder_id];
        },
    ]);
});
