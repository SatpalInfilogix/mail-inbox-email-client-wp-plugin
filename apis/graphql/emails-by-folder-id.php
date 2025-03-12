<?php
function associateEmailAdditionalInfo($emailId, $column, $value)
{
    global $wpdb;
    $table_name = MAIL_INBOX_EMAILS_ADDITIONAL_INFO_TABLE;

    // Check if user_id already exists for this email_id
    $email_exists = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM $table_name WHERE email_id = %d", $emailId));

    if (!$email_exists) {
        // Insert new record
        $wpdb->insert(
            $table_name,
            [
                'email_id' => $emailId,
                $column => $value
            ],
            ['%d', '%d']
        );
    } else {
        // Update existing record
        $wpdb->update(
            $table_name,
            [$column => $value],
            ['email_id' => $emailId],
            ['%d'],
            ['%d']
        );
    }

    $mapping = [
        'agent_id' => 'agent',
        'tag_id' => 'tag',
    ];

    $reference = $mapping[$column] ?? null;

    $userName = 'System';
    $logStatus = 'assigned';

    $mapping = [
        'agent_id' => 'agent',
        'tag_id' => 'tag',
    ];
    
    $asssignedName = 'unkown';
    if($column=='agent_id'){
        $user = get_userdata($value);
        $asssignedName = $user->display_name;
    } else if($column=='tag_id'){
        $asssignedName = $wpdb->get_var($wpdb->prepare("SELECT name FROM " . MAIL_INBOX_TAGS_TABLE . " WHERE id = %d", $value));
    }

    $message = $userName . ' ' . $logStatus . ' ' . $reference . ' ' . $asssignedName;

    createEmailLog([
        'email_id'      => $emailId,
        'user_id'       => null,
        'reference'     => $reference,
        'status'        => $logStatus,
        'reference_id'  => $value,
        'message'       => $message
    ]);
}


