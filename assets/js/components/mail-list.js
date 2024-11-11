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
        isPreviewOpened: {
            type: Boolean,
            default: false
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
                { title: 'Status', value: 'tag' },
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
            rightClickSelectedEmail: {},
            tempSelectedEmail: {},
            isSearching: false,
            menu: false,
            menuX: 0,
            menuY: 0,
            users: [],
            userSearch: '',
            searchingUsers: false,
        };
    },
    methods: {
        showEmailRightClickMenu(event, email) {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            this.menuX = event.clientX;
            this.menuY = event.clientY + scrollTop;
            console.log('email', email)
            this.rightClickSelectedEmail = email;
            this.menu = true;
        },
        updateMenuPosition() {
            // Hide the menu when scrolling to avoid a fixed position issue
            if (this.menu) {
                this.menu = false;
            }
        },
        handleRightClickAction(action, email) {
            if (action === 'mark as read') {
                this.$emit('updateReadStatus', email.id, 1);
                this.rightClickSelectedEmail.isRead = true;
            } else if (action === 'mark as unread') {
                this.$emit('updateReadStatus', email.id, 0);
                this.rightClickSelectedEmail.isRead = false;
            }

            this.menu = false;
        },
        async onRowClick(row) {
            this.selectedEmailId = row.id;
            row.isRead = true;
            this.$emit('viewEmail', row.id);
        },
        selectRow(row) {
            this.tempSelectedEmail = row;
            this.selectedEmailId = row.id;

            if (this.isPreviewOpened) {
                row.isRead = true;
            }

            this.$emit('viewEmailIfPreviewOpened', row.id);
        },
        async loadEmails(offset = 0) {
            this.$emit('loading', 'Loading emails...');

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
                        isRead
                        orderLink
                        additionalInfo {
                            tag_id
                            tag_name
                            agent_id
                            user_id
                            order_id
                            order_title
                            ticket_id
                            ticket_title
                        }
                        categories {
                            id
                            name
                        }
                        userInfo {
                            id,
                            name,
                            email
                        }
                        orders {
                            id
                            order_number
                            link
                        }
                        tickets {
                            id
                            title
                            link
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
                this.$emit('loading', '');

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

                        if (email.userInfo && email.userInfo.id) {
                            email.user = {
                                id: email.userInfo.id,
                                userId: email.userInfo.id,
                                name: email.userInfo.name,
                                email: email.userInfo.email,
                            };
                        }

                        if (email.additionalInfo.order_id) {
                            email.order = {
                                id: email.additionalInfo.order_id,
                                order_number: email.additionalInfo.order_title,
                            };
                        }

                        if (email.additionalInfo.ticket_id) {
                            email.ticket = {
                                id: email.additionalInfo.ticket_id,
                                title: email.additionalInfo.ticket_title,
                            };
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
                this.$emit('loading', '');
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
            if (apiResponse.success) {
                if (tagId) {
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
            if (apiResponse.success) {
                if (agentId) {
                    this.showSnackbar(`Agent successfully assigned!`, 'success');
                } else {
                    this.showSnackbar(`Agent unassigned successfully!`, 'success');
                }

                // Update the local email data to reflect the new tag
                const email = this.loadedMails.find(mail => mail.id === emailId);
                if (email) {
                    email.additionalInfo.agent_id = agentId;
                    const assignedAgent = this.agents.find(agent => agent.id === agentId);

                    if (assignedAgent) {
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
        async handleEmailUser(emailId, userId) {
            const userOrdersResponse = await fetch(`${window.mailInbox.siteUrl}/graphql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: `
                    query GetOrdersByUserId($userId: Int!) {
                        ordersByUserId(userId: $userId) {
                            id
                            order_number
                            total
                        }
                    }
                  `,
                    variables: {
                        userId: userId,
                    },
                }),
            });

            const ordersByUser = await userOrdersResponse.json();
            const email = this.loadedMails.find(mail => mail.id === emailId);
            if (email) {
                email.orders = ordersByUser.data.ordersByUserId;
                email.order = null;
            }

            const ticketsByUserResponse = await fetch(`${window.mailInbox.siteUrl}/graphql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: `
                    query GetTicketsByUserId($userId: ID!) {
                        ticketsByUserId(userId: $userId) {
                            id
                            title
                        }
                    }
                  `,
                    variables: { userId: userId },
                }),
            });

            const ticketsByUser = await ticketsByUserResponse.json();
            if (email) {
                email.tickets = ticketsByUser.data.ticketsByUserId;
                email.ticket = null;
            }

            const apiResponse = await this.associateEmailAdditionalInformation(emailId, 'user_id', userId);
            if (apiResponse.success) {
                if (userId) {
                    this.showSnackbar(`User successfully assigned!`, 'success');
                } else {
                    this.showSnackbar(`User unassigned successfully!`, 'success');
                }
            } else {
                this.showSnackbar(`Failed to assign agent`, 'error');
            }
        },
        async handleEmailCategories(emailId, categoryId) {
            const apiResponse = await this.associateEmailAdditionalInformation(emailId, 'category_id', categoryId);
            if (apiResponse.success) {
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
        async fetchUsers(query, item) {
            if (!query && this.users.length > 0 && query == item.user.name) {
                return;
            }

            this.searchingUsers = true;
            const graphqlQuery = `
                query SearchUsers($search: String!) {
                    users(where: { search: $search }, first: 10) {
                        nodes {
                            id
                            userId
                            name
                            email
                        }
                    }
                }
            `;
            const variables = { search: query };

            try {
                const response = await fetch(`${window.mailInbox.siteUrl}/graphql`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query: graphqlQuery, variables }),
                });

                const result = await response.json();

                if (item) {
                    item.users = result.data.users.nodes || [];
                } else {
                    this.users = result.data.users.nodes || [];
                }
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                this.searchingUsers = false;
            }
        },
        async handleOrderChange(emailId, orderId) {
            const apiResponse = await this.associateEmailAdditionalInformation(emailId, 'order_id', orderId);
            if (apiResponse.success) {
                this.showSnackbar(`Order successfully assigned!`, 'success');
            } else {
                this.showSnackbar(`Failed to assign order`, 'error');
            }
        },
        async handleTicketChange(emailId, ticketId) {
            const apiResponse = await this.associateEmailAdditionalInformation(emailId, 'ticket_id', ticketId);
            if (apiResponse.success) {
                this.showSnackbar(`Ticket successfully assigned!`, 'success');
            } else {
                this.showSnackbar(`Failed to assign ticket`, 'error');
            }
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
        confirmUnassignTag(item) {
            this.currentEmailData = item;
            this.showUnAssignTagModal = true;
        },
        confirmUnassignAgent(item) {
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
    async mounted() {
        this.fetchTags();
        this.fetchCategories();
        this.fetchUsers('');
        this.$nextTick(() => {
            const dataTable = this.$refs.mailDataTable;
            if (dataTable) {
                const scrollContainer = dataTable.$el.querySelector('.v-table__wrapper');
                if (scrollContainer) {
                    scrollContainer.addEventListener('scroll', this.handleScroll);
                    scrollContainer.addEventListener('scroll', this.updateMenuPosition);
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
                scrollContainer.removeEventListener('scroll', this.updateMenuPosition);
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
            :search="userSearch"
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
                <tr class="cursor-default" :class="{'bg-cyan-lighten-5': selectedEmailId === item.id, 'bg-amber-lighten-4' : tempSelectedEmail.id === item.id, 'font-weight-bold' : !item.isRead }" @click="selectRow(item)" @contextmenu.prevent="showEmailRightClickMenu($event, item)" @dblclick="onRowClick(item)">
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
                            <p class="text-decoration-none text-caption my-0 cursor-pointer" :class="{ 'font-weight-black' : !item.isRead }" v-else @click="openAddTagDialog(item)">Add Tag</p>
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
                            <p class="text-decoration-none text-caption my-0 cursor-pointer" :class="{ 'font-weight-black' : !item.isRead }" v-else @click="openAssignAgentDialog(item)">Assign Agent</p>
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
                            <div class="text-caption" :class="{ 'font-weight-black' : !item.isRead }"><v-icon class="text-grey-darken-2 me-1">mdi-calendar</v-icon>{{ item.received_datetime.split(' ')[0] }}</div>
                            <div class="text-caption" :class="{ 'font-weight-black' : !item.isRead }"><v-icon class="text-grey-darken-2 me-1">mdi-clock</v-icon>{{ item.received_datetime.split(' ')[1] }}</div>
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

                    <td>
                        <div style="width: 150px">
                            <v-autocomplete
                                v-model="item.user"
                                :items="item.users ? item.users : users"
                                :loading="searchingUsers"
                                :search-input.sync="search"
                                item-title="name"
                                item-value="userId"
                                return-object
                                no-data-text="No users found"
                                hide-details
                                solo
                                label="User"
                                @update:search="fetchUsers($event, item)"
                                >
                                <template v-slot:item="{ props, item: userItem }">
                                    <v-list-item v-bind="props" @click="handleEmailUser(item.id, userItem.value)"></v-list-item>
                                </template>

                                <template v-slot:no-data>
                                    <span v-if="searchingUsers">Searching...</span>
                                    <span v-else>No users found</span>
                                </template>
                            </v-autocomplete>
                            
                            <v-select
                                :items="item.tickets"
                                return-object
                                item-title="title"
                                item-value="id"
                                label="Ticket"
                                outlined
                                v-model="item.ticket"
                            >
                                <template v-slot:item="{ props, item: ticketItem }">
                                    <v-list-item v-bind="props" @click="handleTicketChange(item.id, ticketItem.value)"></v-list-item>
                                </template>
                            </v-select>
                        </div>
                    </td>
                    <td>
                        <div style="width: 100px">
                            <v-select
                                :items="item.orders"
                                return-object
                                item-title="order_number"
                                item-value="id"
                                label="Order"
                                outlined
                                v-model="item.order"
                            >
                                <template v-slot:item="{ props, item: orderItem }">
                                    <v-list-item v-bind="props" @click="handleOrderChange(item.id, orderItem.value)"></v-list-item>
                                </template>
                            </v-select>
                        </div>
                    </td>
                </tr>
            </template>

        </v-data-table>
    </v-container>

    <v-menu
        v-model="menu"
        :style="{ left: menuX + 'px', top: menuY + 'px' }"
        absolute
    >
        <v-list class="text-grey-darken-3">
            <v-list-item v-if="!rightClickSelectedEmail.isRead" @click="handleRightClickAction('mark as read', rightClickSelectedEmail)">
                <v-icon left class="me-2">mdi-eye-outline</v-icon>
                Mark as Read
            </v-list-item>
            <v-list-item v-if="rightClickSelectedEmail.isRead" @click="handleRightClickAction('mark as unread', rightClickSelectedEmail)">
                <v-icon left class="me-2">mdi-eye-off-outline</v-icon>
                Mark as Unread
            </v-list-item>
        </v-list>
    </v-menu>

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
