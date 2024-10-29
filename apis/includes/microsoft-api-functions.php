<?php
function getMicrosoftAccessToken($accountId)
{
    global $wpdb;
    $query = $wpdb->prepare("SELECT * FROM " . MAIL_INBOX_ACCOUNTS_TABLE . " WHERE id = %d", $accountId);

    // Execute the query and fetch the result
    $result = $wpdb->get_row($query);
    $accessToken = mail_inbox_decrypt($result->access_token);
    return $accessToken;
}

function getGraphMailFolders($accountId)
{
    $accessToken = getMicrosoftAccessToken($accountId);
    $url = GRAPH_API_BASE_ENDPOINT . 'mailFolders?$top=999&$includeHiddenFolders=true';
    
    $folders = [];

    // Fetch all folders including their nested child folders recursively
    $folders = fetchFoldersRecursively($url, $accessToken, $folders);

    return $folders;
}

function fetchFoldersRecursively($url, $accessToken, &$folders)
{
    do {
        $response = wp_remote_get($url, [
            'headers' => [
                'Authorization' => 'Bearer ' . $accessToken,
                'Accept' => 'application/json',
            ],
        ]);

        if (is_wp_error($response)) {
            return $response->get_error_message();
        }

        $body = json_decode($response['body'], true);

        if (isset($body['error']['code'])) {
            if ($body['error']['code'] === 'InvalidAuthenticationToken') {
                return $body;
            }
        }

        // Merge the folders from the current response
        if (isset($body['value'])) {
            foreach ($body['value'] as $folder) {
                $folders[] = $folder;

                // Check if the folder has child folders and recursively fetch them
                if (isset($folder['childFolderCount']) && $folder['childFolderCount'] > 0) {
                    $childFolderUrl = GRAPH_API_BASE_ENDPOINT . 'mailFolders/' . $folder['id'] . '/childFolders?$top=999&$includeHiddenFolders=true';
                    fetchFoldersRecursively($childFolderUrl, $accessToken, $folders);
                }
            }
        }

        // Check for nextLink to continue pagination
        $url = $body['@odata.nextLink'] ?? null;

    } while ($url);

    return $folders;
}

function countEmailsByFolderId($accessToken, $accountId, $folderId)
{
    // Prepare the API endpoint for counting messages in the specified folder
    $countUrl = GRAPH_API_BASE_ENDPOINT . 'mailFolders/' . $folderId . '/messages?$count=true&$top=1';

    // Make the request to the Microsoft Graph API
    $countResponse = wp_remote_get($countUrl, [
        'headers' => [
            'Authorization' => 'Bearer ' . $accessToken,
            'Accept' => 'application/json',
            'ConsistencyLevel' => 'eventual', // Required for using the $count parameter
        ],
    ]);

    // Decode the response body
    $countData = json_decode(wp_remote_retrieve_body($countResponse), true);

    // Check for any errors in the response
    if (isset($countData['error']['code'])) {
        return $countData;
    }

    // Retrieve the message count
    $messageCount = isset($countData['@odata.count']) ? $countData['@odata.count'] : 0;

    return $messageCount;
}


function getNewEmailsCount($accountId, $folderId = '')
{
    // Get the access token for the specified account
    $accessToken = getMicrosoftAccessToken($accountId);
    global $wpdb;

    $newEmailsCount = 0;
    $foldersCount = [];

    if ($folderId) {
        $messageCount = countEmailsByFolderId($accessToken, $accountId, $folderId);

        if (isset($messageCount['error']['code'])) {
            return $messageCount;
        }
        
        $folder = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT id, folder_id, display_name FROM ".MAIL_INBOX_FOLDERS_TABLE." WHERE account_id = %d AND folder_id = %s",
                $accountId,
                $folderId
            )
        );

        // Get saved email count for the folder
        $query = $wpdb->prepare(
            "SELECT COUNT(*) as email_count FROM ".MAIL_INBOX_EMAILS_TABLE." WHERE account_id = %d AND parent_folder_id = %s",
            $accountId,
            $folderId
        );
        $savedEmailsCountForFolder = $wpdb->get_var($query);

        // Store the count in the foldersCount array
        $newEmailsForFolder = $messageCount - $savedEmailsCountForFolder;

        if($newEmailsForFolder > 0){
            $foldersCount[] = [
                'folder_name' => $folder->display_name,
                'local_folder_id' => $folder->id,
                'folder_id' => $folder->folder_id,
                'count' => $newEmailsForFolder
            ];
        }

        // Add the new emails for specified folder
        $newEmailsCount += $newEmailsForFolder;
    } else {
        $folders = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT id, folder_id, display_name FROM ".MAIL_INBOX_FOLDERS_TABLE." WHERE account_id = %d",
                $accountId
            )
        );
    
        // Sync emails for each folder when no specific folder ID is provided
        foreach ($folders as $folder) {
            $folderId = $folder->folder_id;

            // Get saved email count for the folder
            $query = $wpdb->prepare(
                "SELECT COUNT(*) as email_count FROM ".MAIL_INBOX_EMAILS_TABLE." WHERE account_id = %d AND parent_folder_id = %s",
                $accountId,
                $folderId
            );
            $savedEmailsCountForFolder = $wpdb->get_var($query);

            // Sync new emails for the folder
            $messageCount = countEmailsByFolderId($accessToken, $accountId, $folderId);
            
            if (isset($messageCount['error']['code'])) {
                return $messageCount;
            }

            // Calculate new emails for the folder
            $newEmailsForFolder = $messageCount - $savedEmailsCountForFolder;

            if($newEmailsForFolder > 0){
                $foldersCount[] = [
                    'folder_name' => $folder->display_name,
                    'local_folder_id' => $folder->id,
                    'folder_id' => $folder->folder_id,
                    'count' => $newEmailsForFolder
                ];
            }

            // Add the new emails for each folder to the total count
            $newEmailsCount += $newEmailsForFolder;
        }
    }

    // Return an object with total new emails and folder-wise breakdown
    return [
        'count' => $newEmailsCount,
        'folders' => $foldersCount
    ];
}


