<?php
function updateOrCreateEmailFolder($account_id, $folder)
{
    global $wpdb;
   
    $folder_id = $folder['id'];
    $local_folder_parent_id = null;

    // Check if the folder exists in the table
    $existing_folder = $wpdb->get_row(
        $wpdb->prepare("SELECT * FROM " . MAIL_INBOX_FOLDERS_TABLE . " WHERE folder_id = %s", $folder_id)
    );

    $parent_folder = $wpdb->get_row(
        $wpdb->prepare("SELECT id FROM " . MAIL_INBOX_FOLDERS_TABLE . " WHERE folder_id = %s", $folder['parentFolderId'])
    );

    if ($parent_folder) {
        $local_folder_parent_id = $parent_folder->id;
    }

    // Prepare data for insert/update
    $data = array(
        'account_id' => $account_id,
        'folder_id' => $folder_id,
        'display_name' => $folder['displayName'],
        'parent_folder_id' => $folder['parentFolderId'],
        'local_folder_parent_id' => $local_folder_parent_id,
        'child_folder_count' => $folder['childFolderCount'],
        'unread_item_count' => $folder['unreadItemCount'],
        'total_item_count' => $folder['totalItemCount'],
        'size_in_bytes' => $folder['sizeInBytes'],
        'is_hidden' => isset($folder['isHidden']) ? $folder['isHidden'] : ''
    );

    // If folder exists, update it; otherwise, insert a new row
    if ($existing_folder) {
        // Update existing folder
        $result = $wpdb->update(
            MAIL_INBOX_FOLDERS_TABLE,
            $data,
            array('folder_id' => $folder_id)  // Correct key based on SELECT query
        );

        // Error handling
        if ($result === false) {
            error_log("Error updating folder: " . $wpdb->last_error);
        }
    } else {
        // Insert new folder
        $result = $wpdb->insert(
            MAIL_INBOX_FOLDERS_TABLE,
            $data
        );

        // Error handling
        if ($result === false) {
            error_log("Error inserting folder: " . $wpdb->last_error);
        }
    }
}

function is_email_synced($internetMessageId, $receivedDateTime) {
    global $wpdb;

    $table_name = MAIL_INBOX_EMAILS_TABLE;
    $exists = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM $table_name WHERE internet_message_id = %s AND received_datetime = %s",
        $internetMessageId,
        $receivedDateTime
    ));

    return $exists > 0;
}

function updateSavedEmail($email){
    global $wpdb;
    
    $parentFolderId = $email['parentFolderId'];
    $savedFolder = $wpdb->get_row(
        $wpdb->prepare("SELECT id FROM " . MAIL_INBOX_FOLDERS_TABLE . " WHERE folder_id = %s", $parentFolderId)
    );

    $data = array(
        'folder_id' => $savedFolder ? $savedFolder->id : null,
        'categories' => json_encode($email['categories']),
        'has_attachments' => isset($email['hasAttachments']) ? $email['hasAttachments'] : '',
        'subject' => $email['subject'],
        'importance' => $email['importance'],
        'parent_folder_id' => $email['parentFolderId'],
        'conversation_id' => $email['conversationId'],
        'is_delivery_receipt_requested' => isset($email['isDeliveryReceiptRequested']) ? $email['isDeliveryReceiptRequested'] : '',
        'is_read_receipt_requested' => isset($email['isReadReceiptRequested']) ? $email['isReadReceiptRequested'] : '',
        'is_read' => isset($email['isRead']) ? $email['isRead'] : '',
        'is_draft' => isset($email['isDraft']) ? $email['isDraft'] : '',
        'body_content_type' => $email['body']['contentType'],
        'sender' => json_encode($email['sender']),
        'from' => json_encode($email['from']),
        'to_recipients' => json_encode($email['toRecipients']),
        'cc_recipients' => json_encode($email['ccRecipients']),
        'bcc_recipients' => json_encode($email['bccRecipients']),
        'reply_to' => json_encode($email['replyTo']),
        'flag_status' => $email['flag']['flagStatus'],
        'created_datetime' => $email['createdDateTime'],
        'last_modified_datetime' => $email['lastModifiedDateTime'],
        'sent_datetime' => $email['sentDateTime'],
    );
    
    $where = array(
        'internet_message_id' => $email['internetMessageId'],
        //'received_datetime' => $email['receivedDateTime'],
    );
    
    $wpdb->update(
        MAIL_INBOX_EMAILS_TABLE,
        $data,
        $where
    );
}

