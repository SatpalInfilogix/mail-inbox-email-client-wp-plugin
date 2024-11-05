<?php
function kpi_rules()
{ ?>
    <div id="kpi-rules"></div>
    <script>
        window.mailInbox = {
            siteUrl: '<?php echo get_site_url() ?>'
        }
    </script>
    <?php echo '<script type="module" src="' . MAIL_INBOX_PLUGIN_URL . 'assets/js/kpi-rules.js"></script>';
}
?>