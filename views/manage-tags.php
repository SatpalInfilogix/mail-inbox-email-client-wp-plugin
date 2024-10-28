<?php
function manage_tags()
{ ?>
    <div id="manage-tags"></div>
    <script>
        window.mailInbox = {
            siteUrl: '<?php echo get_site_url() ?>'
        }
    </script>
    <?php echo '<script type="module" src="' . MAIL_INBOX_PLUGIN_URL . 'assets/js/manage-tags.js"></script>';
}
?>