function saveNewEmail($account_id, $email)
{
    global $wpdb;

    $emailId = $email['id'];
    $internetMessageId = $email['internetMessageId'];
    $receivedDateTime = $email['receivedDateTime'];

    if (!is_email_synced($internetMessageId, $receivedDateTime)) {
        try {
            $email_id = $email['id'];
            $parent_folder_id = $email['parentFolderId'];

            $savedFolder = $wpdb->get_row(
                $wpdb->prepare("SELECT id FROM " . MAIL_INBOX_FOLDERS_TABLE . " WHERE folder_id = %s", $parent_folder_id)
            );

            // Prepare data for insert/update
            $data = array(
                'account_id' => $account_id,
                'folder_id' => $savedFolder ? $savedFolder->id : null,
                'email_id' => $email_id,
                'categories' => json_encode($email['categories']),
                'has_attachments' => isset($email['hasAttachments']) ? $email['hasAttachments'] : '',
                'subject' => $email['subject'],
                'body_preview' => $email['bodyPreview'],
                'importance' => $email['importance'],
                'parent_folder_id' => $email['parentFolderId'],
                'conversation_id' => $email['conversationId'],
                'is_delivery_receipt_requested' => isset($email['isDeliveryReceiptRequested']) ? $email['isDeliveryReceiptRequested'] : '',
                'is_read_receipt_requested' => isset($email['isReadReceiptRequested']) ? $email['isReadReceiptRequested'] : '',
                'is_read' => isset($email['isRead']) ? $email['isRead'] : '',
                'is_draft' => isset($email['isDraft']) ? $email['isDraft'] : '',
                'web_link' => $email['webLink'],
                'internet_message_id' => $email['internetMessageId'],
                'body_content_type' => $email['body']['contentType'],
                'body_content' => $email['body']['content'],
                'sender' => json_encode($email['sender']),
                'from' => json_encode($email['from']),
                'to_recipients' => json_encode($email['toRecipients']),
                'cc_recipients' => json_encode($email['ccRecipients']),
                'bcc_recipients' => json_encode($email['bccRecipients']),
                'reply_to' => json_encode($email['replyTo']),
                'flag_status' => $email['flag']['flagStatus'],
                'created_datetime' => $email['createdDateTime'],
                'last_modified_datetime' => $email['lastModifiedDateTime'],
                'received_datetime' => $email['receivedDateTime'],
                'sent_datetime' => $email['sentDateTime'],
            );

            $result = $wpdb->insert(
                MAIL_INBOX_EMAILS_TABLE,
                $data
            );
                
            // Error handling
            if ($result === false) {
                throw new Exception("Error inserting email: " . $wpdb->last_error);
            }

                    
            if(isset($email['attachments'])){
                $attachments = $email['attachments'];
                $saved_email_id = $wpdb->insert_id;

                foreach($attachments as $attachment){
                    $attachment_data = [
                        'email_id'      => $saved_email_id,
                        'path'          => $attachment['saved_path'],
                        'name'          => $attachment['name'],
                        'content_type'  => $attachment['contentType'],
                    ];

                    // Insert attachment data into MAIL_INBOX_EMAILS_ATTACHMENTS_TABLE
                    $attachment_result = $wpdb->insert(
                        MAIL_INBOX_EMAILS_ATTACHMENTS_TABLE,
                        $attachment_data
                    );

                    // Error handling for attachments insertion
                    if ($attachment_result === false) {
                        mail_inbox_error_log("Failed to insert attachment for email ID {$saved_email_id}: " . $wpdb->last_error);
                    }
                }
            }
        } catch (Exception $e) {
            wp_send_json_error($e->getMessage(), 500);
        }
    } else {
        mail_inbox_error_log("Email {$emailId} is already being synced!");
    }
}
