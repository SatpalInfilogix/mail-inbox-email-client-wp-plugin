export default {
    name: 'FolderItem',
    props: {
        folder: {
            type: Object,
            required: true,
        },
        activeFolder: {
            type: Object,
            default: null,
        },
    },
    data() {
        return {
            isOpen: false,
            open: ['Users'],
            admins: [
                ['Management', 'mdi-account-multiple-outline'],
                ['Settings', 'mdi-cog-outline'],
            ],
        };
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
                case 'Trash':
                    return 'mdi-trash-can';
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
            this.$emit('syncFolderEmails', folder)
        },
        showFolderMenu(event, folder) {
            this.$emit('showFolderMenu', event, folder);
        },
        toggle() {
            this.isOpen = !this.isOpen;
        },
    },
    template: `
    <div>
        <v-list-group
      v-if="folder.children && folder.children.length"
      v-model="isOpen"
      :prepend-icon="getFolderIcon(folder.display_name)"
      :append-icon="isOpen ? 'mdi-chevron-down' : 'mdi-chevron-right'"
    >
      <template v-slot:activator="{ props }">
        <v-list-item
          v-bind="props"
          @contextmenu.prevent="showFolderMenu($event, folder)"
          :class="{ 'active-folder': activeFolder && activeFolder.id === folder.id }"
        >
          <v-list-item-content>
            <v-list-item-title>
              <!-- Removed .stop to allow event propagation for toggling -->
              <span @click="selectFolder(folder)">{{ folder.display_name }}</span>
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </template>

      <folder-item
        v-for="child in folder.children"
        :key="child.id"
        :folder="child"
        :active-folder="activeFolder"
        @setActiveFolder="$emit('setActiveFolder', $event)"
        @setFolderTab="$emit('setFolderTab', $event)"
        @syncFolderEmails="$emit('syncFolderEmails', $event)"
        @showFolderMenu="$emit('showFolderMenu', $event, child)"
      ></folder-item>
    </v-list-group>

    <v-list-item
      v-else
      :key="folder.id"
      :prepend-icon="getFolderIcon(folder.display_name)"
      @contextmenu.prevent="showFolderMenu($event, folder)"
      @click="selectFolder(folder)"
      :class="{ 'active-folder': activeFolder && activeFolder.id === folder.id }"
    >
      <v-list-item-title>{{ folder.display_name }}</v-list-item-title>
    </v-list-item>
  </div>
    `
};
