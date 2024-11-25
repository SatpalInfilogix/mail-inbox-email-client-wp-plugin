<?php
function getEmailsWithTagCount($folder_id = null, $received_date = null, $agent_id = null) {
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

    // Add agent_id condition with INNER JOIN if provided
    if (!empty($agent_id)) {
        $query .= $wpdb->prepare(" AND ai.agent_id = %d", $agent_id);
    }

    // Add folder_id condition if provided
    if (!empty($folder_id)) {
        $query .= $wpdb->prepare(" AND e.folder_id = %d", $folder_id);
    }

    // Add received_date condition if provided
    if (!empty($received_date)) {
        $query .= $wpdb->prepare(" AND DATE(e.received_datetime) = %s", $received_date);
    }

    // Execute the query
    $email_count = $wpdb->get_var($query);

    return $email_count;
}

function getEmailsWithoutTagCount($folder_id = null, $received_date = null, $agent_id = null) {
    global $wpdb;

    // Base query to count emails without assigned tags
    $query = "
        SELECT COUNT(DISTINCT e.id) AS email_count
        FROM " . MAIL_INBOX_EMAILS_TABLE . " AS e
    ";

    // If agent_id is provided, use INNER JOIN to filter by agent_id
    if (!empty($agent_id)) {
        $query .= "
            INNER JOIN " . MAIL_INBOX_EMAILS_ADDITIONAL_INFO_TABLE . " AS ai
            ON e.id = ai.email_id
        ";
    }

    // Start WHERE clause to exclude tagged emails
    $query .= "
        WHERE NOT EXISTS (
            SELECT 1
            FROM " . MAIL_INBOX_EMAILS_ADDITIONAL_INFO_TABLE . " AS ai2
            WHERE ai2.email_id = e.id
              AND ai2.tag_id IS NOT NULL
              AND ai2.tag_id > 0
    ";

    // Add agent_id condition in the subquery if provided
    if (!empty($agent_id)) {
        $query .= $wpdb->prepare(" AND ai2.agent_id = %d", $agent_id);
    }

    $query .= ")";

    // Add folder_id condition if provided
    if (!empty($folder_id)) {
        $query .= $wpdb->prepare(" AND e.folder_id = %d", $folder_id);
    }

    // Add received_date condition if provided
    if (!empty($received_date)) {
        $query .= $wpdb->prepare(" AND DATE(e.received_datetime) = %s", $received_date);
    }

    // Add condition to enforce agent_id if provided
    if (!empty($agent_id)) {
        $query .= $wpdb->prepare(" AND ai.agent_id = %d", $agent_id);
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
                    $folder_id = $root['folder_id'] ?? null;
                    $received_date = $root['received_date'] ?? null;
                    $agent_id = $root['agent_id'] ?? null;
                    return (int) getEmailsWithTagCount($folder_id, $received_date, $agent_id);
                },
            ],
            'unassignedEmailsCount' => [
                'type'        => 'Int',
                'description' => 'The number of unassigned emails',
                'resolve'     => function($root, $args, $context, $info) {
                    $folder_id = $root['folder_id'] ?? null;
                    $received_date = $root['received_date'] ?? null;
                    $agent_id = $root['agent_id'] ?? null;
                    return (int) getEmailsWithoutTagCount($folder_id, $received_date, $agent_id);
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
            'received_date' => [
                'type'        => 'String', // Accept date in string format (e.g., "YYYY-MM-DD")
                'description' => 'Date to filter emails by received_datetime',
            ],
            'agent_id' => [
                'type'        => 'Int',
                'description' => 'Agent ID to filter emails (optional)',
            ],
        ],
        'resolve'     => function($root, $args, $context, $info) {
            $folder_id = $args['folder_id'] ?? null;
            $received_date = $args['received_date'] ?? null;
            $agent_id = $args['agent_id'] ?? null;
            return [
                'folder_id' => $folder_id,
                'received_date' => $received_date,
                'agent_id' => $agent_id,
            ];
        },
    ]);
});
