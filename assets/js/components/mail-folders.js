import FolderItem from './folder-item.js';

export default {
    name: 'MailFolder',
    components: {
        FolderItem,
    },
    props: {
        account: {
            type: Object,
            required: true
        },
        activeFolder: {
            type: Object,
            default: {}
        }
    },
    data() {
        return {
            menu: false,
            menuX: 0,
            menuY: 0,
            selectedFolder: null,
        };
    },
    computed: {
        folderTree() {
            const folders = this.account.folders.map(folder => ({ ...folder }));
            const folderMap = {};
            folders.forEach(folder => {
                folder.children = [];
                folderMap[folder.id] = folder;
            });

            const tree = [];
            folders.forEach(folder => {
                if (folder.local_folder_parent_id) {
                    const parent = folderMap[folder.local_folder_parent_id];
                    if (parent) {
                        parent.children.push(folder);
                    }
                } else {
                    tree.push(folder);
                }
            });
            return tree;
        }
    },
    methods: {
        showFolderMenu(event, folder) {
            this.menuX = event.clientX;
            this.menuY = event.clientY;
            this.selectedFolder = folder;
            this.menu = true;
        },
        handleRightClickAction(action, folder) {
            if (action == 'new tab') {
                this.$emit('setFolderTab', folder);
            } else if (action == 'sync emails') {
                this.$emit('syncFolderEmails', folder);
            }
            this.menu = false;
        },
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
                    return 'mdi-alert-circle';
                case 'Archive':
                    return 'mdi-archive';
                case 'Conversation History':
                    return 'mdi-message-text';
                case 'Outbox':
                    return 'mdi-tray-arrow-up';
                case 'Scheduled':
                    return 'mdi-calendar-clock';
                case 'Spam':
                    return 'mdi-alert-circle';
                default:
                    return 'mdi-folder';
            }
        },
        selectFolder(folder) {
            this.$emit('setActiveFolder', folder);
        },
    },
    template: `
    <v-expand-transition v-if="account.folders.length > 0">
        <v-list v-if="account.isOpened" density="compact">
            <FolderItem
            v-for="folder in folderTree"
            :key="folder.id"
            :folder="folder"
            :active-folder="activeFolder"
            @setActiveFolder="selectFolder"
            @showFolderMenu="showFolderMenu"
            @setFolderTab="$emit('setFolderTab', $event)"
            @syncFolderEmails="$emit('syncFolderEmails', $event)"
            ></FolderItem>

            <v-menu
                v-model="menu"
                    :style="{ left: menuX + 'px', top: menuY + 'px' }"
                    absolute
                >
                <v-list class="text-grey-darken-3">
                    <v-list-item @click="handleRightClickAction('sync emails', selectedFolder)">
                        <v-icon left>mdi-sync</v-icon>
                        Sync Emails
                    </v-list-item>
                    <v-list-item @click="handleRightClickAction('new tab', selectedFolder)">
                        <v-icon left>mdi-folder-plus</v-icon>
                        Open Folder in new Tab
                    </v-list-item>
                </v-list>
            </v-menu>
        </v-list>
    </v-expand-transition>

    <div v-else-if="account.isOpened" class="text-center my-4">
        <v-icon size="48" color="grey">mdi-folder-open-outline</v-icon>
        <div class="text-subtitle-2 text-center mb-2">No Folders found!</div>
    </div>
    `
}
