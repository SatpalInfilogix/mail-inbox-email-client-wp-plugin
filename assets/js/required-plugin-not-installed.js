document.addEventListener("DOMContentLoaded", function () {
    const { createApp } = Vue;
    const { createVuetify } = Vuetify;

    const vuetify = createVuetify({
        icons: {
            iconfont: 'mdi',
        }
    });

    const app = createApp({
        template: `
        <v-container fluid>
            <v-card class="mx-auto" max-width="500" outlined>
                <v-card-title>Install WPGraphQL Plugin</v-card-title>
                <v-card-text>
                    <p>WPGraphQL is not installed. Please install this plugin to use this plugin.</p>
                </v-card-text>
            </v-card>
        </v-container>
      `
    });

    // Use Vuetify
    app.use(vuetify);

    // Mount the app
    app.mount("#plugin-not-installed");
});