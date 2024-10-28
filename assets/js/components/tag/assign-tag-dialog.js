export default {
  name: 'assignTagDialog',
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    unAssign: {
      type: Boolean,
      required: true,
    },
    tags: {
      type: Array,
      required: true,
    },
    selectedEmail: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      selectedTag: null,
      visibleInternal: this.visible,
      isLoading: false,
    };
  },
  watch: {
    visible(val) {
      this.visibleInternal = val;
      if (!val) {
        this.selectedTag = null;
      }

      if(this.selectedEmail){
        this.selectedTag = this.selectedEmail.additionalInfo.tag;
      } else {
        this.selectedTag = null;
      }
    },
    visibleInternal(val) {
      this.$emit('update:visible', val);
    },
  },
  methods: {
    async handleSelect(item) {
      this.selectedTag = item;

      if (this.selectedTag && this.selectedEmail && this.selectedEmail.id) {
        this.isLoading = true;
        try {
          // Emit event to parent with emailId and selectedTag.id
          await this.$emit('tag-assigned', this.selectedEmail.id, this.selectedTag.value);
          this.closeDialog();
        } catch (error) {
          console.error('Error assigning tag:', error);
          this.$emit('error', 'Failed to assign tag.');
        } finally {
          this.isLoading = false;
        }
      }
    },
    async unAssignTag(){
      await this.$emit('tag-assigned', this.selectedEmail.id, null);
      this.closeDialog();
    },
    closeDialog() {
      this.visibleInternal = false;
      this.$emit('close');
    },
    updateVisibility(val) {
      this.visibleInternal = val;
    },
  },
  template: `
    <div>
      <v-dialog v-model="visibleInternal" persistent max-width="500px" @input="updateVisibility">
      <v-card>
        <v-card-title class="d-flex justify-space-between">
          <span class="text-h6">Assign Tag</span>
          <v-icon class="text-body-1" @click="closeDialog">mdi-close</v-icon>
        </v-card-title>
        <v-card-text>
          <v-select
            label="Select Tag"
            v-model="selectedTag"
            :items="tags"
            item-text="name"
            item-value="id"
            return-object
            dense
            outlined
            hide-details
          >
            <!-- Display Selected Tag as a Chip -->
            <template v-slot:selection="{ item }">
              <v-chip
                :style="{
                  backgroundColor: item.backgroundColor,
                  color: item.fontColor,
                }"
                small
                v-if="item.raw.name"
              >
                {{ item.raw.name }}
              </v-chip>
            </template>

            <!-- Display Each Dropdown Item with a Chip -->
            <template v-slot:item="{ item, attrs }">
              <v-list-item
                v-bind="attrs"
                :key="item.id"
                @click="handleSelect(item)"
                >
                <v-list-item-content>
                    <v-chip
                    :style="{
                        backgroundColor: item.raw.backgroundColor,
                        color: item.raw.fontColor,
                    }"
                    small
                    class="mr-2"
                    >
                    {{ item.raw.name }}
                    </v-chip>
                </v-list-item-content>
              </v-list-item>
            </template>
          </v-select>
        </v-card-text>
      </v-card>
    </v-dialog>


    <v-dialog v-model="unAssign" max-width="500">
      <v-card>
        <v-card-title class="headline">Unassign Tag</v-card-title>
        <v-card-text class="text-body-2">Are you sure you want to unassign this tag?</v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <!-- Cancel Button -->
          <v-btn color="grey" text @click="closeDialog">
            Cancel
          </v-btn>
          <!-- Confirm Delete Button -->
          <v-btn class="bg-red" @click="unAssignTag">
            Confirm
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
  `
};
