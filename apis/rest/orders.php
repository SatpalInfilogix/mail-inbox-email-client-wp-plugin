<?php
add_action('wp_ajax_mail_inbox_create_order', 'mailInboxCreateOrder');


function mailInboxCreateOrder(){
    if (!class_exists('WC_Order')) {
        wp_send_json_error(['message' => 'Woocommerce is not installed']);
    }

    $customerId = sanitize_text_field($_POST['customer_id']);
    $agentId = sanitize_text_field($_POST['agent_id']);
    $products = sanitize_text_field($_POST['products']);
    $products = explode(", ", $products);
    $customerPhone = sanitize_text_field($_POST['customer_phone']);
    $description = sanitize_text_field($_POST['description']);
    $emailId = sanitize_text_field($_POST['email_id']);
    $amount = floatval($_POST['amount']);

    try {
        $order = wc_create_order();

        foreach ($products as $productId) {
            $product = wc_get_product($productId);
            if ($product) {
                $order->add_product($product, 1);
            }
        }

        if ($customerId) {
            $customer = get_user_by( 'id', $customerId);
            $order->set_customer_id($customerId);
            $order->set_billing_first_name($customer->first_name);
            $order->set_billing_last_name($customer->last_name);
            $order->set_billing_email($customer->user_email );	
            $order->set_billing_phone($customerPhone);

            global $wpdb;
            $table_name = MAIL_INBOX_EMAILS_ADDITIONAL_INFO_TABLE;

            $email_exists = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table_name WHERE email_id = %d", $emailId));

            if ($email_exists) {
                $wpdb->update(
                    $table_name,
                    ['user_id' => $customerId],
                    ['email_id' => $emailId],
                    ['%d'],
                    ['%d']
                );
            } else {
                $wpdb->insert(
                    $table_name,
                    [
                        'email_id' => $emailId,
                        'user_id' => $customerId
                    ],
                    ['%d', '%d']
                );
            }
        }

        if (function_exists('update_field') && $description) {
            $acf_order_description_field_key = get_option('mail_inbox_order_description_acf_field', '');
            update_field($acf_order_description_field_key, $description, $order->get_id());
        }
        

        if ($description) {
            $acf_field_key = get_option('mail_inbox_order_description_acf_field', '');
            update_field($acf_field_key, $description, $order->get_id());
        }

        if($agentId){
            update_post_meta( $order->get_id(), 'wcb2bsa_sales_agent', $agentId );
        }

        $order->set_total($amount);
        $orderId = $order->save();

        wp_send_json_success([
            'message' => 'Order created successfully',
            'orderId' => $orderId,
            'orderNumber' => $order->get_order_number()
        ]);
    } catch (Exception $e) {
        wp_send_json_error(['message' => $e->getMessage()]);
    }
}
