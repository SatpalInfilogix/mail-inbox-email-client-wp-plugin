document.addEventListener("DOMContentLoaded", function () {
    const { createApp } = Vue;
    const { createVuetify } = Vuetify;

    const vuetify = createVuetify({
        icons: {
            iconfont: 'mdi',
        }
    });

    const app = createApp({
        data() {
            return {
                accounts: [],
                
            };
        },
        methods: {
        },
        mounted() {
            
        },
        template: `
        <v-container fluid class="pl-0" style="height: calc(100vh - 120px)">
            <div class="d-flex justify-space-between align-center">
                <div class="text-h5">Mail Inbox KPI Rules</div>
                <v-btn prepend-icon="mdi-plus" color="#5865f2" @click="connectAccount">Add new rule</v-btn>
            </div>

            <v-card class="mt-4" style="min-height: 400px">
                <v-card-text>
                    <h1 class="text-h5 my-0">0 existing rules</h1>
                </v-card-text>
            </v-card>
        </v-container>
        `,
    });

    // Use Vuetify
    app.use(vuetify);

    // Mount the app
    app.mount("#kpi-rules");
});
