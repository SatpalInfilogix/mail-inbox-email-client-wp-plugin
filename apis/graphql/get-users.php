<?php
add_action('graphql_register_types', function () {
    register_graphql_field('RootQuery', 'mailInboxUsers', [
        'type' => ['list_of' => 'MailInboxUser'],
        'args' => [
            'where' => [
                'type' => 'MailInboxUserWhereInput',
                'description' => __('Arguments to filter the users', 'your-textdomain'),
            ],
            'first' => [
                'type' => 'Int',
                'description' => __('Number of results to return', 'your-textdomain'),
            ],
        ],
        'resolve' => function ($root, $args, $context, $info) {
            $search = $args['where']['search'] ?? '';
            $first = $args['first'] ?? 10;

            $users = get_users([
                'search' => '*' . esc_attr($search) . '*',
                'number' => $first,
            ]);

            return array_map(function ($user) {
                return [
                    'id' => $user->ID,
                    'userId' => $user->ID,
                    'name' => $user->display_name,
                    'email' => $user->user_email,
                    'phoneNumber' => get_user_meta($user->ID, 'billing_phone', true),
                ];
            }, $users);
        },
    ]);

    register_graphql_object_type('MailInboxUser', [
        'fields' => [
            'id' => ['type' => 'ID'],
            'userId' => ['type' => 'String'],
            'name' => ['type' => 'String'],
            'email' => ['type' => 'String'],
            'phoneNumber' => ['type' => 'String'],
        ],
    ]);

    register_graphql_input_type('MailInboxUserWhereInput', [
        'fields' => [
            'search' => ['type' => 'String'],
        ],
    ]);
});
