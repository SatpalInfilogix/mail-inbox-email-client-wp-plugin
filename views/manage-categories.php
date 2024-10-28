<?php
function manage_categories()
{ ?>
    <div id="manage-categories"></div>
    <script>
        window.mailInbox = {
            siteUrl: '<?php echo get_site_url() ?>'
        }
    </script>
    <?php echo '<script type="module" src="' . MAIL_INBOX_PLUGIN_URL . 'assets/js/manage-categories.js"></script>';
}
?>