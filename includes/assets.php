<?php

add_action('admin_enqueue_scripts', 'mail_inbox_enqueue_scripts');
function mail_inbox_enqueue_scripts($hook) {
    // Ensure we only load the scripts on the Mail Inbox admin page
    if ($hook !== 'toplevel_page_mail-inbox' && $hook !== 'mail-inbox_page_connected-accounts' && $hook !== 'mail-inbox_page_manage-categories' && $hook !== 'mail-inbox_page_manage-tags') {
        return;
    }

    // Plugin directory URL
    /* wp_enqueue_script(
        'vue-js',
        MAIL_INBOX_PLUGIN_URL . 'assets/js/libs/vue.global.prod.js',
        [],
        '3.2.47',
        true
    ); */

    wp_enqueue_script(
        'vue-js',
        MAIL_INBOX_PLUGIN_URL . 'assets/js/libs/vue.global.js',
        [],
        '3.2.47',
        true
    );

    wp_enqueue_script(
        'vuetify-js',
        MAIL_INBOX_PLUGIN_URL . 'assets/js/libs/vuetify.min.js',
        ['vue-js'],
        '3.1.15',
        true
    );

    wp_enqueue_style(
        'vuetify-css',
        MAIL_INBOX_PLUGIN_URL . 'assets/css/libs/vuetify.min.css',
        [],
        '3.1.15'
    );

    wp_enqueue_style(
        'mdi-icons',
        MAIL_INBOX_PLUGIN_URL . 'assets/css/libs/materialdesignicons.min.css',
        [],
        '6.5.95'
    );

    wp_enqueue_style(
        'mail-inbox-css',
        MAIL_INBOX_PLUGIN_URL . 'assets/css/style.css',
        [],
        '3.1.15'
    );

      // Enqueue Moment.js (dependency for vue2-daterange-picker)
      wp_enqueue_script('moment-js', 'https://cdn.jsdelivr.net/npm/moment@2.29.1/moment.min.js', [], null, true);
      // Enqueue vue2-daterange-picker
      wp_enqueue_script('vue-daterange-picker', 'https://unpkg.com/@vuepic/vue-datepicker@latest', [], null, true);
      // Enqueue vue2-daterange-picker CSS
      wp_enqueue_style('vue-daterange-picker-css', 'https://unpkg.com/@vuepic/vue-datepicker@latest/dist/main.css', [], null);
  

    wp_localize_script( 'custom-ajax-script', 'ajax_object', array( 'ajax_url' => admin_url( 'admin-ajax.php' ) ) );
}
