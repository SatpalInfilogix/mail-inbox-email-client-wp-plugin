<?php
add_action( 'graphql_register_types', function() {
    // Define the Ticket type
    register_graphql_object_type( 'Ticket', [
        'description' => 'Ticket object',
        'fields' => [
            'id' => [
                'type' => 'ID',
                'description' => 'The ID of the ticket',
            ],
            'title' => [
                'type' => 'String',
                'description' => 'The title of the ticket',
            ],
            'content' => [
                'type' => 'String',
                'description' => 'The content of the ticket',
            ],
            'status' => [
                'type' => 'String',
                'description' => 'The status of the ticket',
            ],
        ]
    ]);

    // Register the ticketsByUserId query
    register_graphql_field( 'RootQuery', 'ticketsByUserId', [
        'type' => ['list_of' => 'Ticket'], // Ensure this returns a list of Ticket objects, not String
        'args' => [
            'userId' => [
                'type' => 'ID',
                'description' => 'The ID of the user to fetch tickets for.',
            ],
        ],
        'resolve' => function( $root, $args, $context, $info ) {
            if (empty($args['userId'])) {
                return [];
            }

            global $wpdb;
            // Query tickets related to the user in Awesome Support
            $tickets_query = $wpdb->prepare("
                SELECT p.ID as id, p.post_title as title, p.post_date as created_at, p.post_modified as updated_at,
                    (SELECT meta_value FROM {$wpdb->postmeta} WHERE post_id = p.ID AND meta_key = '_status') AS status,
                    (SELECT meta_value FROM {$wpdb->postmeta} WHERE post_id = p.ID AND meta_key = '_priority') AS priority
                FROM {$wpdb->posts} AS p
                WHERE p.post_type = 'ticket' AND p.post_author = %d
                ORDER BY p.post_date DESC
                LIMIT 5
            ", $args['userId']);

            $tickets = $wpdb->get_results($tickets_query);

            // Format the ticket data as expected in GraphQL response
            return array_map(function ($ticket) {
                return [
                    'id' => $ticket->id,
                    'title' => $ticket->title,
                    'status' => $ticket->status,
                    'priority' => $ticket->priority,
                    'created_at' => $ticket->created_at,
                    'updated_at' => $ticket->updated_at,
                    'link' => get_edit_post_link($ticket->id)
                ];
            }, $tickets);
        },
    ]);
});