function getNewEmails($accountId, $folder_id = ''){
    $accessToken = getMicrosoftAccessToken($accountId);

    global $wpdb;
    $query = $wpdb->prepare(
        "SELECT COUNT(*) as email_count FROM ".MAIL_INBOX_EMAILS_TABLE." WHERE account_id = %d",
        $accountId
    );
    
    $savedEmailsCount = $wpdb->get_var($query);

    // Set the base email endpoint
    $emailEndpoint = 'messages?$top=10&$orderby=receivedDateTime%20asc';

    // If a folder ID is provided, adjust the endpoint to fetch emails from that specific folder
    if (!empty($folder_id)) {
        $query = $wpdb->prepare(
            "SELECT COUNT(*) as email_count FROM ".MAIL_INBOX_EMAILS_TABLE." WHERE parent_folder_id = %s",
            $folder_id
        );

        $savedEmailsCount = $wpdb->get_var($query);

        $emailEndpoint = 'mailFolders/' . $folder_id . '/messages?$top=10&$orderby=receivedDateTime%20asc';
    }

    // If there are saved emails, use the $skip parameter to fetch new emails
    if (!empty($savedEmailsCount)) {
        $emailEndpoint .= '&$skip=' . $savedEmailsCount;
    }

    $response = wp_remote_get(GRAPH_API_BASE_ENDPOINT.$emailEndpoint, [
        'headers' => [
            'Authorization' => 'Bearer ' . $accessToken,
            'Accept' => 'application/json',
        ],
    ]);

    $emails = json_decode($response['body'], true);
    
    if (isset($emails['error']['code'])) {
        if ($emails['error']['code'] === 'InvalidAuthenticationToken') {
            return $emails;
        }
    }
 
    $emails_with_attachments = [];

    foreach ($emails['value'] as $email) {
        if ($email['hasAttachments']) {
            $attachments_response = wp_remote_get(GRAPH_API_BASE_ENDPOINT . "messages/{$email['id']}/attachments", [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                    'Accept' => 'application/json',
                ],
            ]);

            $attachments = json_decode($attachments_response['body'], true);
            $email['attachments'] = $attachments['value'];

            // Ensure the email-attachments directory exists once
            $baseDir = WP_CONTENT_DIR . '/uploads/email-attachments/';
            if (!is_dir($baseDir)) {
                mkdir($baseDir, 0777, true);
            }

            // Create a specific directory for each email
            $emailDir = $baseDir . uniqid();
            if (!is_dir($emailDir)) {
                mkdir($emailDir, 0777, true);
            }

            $path = $emailDir . '/';

            // Loop through attachments, save and handle inline references
            foreach ($email['attachments'] as $attachment) {
                $attachmentName = $path . $attachment['name'];
                $attachmentContent = base64_decode($attachment['contentBytes']);

                // Check if writing to file is successful
                if (file_put_contents($attachmentName, $attachmentContent) === false) {
                    error_log("Failed to save attachment {$attachment['name']} for email {$email['id']}");
                    continue;
                }

                // Replace inline content ID with base64 data URI
                if (isset($attachment['contentId']) && strpos($email['body']['content'], "cid:" . $attachment['contentId']) !== false) {
                    $base64Data = 'data:' . $attachment['contentType'] . ';base64,' . $attachment['contentBytes'];
                    $email['body']['content'] = str_replace("cid:" . $attachment['contentId'], $base64Data, $email['body']['content']);
                }
            }
        }

        $emails_with_attachments[] = $email;
    }

    return $emails_with_attachments;
}