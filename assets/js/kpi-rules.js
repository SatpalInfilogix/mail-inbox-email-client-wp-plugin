import AddKpiRule from './components/kpi-rules/add.js';
import EditKpiRule from './components/kpi-rules/edit.js';

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
                categories: [],
                tags: [],
                rules: [],
                headers: [
                    { title: 'ID', value: 'id' },
                    { title: 'Default Points', value: 'defaultPoints' },
                    { title: 'Category', value: 'categoryId' },
                    { title: 'Tag', value: 'tagId' },
                    { title: 'Time', value: 'time' },
                    { title: 'Action Type', value: 'ruleActionType' },
                    { title: 'Points', value: 'points' },
                    { title: 'Actions', value: 'actions', sortable: false },
                ],
                showDeleteModal: false,
                snackbar: false,
                snackbarMessage: '',
                snackbarColor: 'success',
                loading: true
            };
        },
        components: {
            AddKpiRule,
            EditKpiRule
        },
        methods: {
            async fetchData(query) {
                try {
                    const response = await fetch(`${window.mailInbox.siteUrl}/graphql`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ query })
                    });
                    const apiResponse = await response.json();
                    return apiResponse.data || {};
                } catch (error) {
                    console.error("Fetch error:", error);
                    return {};
                }
            },
            async fetchCategories() {
                const data = await this.fetchData(`
                    query {
                        mailInboxCategories(status: "Active") {
                            id
                            name
                            fontColor
                            backgroundColor
                        }
                    }`);
                this.categories = data.mailInboxCategories || [];
            },
            async fetchTags() {
                const data = await this.fetchData(`
                    query {
                        mailInboxTags(status: "Active") {
                            id
                            name
                            fontColor
                            backgroundColor
                        }
                    }`);
                this.tags = data.mailInboxTags || [];
            },
            async fetchKPIRules() {
                const data = await this.fetchData(`
                    query GetAllKpiRules {
                        kpiRules {
                            id
                            time
                            defaultPoints
                            categoryId
                            tagId
                            actionType
                            points
                        }
                    }`);
                this.rules = data.kpiRules || [];
            },
            confirmDelete(ruleId) {
                this.ruleToDelete = ruleId;
                this.showDeleteModal = true;
            },
            async deleteRule() {
                try {
                    const query = `
                    mutation {
                        deleteKPIRuleById(input: {id: ${this.ruleToDelete}}) {
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

                    if (apiResponse.data.deleteKPIRuleById.success) {
                        this.showSnackbar('Rule deleted successfully!', 'success');
                        this.fetchKPIRules();
                    } else {
                        this.showSnackbar('Failed to delete rule.', 'error');
                    }
                } catch (error) {
                    this.showSnackbar('Failed to delete rule.', 'error');
                } finally {
                    this.showDeleteModal = false;
                }
            },
            showSnackbar(message, color = 'success') {
                this.snackbarMessage = message;
                this.snackbarColor = color;
                this.snackbar = true;
            }
        },
        async mounted() {
            await this.fetchCategories();
            await this.fetchTags();
            await this.fetchKPIRules();
            this.loading = false;
        },
        template: `
        <v-container fluid class="pl-0" style="height: calc(100vh - 120px)">
            <div class="d-flex justify-space-between align-center">
                <div class="text-h5">Mail Inbox KPI Rules</div>

                <AddKpiRule :tags="tags"
                    :categories="categories"
                    @reloadRules="fetchKPIRules"
                />
            </div>

            <v-card class="mt-4" style="min-height: 400px">
                <v-card-text>
                    <v-skeleton-loader
                        v-if="loading"
                        type="text"
                        class="text-h6 mb-3"
                        style="width: 200px;" 
                    ></v-skeleton-loader>
                    <div v-else class="text-h6 mb-3">{{ rules.length }} existing rules</div>
                    
                    <v-data-table
                        :headers="headers"
                        :items="rules"
                        class="elevation-1 mt-4"
                        item-key="id"
                    >
                        <template v-slot:body v-if="loading">
                            <tr v-for="i in 5" :key="i">
                                <td><v-skeleton-loader type="text" width="40px"></v-skeleton-loader></td>
                                <td><v-skeleton-loader type="text" width="60px"></v-skeleton-loader></td>
                                <td><v-skeleton-loader type="text" width="100px"></v-skeleton-loader></td>
                                <td><v-skeleton-loader type="text" width="100px"></v-skeleton-loader></td>
                                <td><v-skeleton-loader type="text" width="100px"></v-skeleton-loader></td>
                                <td><v-skeleton-loader type="text" width="100px"></v-skeleton-loader></td>
                                <td><v-skeleton-loader type="text" width="50px"></v-skeleton-loader></td>
                                <td><v-skeleton-loader type="text" width="80px"></v-skeleton-loader></td>
                            </tr>
                        </template>
                        
                        <template v-slot:item.categoryId="{ item }">
                        <v-chip
                            :style="{ backgroundColor: categories.find(category => category.id == item.categoryId)?.backgroundColor, color: categories.find(category => category.id == item.categoryId)?.fontColor, padding: '5px', borderRadius: '5px' }"
                            size="small">
                            {{ categories.find(category => category.id == item.categoryId)?.name || 'N/A' }}
                            </v-chip>
                        </template>

                        <template v-slot:item.ruleActionType="{ item }">
                            {{ item.actionType || 'N/A' }}
                        </template>

                        <template v-slot:item.time="{ item }">
                            <div v-if="item.time">
                                {{ Math.floor(item.time / 60) > 0 ? Math.floor(item.time / 60) + ' hours ' : '' }}
                                {{ item.time % 60 > 0 ? (item.time % 60) + ' minutes' : '' }}
                            </div>
                            <div v-else>N/A</div>
                        </template>
                        
                        <template v-slot:item.tagId="{ item }">
                            <v-chip
                                :style="{ backgroundColor: tags.find(tag => tag.id == item.tagId)?.backgroundColor, color: tags.find(tag => tag.id == item.tagId)?.fontColor, padding: '5px', borderRadius: '5px' }"
                                size="small">
                                {{ tags.find(tag => tag.id == item.tagId)?.name || 'N/A' }}
                            </v-chip>
                        </template>

                        <template v-slot:item.actions="{ item }">
                            <EditKpiRule :tags="tags"
                                :categories="categories"
                                :rule="item" 
                                @reloadRules="fetchKPIRules" 
                            />
                            
                            <v-btn icon color="red" size="x-small" class="m-1" @click.stop="confirmDelete(item.id)">
                                <v-icon>mdi-delete</v-icon>
                            </v-btn>
                        </template>
                    </v-data-table>
                </v-card-text>
            </v-card>

            <!-- Delete Confirmation Modal -->
            <v-dialog v-model="showDeleteModal" max-width="500">
                <v-card>
                    <v-card-title class="headline">Delete Rule</v-card-title>
                    <v-card-text class="text-body-2">Are you sure you want to delete this rule?</v-card-text>

                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <!-- Cancel Button -->
                        <v-btn color="grey" text @click="showDeleteModal = false">
                            Cancel
                        </v-btn>
                        <!-- Confirm Delete Button -->
                        <v-btn class="bg-red" @click="deleteRule">
                            Confirm
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </v-container>


        <v-snackbar
            v-model="snackbar"
            :color="snackbarColor"
            timeout="3000"
            top
        >
            {{ snackbarMessage }}
        </v-snackbar>
        `,
    });

    // Use Vuetify
    app.use(vuetify);

    // Mount the app
    app.mount("#kpi-rules");
});
