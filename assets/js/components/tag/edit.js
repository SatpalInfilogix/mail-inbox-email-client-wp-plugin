export default {
    name: 'EditTag',
    props: {
        tag: {
            type: Object,
            required: true
        },
    },
    data() {
        return {
            editTag: {
                name: this.tag.name,
                font_color: this.tag.fontColor,
                background_color: this.tag.backgroundColor,
                status: this.tag.status,
            },
            nameRules: [
                v => !!v || 'Name is required',
                v => (v && v.length <= 100) || 'Name must be 100 characters or less',
            ],
            dialog: false,
            snackbar: false,
            snackbarMessage: '',
            snackbarColor: 'success',
        };
    },
    methods: {
        async handleSubmit(event) {
            if (event) event.preventDefault();
            
            const { valid } = await this.$refs.editTagForm.validate()

            if (valid){
                const formdata = new FormData();
                formdata.append("action", "update_tag");
                formdata.append("id", this.tag.id);
                formdata.append("name", this.editTag.name);
                formdata.append("font_color", this.editTag.font_color);
                formdata.append("background_color", this.editTag.background_color);
                formdata.append("status", this.editTag.status);

                const response = await fetch(ajaxurl, {
                    method: 'POST',
                    body: formdata
                });

                const apiResponse = await response.json();

                if(apiResponse.success){
                    this.dialog = false;
                    this.$emit('reloadTags');
                    this.showSnackbar('Tag updated successfully!', 'success');
                } else {
                    this.showSnackbar(apiResponse.data.message || 'Failed to update tag.', 'error');
                }
            }
        },
        showSnackbar(message, color = 'success') {
            this.snackbarMessage = message;
            this.snackbarColor = color;
            this.snackbar = true;
        }
    },
    template: `
        <v-dialog v-model="dialog" max-width="500">
            <template v-slot:activator="{ props: activatorProps }">
                <v-btn icon color="green" size="x-small" class="m-1" v-bind="activatorProps">
                    <v-icon>mdi-pencil</v-icon>
                </v-btn>
            </template>

            <template v-slot:default="{ isActive }">
                <v-card title="Edit Tag">
                    <v-card-text>
                        <v-form ref="editTagForm" @keydown.enter="handleSubmit" class="form-inputs">
                            <v-text-field 
                                label="Name" 
                                v-model="editTag.name" 
                                :rules="nameRules"
                                required
                                class="mb-2"
                            ></v-text-field>

                            <v-row>
                                <v-col cols="12" sm="6">
                                    <v-text-field 
                                        type="color" 
                                        label="Background Color" 
                                        v-model="editTag.background_color" 
                                        required
                                    ></v-text-field>
                                </v-col>
                                <v-col cols="12" sm="6">
                                    <v-text-field 
                                        type="color" 
                                        label="Font Color" 
                                        v-model="editTag.font_color" 
                                        required
                                    ></v-text-field>
                                </v-col>
                            </v-row>

                            <v-select
                            label="Status"
                            v-model="editTag.status" 
                            :items="['Active', 'Inactive']"
                            ></v-select>
                        </v-form>
                    </v-card-text>

                    <v-divider></v-divider>

                    <v-card-actions>
                        <v-spacer></v-spacer>

                        <v-btn
                            text="Close"
                            variant="plain"
                            @click="dialog = false"
                        ></v-btn>

                        <v-btn
                            color="#5865f2"
                            text="Save"
                            variant="tonal"
                            @click="handleSubmit"
                        ></v-btn>
                    </v-card-actions>
                </v-card>
            </template>
        </v-dialog>

        <v-snackbar
            v-model="snackbar"
            :color="snackbarColor"
            timeout="3000"
            top
        >
            {{ snackbarMessage }}
        </v-snackbar>
    `
};
