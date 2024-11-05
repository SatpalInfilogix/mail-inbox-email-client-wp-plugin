<?php
function kpi_rules()
{ ?>
    <div id="connected-accounts"></div>
    <script>
        window.mailInbox = {
            siteUrl: '<?php echo get_site_url() ?>'
        }
    </script>
    <?php echo '<script type="module" src="' . MAIL_INBOX_PLUGIN_URL . 'assets/js/connected-accounts.js"></script>';
}
?>