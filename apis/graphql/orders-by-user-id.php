<?php
// Hook into GraphQL registration after WPGraphQL initializes
add_action('graphql_register_types', function () {

    // Ensure WPGraphQL is active
    if (class_exists('WPGraphQL')) {

        // Register custom GraphQL fields and types
        register_graphql_field('RootQuery', 'ordersByUserId', [
            'type' => ['list_of' => 'Order'],
            'args' => [
                'userId' => [
                    'type' => 'Int',
                    'description' => 'User ID to filter orders by',
                ],
            ],
            'resolve' => function ($source, $args, $context, $info) {
                if (empty($args['userId'])) {
                    return new WP_Error('no_user_id', 'You must provide a user ID.', ['status' => 400]);
                }

                // Retrieve user by ID
                $user = get_user_by('ID', absint($args['userId']));
                if (!$user) {
                    return new WP_Error('invalid_user_id', 'Invalid user ID.', ['status' => 404]);
                }

                // Retrieve user email
                $userEmail = $user->user_email;
                $args = array(
                    'billing_email' => $userEmail, // Filter by email address
                    'limit'         => 5,     // Get all matching orders
                    'status'        => 'any',  // Retrieve orders of any status
                );
            
                $orders = wc_get_orders($args);
                if (empty($orders)) {
                    return [];
                }
    
                // Format orders for GraphQL response
                return array_map(function ($order) {
                    $wc_order = wc_get_order($order->ID);
                    return [
                        'id' => $wc_order->get_id(),
                        'order_number' => $wc_order->get_order_number(),
                        'total' => (float) $wc_order->get_total(),
                        'date_created' => $wc_order->get_date_created()->date('Y-m-d H:i:s'),
                        'status' => $wc_order->get_status(),
                        'items' => array_map(function ($item) {
                            return [
                                'name' => $item->get_name(),
                                'quantity' => $item->get_quantity(),
                                'total' => (float) $item->get_total(),
                            ];
                        }, $wc_order->get_items()),
                    ];
                }, $orders);
            },
        ]);

        // Define the Order type with its fields
        register_graphql_object_type('Order', [
            'fields' => [
                'id' => ['type' => 'ID'],
                'status' => ['type' => 'String'],
                'total' => ['type' => 'String'],
                'currency' => ['type' => 'String'],
                'items' => [
                    'type' => ['list_of' => 'OrderItem'],
                    'description' => 'Items in the order',
                ],
            ],
        ]);

        // Define the OrderItem type with its fields
        register_graphql_object_type('OrderItem', [
            'fields' => [
                'productId' => [
                    'type' => 'ID',
                    'description' => 'ID of the product in the order item',
                ],
                'quantity' => [
                    'type' => 'Int',
                    'description' => 'Quantity of the product ordered',
                ],
                'total' => [
                    'type' => 'String',
                    'description' => 'Total price of the order item',
                ],
            ],
        ]);
    } else {
        error_log('WPGraphQL is not active. Please activate the WPGraphQL plugin.');
    }
});
