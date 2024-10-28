import AddTag from './components/tag/add.js';
import EditTag from './components/tag/edit.js';

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
                tags: [],
                headers: [
                    { title: '#', value: 'index' },
                    { title: 'Tag Name', value: 'name' },
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
            AddTag,
            EditTag
        },
        methods: {
            async fetchTags() {
                try {
                    const query = `
                    query {
                        mailInboxTags {
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

                    if (apiResponse.data.mailInboxTags) {
                        this.tags = apiResponse.data.mailInboxTags;
                    }
                } catch (error) {
                    this.loading = false;
                }
            },
            confirmDelete(tagId) {
                this.tagToDelete = tagId;
                this.showDeleteModal = true;
            },
            async deleteTag() {
                try {
                    const query = `
                    mutation {
                        deleteTagById(input: {id: ${this.tagToDelete}}) {
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
                    if (apiResponse.data.deleteTagById.success) {
                        this.showSnackbar('Tag deleted successfully!', 'success');
                        this.fetchTags();
                    } else {
                        this.showSnackbar('Failed to delete tag.', 'error');
                    }
                } catch (error) {
                    this.showSnackbar('Failed to delete tag.', 'error');
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
            this.fetchTags();
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
                    <div v-else class="text-h6 mb-3">{{ tags.length }} Tags</div>
                    
                    <AddTag @reloadTags="fetchTags" />
                </div>

                <!-- Data Table -->
                <v-data-table
                :headers="headers"
                :items="tags"
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
                    <v-chip
                        :style="{ backgroundColor: item.backgroundColor, color: item.fontColor, padding: '5px', borderRadius: '5px' }"
                        size="small">
                        {{ item.name }}
                    </v-chip>
                </template>

                <!-- Custom slot for Actions -->
                <template v-slot:item.actions="{ item }">
                    <EditTag :tag="item" @reloadTags="fetchTags" />
                    <v-btn icon color="red" size="x-small" class="m-1" @click.stop="confirmDelete(item.id)">
                        <v-icon>mdi-delete</v-icon>
                    </v-btn>
                </template>
            </v-data-table>

            <!-- Delete Confirmation Modal -->
            <v-dialog v-model="showDeleteModal" max-width="500">
                <v-card>
                    <v-card-title class="headline">Delete Tag</v-card-title>
                    <v-card-text class="text-body-2">Are you sure you want to delete this tag? This action will delete whole related data with this tag.</v-card-text>

                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <!-- Cancel Button -->
                        <v-btn color="grey" text @click="showDeleteModal = false">
                            Cancel
                        </v-btn>
                        <!-- Confirm Delete Button -->
                        <v-btn class="bg-red" @click="deleteTag">
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
    app.mount("#manage-tags");
});
