<?php
add_action( 'graphql_register_types', function() {
    register_graphql_field( 'RootQuery', 'mailInboxAgents', [
        'type' => ['list_of' => 'User'],
        'resolve' => function( $root, $args, $context, $info ) {
            $agentRole = get_option('mail_inbox_agent_role', '');

            // Query all users without filtering by role
            $user_query = new WP_User_Query([
                'role'   => $agentRole,
                'fields' => 'all_with_meta', // Ensure all user fields are fetched
            ]);

            // Fetch the results
            $users = $user_query->get_results();

            // Map fields for GraphQL compatibility
            return array_map( function( $user ) {
                return (object) [
                    'id' => $user->ID,
                    'name' => $user->display_name,
                    'email' => $user->user_email,
                ];
            }, $users );
        },
        'description' => 'Query to fetch all users without filtering by role.',
    ]);
});