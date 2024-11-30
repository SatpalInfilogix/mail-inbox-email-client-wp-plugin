<?php
// Register the custom interval for every minute
function mail_inbox_every_minute_schedule($schedules) {
    $schedules['every_minute'] = array(
        'interval' => 600, // 60 seconds = 1 minute
        'display'  => __('Every Ten Minutes')
    );
    return $schedules;
}
add_filter('cron_schedules', 'mail_inbox_every_minute_schedule');

// Schedule the event if it's not already scheduled
function schedule_mail_inbox_cron_event() {
    if (!wp_next_scheduled('mail_inbox_cron_job_hook')) {
        wp_schedule_event(time(), 'every_minute', 'mail_inbox_cron_job_hook');
    }
}
add_action('wp', 'schedule_mail_inbox_cron_event');

// Unschedule the event upon plugin deactivation
function remove_mail_inbox_cron_job() {
    $timestamp = wp_next_scheduled('mail_inbox_cron_job_hook');
    if ($timestamp) {
        wp_unschedule_event($timestamp, 'mail_inbox_cron_job_hook');
    }
}

// Define the cron job's functionality
function mail_inbox_cron_job_function() {
    die();
    
    // Log the start of the cron job
    mail_inbox_log('Mail Inbox cron job executed every minute');

    global $wpdb;
    // Get connected accounts
    $query = "SELECT * FROM " . MAIL_INBOX_ACCOUNTS_TABLE;
    $connected_accounts = $wpdb->get_results($query);

    foreach($connected_accounts as $connected_account) {
        $accountId = $connected_account->id;

        // Start recursive fetch for each folder
        fetchEmailsRecursively($accountId);
    }
}

// Recursive function to fetch emails
function fetchEmailsRecursively($accountId) {
    
    // Check for new emails
    $newEmails = getNewEmailsCount($accountId, '');

    if(isset($newEmails['error']['code'])) {
        mail_inbox_error_log(json_encode($newEmails['error']));
        return; // Exit if there is an error
    }

    // Sync emails for each folder
    foreach($newEmails['folders'] as $folder) {
        if($folder['count'] > 0) {
            $folderId = $folder['folder_id'];
            $newFetchedEmails = getNewEmails($accountId, $folderId);

            if (isset($newFetchedEmails['error']['code'])) {
                mail_inbox_error_log(json_encode($newFetchedEmails['error']));
                return; // Exit if there is an error
            }

            // Process and store the fetched emails
            array_walk($newFetchedEmails, function ($email) use ($accountId) {
                saveNewEmail($accountId, $email);
            });

            mail_inbox_log(json_encode([
                'message' => count($newFetchedEmails).' emails synced successfully',
                'count' => count($newFetchedEmails)
            ]));

            echo count($newFetchedEmails).' emails being fetched!';

            // Check if more emails are available in the same folder
            if (count($newFetchedEmails) > 0) {
                fetchEmailsRecursively($accountId); // Recursive call for more emails
            }
        }
    }
}

add_action('mail_inbox_cron_job_hook', 'mail_inbox_cron_job_function');
