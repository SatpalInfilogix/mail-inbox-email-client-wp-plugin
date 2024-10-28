document.addEventListener("DOMContentLoaded", function () {
    const { createApp } = Vue;
    const { createVuetify } = Vuetify;

    const vuetify = createVuetify({
      icons: {
        iconfont: 'mdi',
      }
    });

    const app = createApp({
      methods: {
        connectMailAccount(){
          let authorizationUrl = jQuery('[data-authorization-url]').data('authorization-url');
          window.location = authorizationUrl;
        }
      },
      template: `
        <v-app class="mis-configuration-container">
          <v-main>
            <v-container class="fill-height" fluid>
              <v-row justify="center" align="center">
                <v-col cols="12" sm="8" md="6">
                  <v-card elevation="12" class="pa-5">
                    <v-card-title class="headline text-center">
                      <v-icon size="large" color="primary">mdi-alert-circle</v-icon>
                    </v-card-title>
                    <v-card-text class="text-center">
                      <p class="mb-4 mt-0 text-h5">No Account Connected!</p>
                      <p>Please configure your account to access emails.</p>
                    </v-card-text>
                     <v-row justify="center pb-4">
                        <v-btn color="primary" @click="connectMailAccount">
                            Connect Now
                        </v-btn>
                    </v-row>
                  </v-card>
                </v-col>
              </v-row>
            </v-container>
          </v-main>
        </v-app>
      `
    });

    // Use Vuetify
    app.use(vuetify);

    // Mount the app
    app.mount("#no-account-connected");
  });