<?php
add_action( 'graphql_register_types', function() {
    register_graphql_object_type( 'Email', [
        'description' => __( 'An email entry', 'your-text-domain' ),
        'fields' => [
            'id' => [
                'type' => 'ID',
                'description' => __( 'The ID of the email', 'your-text-domain' ),
            ],
            'account_id' => [
                'type' => 'ID',
                'description' => __( 'The account ID associated with the email', 'your-text-domain' ),
            ],
            // Add other fields similarly...
            'subject' => [
                'type' => 'String',
                'description' => __( 'The subject of the email', 'your-text-domain' ),
            ],
            'body_preview' => [
                'type' => 'String',
                'description' => __( 'Preview of the email body', 'your-text-domain' ),
            ],
            // Continue for other fields...
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
