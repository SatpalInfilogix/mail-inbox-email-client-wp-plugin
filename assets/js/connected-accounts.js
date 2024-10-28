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
                headers: [
                    { title: '#', value: 'id' },
                    { title: 'Email', value: 'email' },
                    { title: 'User name', value: 'username' },
                    { title: 'Actions', value: 'actions', sortable: false },
                ],
                loading: true,
                showDeleteModal: false,
                accountToDelete: null, // Holds the account to be deleted
            };
        },
        methods: {
            confirmDelete(accountId) {
                // Open the confirmation modal and set the account ID to be deleted
                this.accountToDelete = accountId;
                this.showDeleteModal = true;
            },
            async deleteAccount() {
                try {
                    this.loading = true;

                    const query = `
                    mutation {
                        deleteAccountById(input: {id: ${this.accountToDelete}}) {
                            success
                        }
                    }`;

                    const response = await fetch(`${window.mailInbox.siteUrl}/graphql`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            query: query
                        })
                    });

                    const apiResponse = await response.json();
                    if (apiResponse.data.deleteAccountById.success) {
                        this.fetchConnectedAccounts();
                    } else {
                        console.log("Failed to delete the account.");
                    }
                } catch (error) {
                    console.log('error',error)
                } finally {
                    this.loading = false;
                    this.showDeleteModal = false;
                }
            },
            async fetchConnectedAccounts() {
                try {
                    const query = `
                    query {
                        mailAccounts {
                            id
                            email
                            username
                        }
                    }`;

                    const response = await fetch(`${window.mailInbox.siteUrl}/graphql`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            query: query
                        })
                    });

                    const apiResponse = await response.json();
                    this.loading = false;

                    if (apiResponse.data.mailAccounts) {
                        this.accounts = apiResponse.data.mailAccounts;
                    }
                } catch (error) {
                    this.loading = false;
                }
            },
            async connectAccount() {
                try {
                    const formdata = new FormData();
                    formdata.append("action", "get_account_auth_url");

                    const response = await fetch(ajaxurl, {
                        method: 'POST',
                        body: formdata
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const apiResponse = await response.json();
                    if (apiResponse.success) {
                        window.location = apiResponse.data.authorization_url;
                    }
                } catch (error) {
                    this.$toast.error("An error occurred while connecting the account.");
                }
            }
        },
        mounted() {
            this.fetchConnectedAccounts();
        },
        template: `
           <v-container fluid style="height: calc(100vh - 120px)">
                <div class="d-flex justify-space-between">
                    <v-skeleton-loader
                        v-if="loading"
                        type="text"
                        class="text-h6 mb-3"
                        style="width: 200px;" 
                    ></v-skeleton-loader>
                    <div v-else class="text-h6 mb-3">{{ accounts.length }} Connected Accounts</div>

                    <v-btn prepend-icon="mdi-link" color="#5865f2" @click="connectAccount">
                        Connect Account
                    </v-btn>
                </div>

                <!-- Data Table -->
                <v-data-table
                :headers="headers"
                :items="accounts"
                class="elevation-1 h-100"
                item-key="id"
                hide-default-footer
                >
                <template v-slot:body v-if="loading">
                    <tr v-for="i in 5" :key="i">
                        <td><v-skeleton-loader type="text" width="40px"></v-skeleton-loader></td>
                        <td><v-skeleton-loader type="text" width="200px"></v-skeleton-loader></td>
                        <td><v-skeleton-loader type="text" width="150px"></v-skeleton-loader></td>
                        <td><v-skeleton-loader type="text" width="50px"></v-skeleton-loader></td>
                    </tr>
                </template>

                <!-- Custom slot for Actions -->
                <template v-slot:item.actions="{ item }">
                    <v-btn icon color="red" size="x-small" class="m-1" @click.stop="confirmDelete(item.id)">
                        <v-icon>mdi-delete</v-icon>
                    </v-btn>
                </template>
            </v-data-table>

            <!-- Delete Confirmation Modal -->
            <v-dialog v-model="showDeleteModal" max-width="500">
                <v-card>
                    <v-card-title class="headline">Delete Account</v-card-title>
                    <v-card-text class="text-body-2">Are you sure you want to delete this account? This action will delete whole related data with this account.</v-card-text>

                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <!-- Cancel Button -->
                        <v-btn color="grey" text @click="showDeleteModal = false">
                            Cancel
                        </v-btn>
                        <!-- Confirm Delete Button -->
                        <v-btn class="bg-red" @click="deleteAccount">
                            Confirm
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </v-container>
        `,
    });

    // Use Vuetify
    app.use(vuetify);

    // Mount the app
    app.mount("#connected-accounts");
});