add_action('graphql_register_types', function () {
    // Register EmailAdditionalInfo type
    register_graphql_object_type('EmailAdditionalInfo', [
        'description' => __('Additional info for an email', 'your-text-domain'),
        'fields' => [
            'id' => ['type' => 'ID', 'description' => __('The ID of the additional info record', 'your-text-domain')],
            'email_id' => ['type' => 'ID', 'description' => __('The email ID', 'your-text-domain')],
            'tag_id' => ['type' => 'ID', 'description' => __('The tag ID', 'your-text-domain')],
            'tag_name' => ['type' => 'String', 'description' => __('The name of the tag', 'your-text-domain')],
            'tag_log' => ['type' => 'String', 'description' => __('Get log who has assigned the tag', 'your-text-domain')],
            'agent_id' => ['type' => 'ID', 'description' => __('The agent ID', 'your-text-domain')],
            'user_id' => ['type' => 'ID', 'description' => __('User associated with this email', 'your-text-domain')],
            'ticket_id' => ['type' => 'ID', 'description' => __('Ticket assigned to this email', 'your-text-domain')],
            'ticket_title' => ['type' => 'String', 'description' => __('Associated Ticket title with this email', 'your-text-domain')],
            'order_id' => ['type' => 'ID', 'description' => __('Order associated with this email', 'your-text-domain')],
            'order_title' => ['type' => 'String', 'description' => __('Associated order title with this email', 'your-text-domain')],
            'created_at' => ['type' => 'String', 'description' => __('The creation time of the record', 'your-text-domain')],
            'updated_at' => ['type' => 'String', 'description' => __('The last update time of the record', 'your-text-domain')],
        ],
    ]);

    // Register Category type
    register_graphql_object_type('EmailListCategory', [
        'description' => __('A category associated with an email', 'your-text-domain'),
        'fields' => [
            'id' => ['type' => 'ID', 'description' => __('The ID of the category', 'your-text-domain')],
            'name' => ['type' => 'String', 'description' => __('The name of the category', 'your-text-domain')],
            'log' => ['type' => 'String', 'description' => __('Get log of the category', 'your-text-domain')],
        ],
    ]);

    // Register Category type
    register_graphql_object_type('Logs', [
        'description' => __('Logs associated with an email', 'your-text-domain'),
        'fields' => [
            'id' => ['type' => 'ID', 'description' => __('The ID of the log', 'your-text-domain')],
            'message' => ['type' => 'String', 'description' => __('Message of the log', 'your-text-domain')],
            'created_at' => ['type' => 'String', 'description' => __('Time of the created log', 'your-text-domain')],
        ]
    ]);

    // Register Attachment type
    register_graphql_object_type('Attachment', [
        'description' => __('An attachment associated with an email', 'your-text-domain'),
        'fields' => [
            'id' => ['type' => 'ID', 'description' => __('The ID of the attachment', 'your-text-domain')],
            'email_id' => ['type' => 'ID', 'description' => __('The email ID', 'your-text-domain')],
            'name' => ['type' => 'String', 'description' => __('The name of the attachment', 'your-text-domain')],
            'path' => ['type' => 'String', 'description' => __('The path to the attachment file', 'your-text-domain')],
            'content_type' => ['type' => 'String', 'description' => __('The MIME type of the attachment', 'your-text-domain')],
            'created_at' => ['type' => 'String', 'description' => __('The creation time of the attachment', 'your-text-domain')],
            'updated_at' => ['type' => 'String', 'description' => __('The last update time of the attachment', 'your-text-domain')],
        ],
    ]);

    // Register input type for filters
    register_graphql_input_type('EmailFiltersInput', [
        'description' => __('Filters for querying emails', 'your-text-domain'),
        'fields' => [
            'startDate' => [
                'type' => ['list_of' => 'String'],
                'description' => __('Date range filter in the format [start_date, end_date]', 'your-text-domain'),
            ],
            'endDate' => [
                'type' => ['list_of' => 'String'],
                'description' => __('Date range filter in the format [start_date, end_date]', 'your-text-domain'),
            ],
            'keyword' => [
                'type' => 'String',
                'description' => __('Keyword to search in email body content', 'your-text-domain'),
            ],
            'searchFrom' => [
                'type' => 'String',
                'description' => __('Text to search in email from Name or Email', 'your-text-domain'),
            ],
            'searchSubject' => [
                'type' => 'String',
                'description' => __('Text to search in Email Subject', 'your-text-domain'),
            ],
            'agentId' => [
                'type' => 'Int',
                'description' => __('Agent ID to filter in Emails', 'your-text-domain'),
            ],
            'tags' => [
                'type' => 'String',
                'description' => __('Filter by tags if assigned or not', 'your-text-domain'),
            ],
            'categories' => [
                'type' => 'String',
                'description' => __('Filter by categories if assigned or not', 'your-text-domain'),
            ],
        ],
    ]);

    // Extend the Email type with is_read
    register_graphql_field('Email', 'is_read', [
        'type' => 'Boolean',
        'description' => __('Whether the email is read by the logged-in user', 'your-text-domain'),
        'resolve' => function ($email, $args, $context, $info) {
            global $wpdb;

            // Get the logged-in user ID
            $user_id = get_current_user_id();

            // If no user is logged in, return null for read status
            if (!$user_id) {
                return null;
            }

            // Check the read status in the mail_inbox_emails_is_read table
            $table_name = MAIL_INBOX_EMAILS_READ_STATUS_TABLE;
            $read_status = $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM $table_name WHERE email_id = %d AND user_id = %d",
                $email->id,
                $user_id
            ));

            // Return true if a record exists (email is read), otherwise false (email is unread)
            return $read_status > 0;
        }
    ]);

    // Register UserInfo type for user details
    register_graphql_object_type('UserInfo', [
        'description' => __('Information about the user associated with an email', 'your-text-domain'),
        'fields' => [
            'id' => ['type' => 'ID', 'description' => __('The ID of the user', 'your-text-domain')],
            'name' => ['type' => 'String', 'description' => __('The name of the user', 'your-text-domain')],
            'email' => ['type' => 'String', 'description' => __('The email address of the user', 'your-text-domain')],
            'role' => ['type' => 'String', 'description' => __('The role of the user', 'your-text-domain')],
        ],
    ]);


    // Extend Email type with user_info field
    register_graphql_field('Email', 'user_info', [
        'type' => 'UserInfo',
        'description' => __('Information about the user associated with this email', 'your-text-domain'),
        'resolve' => function ($email, $args, $context, $info) {
            global $wpdb;
            $table_name = MAIL_INBOX_EMAILS_ADDITIONAL_INFO_TABLE;

            $associated_user = $wpdb->get_row($wpdb->prepare("SELECT user_id FROM $table_name WHERE email_id = %d", $email->id));
            if ($associated_user->user_id) {
                $user = get_userdata($associated_user->user_id);
            } else {
                $email = json_decode($email->sender)->emailAddress->address;
                $user = get_user_by('email', $email);
            }

            if (!isset($user->data)) {
                return null;
            }

            // Return user details in the expected format
            return [
                'id' => $user->ID,
                'name' => $user->display_name,
                'email' => $user->user_email,
                'role' => implode(', ', $user->roles),
            ];
        }
    ]);

    // Register Order type
    register_graphql_object_type('Order', [
        'description' => __('An order placed by a user', 'your-text-domain'),
        'fields' => [
            'id' => ['type' => 'ID', 'description' => __('The ID of the order', 'your-text-domain')],
            'order_number' => ['type' => 'String', 'description' => __('The order number', 'your-text-domain')],
            'total' => ['type' => 'Float', 'description' => __('The total amount of the order', 'your-text-domain')],
            'date_created' => ['type' => 'String', 'description' => __('The date the order was created', 'your-text-domain')],
            'status' => ['type' => 'String', 'description' => __('The status of the order', 'your-text-domain')],
            'link' => ['type' => 'String', 'description' => __('Edit link of the order', 'your-text-domain')],
            'items' => [
                'type' => ['list_of' => 'OrderItem'],
                'description' => __('The items within the order', 'your-text-domain'),
            ],
        ],
    ]);

    // Register Awesome Support Ticket type with link field
    register_graphql_object_type('AwesomeSupportTicket', [
        'description' => __('A support ticket from Awesome Support', 'your-text-domain'),
        'fields' => [
            'id' => ['type' => 'ID', 'description' => __('The ID of the ticket', 'your-text-domain')],
            'title' => ['type' => 'String', 'description' => __('The title of the ticket', 'your-text-domain')],
            'status' => ['type' => 'String', 'description' => __('The status of the ticket', 'your-text-domain')],
            'priority' => ['type' => 'String', 'description' => __('The priority of the ticket', 'your-text-domain')],
            'created_at' => ['type' => 'String', 'description' => __('The creation date of the ticket', 'your-text-domain')],
            'updated_at' => ['type' => 'String', 'description' => __('The last update time of the ticket', 'your-text-domain')],
            'link' => ['type' => 'String', 'description' => __('The link to view the ticket in Awesome Support', 'your-text-domain')],
        ],
    ]);

    // Extend Email type with tickets field
    register_graphql_field('Email', 'tickets', [
        'type' => ['list_of' => 'AwesomeSupportTicket'],
        'description' => __('Awesome Support tickets associated with the user of this email', 'your-text-domain'),
        'resolve' => function ($email, $args, $context, $info) {
            global $wpdb;

            // Query the associated user ID from the additional info table
            $table_name = MAIL_INBOX_EMAILS_ADDITIONAL_INFO_TABLE;
            $associated_user = $wpdb->get_row($wpdb->prepare("SELECT user_id FROM $table_name WHERE email_id = %d", $email->id));

            // If no user ID is associated, return an empty array
            if (empty($associated_user->user_id)) {
                $email = json_decode($email->sender)->emailAddress->address;
                $user = get_user_by('email', $email);
                if (!isset($user->data)) {
                    return [];
                }

                $associatedUserId = $user->data->ID;
            } else {
                $associatedUserId = $associated_user->user_id;
            }

            // Query tickets related to the user in Awesome Support
            $tickets_query = $wpdb->prepare("
                SELECT p.ID as id, p.post_title as title, p.post_date as created_at, p.post_modified as updated_at,
                    (SELECT meta_value FROM {$wpdb->postmeta} WHERE post_id = p.ID AND meta_key = '_status') AS status,
                    (SELECT meta_value FROM {$wpdb->postmeta} WHERE post_id = p.ID AND meta_key = '_priority') AS priority
                FROM {$wpdb->posts} AS p
                WHERE p.post_type = 'ticket' AND p.post_author = %d
                ORDER BY p.post_date DESC
                LIMIT 5
            ", $associatedUserId);

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
        }
    ]);

    // Register OrderItem type for individual items within an order
    register_graphql_object_type('OrderItem', [
        'description' => __('An item within an order', 'your-text-domain'),
        'fields' => [
            'name' => ['type' => 'String', 'description' => __('The name of the item', 'your-text-domain')],
            'quantity' => ['type' => 'Int', 'description' => __('The quantity of the item ordered', 'your-text-domain')],
            'total' => ['type' => 'Float', 'description' => __('The total price for this item', 'your-text-domain')],
        ],
    ]);

    // Extend the Email type with an orders field to get orders by email
    register_graphql_field('Email', 'orders', [
        'type' => ['list_of' => 'Order'],
        'description' => __('The last 5 orders associated with this email address', 'your-text-domain'),
        'resolve' => function ($email, $args, $context, $info) {
            global $wpdb;
            $table_name = MAIL_INBOX_EMAILS_ADDITIONAL_INFO_TABLE;
            $associated_user = $wpdb->get_row($wpdb->prepare("SELECT user_id FROM $table_name WHERE email_id = %d", $email->id));

            if (!class_exists('WooCommerce')) {
                return [];
            }

            if ($associated_user->user_id && get_userdata($associated_user->user_id)->data) {
                $userEmail = get_userdata($associated_user->user_id)->data->user_email;
            } else {
                $userEmail = json_decode($email->sender)->emailAddress->address;
                if (empty($userEmail)) {
                    return []; // No email found in the Email record
                }
            }

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
                    'link' => $wc_order->get_view_order_url(),
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

    // Register Email type with additionalInfo field
    register_graphql_object_type('Email', [
        'description' => __('An email entry', 'your-text-domain'),
        'fields' => [
            'id' => ['type' => 'ID', 'description' => __('The ID of the email', 'your-text-domain')],
            'account_id' => ['type' => 'ID', 'description' => __('The account ID associated with the email', 'your-text-domain')],
            'folder_id' => ['type' => 'ID', 'description' => __('The folder ID associated with the email', 'your-text-domain')],
            'email_id' => ['type' => 'String', 'description' => __('The unique email ID', 'your-text-domain')],
            'has_attachments' => ['type' => 'Boolean', 'description' => __('Whether the email has attachments', 'your-text-domain')],
            'subject' => ['type' => 'String', 'description' => __('The subject of the email', 'your-text-domain')],
            'body_preview' => ['type' => 'String', 'description' => __('Preview of the email body', 'your-text-domain')],
            'importance' => ['type' => 'String', 'description' => __('The importance level of the email', 'your-text-domain')],
            'parent_folder_id' => ['type' => 'String', 'description' => __('The ID of the parent folder', 'your-text-domain')],
            'conversation_id' => ['type' => 'String', 'description' => __('The conversation ID', 'your-text-domain')],
            'is_delivery_receipt_requested' => ['type' => 'Boolean', 'description' => __('If delivery receipt is requested', 'your-text-domain')],
            'is_read_receipt_requested' => ['type' => 'Boolean', 'description' => __('If read receipt is requested', 'your-text-domain')],
            'is_read' => ['type' => 'Boolean', 'description' => __('Whether the email is read', 'your-text-domain')],
            'is_draft' => ['type' => 'Boolean', 'description' => __('Whether the email is a draft', 'your-text-domain')],
            'web_link' => ['type' => 'String', 'description' => __('The web link to view the email', 'your-text-domain')],
            'body_content_type' => ['type' => 'String', 'description' => __('The content type of the email body', 'your-text-domain')],
            'body_content' => ['type' => 'String', 'description' => __('The full content of the email body', 'your-text-domain')],
            'to_recipients' => ['type' => 'String', 'description' => __('The recipients of the email', 'your-text-domain')],
            'cc_recipients' => ['type' => 'String', 'description' => __('The CC recipients of the email', 'your-text-domain')],
            'bcc_recipients' => ['type' => 'String', 'description' => __('The BCC recipients of the email', 'your-text-domain')],
            'sender' => ['type' => 'String', 'description' => __('The sender address of the email', 'your-text-domain')],
            'reply_to' => ['type' => 'String', 'description' => __('The reply-to addresses of the email', 'your-text-domain')],
            'flag_status' => ['type' => 'String', 'description' => __('The flag status of the email', 'your-text-domain')],
            'created_datetime' => ['type' => 'String', 'description' => __('The datetime when the email was created', 'your-text-domain')],
            'last_modified_datetime' => ['type' => 'String', 'description' => __('The datetime when the email was last modified', 'your-text-domain')],
            'received_datetime' => ['type' => 'String', 'description' => __('The datetime when the email was received', 'your-text-domain')],
            'sent_datetime' => ['type' => 'String', 'description' => __('The datetime when the email was sent', 'your-text-domain')],
            'created_at' => ['type' => 'String', 'description' => __('The creation time of the record', 'your-text-domain')],
            'updated_at' => ['type' => 'String', 'description' => __('The last update time of the record', 'your-text-domain')],
            'additionalInfo' => [
                'type' => 'EmailAdditionalInfo',
                'description' => __('Additional info associated with the email', 'your-text-domain'),
                'resolve' => function ($email, $args, $context, $info) {
                    global $wpdb;
                    $query = "
                        SELECT ai.*, t.name AS tag_name
                        FROM " . MAIL_INBOX_EMAILS_ADDITIONAL_INFO_TABLE . " AS ai
                        LEFT JOIN " . MAIL_INBOX_TAGS_TABLE . " AS t ON ai.tag_id = t.id
                        WHERE ai.email_id = %d
                    ";
                    $emailId = $email->id;

                    $prepared_query = $wpdb->prepare($query, intval($email->id));
                    $additional_info = $wpdb->get_row($prepared_query);

                    $ticketTitle = '';
                    if (get_post_type($additional_info->ticket_id) === 'ticket') {
                        $ticketTitle = get_the_title($additional_info->ticket_id);
                    }

                    $orderTitle = '';
                    if (class_exists('WooCommerce')) {
                        if (wc_get_order($additional_info->order_id)) {
                            $order = wc_get_order($additional_info->order_id);
                            if ($order) {
                                $orderTitle = $order->get_order_number();
                            }
                        }
                    }

                    $defaultTicketAssignee = null;
                    if (!$additional_info->agent_id) {
                        // Query the associated user ID from the additional info table
                        $table_name = MAIL_INBOX_EMAILS_ADDITIONAL_INFO_TABLE;
                        $associated_user = $wpdb->get_row($wpdb->prepare("SELECT user_id FROM $table_name WHERE email_id = %d", $email->id));

                        // If no user ID is associated, return an empty array
                        if (empty($associated_user->user_id)) {
                            $email = json_decode($email->sender)->emailAddress->address;
                            $user = get_user_by('email', $email);
                            if (isset($user->data)) {
                                $associatedUserId = $user->data->ID;

                                associateEmailAdditionalInfo($emailId, 'user_id', $associatedUserId);
                            }
                        } else {
                            $associatedUserId = $associated_user->user_id;
                        }

                        // Query tickets related to the user in Awesome Support
                        $tickets_query = $wpdb->prepare("
                            SELECT p.ID as id, p.post_title as title, p.post_date as created_at, p.post_modified as updated_at,
                                (SELECT meta_value FROM {$wpdb->postmeta} WHERE post_id = p.ID AND meta_key = '_status') AS status,
                                (SELECT meta_value FROM {$wpdb->postmeta} WHERE post_id = p.ID AND meta_key = '_priority') AS priority
                            FROM {$wpdb->posts} AS p
                            WHERE p.post_type = 'ticket' AND p.post_author = %d
                            ORDER BY p.post_date DESC
                            LIMIT 1
                        ", $associatedUserId);

                        $ticket = $wpdb->get_row($tickets_query);
                        if ($ticket) {
                            $defaultTicketAssignee = get_post_meta($ticket->id, '_wpas_assignee', true);
                            associateEmailAdditionalInfo($emailId, 'agent_id', $defaultTicketAssignee);
                        }
                    }

                    $tag_log = '';
                    $logs_table = MAIL_INBOX_LOGS_TABLE;

                    if($additional_info->tag_id && $additional_info->tag_name && $additional_info->email_id){
                        $tempAssignee = $wpdb->get_row($wpdb->prepare("SELECT user_id FROM $logs_table WHERE email_id = %d AND reference = %s ORDER BY id DESC", $additional_info->email_id, 'tag'));
                        
                        $assignee = 'System';

                        if (!empty($tempAssignee->user_id)) {
                            $user_info = get_user_by('id', $tempAssignee->user_id);
                            if ($user_info) {
                                $assignee = $user_info->display_name;
                            }
                        }

                        $tag_log = $additional_info->tag_name.' assigned by '.$assignee;
                    }

                    return [
                        'id' => $additional_info->id ?? null,
                        'email_id' => $additional_info->email_id ?? null,
                        'tag_id' => $additional_info->tag_id ?? null,
                        'tag_name' => $additional_info->tag_name ?? null,
                        'tag_log' => $tag_log ?? null,
                        'agent_id' => $additional_info->agent_id ?? $defaultTicketAssignee,
                        'user_id' => $additional_info->user_id ?? null,
                        'ticket_id' => $additional_info->ticket_id ?? null,
                        'ticket_title' => $ticketTitle ?? null,
                        'order_id' => $additional_info->order_id ?? null,
                        'order_title' => $orderTitle ?? null,
                        'created_at' => $additional_info->created_at ?? null,
                        'updated_at' => $additional_info->updated_at ?? null,
                    ];
                }
            ],
            'categories' => [
                'type' => ['list_of' => 'EmailListCategory'],
                'description' => __('Categories associated with the email', 'your-text-domain'),
                'resolve' => function ($email, $args, $context, $info) {
                    global $wpdb;
                    $query = "
                        SELECT c.id, c.name
                        FROM " . MAIL_INBOX_EMAILS_ADDITIONAL_MULTIPLE_INFO_TABLE . " AS em
                        LEFT JOIN " . MAIL_INBOX_CATEGORIES_TABLE . " AS c ON em.category_id = c.id
                        WHERE em.email_id = %d
                    ";
                    
                    $prepared_query = $wpdb->prepare($query, intval($email->id));
                    $categories = $wpdb->get_results($prepared_query);
                    
                    $logs_table = MAIL_INBOX_LOGS_TABLE;


                    foreach ($categories as &$category) {
                        $tempAssignee = $wpdb->get_row($wpdb->prepare("SELECT user_id FROM $logs_table WHERE email_id = %d AND reference = %s ORDER BY id DESC", $email->id, 'category'));
                        
                        $assignee = 'System';

                        if (!empty($tempAssignee->user_id)) {
                            $user_info = get_user_by('id', $tempAssignee->user_id);
                            if ($user_info) {
                                $assignee = $user_info->display_name;
                            }
                        }
    

                        $category->log = $category->name. ' is assigned by '.$assignee;
                    }

                    return $categories;
                },
            ],
            'attachments' => [
                'type' => ['list_of' => 'Attachment'],
                'description' => __('Attachments associated with the email', 'your-text-domain'),
                'resolve' => function ($email, $args, $context, $info) {
                    global $wpdb;
                    $query = "
                        SELECT *
                        FROM " . MAIL_INBOX_EMAILS_ATTACHMENTS_TABLE . "
                        WHERE email_id = %d
                    ";
                    $prepared_query = $wpdb->prepare($query, intval($email->id));
                    return $wpdb->get_results($prepared_query);
                },
            ],
            'orderLink' => [
                'type' => 'String',
                'description' => __('Order link of email', 'your-text-domain'),
                'resolve' => function ($email, $args, $context, $info) {
                    global $wpdb;
                    $query = "
                        SELECT order_id
                        FROM " . MAIL_INBOX_EMAILS_ADDITIONAL_INFO_TABLE . "
                        WHERE email_id = %d
                    ";
                    $prepared_query = $wpdb->prepare($query, intval($email->id));
                    $orderId = $wpdb->get_row($prepared_query)->order_id;
                    if (!$orderId) {
                        return '';
                    }

                    return admin_url('post.php?post=' . $orderId . '&action=edit');
                }
            ],
            'ticketLink' => [
                'type' => 'String',
                'description' => __('Attached ticket link', 'your-text-domain'),
                'resolve' => function ($email, $args, $context, $info) {
                    global $wpdb;
                    $query = "
                        SELECT ticket_id
                        FROM " . MAIL_INBOX_EMAILS_ADDITIONAL_INFO_TABLE . "
                        WHERE email_id = %d
                    ";
                    $prepared_query = $wpdb->prepare($query, intval($email->id));
                    $ticketId = $wpdb->get_row($prepared_query)->ticket_id;
                    if (!$ticketId) {
                        return '';
                    }

                    return admin_url('post.php?post=' . $ticketId . '&action=edit');
                }
            ],
            'logs' => [
                'type' => ['list_of' => 'Logs'],
                'description' => __('Logs associated with the email', 'your-text-domain'),
                'resolve' => function ($email, $args, $context, $info) {
                    global $wpdb;
                    $query = "SELECT * FROM " . MAIL_INBOX_LOGS_TABLE . " WHERE email_id = %d ORDER BY id DESC";
                    $prepared_query = $wpdb->prepare($query, intval($email->id));
                    return $wpdb->get_results($prepared_query);
                },
            ],
        ],
    ]);

    // Register the query to get emails by folder_id with pagination
    register_graphql_field('RootQuery', 'getEmailsByFolderId', [
        'type' => ['list_of' => 'Email'],
        'args' => [
            'folder_id' => [
                'type' => 'ID',
                'description' => __('The folder ID to filter by', 'your-text-domain'),
            ],
            'limit' => [
                'type' => 'Int',
                'description' => __('The number of emails to return', 'your-text-domain'),
                'defaultValue' => 10,
            ],
            'offset' => [
                'type' => 'Int',
                'description' => __('The number of emails to skip', 'your-text-domain'),
                'defaultValue' => 0,
            ],
            'filters' => [
                'type' => 'EmailFiltersInput',
                'description' => __('Filters for date range, keyword, etc.', 'your-text-domain'),
            ],
        ],
        'resolve' => function ($source, $args, $context, $info) {
            global $wpdb;

            if (empty($args['folder_id'])) {
                return null; // No folder_id provided
            }

            $limit = isset($args['limit']) ? absint($args['limit']) : 10;
            $offset = isset($args['offset']) ? absint($args['offset']) : 0;
            $folder_id = intval($args['folder_id']);

            // Start constructing the query with the main table
            $query = "SELECT e.* FROM " . MAIL_INBOX_EMAILS_TABLE . " AS e";

            // Initialize WHERE conditions and parameters
            $conditions = [];
            $query_params = [];

            // Initial WHERE clause for folder_id filter
            $conditions[] = "e.folder_id = %d";
            $query_params[] = $folder_id;

            // Apply filters if provided
            if (!empty($args['filters'])) {
                $filters = $args['filters'];

                // Date range filter
                if (!empty($filters['startDate'][0]) && !empty($filters['endDate'][0])) {
                    $startOfDayUTC = gmdate('Y-m-d H:i:s', strtotime($filters['startDate'][0] . ' 00:00:00') - (5.5 * 3600));
                    $endOfDayUTC = gmdate('Y-m-d H:i:s', strtotime($filters['endDate'][0] . ' 23:59:59') - (5.5 * 3600));

                    $conditions[] = "e.received_datetime BETWEEN %s AND %s";
                    $query_params[] = $startOfDayUTC;
                    $query_params[] = $endOfDayUTC;
                } elseif (!empty($filters['startDate'][0])) {
                    $startOfDayUTC = gmdate('Y-m-d H:i:s', strtotime($filters['startDate'][0] . ' 00:00:00') - (5.5 * 3600));
                    $endOfDayUTC = gmdate('Y-m-d H:i:s', strtotime($filters['startDate'][0] . ' 23:59:59') - (5.5 * 3600));

                    $conditions[] = "e.received_datetime BETWEEN %s AND %s";
                    $query_params[] = $startOfDayUTC;
                    $query_params[] = $endOfDayUTC;
                } elseif (!empty($filters['endDate'][0])) {
                    $startOfDayUTC = gmdate('Y-m-d H:i:s', strtotime($filters['endDate'][0] . ' 00:00:00') - (5.5 * 3600));
                    $endOfDayUTC = gmdate('Y-m-d H:i:s', strtotime($filters['endDate'][0] . ' 23:59:59') - (5.5 * 3600));

                    $conditions[] = "e.received_datetime BETWEEN %s AND %s";
                    $query_params[] = $startOfDayUTC;
                    $query_params[] = $endOfDayUTC;
                }

                // Search by From filter
                if (!empty($filters['searchFrom'])) {
                    $searchFrom = '%' . $wpdb->esc_like($filters['searchFrom']) . '%';
                    $conditions[] = "(JSON_UNQUOTE(JSON_EXTRACT(e.sender, '$.emailAddress.name')) LIKE %s 
                                    OR JSON_UNQUOTE(JSON_EXTRACT(e.sender, '$.emailAddress.address')) LIKE %s)";
                    $query_params[] = $searchFrom;
                    $query_params[] = $searchFrom;
                }

                // Search by Subject filter
                if (!empty($filters['searchSubject'])) {
                    $searchSubject = '%' . $wpdb->esc_like(trim($args['filters']['searchSubject'])) . '%';
                    $conditions[] = "e.subject LIKE %s";
                    $query_params[] = $searchSubject;
                }

                // Keyword filter
                if (!empty($filters['keyword'])) {
                    $keyword = '%' . $wpdb->esc_like(wp_strip_all_tags(trim($filters['keyword']))) . '%';
                    $conditions[] = "e.body_content LIKE %s";
                    $query_params[] = $keyword;
                }

                // Agent ID filter
                if (!empty($filters['agentId'])) {
                    $agentId = $filters['agentId'];

                    if ($agentId > 0) {
                        $conditions[] = "EXISTS (
                            SELECT 1 FROM " . MAIL_INBOX_EMAILS_ADDITIONAL_INFO_TABLE . " ai
                            WHERE ai.email_id = e.id AND ai.agent_id = %d
                        )";
                        $query_params[] = intval($agentId);
                    } else if ($agentId === -1) {
                        // Filter for cases where agent_id is NULL or 0
                        $conditions[] = "NOT EXISTS (
                            SELECT 1 FROM " . MAIL_INBOX_EMAILS_ADDITIONAL_INFO_TABLE . " ai
                            WHERE ai.email_id = e.id AND ai.agent_id IS NOT NULL AND ai.agent_id > 0
                        )";
                    }
                }

                // Tags filter
                if (!empty($filters['tags'])) {
                    $tagFilter = $filters['tags'];
                    if ($tagFilter == 'With Tags') {
                        // Only get records with a tag
                        $conditions[] = "EXISTS (
                            SELECT 1 FROM " . MAIL_INBOX_EMAILS_ADDITIONAL_INFO_TABLE . " ai
                            WHERE ai.email_id = e.id AND ai.tag_id IS NOT NULL AND ai.tag_id > 0
                        )";
                    } else if ($tagFilter == 'Without Tags') {
                        // Only get records without a tag
                        $conditions[] = "NOT EXISTS (
                            SELECT 1 FROM " . MAIL_INBOX_EMAILS_ADDITIONAL_INFO_TABLE . " ai
                            WHERE ai.email_id = e.id AND ai.tag_id IS NOT NULL AND ai.tag_id > 0
                        )";
                    }
                }

                // Categories filter
                if (!empty($filters['categories'])) {
                    $categoryFilter = $filters['categories'];

                    if ($categoryFilter == 'With Categories') {
                        // Only get records with a category
                        $conditions[] = "EXISTS (
                            SELECT 1 FROM " . MAIL_INBOX_EMAILS_ADDITIONAL_MULTIPLE_INFO_TABLE . " em
                            WHERE em.email_id = e.id AND em.category_id IS NOT NULL AND em.category_id > 0
                        )";
                    } else if ($categoryFilter == 'Without Categories') {
                        // Only get records without a category
                        $conditions[] = "NOT EXISTS (
                            SELECT 1 FROM " . MAIL_INBOX_EMAILS_ADDITIONAL_MULTIPLE_INFO_TABLE . " em
                            WHERE em.email_id = e.id AND em.category_id IS NOT NULL AND em.category_id > 0
                        )";
                    } else if ($categoryFilter && $categoryFilter != 'null') {
                        $categoryIds = implode(',', array_map('intval', explode(',', $categoryFilter))); // Sanitize category IDs
                        $conditions[] = "EXISTS (
                            SELECT 1 FROM " . MAIL_INBOX_EMAILS_ADDITIONAL_MULTIPLE_INFO_TABLE . " em
                            WHERE em.email_id = e.id AND em.category_id IN ($categoryIds)
                        )";
                    }
                }
            }

            // Assemble the WHERE clause
            if (!empty($conditions)) {
                $query .= " WHERE " . implode(" AND ", $conditions);
            }

            // Add ORDER BY and LIMIT/OFFSET
            $query .= " ORDER BY e.id DESC LIMIT %d OFFSET %d";
            $query_params[] = $limit;
            $query_params[] = $offset;

            // Prepare and execute the query
            $prepared_query = $wpdb->prepare($query, $query_params);

            $emails = $wpdb->get_results($prepared_query);
            return $emails;
        },
    ]);
});
