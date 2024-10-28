import AddCategory from './components/category/add.js';
import EditCategory from './components/category/edit.js';

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
                headers: [
                    { title: '#', value: 'index' },
                    { title: 'Category Name', value: 'name' },
                    { title: 'Background Color', value: 'backgroundColor' },
                    { title: 'Font Color', value: 'fontColor' },
                    { title: 'Preview', value: 'preview' },
                    { title: 'Status', value: 'status' },
                    { title: 'Actions', value: 'actions', sortable: false },
                ],
                loading: true,
                showDeleteModal: false,
                snackbar: false,
                snackbarMessage: '',
                snackbarColor: 'success',
            };
        },
        components: {
            AddCategory,
            EditCategory
        },
        methods: {
            async fetchCategories() {
                try {
                    const query = `
                    query {
                        mailInboxCategories {
                            id
                            name
                            fontColor
                            backgroundColor
                            status
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

                    if (apiResponse.data.mailInboxCategories) {
                        this.categories = apiResponse.data.mailInboxCategories;
                    }
                } catch (error) {
                    this.loading = false;
                }
            },
            confirmDelete(categoryId) {
                this.categoryToDelete = categoryId;
                this.showDeleteModal = true;
            },
            async deleteCategory() {
                try {
                    const query = `
                    mutation {
                        deleteCategoryById(input: {id: ${this.categoryToDelete}}) {
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
                    if (apiResponse.data.deleteCategoryById.success) {
                        this.showSnackbar('Category deleted successfully!', 'success');
                        this.fetchCategories();
                    } else {
                        this.showSnackbar('Failed to delete category.', 'error');
                    }
                } catch (error) {
                    this.showSnackbar('Failed to delete category.', 'error');
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
        mounted() {
            this.fetchCategories();
        },
        template: `
           <v-container fluid style="height: calc(100vh - 100px)">
                <div class="d-flex justify-space-between">
                    <v-skeleton-loader
                        v-if="loading"
                        type="text"
                        class="text-h6 mb-3"
                        style="width: 200px;" 
                    ></v-skeleton-loader>
                    <div v-else class="text-h6 mb-3">{{ categories.length }} Categories</div>
                    
                    <AddCategory @reloadCategories="fetchCategories" />
                </div>

                <!-- Data Table -->
                <v-data-table
                :headers="headers"
                :items="categories"
                class="elevation-1 h-100"
                item-key="id"
                >
                <template v-slot:body v-if="loading">
                    <tr v-for="i in 10" :key="i">
                        <td><v-skeleton-loader type="text" width="40px"></v-skeleton-loader></td>
                        <td><v-skeleton-loader type="text" width="200px"></v-skeleton-loader></td>
                        <td><v-skeleton-loader type="text" width="150px"></v-skeleton-loader></td>
                        <td><v-skeleton-loader type="text" width="150px"></v-skeleton-loader></td>
                        <td><v-skeleton-loader type="text" width="150px"></v-skeleton-loader></td>
                        <td><v-skeleton-loader type="text" width="100px"></v-skeleton-loader></td>
                        <td><v-skeleton-loader type="text" width="50px"></v-skeleton-loader></td>
                    </tr>
                </template>

                <template v-slot:item.index="{ index }">
                    {{ index + 1 }}
                </template>

                 <template v-slot:item.preview="{ item }">
                    <div :style="{ backgroundColor: item.backgroundColor, color: item.fontColor, padding: '5px', borderRadius: '5px' }">
                        {{ item.name }}
                    </div>
                </template>

                <!-- Custom slot for Actions -->
                <template v-slot:item.actions="{ item }">
                    <EditCategory :category="item" @reloadCategories="fetchCategories" />
                    <v-btn icon color="red" size="x-small" class="m-1" @click.stop="confirmDelete(item.id)">
                        <v-icon>mdi-delete</v-icon>
                    </v-btn>
                </template>
            </v-data-table>

            <!-- Delete Confirmation Modal -->
            <v-dialog v-model="showDeleteModal" max-width="500">
                <v-card>
                    <v-card-title class="headline">Delete Category</v-card-title>
                    <v-card-text class="text-body-2">Are you sure you want to delete this category? This action will delete whole related data with this category.</v-card-text>

                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <!-- Cancel Button -->
                        <v-btn color="grey" text @click="showDeleteModal = false">
                            Cancel
                        </v-btn>
                        <!-- Confirm Delete Button -->
                        <v-btn class="bg-red" @click="deleteCategory">
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
    app.mount("#manage-categories");
});
