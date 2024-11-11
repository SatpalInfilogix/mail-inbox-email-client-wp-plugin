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
            if ( empty( $args['userId'] ) ) {
                return [];
            }

            $query_args = [
                'post_type' => 'ticket',
                'meta_query' => [
                    [
                        'key' => 'user_id',
                        'value' => $args['userId'],
                        'compare' => '='
                    ]
                ],
            ];

            $tickets_query = new WP_Query( $query_args );
            $tickets = [];

            if ( $tickets_query->have_posts() ) {
                while ( $tickets_query->have_posts() ) {
                    $tickets_query->the_post();
                    $tickets[] = [
                        'id' => get_the_ID(),
                        'title' => get_the_title(),
                        'content' => get_the_content(),
                        'status' => get_post_meta( get_the_ID(), 'status', true ),
                    ];
                }
            }

            wp_reset_postdata();

            return $tickets;
        },
    ]);
});
