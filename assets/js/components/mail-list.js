import AssignTagDialog from './tag/assign-tag-dialog.js';
import AssignAgentDialog from './agent/assign-agent-dialog.js';
import CreateOrderDialog from './orders/create-order-dialog.js';

export default {
    name: 'MailList',
    components: {
        AssignTagDialog,
        AssignAgentDialog,
        VueDatePicker,
        CreateOrderDialog
    },
    emits: ['viewEmail', 'updateReadStatus', 'viewEmailIfPreviewOpened', 'loadingText', 'createLog'],
    props: {
        activeAccount: {
            type: Object,
            required: true
        },
        filters: {
            type: Object,
            default: {}
        },
        categories: {
            type: Array,
            required: true
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
        },
        isExpandedFilters: {
            type: Boolean,
            default: false
        },
        activeSyncingFolder: {
            type: Object,
            default: null
        }
    },
    data() {
        return {
            loadedMails: [],
            headers: this.generateHeaders(),
            search: '',
            selectedEmailId: 0,
            tags: [],
            isAddTagDialogOpen: false,
            isAddOrderDialogOpen: false,
            isAssignAgentDialogOpen: false,
            showUnAssignTagModal: false,
            showUnAssignAgentModal: false,
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
            loadingMoreEmails: false,
            emailCounts: {},
            selectedCountDate: new Date(),
            loadingEmailCounts: true,
            selectedCountsFilterAgent: null,
            products: [],
            pendingActionDetails: null,
            currentEmailData: null
        };
    },
    computed: {
        isWoocommerceInstalled() {
            return window.mailInbox.isWoocommerceInstalled;
        },
        isAwesomeSupportInstalled() {
            return window.mailInbox.isAwesomeSupportInstalled;
        }
    },
    methods: {
        generateHeaders() {
            const baseHeaders = [
                { title: 'Status', value: 'tag' },
                { title: 'Agent', value: 'agent' },
                { title: 'From', value: 'from' },
                { title: 'Subject', value: 'subject' },
                { title: 'Date/Time', value: 'received_datetime' },
                { title: 'Attachments', value: 'attachments' },
                { title: 'Category', value: 'category' }
            ];

            if (window.mailInbox.isAwesomeSupportInstalled) {
                baseHeaders.push({ title: 'Ticket', value: 'selectedTicket' });
            }

            if (window.mailInbox.isWoocommerceInstalled) {
                baseHeaders.push({ title: 'Order', value: 'selectedOrder' });
            }

            return baseHeaders;
        },
        showEmailRightClickMenu(event, email) {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            this.menuX = event.clientX;
            this.menuY = event.clientY + scrollTop;
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
        async fetchEmailCounts() {
            // GraphQL query
            const query = `
                query GetEmailCounts($folderId: Int, $receivedDate: String, $agentId: Int) {
                    emailCounts(folder_id: $folderId, received_date: $receivedDate, agent_id: $agentId) {
                        assignedEmailsCount
                        unassignedEmailsCount
                        authUserAssignedEmailsCount
                        authUserUnassignedEmailsCount
                    }
                }
            `;

            this.loadingEmailCounts = true;

            const formatDate = (date) => {
                if (!date) return null;
                const d = new Date(date);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, "0"); // Add leading zero
                const day = String(d.getDate()).padStart(2, "0"); // Add leading zero
                return `${year}-${month}-${day}`;
            };

            try {
                const response = await fetch(`${window.mailInbox.siteUrl}/graphql`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query,
                        variables: {
                            folderId: parseInt(this.activeFolder?.id) || null,
                            receivedDate: formatDate(this.selectedCountDate),
                            agentId: parseInt(this.selectedCountsFilterAgent?.value) || null
                        },
                    }),
                });

                if (!response.ok) {
                    throw new Error(`GraphQL error: ${response.statusText} (HTTP ${response.status})`);
                }

                const result = await response.json();
                this.loadingEmailCounts = false;

                // Check for GraphQL errors in the response
                if (result.errors) {
                    throw new Error(`GraphQL error: ${result.errors.map(err => err.message).join(', ')}`);
                }

                this.emailCounts = result.data.emailCounts;
            } catch (error) {
                console.error("Error fetching email counts:", error.message);
                throw error; // Rethrow the error so the caller can handle it
            }
        },
        async loadEmails(offset = 0) {
            //this.$emit('loadingText', 'Loading emails...');

            if (offset === 0) {
                this.loading = false;
                this.allLoaded = false;
            }

            if (this.loading || this.allLoaded || !this.activeFolder) return;

            this.loading = true;
            this.loadingMoreEmails = true;

            const agentIdValue = this.filters.agentId ? parseInt(this.filters.agentId) : null;
            let filterCategories = this.filters.categories;
            if (!filterCategories) {
                filterCategories = ''
            } else {
                filterCategories = filterCategories.map(category => category.id).join(',');
            }

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
                            categories: "${filterCategories || 'null'}",
                        }) {
                        id
                        subject
                        received_datetime
                        to_recipients
                        sender
                        has_attachments
                        isRead
                        orderLink
                        ticketLink
                        additionalInfo {
                            tag_id
                            tag_name
                            agent_id
                            user_id
                            order_id
                            order_title
                            ticket_id
                            ticket_title
                            tag_log
                        }
                        categories {
                            id
                            name
                            log
                        }
                        userInfo {
                            id,
                            name,
                            email
                        }
                        orders {
                            id
                            order_number
                        }
                        tickets {
                            id
                            title
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
                //this.$emit('loadingText', '');

                if (apiResponse.errors) {
                    console.error('GraphQL Errors:', apiResponse.errors);
                }

                if (apiResponse.data.getEmailsByFolderId) {
                    this.loading = false;

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
                        } else if (email.orders.length > 0) {
                            email.order = {
                                id: email.orders[0].id,
                                order_number: email.orders[0].order_number,
                            };
                            email.orderLink = this.editPostLink(email.order.id);
                        }

                        if (email.additionalInfo.ticket_id) {
                            email.ticket = {
                                id: email.additionalInfo.ticket_id,
                                title: email.additionalInfo.ticket_title,
                            };
                        } else if (email.tickets.length > 0) {
                            email.ticket = {
                                id: email.tickets[0].id,
                                title: email.tickets[0].title,
                            };
                            email.ticketLink = this.editPostLink(email.ticket.id);
                        }
                        return email;
                    });

                    if (offset === 0) {
                        this.loadedMails = newEmails;
                        await this.fetchEmailCounts();
                    } else {
                        this.loadedMails = [...this.loadedMails, ...newEmails];
                    }

                    this.loadingMoreEmails = false;

                    //this.$emit('loading', '');
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
        editPostLink(id) {
            return `${window.mailInbox.adminUrl}post.php?post=${id}&action=edit`;
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
        async handleOrderSuccess(response){
            this.isAddOrderDialogOpen = false;
            await this.handleEmailCategories(this.pendingActionDetails.emailId, this.pendingActionDetails.categoryId, '');
            await this.handleEmailUser(this.pendingActionDetails.emailId, response.userId);

            const email = this.loadedMails.find(mail => mail.id === this.pendingActionDetails.emailId);
            email.order = {
                id: response.orderId,
                order_number: response.orderNumber,
            };
            email.orderLink = this.editPostLink(response.orderId);

        },
        async handleEmailTag(emailId, tagId) {
            const apiResponse = await this.associateEmailAdditionalInformation(emailId, 'tag_id', tagId);

            if (apiResponse.success) {
                if (tagId) {
                    this.showSnackbar(`Tag successfully assigned!`, 'success');
                } else {
                    this.showSnackbar(`Tag unassigned successfully!`, 'success');
                }

                if (apiResponse.data.log) {
                    this.$emit('createLog', emailId, apiResponse.data.log)
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

                if (apiResponse.data.log) {
                    this.$emit('createLog', emailId, apiResponse.data.log)
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
                        userId: Number(userId),
                    },
                }),
            });

            const ordersByUser = await userOrdersResponse.json();
            const email = this.loadedMails.find(mail => mail.id === emailId);
            if (email) {
                email.orders = ordersByUser.data.ordersByUserId;
                email.order = null;
                email.orderLink = ``;
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
                email.ticketLink = ``;
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
        async handleEmailCategories(emailId, categoryId, categoryName = '') {
            if (categoryName && categoryName.toLowerCase() === "new order") {
                this.isAddOrderDialogOpen = true;

                let defaultUserId = this.loadedMails.find(email => email.id === emailId).userInfo?.id || null;

                this.pendingActionDetails = {
                    emailId,
                    categoryId,
                    defaultUserId
                }
                return;
            }

            const apiResponse = await this.associateEmailAdditionalInformation(emailId, 'category_id', categoryId);
            if (apiResponse.success) {
                if (apiResponse.data.log) {
                    this.$emit('createLog', emailId, apiResponse.data.log)
                }

                this.showSnackbar(`Category successfully assigned!`, 'success');
            } else {
                this.showSnackbar(`Failed to assign category`, 'error');
            }
        },
        convertToIST(dateString) {
            // Convert the string to a Date object (appending ' UTC' to treat it as UTC)
            const date = new Date(dateString + ' UTC');

            // Convert to IST using the Asia/Kolkata timezone
            const options = {
                timeZone: 'Asia/Kolkata', // Specify IST timezone
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            };

            const formatter = new Intl.DateTimeFormat('en-IN', options);
            const formattedDate = formatter.format(date);

            const [day, month, year, hour, minute, second] = formattedDate.split(/[\s,\/:-]+/);
            return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
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
                    mailInboxUsers(where: { search: $search }, first: 10) {
                        id
                        userId
                        name
                        email
                        phoneNumber
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
                    item.users = result.data.mailInboxUsers || [];
                } else {
                    this.users = result.data.mailInboxUsers || [];
                }
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                this.searchingUsers = false;
            }
        },
        async fetchProducts() {
            const graphqlQuery = `
                query GetAllProducts {
                    mailInboxAllProducts {
                        id
                        name
                    }
                }
            `;

            const response = await fetch(`${window.mailInbox.siteUrl}/graphql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: graphqlQuery }),
            });

            const products = await response.json();
            if(products?.data?.mailInboxAllProducts){
                this.products = products?.data?.mailInboxAllProducts;
            }
        },
        async handleOrderChange(emailId, orderId) {
            const apiResponse = await this.associateEmailAdditionalInformation(emailId, 'order_id', orderId);
            if (apiResponse.success) {
                const email = this.loadedMails.find(mail => mail.id === emailId);
                email.orderLink = this.editPostLink(orderId);

                this.showSnackbar(`Order successfully assigned!`, 'success');
            } else {
                this.showSnackbar(`Failed to assign order`, 'error');
            }
        },
        async handleTicketChange(emailId, ticketId) {
            const apiResponse = await this.associateEmailAdditionalInformation(emailId, 'ticket_id', ticketId);
            if (apiResponse.success) {
                const email = this.loadedMails.find(mail => mail.id === emailId);
                email.ticketLink = this.editPostLink(ticketId);

                this.showSnackbar(`Ticket successfully assigned!`, 'success');
            } else {
                this.showSnackbar(`Failed to assign ticket`, 'error');
            }
        },
        handleScroll(event) {
            const { scrollTop, scrollHeight, clientHeight } = event.target;

            // Calculate the total scrollable height
            const totalScrollableHeight = scrollHeight - clientHeight;

            // Calculate the scroll position as a percentage
            const scrollPercentage = scrollTop / totalScrollableHeight;

            // Load more emails when the user has scrolled past 50% of the content
            if (scrollPercentage >= 0.5) {
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
                this.selectAll = false;
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
        async handleCountDateChange(newDate) {
            this.selectedCountDate = newDate;
            this.fetchEmailCounts();
        },
        handleCountFilterAgent(item) {
            this.selectedCountsFilterAgent = item;
            this.fetchEmailCounts();
        },
        clearCountsAgentSelection() {
            this.selectedCountsFilterAgent = null;
            this.fetchEmailCounts();
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
                if (this.activeSyncingFolder.local_folder_id === this.activeFolder.id) {
                    this.loadEmails();
                }
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
        await this.fetchTags();
        await this.fetchUsers('');
        await this.fetchProducts();
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
       <v-container fluid :style="{ height: isExpandedFilters ? 'calc(100vh - 220px)' : 'calc(100vh - 186px)' }" class="position-relative pt-0">
        <!-- Data Table -->
        <v-progress-linear
            color="primary"
            indeterminate
            v-if="isSearching"
        ></v-progress-linear>

        <v-skeleton-loader
            v-if="loadingEmailCounts"
            type="text"
            class="ma-0 w-50"
        ></v-skeleton-loader>

        <div v-else class="d-flex ga-3 align-center">
            <p class="ma-0 text-body-1">{{emailCounts.unassignedEmailsCount}} emails not resolved for </p>
            <vue-date-picker v-model="selectedCountDate" :max-date="new Date()" class="w-25" placeholder="Enter date" :enable-time-picker="false" text-input auto-apply @update:model-value="handleCountDateChange"></vue-date-picker>
            <div class="w-25">
                <v-select
                    label="Select Agent"
                    v-model="selectedCountsFilterAgent"
                    :items="agents"
                    item-text="name"
                    item-value="id"
                    return-object
                    density="compact"
                    outlined
                    hide-details
                    
                >
                    <!-- Display Selected Tag as a Chip -->
                    <template v-slot:selection="{ item }">
                        {{ item.props.title.name }}
                        <v-icon @click.stop="clearCountsAgentSelection" class="position-absolute right-0">mdi-close</v-icon>
                    </template>
                                        
                    <!-- Display Each Dropdown Item with a Chip -->
                    <template v-slot:item="{ item, attrs }">
                        <v-list-item
                            v-bind="attrs"
                            :key="item.id"
                            @click="handleCountFilterAgent(item)"
                        >
                            <v-list-item-content>{{ item.raw.name }}</v-list-item-content>
                        </v-list-item>
                    </template>
                </v-select>
            </div>
        </div>

        <div class="w-100" v-if="!loadingEmailCounts">
            <p class="ma-0 text-body-1 text-red">You have {{emailCounts.authUserUnassignedEmailsCount}} unresolved emails</p>
        </div>

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

                                <v-tooltip activator="parent" location="top">{{ item.additionalInfo.tag_log }}</v-tooltip>
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
                            <span v-if="activeFolder.display_name==='Inbox' || activeFolder.display_name==='Junk Email'">
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
                            <div class="text-caption" :class="{ 'font-weight-black' : !item.isRead }"><v-icon class="text-grey-darken-2 me-1">mdi-calendar</v-icon>{{ convertToIST(item.received_datetime).split(' ')[0] }}</div>
                            <div class="text-caption" :class="{ 'font-weight-black' : !item.isRead }"><v-icon class="text-grey-darken-2 me-1">mdi-clock</v-icon>{{ convertToIST(item.received_datetime).split(' ')[1] }}</div>
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
                                <v-list-item v-bind="props" @click="handleEmailCategories(item.id, categoryItem.value, categoryItem.title)"></v-list-item>
                            </template>
                            <template v-slot:selection="{ item: categoryItem, index }">
                                <v-chip v-if="index < 2">
                                    <span>{{ item.categories[index].name }}</span>
                                </v-chip>
                                <v-tooltip activator="parent" location="top">{{ item.categories[index].log }}</v-tooltip>

                                
                                <span
                                    v-if="index === 2"
                                    class="text-grey text-caption align-self-center"
                                >
                                    (+{{ item.categories.length - 2 }} others)
                                </span>
                            </template>
                        </v-select>
                    </td>

                    <td v-if="isAwesomeSupportInstalled">
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

                            <a :href="item.ticketLink" v-if="item.ticketLink" target="_blank">View Ticket</a>
                        </div>
                    </td>
                    <td v-if="isWoocommerceInstalled">
                        <div style="width: 100px">
                            <v-autocomplete
                                v-if="!isAwesomeSupportInstalled"
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
                            <a :href="item.orderLink" v-if="item.orderLink" target="_blank">View Order</a>
                        </div>
                    </td>
                </tr>
            </template>
        </v-data-table>

        <v-snackbar
            v-model="loadingMoreEmails"
            color="#5865f2"
            location="bottom"
            :timeout="-1"
            elevation="0"
            >
            Loading emails...
        </v-snackbar>
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

    <CreateOrderDialog :pendingActionDetails="pendingActionDetails" :agents="agents" @orderCreatedSuccess="handleOrderSuccess" @close="isAddOrderDialogOpen = false" :users="users" :products="products" :visible="isAddOrderDialogOpen"></CreateOrderDialog>

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
