<?php
add_action('graphql_register_types', 'register_email_attachment_type');

function register_email_attachment_type()
{
    register_graphql_object_type('EmailAttachment', [
        'description' => __('Email Attachment', 'your-textdomain'),
        'fields'      => [
            'id' => [
                'type'        => 'ID',
                'description' => __('The unique identifier of the attachment', 'your-textdomain'),
            ],
            'emailId' => [
                'type'        => 'Int',
                'description' => __('The ID of the email this attachment belongs to', 'your-textdomain'),
            ],
            'contentId' => [
                'type'        => 'String',
                'description' => __('The content ID of the attachment', 'your-textdomain'),
            ],
            'isInline' => [
                'type'        => 'Boolean',
                'description' => __('Whether the attachment is inline', 'your-textdomain'),
            ],
            'contentType' => [
                'type'        => 'String',
                'description' => __('The content type of the attachment', 'your-textdomain'),
            ],
            'contentBytes' => [
                'type'        => 'String',
                'description' => __('The base64 encoded content of the attachment', 'your-textdomain'),
            ],
        ],
    ]);
}

add_action('graphql_register_types', 'register_get_email_attachments_field');

function register_get_email_attachments_field()
{
    register_graphql_field('RootQuery', 'getEmailAttachments', [
        'type'        => ['list_of' => 'EmailAttachment'],
        'description' => __('Get attachments for a specific email', 'your-textdomain'),
        'args'        => [
            'emailId' => [
                'type'        => 'Int',
                'description' => __('The ID of the email', 'your-textdomain'),
                'required'    => true,
            ],
        ],
        'resolve'     => function ($root, $args, $context, $info) {
            global $wpdb;

            $email_id = intval($args['emailId']);

            // Fetch attachments for the given email ID
            $attachments = $wpdb->get_results(
                $wpdb->prepare(
                    "SELECT id, email_id, content_id, is_inline, content_type, content_bytes
                    FROM " . MAIL_INBOX_EMAILS_ATTACHMENTS_TABLE . "
                    WHERE email_id = %d",
                    $email_id
                ),
                ARRAY_A
            );

            // Map the results to match the GraphQL fields
            return array_map(function ($attachment) {
                return [
                    'id'           => $attachment['id'],
                    'emailId'      => intval($attachment['email_id']),
                    'contentId'    => $attachment['content_id'],
                    'isInline'     => (bool)$attachment['is_inline'],
                    'contentType'  => $attachment['content_type'],
                    'contentBytes' => $attachment['content_bytes'],
                ];
            }, $attachments);
        },
    ]);
}
