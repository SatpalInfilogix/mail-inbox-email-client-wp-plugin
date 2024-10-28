import AssignTagDialog from './tag/assign-tag-dialog.js';

export default {
    name: 'MailList',
    components: {
        AssignTagDialog
    },
    props: {
        activeAccount: {
            type: Object,
            required: true
        },
        activeFolder: {
            type: Object,
            required: true
        },
        updatedEmailsCount: {
            type: Number,
            default: 0
        }
    },
    data() {
        return {
            loadedMails: [],
            headers: [
                { title: 'Tag', value: 'tag' },
                { title: 'Agent', value: 'agent' },
                { title: 'From', value: 'from' },
                { title: 'Subject', value: 'subject' },
                { title: 'Date/Time', value: 'received_datetime' },
                { title: 'Attachments', value: 'attachments' },
                { title: 'Category', value: 'category' },
                { title: 'Ticket', value: 'selectedTicket' },
                { title: 'Order', value: 'selectedOrder' }
            ],
            search: '',
            selectedEmailId: 0,
            tags: [],
            isAddTagDialogOpen: false,
            showUnAssignTagModal: false,
            categories: [],
            tagId: 0,
            snackbar: false,
            snackbarMessage: '',
            snackbarColor: 'success',
        };
    },
    methods: {
        onRowClick(row) {
            this.selectedEmailId = row.id;
            this.$emit('viewEmail', row.id);
        },
        async loadEmails(offset = 0) {  
            if(offset === 0){
                this.loading = false;
                this.allLoaded = false;
            }

            if (this.loading || this.allLoaded || !this.activeFolder) return; // Prevent multiple loads or loading after all emails are loaded
    
            this.loading = true;
            
            const query = `
                query {
                    getEmailsByFolderId(folder_id: ${this.activeFolder.id}, limit: 20, offset: ${offset}) {
                        id
                        subject
                        received_datetime
                        to_recipients
                        sender
                        additionalInfo {
                            tag_id
                            tag_name
                            agent_id
                        }
                        categories {
                            id
                            name
                        }
                    }
                }`;
    
            try {
                const response = await fetch(`${window.mailInbox.siteUrl}/graphql`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ query })
                });
    
                const apiResponse = await response.json();
    
                if (apiResponse.data.getEmailsByFolderId) {
                    const newEmails = apiResponse.data.getEmailsByFolderId.map(email => {
                        email.additionalInfo = email.additionalInfo || {};
    
                        if (email.additionalInfo.tag_id) {
                            email.additionalInfo.tag = {
                                id: email.additionalInfo.tag_id,
                                name: email.additionalInfo.tag_name,
                                fontColor: this.getTagProperty('fontColor', email.additionalInfo.tag_id),
                                backgroundColor: this.getTagProperty('backgroundColor', email.additionalInfo.tag_id),
                            };
                        } else {
                            email.additionalInfo.tag_id = null;
                        }
    
                        return email;
                    });
    
                    if (offset === 0) {
                        this.loadedMails = newEmails;
                    } else {
                        this.loadedMails = [...this.loadedMails, ...newEmails];
                    }
                    
                    // If fewer emails are returned than the limit, assume all emails are loaded
                    if (newEmails.length < 20) {
                        this.allLoaded = true;
                    }
                } else {
                    this.allLoaded = true;
                }
            } catch (error) {
                console.error('Error loading emails:', error);
            } finally {
                this.loading = false;
            }
        },
        async fetchTags() {
            const query = `
            query {
                mailInboxTags(status: "Active") {
                    id
                    name
                    fontColor
                    backgroundColor
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
            this.tags = apiResponse.data.mailInboxTags;
        },
        
        async fetchCategories() {
            const query = `
            query {
                mailInboxCategories(status: "Active") {
                    id
                    name
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
            this.categories = apiResponse.data.mailInboxCategories;
        },
        async associateEmailAdditionalInformation(emailId, column, value) {
            const formdata = new FormData();
            formdata.append("action", "associate_email_additional_information");
            formdata.append("email_id", emailId);
            formdata.append("column", column);
            formdata.append("value", value);

            const response = await fetch(ajaxurl, {
                method: 'POST',
                body: formdata
            });

            return await response.json();
        },
        async handleEmailTag(emailId, tagId) {
            const apiResponse = await this.associateEmailAdditionalInformation(emailId, 'tag_id', tagId);
            if(apiResponse.success){
                this.showSnackbar(`Tag successfully assigned!`, 'success');

                // Update the local email data to reflect the new tag
                const email = this.loadedMails.find(mail => mail.id === emailId);
                if (email) {
                    email.additionalInfo.tag_id = tagId;
                    const assignedTag = this.tags.find(tag => tag.id === tagId);
                    email.additionalInfo.tag_name = assignedTag ? assignedTag.name : '';
                    

                    email.additionalInfo.tag = {
                        id: email.additionalInfo.tag_id,
                        name: email.additionalInfo.tag_name,
                        fontColor: this.getTagProperty('fontColor', email.additionalInfo.tag_id),
                        backgroundColor: this.getTagProperty('backgroundColor', email.additionalInfo.tag_id),
                    };
                }
            } else {
                this.showSnackbar(`Failed to assign tag`, 'error');
            }
        },
        async handleEmailCategories(emailId, categoryId){
            const apiResponse = await this.associateEmailAdditionalInformation(emailId, 'category_id', categoryId);
            if(apiResponse.success){
                this.showSnackbar(`Category successfully assigned!`, 'success');
            } else {
                this.showSnackbar(`Failed to assign category`, 'error');
            }
        },
        showSnackbar(message, color = 'success') {
            this.snackbarMessage = message;
            this.snackbarColor = color;
            this.snackbar = true;
        },
        handleScroll(event) {
            const { scrollTop, scrollHeight, clientHeight } = event.target;
    
            // Check if the user has scrolled near the bottom (with a 250px threshold)
            if (scrollTop + clientHeight >= scrollHeight - 250) {
                const newOffset = this.loadedMails.length;
    
                this.loadEmails(newOffset);
            }
        },
        getTagProperty(property, tagId){
            const tag = this.tags.find(tag => tag.id === tagId);

            return tag ? tag[property] : '#000';
        },
        openAddTagDialog(emailData) {
            this.currentEmailData = emailData;
            this.isAddTagDialogOpen = true;
        },
        confirmUnassignTag(emailData){
            this.currentEmailData = emailData;
            this.showUnAssignTagModal = true;
        },
        closeAddTagDialog() {
          this.isAddTagDialogOpen = false;
          this.showUnAssignTagModal = false;
          this.currentEmailData = null;
        },
    },
    watch: {
        activeFolder: {
            handler() {
                this.loadEmails();
            },
            deep: true
        },
        updatedEmailsCount: {
            handler() {
                this.loadEmails();
            },
            deep: true
        },
    },
    mounted() {
        this.fetchTags();
        this.fetchCategories();
        this.$nextTick(() => {
            // Access the scroll container inside v-data-table
            const dataTable = this.$refs.mailDataTable;
            if (dataTable) {
                // Vuetify's v-data-table uses a div with class 'v-data-table__wrapper' for scrolling
                const scrollContainer = dataTable.$el.querySelector('.v-table__wrapper');
                if (scrollContainer) {
                    scrollContainer.addEventListener('scroll', this.handleScroll);
                }
            }
        });
    },
    beforeDestroy() {
        // Clean up the event listener
        const dataTable = this.$refs.mailDataTable;
        if (dataTable) {
            const scrollContainer = dataTable.$el.querySelector('.v-data-table__wrapper');
            if (scrollContainer) {
                scrollContainer.removeEventListener('scroll', this.handleScroll);
            }
        }
    },
    template: `
       <v-container fluid style="height: calc(100vh - 140px)">
            <!-- Data Table -->
            <v-data-table
                ref="mailDataTable"
                :headers="headers"
                :items="loadedMails"
                :search="search"
                show-select
                class="elevation-1 h-100 reduce-dt-spacing"
                item-key="id"
                hide-default-footer
                :items-per-page="-1"
                density="comfortable"
            >

            <template v-slot:header.attachments="{ header }">
                <v-icon small class="ml-2">
                    mdi-paperclip
                </v-icon>
            </template>

            
            <template v-slot:item="{ item }">
                <tr class="cursor-default" :class="{'bg-cyan-lighten-5': selectedEmailId === item.id}" @dblclick="onRowClick(item)">
                    <td>
                        <v-checkbox
                            v-model="item.selected"
                            :value="item.id"
                            @change="onCheckboxChange(item)"
                        ></v-checkbox>
                    </td>

                    <td>
                        <div style="width: 50px">
                            <v-chip
                                :style="{
                                    backgroundColor: getTagProperty('backgroundColor', item.additionalInfo.tag_id),
                                    color: getTagProperty('fontColor', item.additionalInfo.tag_id)
                                }"
                                size="small" 
                                v-if="item.additionalInfo.tag_name"
                                @click="openAddTagDialog(item)"
                            >
                                {{ item.additionalInfo.tag_name }}
                                <v-icon
                                    small
                                    class="ml-2"
                                    @click.stop="confirmUnassignTag(item)"
                                >
                                    mdi-close
                                </v-icon>
                            </v-chip>
                            <p class="text-decoration-none text-caption my-0 cursor-pointer" v-else @click="openAddTagDialog(item)">Add Tag</p>
                        </div>
                    </td>

                    <td>{{ item.additionalInfo.agent_id || 'N/A' }}</td>

                    <td>
                        <div class="text-truncate" style="width: 140px;">
                            <span v-if="activeFolder.display_name==='Inbox'">
                                {{ JSON.parse(item.sender) ? JSON.parse(item.sender).emailAddress.name : 'Unknown' }}<br>
                                {{ JSON.parse(item.sender) ? JSON.parse(item.sender).emailAddress.address : 'Unknown' }}<br>
                            </span>
                            <span v-else>
                                {{ JSON.parse(item.to_recipients)[0] ? JSON.parse(item.to_recipients)[0].emailAddress.name : 'Unknown' }}
                            </span>
                        </div>
                    </td>

                    <td>
                        <div class="text-truncate" style="width: 200px;">
                            {{ item.subject }}
                        </div>
                    </td>

                    <td>
                        <div style="width: 128px;">
                            <div class="text-caption"><v-icon class="text-grey-darken-2 me-1">mdi-calendar</v-icon>{{ item.received_datetime.split(' ')[0] }}</div>
                            <div class="text-caption"><v-icon class="text-grey-darken-2 me-1">mdi-clock</v-icon>{{ item.received_datetime.split(' ')[1] }}</div>
                        </div>
                    </td>

                    <td>
                        <v-chip size="x-small" color="primary" text-color="white">
                            {{ item.attachments ? item.attachments.length : 0 }}
                        </v-chip>
                    </td>

                    <td>
                        <v-select
                            label="Category"
                            v-model="item.categories"
                            :items="categories"
                            item-title="name"
                            item-value="id"
                            return-object
                            width="150px"
                            class="mt-2"
                            multiple
                        >
                            <template v-slot:item="{ props, item }">
                                <v-list-item v-bind="props" @click="handleEmailCategories(item.id, item.value)"></v-list-item>
                            </template>
                            <template v-slot:selection="{ item, index }">
                                <v-chip v-if="index < 2">
                                    <span>{{ item.title }}</span>
                                </v-chip>
                                <span
                                    v-if="index === 2"
                                    class="text-grey text-caption align-self-center"
                                >
                                    (+{{ item.categories.length - 2 }} others)
                                </span>
                            </template>
                        </v-select>
                    </td>

                    <td>{{ item.selectedTicket || 'N/A' }}</td>

                    <td>{{ item.selectedOrder || 'N/A' }}</td>
                </tr>
            </template>

            <template v-slot:item.tag="{ props, item: emailData }">
                <v-chip
                    :style="{
                        backgroundColor: getTagProperty('backgroundColor', emailData.additionalInfo.tag_id),
                        color: getTagProperty('fontColor', emailData.additionalInfo.tag_id)
                    }"
                    size="small" 
                    v-if="emailData.additionalInfo.tag_name"
                    @click="openAddTagDialog(emailData)"
                >
                    
                    {{ emailData.additionalInfo.tag_name }}
                    <v-icon
                        small
                        class="ml-2"
                        @click.stop="confirmUnassignTag(emailData)">
                        mdi-close
                    </v-icon>
                </v-chip>

                <p class="text-decoration-none text-caption my-0" v-else @click="openAddTagDialog(emailData)">Add Tag</p>
            </template>

            <template v-slot:item.category="{ props, item: emailData }">
                <v-select
                label="Category"
                v-model="emailData.categories"
                :items="categories"
                item-title="name"
                item-value="id"
                return-object
                width="150px"
                class="mt-2"
                multiple
                >
                    <template v-slot:item="{ props, item }">
                        <v-list-item v-bind="props" @click="handleEmailCategories(emailData.id, item.value)"></v-list-item>
                    </template>
                    <template v-slot:selection="{ item, index }">
                        <v-chip v-if="index < 2">
                            <span>{{ item.title }}</span>
                        </v-chip>
                        <span
                            v-if="index === 2"
                            class="text-grey text-caption align-self-center"
                        >
                            (+{{ emailData.additionalInfo.categories.length - 2 }} others)
                        </span>
                    </template>
                </v-select>
            </template>

            <template v-slot:item.from="{ item }">
                <div class="text-truncate" style="width: 200px;">
                    {{ JSON.parse(item.to_recipients)[0] ? JSON.parse(item.to_recipients)[0].emailAddress.name : 'Unknown' }}
                </div>
            </template>

            <template v-slot:item.subject="{ item }">
                <div class="text-truncate" style="width: 200px;">
                    {{ item.subject }}
                </div>
            </template>

            <template v-slot:item.received_datetime="{ item }">
                <div style="width: 128px;">
                    <div class="text-caption"><v-icon class="text-grey-darken-2 me-1">mdi-calendar</v-icon>{{ item.received_datetime.split(' ')[0] }}</div>
                    <div class="text-caption"><v-icon class="text-grey-darken-2 me-1">mdi-clock</v-icon>{{ item.received_datetime.split(' ')[1] }}</div>
                </div>
            </template>

            <template v-slot:item.attachments="{ item }">
                <v-chip
                size="x-small"
                color="primary"
                text-color="white"
                >
                {{ tagId }} attachments
                </v-chip>
            </template>
        </v-data-table>
    </v-container>

    <AssignTagDialog
        :visible="isAddTagDialogOpen"
        :unAssign="showUnAssignTagModal"
        :tags="tags"
        :selectedEmail="currentEmailData"
        @tag-assigned="handleEmailTag"
        @close="closeAddTagDialog"
        @error="showSnackbar"
    ></AssignTagDialog>

    <v-snackbar
        v-model="snackbar"
        :color="snackbarColor"
        timeout="3000"
        top
    >
        {{ snackbarMessage }}
    </v-snackbar>
    `,
};
