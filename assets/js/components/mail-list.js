import AssignTagDialog from './tag/assign-tag-dialog.js';
import AssignAgentDialog from './agent/assign-agent-dialog.js';

export default {
    name: 'MailList',
    components: {
        AssignTagDialog,
        AssignAgentDialog
    },
    props: {
        activeAccount: {
            type: Object,
            required: true
        },
        filters: {
            type: Object,
            default: {}
        },
        activeFolder: {
            type: Object,
            required: true
        },
        updatedEmailsCount: {
            type: Number,
            default: 0
        },
        agents: {
            type: Array,
            required: true
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
            isAssignAgentDialogOpen: false,
            showUnAssignTagModal: false,
            showUnAssignAgentModal: false,
            categories: [],
            tagId: 0,
            snackbar: false,
            snackbarMessage: '',
            snackbarColor: 'success',
            tempSelectedEmail: {},
            isSearching: false
        };
    },
    methods: {
        async onRowClick(row) {
            this.selectedEmailId = row.id;
            this.$emit('viewEmail', row.id);
        },
        selectRow(row) {
            this.tempSelectedEmail = row;
            this.selectedEmailId = row.id;
            this.$emit('viewEmailIfPreviewOpened', row.id);
        },
        async loadEmails(offset = 0) {  
            if (offset === 0) {
                this.loading = false;
                this.allLoaded = false;
            }

            if (this.loading || this.allLoaded || !this.activeFolder) return;

            this.loading = true;

            const agentIdValue = this.filters.agentId ? parseInt(this.filters.agentId) : null;

            const query = `
                query {
                    getEmailsByFolderId(
                        folder_id: ${this.activeFolder.id}, 
                        limit: 20, offset: ${offset}, 
                        filters: {
                            startDate: "${this.filters.startDate || ''}",
                            endDate: "${this.filters.endDate || ''}",
                            keyword: "${this.filters.keyword || ''}",
                            searchFrom: "${this.filters.searchFrom || ''}",
                            searchSubject: "${this.filters.searchSubject || ''}",
                            agentId: ${agentIdValue !== null ? agentIdValue : 'null'},
                            tags: "${this.filters.tags || 'null'}",
                            categories: "${this.filters.categories || 'null'}",
                        }) {
                        id
                        subject
                        received_datetime
                        to_recipients
                        sender
                        has_attachments
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
                this.isSearching = false;

                if (apiResponse.errors) {
                    console.error('GraphQL Errors:', apiResponse.errors);
                }

                if (apiResponse.data.getEmailsByFolderId) {
                    const newEmails = apiResponse.data.getEmailsByFolderId.map(email => {
                          // Ensure additionalInfo exists with necessary structure
                          email.additionalInfo = email.additionalInfo || {};
                        
                          if (email.additionalInfo.tag_id) {
                            email.additionalInfo.tag = {
                              id: email.additionalInfo.tag_id,
                              name: email.additionalInfo.tag_name,
                              fontColor: this.getTagProperty('fontColor', email.additionalInfo.tag_id),
                              backgroundColor: this.getTagProperty('backgroundColor', email.additionalInfo.tag_id),
                            };
                          }
                        
                          if (email.additionalInfo.agent_id) {
                            const associatedAgent = this.agents.find(agent => agent.id === email.additionalInfo.agent_id);
                            if (associatedAgent) {
                              email.additionalInfo.agent = {
                                id: associatedAgent.id,
                                name: associatedAgent.name
                              };
                            }
                          }
                          return email;
                        });

                    if (offset === 0) {
                        this.loadedMails = newEmails;
                    } else {
                        this.loadedMails = [...this.loadedMails, ...newEmails];
                    }

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
                body: JSON.stringify({ query })
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
                body: JSON.stringify({ query })
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
                if(tagId){
                    this.showSnackbar(`Tag successfully assigned!`, 'success');
                } else {
                    this.showSnackbar(`Tag unassigned successfully!`, 'success');
                }

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
        async handleEmailAgent(emailId, agentId) {
            const apiResponse = await this.associateEmailAdditionalInformation(emailId, 'agent_id', agentId);
            if(apiResponse.success){
                if(agentId){
                    this.showSnackbar(`Agent successfully assigned!`, 'success');
                } else {
                    this.showSnackbar(`Agent unassigned successfully!`, 'success');
                }

                // Update the local email data to reflect the new tag
                const email = this.loadedMails.find(mail => mail.id === emailId);
                if (email) {
                    email.additionalInfo.agent_id = agentId;
                    const assignedAgent = this.agents.find(agent => agent.id === agentId);
                    
                    if(assignedAgent){
                        email.additionalInfo.agent = {
                            id: assignedAgent.id,
                            name: assignedAgent.name
                        };
                    } else {
                        email.additionalInfo.agent = null;
                    }
                }
            } else {
                this.showSnackbar(`Failed to assign agent`, 'error');
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
        getTagProperty(property, tagId) {
            const tag = this.tags.find(tag => tag.id === tagId);
            return tag ? tag[property] : '#000';
        },
        openAddTagDialog(item) {
            this.currentEmailData = item;
            this.isAddTagDialogOpen = true;
        },
        toggleSelectAll() {
            this.selectAll = !this.selectAll;

            this.loadedMails.forEach(email => {
                email.selected = this.selectAll;
            });
        },
        onCheckboxChange(email) {
            if (!email.selected) {
                this.selectAll = false; // Uncheck the header checkbox if any email is unchecked
            }
        },
        openAssignAgentDialog(item) {
            this.currentEmailData = item;
            this.isAssignAgentDialogOpen = true;
        },
        confirmUnassignTag(item){
            this.currentEmailData = item;
            this.showUnAssignTagModal = true;
        },
        confirmUnassignAgent(item){
            this.currentEmailData = item;
            this.showUnAssignAgentModal = true;
        },
        closeAddTagDialog() {
          this.isAddTagDialogOpen = false;
          this.showUnAssignTagModal = false;
          this.currentEmailData = null;
        },
        closeAssignAgentDialog() {
          this.isAssignAgentDialogOpen = false;
          this.showUnAssignAgentModal = false;
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
        filters: {
            handler() {
                this.isSearching = true;
                this.loadEmails();  // Reload emails when filters change
            },
            deep: true
        },
    },
    mounted() {
        this.fetchTags();
        this.fetchCategories();
        this.$nextTick(() => {
            const dataTable = this.$refs.mailDataTable;
            if (dataTable) {
                const scrollContainer = dataTable.$el.querySelector('.v-table__wrapper');
                if (scrollContainer) {
                    scrollContainer.addEventListener('scroll', this.handleScroll);
                }
            }
        });
    },
    beforeDestroy() {
        const dataTable = this.$refs.mailDataTable;
        if (dataTable) {
            const scrollContainer = dataTable.$el.querySelector('.v-data-table__wrapper');
            if (scrollContainer) {
                scrollContainer.removeEventListener('scroll', this.handleScroll);
            }
        }
    },
    template: `
       <v-container fluid style="height: calc(100vh - 180px)">
        <!-- Data Table -->
        <v-progress-linear
            color="primary"
            indeterminate
            v-if="isSearching"
        ></v-progress-linear>

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
            fixed-header
            density="comfortable"
        >
            <template v-slot:header.checkbox="{ header }">
                <v-checkbox
                    v-model="selectAll"
                    @change="toggleSelectAll"
                ></v-checkbox>
            </template>

            <template v-slot:header.attachments="{ header }">
                <v-icon small>mdi-paperclip</v-icon>
            </template>

            <template v-slot:item="{ item }">
                <tr class="cursor-default" :class="{'bg-cyan-lighten-5': selectedEmailId === item.id, 'bg-amber-lighten-4' : tempSelectedEmail.id === item.id}" @click="selectRow(item)" @dblclick="onRowClick(item)">
                    <td>
                        <v-checkbox
                            v-model="item.selected"
                            :value="item.id"
                            @change="onCheckboxChange(item)"
                        ></v-checkbox>
                    </td>

                    <!-- Updated Tag Template -->
                    <td>
                        <div style="width: 65px">
                            <v-chip
                                :style="{
                                    backgroundColor: getTagProperty('backgroundColor', item.additionalInfo?.tag?.id),
                                    color: getTagProperty('fontColor', item.additionalInfo?.tag?.id)
                                }"
                                size="small" 
                                v-if="item.additionalInfo && item.additionalInfo.tag && item.additionalInfo.tag.name"
                                @click="openAddTagDialog(item)"
                            >
                                <span class="text-truncate" style="width: 28px">{{ item.additionalInfo.tag.name }}</span>
                                <v-icon
                                    small
                                    class="ml-2"
                                    @click.stop="confirmUnassignTag(item)"
                                >
                                    mdi-close
                                </v-icon>

                                <v-tooltip activator="parent" location="top">{{ item.additionalInfo.tag.name }}</v-tooltip>
                            </v-chip>
                            <p class="text-decoration-none text-caption my-0 cursor-pointer" v-else @click="openAddTagDialog(item)">Add Tag</p>
                        </div>
                    </td>

                    <!-- Updated Agent Template -->
                    <td>
                        <div style="width: 85px">
                            <v-chip size="small" v-if="item.additionalInfo && item.additionalInfo.agent && item.additionalInfo.agent.name" @click="openAssignAgentDialog(item)">
                                <span class="text-truncate" style="width: 46px">{{ item.additionalInfo.agent.name }}</span>
                                <v-icon
                                    small
                                    class="ml-2"
                                    @click.stop="confirmUnassignAgent(item)"
                                >
                                mdi-close
                                </v-icon>

                                <v-tooltip activator="parent" location="top">{{ item.additionalInfo.agent.name }}</v-tooltip>
                            </v-chip>
                            <p class="text-decoration-none text-caption my-0 cursor-pointer" v-else @click="openAssignAgentDialog(item)">Assign Agent</p>
                        </div>
                    </td>

                    <td>
                        <div class="text-truncate" style="width: 140px;">
                            <span v-if="activeFolder.display_name==='Inbox'">
                                {{ JSON.parse(item.sender)?.emailAddress?.name || 'Unknown' }}<br>
                                {{ JSON.parse(item.sender)?.emailAddress?.address || 'Unknown' }}<br>

                                <v-tooltip location="top" activator="parent">
                                    <template v-slot:default>
                                        <span>
                                            {{ JSON.parse(item.sender)?.emailAddress?.name || 'Unknown' }}<br>
                                            {{ JSON.parse(item.sender)?.emailAddress?.address || 'Unknown' }}
                                        </span>
                                    </template>
                                </v-tooltip>
                            </span>
                            <span v-else>
                                {{ JSON.parse(item.to_recipients)[0]?.emailAddress?.name || 'Unknown' }}
                            </span>
                        </div>
                    </td>

                    <td>
                        <div class="text-truncate" style="width: 200px;">
                            {{ item.subject }}
                             
                            <v-tooltip activator="parent" location="top">{{ item.subject }}</v-tooltip>
                        </div>
                    </td>

                    <td>
                        <div style="width: 128px;">
                            <div class="text-caption"><v-icon class="text-grey-darken-2 me-1">mdi-calendar</v-icon>{{ item.received_datetime.split(' ')[0] }}</div>
                            <div class="text-caption"><v-icon class="text-grey-darken-2 me-1">mdi-clock</v-icon>{{ item.received_datetime.split(' ')[1] }}</div>
                        </div>
                    </td>

                    <td>
                        <v-icon small v-if="item.has_attachments" class="text-amber">mdi-paperclip</v-icon>
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
                            <template v-slot:item="{ props, item: categoryItem }">
                                <v-list-item v-bind="props" @click="handleEmailCategories(item.id, categoryItem.value)"></v-list-item>
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

    <AssignAgentDialog
        :visible="isAssignAgentDialogOpen"
        :unAssign="showUnAssignAgentModal"
        :agents="agents"
        :selectedEmail="currentEmailData"
        @agent-assigned="handleEmailAgent"
        @close="closeAssignAgentDialog"
        @error="showSnackbar"
    ></AssignAgentDialog>

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
