import ErrorsModel from './common/errors-model.js';
import FullScreen from './common/full-screen.js';
import MailFolders from './mail-folders.js';
import debounce from '../libs/debounce.js';

export default {
    name: 'MailSidebar',
    components: {
        FullScreen,
        ErrorsModel,
        MailFolders
    },
    emits: ['loadedAccounts', 'selectAccount', 'activeFolder', 'folderTab', 'synchronization'],
    props: {
        activeFolder: {
            type: Object,
            default: {}
        }
    },
    data() {
        return {
            folders: [],
            accounts: [],
            modelContent: {},
            selectedAccount: {},
            expandedAccordions: [],
            loading: true,
            selectedEmail: null,
            syncedEmailsCount: 0,
            isSyncing: false,
            foldersToBeSynced: [],
            syncFolder: null,
            snackbar: false,
            snackbarMessage: '',
            snackbarColor: 'success',
        }
    },
    methods: {
        async fetchConnectedAccounts() {
            try {
                const query = `
                query {
                    mailAccounts {
                        id
                        email
                        username
                        folders {
                            id
                            display_name
                            local_folder_parent_id 
                            folder_id
                        }
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
                const { mailAccounts } = apiResponse.data;

                if (!mailAccounts || mailAccounts.length === 0) {
                    return; // Exit early if no accounts found
                }

                // Load accounts into the current object
                this.accounts = mailAccounts;
                this.loading = false;
                this.$emit('loadedAccounts', mailAccounts);

                // Default to the first account
                let previouslySelectedAccount = mailAccounts[0];

                // Check if there is a stored selected account
                if (this.activeFolder.id) {
                    try {
                        const matchingAccount = mailAccounts.find(account => 
                            account.folders.some(folder => folder.id === this.activeFolder.id)
                        );

                        // If found, set it as the previously selected account
                        if (matchingAccount) {
                            matchingAccount.isOpened = true;
                            previouslySelectedAccount = matchingAccount;
                        }
                    } catch (e) {
                        console.warn('Failed to parse selectedAccount from localStorage', e);
                    }
                }

                this.selectAccount(previouslySelectedAccount);
            } catch (error) {
                this.loading = false;
            }
        },
        sortFolders(results){
            const folders = Array.isArray(results) && results.length > 0 ? results : [];

            // Define the custom order for folder names
            const predefinedOrder = [
                'Inbox',
                'Drafts',
                'Sent Items',
                'Junk Email',
                'Outbox',
                'Trash',
                'Deleted Items',
            ];

            // Create a map for quick lookup of predefined order positions
            const orderMap = predefinedOrder.reduce((map, folderName, index) => {
                map[folderName] = index;
                return map;
            }, {});

            // Sort the folders based on the predefined order and then alphabetically
            folders.sort((a, b) => {
                const aName = a.folder_name;
                const bName = b.folder_name;

                const aPosition = orderMap.hasOwnProperty(aName) ? orderMap[aName] : -1;
                const bPosition = orderMap.hasOwnProperty(bName) ? orderMap[bName] : -1;

                // Both folders are in the predefined order
                if (aPosition !== -1 && bPosition !== -1) {
                    return aPosition - bPosition;
                }

                // Only a is in the predefined order
                if (aPosition !== -1) {
                    return -1;
                }

                // Only b is in the predefined order
                if (bPosition !== -1) {
                    return 1;
                }

                // Neither folder is in the predefined order; sort alphabetically
                return aName.localeCompare(bName);
            });

            // Return the sorted folders
            return folders;
        },
        async syncFolders() {
            try {
                const formdata = new FormData();
                formdata.append("action", "sync_email_folders");
                formdata.append("account_id", this.selectedAccount.id);
                this.$emit('synchronization', 'Syncing email folders');

                const response = await fetch(ajaxurl, {
                    method: 'POST',
                    body: formdata
                });

                const apiResponse = await response.json();

                if (!apiResponse.success) {
                    let { code } = apiResponse.data;
                    if (code === 401) {
                        this.showErrorDialog('Session Expired', 'Your session has expired. Please reconnect.', 'Reconnect', this.reconnectAccount);
                    } else if (code === 404) {
                        this.showErrorDialog(
                            'Folders not found!',
                            `Folders not found associated with ${this.selectedAccount.email}`,
                            'Okay',
                            this.closeErrorModal
                        );
                    }
                } else {
                    this.fetchConnectedAccounts();
                }
            } catch (error) {
                this.showErrorDialog('Sync Failed', 'Unable to sync folders at this time.', 'Try Again', this.syncFolders);
            }
        },
        async checkNewEmails(){
            this.isSyncing = false;

            const formdata = new FormData();
            formdata.append("action", "check_new_emails");
            formdata.append("account_id", this.selectedAccount.id);
            formdata.append("folder_id", this.syncFolder ? this.syncFolder.folder_id : '');

            this.$emit('synchronization', 'Checking for new emails');

            const response = await fetch(ajaxurl, {
                method: 'POST',
                body: formdata
            });

            const apiResponse = await response.json();
            if(apiResponse.success){
                this.isSyncing = true;
                this.foldersToBeSynced = this.sortFolders(apiResponse.data.folders);
                //this.foldersToBeSynced = apiResponse.data.folders;

                if(this.foldersToBeSynced.length > 0){
                    this.syncFolder = this.foldersToBeSynced[0];
                } else {
                    this.showSnackbar('All emails are up to dated!', 'success');
                }
            }
        },
        async syncEmails(retryCount = 3) {
            const formdata = new FormData();
            formdata.append("action", "sync_emails");
            formdata.append("account_id", this.selectedAccount.id);
            formdata.append("folder_id", this.syncFolder ? this.syncFolder.folder_id : '');
        
            if (this.syncFolder) {
                this.$emit('synchronization', `${this.syncFolder.count} emails to be synced in ${this.syncFolder.folder_name}`, 1);
            }
        
            try {
                const response = await fetch(ajaxurl, {
                    method: 'POST',
                    body: formdata
                });
        
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
        
                const apiResponse = await response.json();
                if (apiResponse.success) {
                    const syncedCount = apiResponse.data.count; // Number of emails synced from the API response
                    this.syncedEmailsCount += syncedCount;
        
                    // Ensure synced count doesn't decrease below zero
                    if (this.syncFolder) {
                        this.syncFolder.count = Math.max(0, this.syncFolder.count - syncedCount);
                    }
        
                    const folderIndex = this.foldersToBeSynced.findIndex(folder => folder.local_folder_id === this.syncFolder.local_folder_id);
                    if (folderIndex !== -1) {
                        // Update only when synced count is greater than zero
                        /* if (syncedCount > 0) {
                            this.foldersToBeSynced[folderIndex].count = Math.max(0, this.foldersToBeSynced[folderIndex].count - syncedCount);
                        } */
        
                        if (syncedCount > 0) {
                            // If emails are still remaining in the current folder, avoid unnecessary recursion
                            await this.syncEmails();
                        } else {
                            // Move to the next folder if the current folder is fully synced
                            const nextFolderIndex = folderIndex + 1;
                            if (this.foldersToBeSynced[nextFolderIndex]) {
                                this.syncedEmailsCount = 0;
                                this.syncFolder = this.foldersToBeSynced[nextFolderIndex];
                                await this.syncEmails();
                            } else {
                                this.showSnackbar(`Emails for ${this.syncFolder.folder_name} folder are synced!`, 'success');
                                this.$emit('synchronization', ``);
                            }
                        }
                    }
                } else {
                    let { code } = apiResponse.data;
                    if (code === 401) {
                        this.showErrorDialog('Session Expired', 'Your session has expired. Please reconnect.', 'Reconnect', this.reconnectAccount);
                    } else if (code === 404) {
                        this.showErrorDialog(
                            'Emails not found!',
                            `Emails not found associated with ${this.selectedAccount.email}`,
                            'Okay',
                            this.closeErrorModal
                        );
                    } else {
                        alert(apiResponse.data.data);
                    }
                }
            } catch (error) {
                if (retryCount > 0) {
                    console.warn(`Retrying sync... attempts left: ${retryCount}`);
                    setTimeout(() => this.syncEmails(retryCount - 1), 2000); // Retry after a short delay
                } else {
                    this.$emit('synchronization', ``);
                    alert(`Error syncing emails: ${error.message}`);
                }
            }
        },        
        showSnackbar(message, color = 'success') {
            this.snackbarMessage = message;
            this.snackbarColor = color;
            this.snackbar = true;
        },
        closeErrorModal() {
            this.modelContent.visible = false;
        },
        showErrorDialog(title, description, btnText, onBtnClick) {
            this.modelContent = {
                title,
                description,
                btnText,
                onBtnClick,
                visible: true  // Show the error dialog
            };
        },
        async reconnectAccount() {
            const formdata = new FormData();
            formdata.append("action", "get_account_auth_url");

            const response = await fetch(ajaxurl, {
                method: 'POST',
                body: formdata
            });

            const apiResponse = await response.json();
            if (apiResponse.success) {
                window.location = apiResponse.data.authorization_url;
            }
        },
        toggleAccountFolders(account) {
            account.isOpened = !account.isOpened;
        },
        selectAccount(account) {
            account.isOpened = true;
            this.selectedAccount = account;
            this.$emit('selectAccount', account);
        },
        handleActiveFolder(folder){
            this.$emit('activeFolder', folder);
        },
        handleFolderTab(folder){
            this.$emit('folderTab', folder);
        },
        syncEmailData: debounce(async function(){
            this.syncFolder = null;
            await this.syncFolders();
            await this.checkNewEmails();
            this.syncedEmailsCount = 0;
            this.isSyncing = true;
            await this.syncEmails();
        }, 300),
        async handleFolderEmailSync(folder){
            this.syncFolder = folder;
            await this.checkNewEmails();
            this.syncedEmailsCount = 0;
            this.isSyncing = true;
            await this.syncEmails();
        }
    },
    async mounted() {
        await this.fetchConnectedAccounts();
        //this.syncEmailData();
    },
    template: `
        <v-col class="mail-sidebar" style="height: 80vh; background-color: #f5f5f5; border: 1px solid #ddd; overflow-y: auto;">
            <v-btn
                class="text-none text-subtitle-1 w-100"
                color="#5865f2"
                @click="syncEmailData"
                >
                <v-icon left>mdi-sync</v-icon>
                Sync All Emails
            </v-btn>

             <v-list-item class="pa-0">
                <v-list-item-content>
                    <v-list-item-title class="text-subtitle-1">
                        <FullScreen />
                        {{selectedAccount.email}}
                    </v-list-item-title>
                </v-list-item-content>
            </v-list-item>


            <template v-if="loading">
                <v-skeleton-loader type="list-item" class="mb-4"></v-skeleton-loader>
                <v-skeleton-loader type="list-item" v-for="n in 3" :key="n"></v-skeleton-loader>
            </template>
            <template v-else>
                <v-item-group mandatory v-if="accounts.length > 1">
                    <v-item v-for="account in accounts" :key="account.id" v-slot="{ toggle }">
                        <v-card
                        :color="account.id===selectedAccount.id ? '#5865f2' : ''"
                        class="d-flex align-center px-2 py-2 my-2"
                        >
                            <v-btn  density="compact" class="me-1" icon @click="toggleAccountFolders(account)">
                                <v-icon>{{ account.isOpened ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                            </v-btn>

                            <div class="text-body-2" @click="selectAccount(account)">
                                {{ account.email }}
                            </div>
                        </v-card>

                        <MailFolders 
                            :account="account"
                            :active-folder="activeFolder"
                            @set-active-folder="handleActiveFolder"
                            @set-folder-tab="handleFolderTab"
                        />
                    </v-item>
                </v-item-group>
                <v-item-group mandatory v-else>
                    <MailFolders 
                        v-for="account in accounts" :key="account.id" 
                        :account="account" 
                        :active-folder="activeFolder"
                        @set-active-folder="handleActiveFolder"
                        @set-folder-tab="handleFolderTab"
                        @sync-folder-emails="handleFolderEmailSync"
                    />
                </v-item-group>
            </template>
        </v-col>

        <ErrorsModel
            :visible.sync="modelContent.visible"
            :title="modelContent.title"
            :description="modelContent.description"
            :btnText="modelContent.btnText"
            :onBtnClick="modelContent.onBtnClick"
            @update:visible="modelContent.visible = $event"
        />

        <v-snackbar
            v-model="snackbar"
            :color="snackbarColor"
            timeout="3000"
            top
        >
            {{ snackbarMessage }}
        </v-snackbar>
    `
};
