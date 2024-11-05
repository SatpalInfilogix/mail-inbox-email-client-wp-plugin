import MailSidebar from './components/mail-sidebar.js';
import MailList from './components/mail-list.js';
import MailPreview from './components/mail-preview.js';
import DividerLayout from './components/divider-layout.js';
import FoldersTab from './components/folders-tab.js';

document.addEventListener("DOMContentLoaded", function () {
    const { createApp } = Vue;
    const { createVuetify } = Vuetify;

    const vuetify = createVuetify({
        icons: {
            iconfont: 'mdi',
        }
    });

    // Create the main Vue app
    const app = createApp({
        data() {
            return {
                sidebarWidth: 14,
                contentWidth: 43,
                previewWidth: 43,
                minSidebarWidth: 14,
                minContentWidth: 20,
                minPreviewWidth: 15,
                showPreview: false,
                activeEmail: null,
                loadingText: 'Loading Connected Accounts',
                account: {},
                tabFolders: [],
                activeFolder: {},
                connectedAccounts: [],
                updatedEmailsCount: 0,
                filterDate: Vue.ref([]),
                filters: {},
                searchFrom: '',
                searchSubject: '',
                searchBody: '',
                agents: [],
                selectedAgent: '',
            };
        },
        computed: {
            computedContentWidth() {
                return this.showPreview ? this.contentWidth : (parseFloat(this.contentWidth) + parseFloat(this.previewWidth));
            },
            computedPreviewWidth() {
                return this.showPreview ? this.previewWidth : 0;
            },
        },
        components: { VueDatePicker },
        watch: {
            selectedAgent(newAgent) {
                this.filters.agentId = newAgent;
                //alert(this.filters.agentId);
            }
        },
        methods: {
            updateWidths(widths) {
                this.sidebarWidth = widths.sidebarWidth;
                this.contentWidth = widths.contentWidth;
                this.previewWidth = widths.previewWidth;
            },
            updateSearchFrom(e) {
                this.filters.searchFrom = e.target.value;
            },
            updateSearchSubject(e) {
                this.filters.searchSubject = e.target.value;
            },
            updateSearchBody(e) {
                this.filters.keyword = e.target.value;
            },
            async fetchAgents() {
                const query = `
                query GetMailInboxAgents {
                    mailInboxAgents {
                        id
                        name
                        email
                    }
                }`;
    
                const response = await fetch(`${window.mailInbox.siteUrl}/graphql`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ query })
                });
    
                const apiResponse = await response.json();
                this.agents = apiResponse.data.mailInboxAgents;
            },
            async viewEmail(emailId) {
                const query = `
                    query {
                        getEmailById(id: ${emailId}) {
                            id
                            subject
                            received_datetime
                            to_recipients
                            has_attachments 
                            body_preview
                            body_content_type
                            body_content
                            cc_recipients
                            bcc_recipients
                            reply_to
                            additionalInfo {
                                tag_id
                                tag_name
                                agent_id
                            }
                            categories {
                                id
                                name
                            }
                            attachments {
                                name
                                path
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
                this.activeEmail = apiResponse.data.getEmailById;
                this.showPreview = true;

                if(parseFloat(this.previewWidth) <= 43){
                    this.previewWidth = 43;
                }
                
                let calculatedContentWidth = this.contentWidth === this.previewWidth ? this.contentWidth : this.contentWidth - this.previewWidth;

                this.updateWidths({
                    sidebarWidth: parseFloat(this.sidebarWidth),
                    contentWidth: calculatedContentWidth,
                    previewWidth: parseFloat(this.previewWidth),
                });
            },
            async viewEmailIfPreviewOpened(emailId){
                if(this.showPreview){
                    this.viewEmail(emailId);
                }
            },
            handleSelectedAccount(accountDetails){
                this.account = accountDetails;
                localStorage.setItem('mailInboxSelectedAccount', JSON.stringify(accountDetails));
            },
            handleActiveFolder(folder){
                this.activeFolder = folder;
                localStorage.setItem('mailInboxActiveFolder', JSON.stringify(folder))
            },
            handleFolderTab(folder, action = 'add'){
                const account = this.connectedAccounts.find(acc => 
                    acc.folders.some(f => f.id === folder.id)
                );
            
                // If no account is found, return early
                if (!account) {
                    console.error('No account found for the given folder:', folder);
                    return;
                }
            
                // Find the account in the tabFolders array
                let accountIndex = this.tabFolders.findIndex(a => a.id === account.id);
                
                // If the account is not already in tabFolders, add it
                if (accountIndex === -1) {
                    const nameParts = account.username.split(' ');
                    const shortname = nameParts.length > 1
                        ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
                        : nameParts[0][0].toUpperCase();
                        
                    this.tabFolders.push({
                        id: account.id,
                        username: account.username,
                        shortname: shortname,
                        folders: []
                    });
                    accountIndex = this.tabFolders.length - 1; // Update index to new account position
                }
                
                // Find the folder index within the selected account's folders
                const folderIndex = this.tabFolders[accountIndex].folders.findIndex(f => f.id === folder.id);
            
                if (action === 'add') {
                    folder.uniqueId = Date.now();
                    this.tabFolders[accountIndex].folders.push(folder);
                } else if (action === 'remove') {
                    // If the folder exists, remove it
                    if (folderIndex !== -1) {
                        this.tabFolders[accountIndex].folders.splice(folderIndex, 1);
                    }
                }

                if (this.tabFolders[accountIndex].folders.length === 0) {
                    this.tabFolders.splice(accountIndex, 1);
                }            
            
                localStorage.setItem('mailInboxTabFolders', JSON.stringify(this.tabFolders));
            },
            setDefaultActiveFolder(){
                if(localStorage.getItem('mailInboxActiveFolder')){
                    let tempFolder = JSON.parse(localStorage.getItem('mailInboxActiveFolder'));
                    this.activeFolder = tempFolder;
                } else {
                    let tempSelectedAccount = localStorage.getItem('mailInboxSelectedAccount');
                    if(tempSelectedAccount){
                        tempSelectedAccount = JSON.parse(tempSelectedAccount);
                        
                        if(tempSelectedAccount.folders){
                            this.activeFolder = tempSelectedAccount.folders[0];
                            localStorage.setItem('mailInboxActiveFolder', JSON.stringify(this.activeFolder));
                        }
                    }
                }
            },
            onAccountLoad(accounts){
                // Handle progress for saved accounts only
                if(this.connectedAccounts.length === 0){
                    this.loadingText = '';
                }

                this.connectedAccounts = accounts;
                if(!this.activeFolder.id && accounts.length > 0){
                    if(accounts[0].folders.length > 0){
                        let tempDefaultFolder = accounts[0].folders[0];
                        this.activeFolder = tempDefaultFolder;
                        localStorage.setItem('mailInboxActiveFolder', JSON.stringify(tempDefaultFolder));
                    }
                }
            },
            handleSynchronization(message, isEmailSynced = 0){
                this.loadingText = message;

                if(isEmailSynced > 0){
                    this.updatedEmailsCount++;
                }
            },
            onDateChange(newDateRange) {
                const formatDate = (date) => {
                    if (!date) return null;
                    return new Date(date).toISOString().split('T')[0]; // Returns 'YYYY-MM-DD'
                };

                
                this.filters.startDate = formatDate(newDateRange[0]);
                this.filters.endDate = formatDate(newDateRange[1]);
                this.filterDate = newDateRange;
            }
        },
        mounted(){
            this.setDefaultActiveFolder();

            if(localStorage.getItem('mailInboxTabFolders')){
                this.tabFolders = JSON.parse(localStorage.getItem('mailInboxTabFolders'));
            }
            
            this.fetchAgents();
        },
        template: `
            <v-app class="mail-inbox-container">
                <v-main>
                    <v-container fluid>
                        <div no-gutters class="d-flex" style="height: calc(100vh - 68px);">
                            <!-- Sidebar Column -->
                            <v-col :style="{ flexBasis: sidebarWidth + '%', maxWidth: sidebarWidth + '%' }" class="d-flex flex-column pa-0">
                                <mail-sidebar 
                                    :active-folder="activeFolder"
                                    @loaded-accounts="onAccountLoad" 
                                    @select-account="handleSelectedAccount"
                                    @active-folder="handleActiveFolder"
                                    @folder-tab="handleFolderTab"
                                    @synchronization="handleSynchronization"
                                >
                                </mail-sidebar>
                            </v-col>

                            <!-- Divider between Sidebar and Content -->
                            <divider-layout 
                                :sidebarWidth="sidebarWidth" 
                                :contentWidth="contentWidth" 
                                :previewWidth="previewWidth" 
                                :minSidebarWidth="minSidebarWidth" 
                                :minContentWidth="minContentWidth"
                                :minPreviewWidth="minPreviewWidth"
                                :showPreview="showPreview"
                                @update-widths="updateWidths"
                            ></divider-layout>

                            <!-- Content Column -->
                            <v-col :style="{ flexBasis: computedContentWidth + '%', maxWidth: computedContentWidth + '%' }" class="d-flex flex-column pa-0">
                                <v-container>
                                    <v-row>
                                        <v-col cols="12" sm="6" md="4">
                                           <vue-date-picker v-model="filterDate" range :max-date="new Date()" placeholder="Filter emails by date" :enable-time-picker="false" multi-calendars text-input @update:model-value="onDateChange"></vue-date-picker>
                                        </v-col>
                                        <v-col cols="12" sm="6" md="4">
                                            <v-text-field
                                                v-model="searchFrom"
                                                @input="updateSearchFrom($event)"
                                                append-inner-icon="mdi-magnify"
                                                density="compact"
                                                label="Search by From"
                                                variant="solo"
                                                hide-details
                                                single-line
                                                class="p-0 no-padding"
                                                style="padding: 0;"
                                            ></v-text-field>
                                        </v-col>
                                        <v-col cols="12" sm="6" md="4">
                                            <v-text-field
                                                v-model="searchBody"
                                                @input="updateSearchBody($event)"
                                                append-inner-icon="mdi-magnify"
                                                density="compact"
                                                label="Search body content"
                                                variant="solo"
                                                hide-details
                                                single-line
                                                class="p-0 no-padding"
                                                style="padding: 0;"
                                            ></v-text-field>
                                        </v-col>
                                    </v-row>
                                    
                                    <v-row>
                                        <v-col cols="12" sm="6" md="4">
                                            <v-text-field
                                                v-model="searchSubject"
                                                @input="updateSearchSubject($event)"
                                                append-inner-icon="mdi-magnify"
                                                density="compact"
                                                label="Search by Subject"
                                                variant="solo"
                                                hide-details
                                                single-line
                                                class="p-0 no-padding"
                                                style="padding: 0;"
                                            ></v-text-field>
                                        </v-col>
                                        <v-col cols="12" sm="6" md="4">
                                            <v-select
                                                label="Select Agent"
                                                v-model="selectedAgent"
                                                :items="agents"
                                                item-text="name"
                                                item-value="id"
                                                return-object
                                                dense
                                                outlined
                                                hide-details
                                                >
                                                <!-- Display Selected Tag as a Chip -->
                                                <template v-slot:selection="{ item }">
                                                    {{ item.raw.name }}
                                                </template>
                                    
                                                <!-- Display Each Dropdown Item with a Chip -->
                                                <template v-slot:item="{ item, attrs }">
                                                    <v-list-item
                                                    v-bind="attrs"
                                                    :key="item.id"
                                                    @click="handleSelect(item)"
                                                    >
                                                    <v-list-item-content>
                                                        {{ item.raw.name }}
                                                    </v-list-item-content>
                                                    </v-list-item>
                                                </template>
                                            </v-select>
                                        </v-col>
                                    </v-row>
                                    
                                    <v-progress-linear
                                        color="primary"
                                        height="16"
                                        rounded
                                        indeterminate
                                        class="mt-2"
                                        v-if="loadingText"
                                    >
                                        <template v-slot:default>
                                        <div class="progress-label">{{ loadingText }}</div>
                                        </template>
                                    </v-progress-linear>
                                </v-container>
                                
                                <folders-tab :active-folder="activeFolder" :tab-folders="tabFolders" @folder-tab="handleFolderTab"  @set-active-folder="handleActiveFolder" />
                                
                                <mail-list 
                                    :activeAccount="account" 
                                    :activeFolder="activeFolder" 
                                    :updatedEmailsCount="updatedEmailsCount"
                                    :filters="filters"
                                    :agents="agents"
                                    @view-email="viewEmail"
                                    @view-email-if-preview-opened="viewEmailIfPreviewOpened">
                                </mail-list>
                            </v-col>

                            <!-- Conditionally Render Divider and Preview Column -->
                            <divider-layout 
                                v-if="showPreview" 
                                :sidebarWidth="sidebarWidth" 
                                :contentWidth="contentWidth" 
                                :previewWidth="previewWidth" 
                                :minSidebarWidth="minSidebarWidth" 
                                :minContentWidth="minContentWidth"
                                :minPreviewWidth="minPreviewWidth"
                                :showPreview="showPreview"
                                :isSidebar="false"
                                @update-widths="updateWidths"
                            ></divider-layout>

                            <v-col v-if="showPreview" :style="{ flexBasis: computedPreviewWidth + '%', maxWidth: computedPreviewWidth + '%' }" class="d-flex flex-column pa-0">
                                <mail-preview :email="activeEmail" @close-preview="showPreview = false"></mail-preview>
                            </v-col>
                        </div>
                    </v-container>
                </v-main>
            </v-app>
        `,
    });

    // Register the imported components with the Vue app
    app.component('mail-sidebar', MailSidebar);
    app.component('mail-list', MailList);
    app.component('mail-preview', MailPreview);
    app.component('divider-layout', DividerLayout);
    app.component('folders-tab', FoldersTab);

    app.use(vuetify);
    app.mount("#mail-inbox-app");
});
