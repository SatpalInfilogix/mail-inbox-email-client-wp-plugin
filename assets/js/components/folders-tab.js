export default {
    name: 'MailFolder',
    props: {
        activeFolder: {
            type: Object,
            default: () => ({})
        },
        tabFolders: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            activeTab: 0,
        }
    },
    methods: {
        getFolderIcon(displayName) {
            switch (displayName) {
                case 'Inbox':
                    return 'mdi-inbox';
                case 'Sent Items':
                    return 'mdi-send';
                case 'Drafts':
                    return 'mdi-file-document-edit';
                case 'Deleted Items':
                    return 'mdi-trash-can';
                case 'Junk Email':
                case 'Spam':
                    return 'mdi-alert-circle';
                case 'Archive':
                    return 'mdi-archive';
                case 'Conversation History':
                    return 'mdi-message-text';
                case 'Outbox':
                    return 'mdi-tray-arrow-up';
                case 'Scheduled':
                    return 'mdi-calendar-clock';
                default:
                    return 'mdi-folder';
            }
        },
        selectFolder(folder) {
            this.$emit('setActiveFolder', folder);
        },
        closeFolderFromTab(folder) {
            this.$emit('folderTab', folder, 'remove');
        }
    },
    template: `
        <v-container v-if="tabFolders.length > 0">
            <v-card v-if="tabFolders.length > 1">
                <v-tabs
                v-model="activeTab"
                bg-color="#5865f2"
                >
                     <v-tab v-for="(tabFolder, index) in tabFolders" :key="tabFolder.id">
                        {{ tabFolder.shortname }}
                    </v-tab>
                </v-tabs>

                <v-card-text>
                    <v-tabs-window v-model="activeTab">
                        <v-tabs-window-item v-for="tabFolder in tabFolders" :key="tabFolder.id" value="tabFolder.id">
                            <v-chip
                                class="ma-2"
                                closable
                                label
                                v-for="folder in tabFolder.folders"
                                :key="folder.id"
                                :color="folder.id === activeFolder.id ? '#5865f2' : 'default'"
                                :variant="folder.id === activeFolder.id ? 'flat' : 'elevated'"
                                @click="selectFolder(folder)"
                                @click:close="closeFolderFromTab(folder)"
                            >
                                <v-icon class="me-2">{{ getFolderIcon(folder.display_name) }}</v-icon>
                                {{ folder.display_name }}
                            </v-chip>
                        </v-tabs-window-item>
                    </v-tabs-window>
                </v-card-text>
            </v-card>
            <v-card v-else-if="tabFolders.length === 1">
                <v-chip
                    class="ma-2"
                    closable
                    label
                    v-for="folder in tabFolders[0].folders"
                    :key="folder.id"
                    :color="folder.id === activeFolder.id ? '#5865f2' : 'default'"
                    :variant="folder.id === activeFolder.id ? 'flat' : 'elevated'"
                    @click="selectFolder(folder)"
                    @click:close="closeFolderFromTab(folder)"
                >
                    <v-icon class="me-2">{{ getFolderIcon(folder.display_name) }}</v-icon>
                    {{ folder.display_name }}
                </v-chip>
            </v-card>
        </v-container>
    `
}
