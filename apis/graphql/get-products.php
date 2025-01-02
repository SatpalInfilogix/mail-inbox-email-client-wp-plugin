<?php
add_action('graphql_register_types', function() {

    // Register All Products Query Field
    register_graphql_field('RootQuery', 'mailInboxAllProducts', [
        'type' => ['list_of' => 'Product'],
        'description' => __('Retrieve all WooCommerce products', 'your-textdomain'),
        'resolve' => function() {
            $query_args = [
                'post_type' => 'product',
                'post_status' => 'publish',
                'posts_per_page' => -1, // Retrieve all products
            ];

            $query = new WP_Query($query_args);

            $products = [];
            while ($query->have_posts()) {
                $query->the_post();
                global $product;
                $products[] = $product;
            }

            wp_reset_postdata();

            return $products;
        }
    ]);

    // Register Product Type
    register_graphql_object_type('Product', [
        'description' => __('WooCommerce Product', 'your-textdomain'),
        'fields' => [
            'id' => [
                'type' => 'ID',
                'description' => __('The ID of the product', 'your-textdomain'),
            ],
            'name' => [
                'type' => 'String',
                'description' => __('The name of the product', 'your-textdomain'),
            ],
            'price' => [
                'type' => 'String',
                'description' => __('The price of the product', 'your-textdomain'),
                'resolve' => function($product) {
                    return $product->get_price();
                }
            ],
            'sku' => [
                'type' => 'String',
                'description' => __('The SKU of the product', 'your-textdomain'),
            ],
            'stock_status' => [
                'type' => 'String',
                'description' => __('The stock status of the product', 'your-textdomain'),
                'resolve' => function($product) {
                    return $product->get_stock_status();
                }
            ],
            'image' => [
                'type' => 'String',
                'description' => __('The URL of the product image', 'your-textdomain'),
                'resolve' => function($product) {
                    return wp_get_attachment_url($product->get_image_id());
                }
            ],
        ]
    ]);
});