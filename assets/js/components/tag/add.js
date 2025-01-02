export default {
    name: 'AddTag',
    data() {
        return {
            newTag: {
                name: '',
                font_color: '#FFFFFF',
                background_color: '#000000',
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

            const { valid } = await this.$refs.addTagForm.validate()

            if (valid){
                const formdata = new FormData();
                formdata.append("action", "mail_inbox_create_tag");
                formdata.append("name", this.newTag.name);
                formdata.append("font_color", this.newTag.font_color);
                formdata.append("background_color", this.newTag.background_color);

                const response = await fetch(ajaxurl, {
                    method: 'POST',
                    body: formdata
                });

                const apiResponse = await response.json();

                if(apiResponse.success){
                    this.dialog = false;
                    this.resetForm();
                    this.$emit('reloadTags');
                    this.showSnackbar('Tag created successfully!', 'success');
                } else {
                    this.showSnackbar(apiResponse.data.message || 'Failed to create tag.', 'error');
                }
            }
        },
        resetForm() {
            this.newTag = {
                name: '',
                font_color: '#FFFFFF',
                background_color: '#000000',
            };
            this.$refs.addTagForm.resetValidation();
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
                <v-btn
                    v-bind="activatorProps"
                    color="#5865f2"
                    text="Add new tag"
                    variant="flat"
                    prepend-icon="mdi-plus"
                ></v-btn>
            </template>

            <template v-slot:default="{ isActive }">
                <v-card title="Add new tag">
                    <v-card-text>
                        <v-form ref="addTagForm" @keydown.enter="handleSubmit" class="form-inputs">
                            <v-text-field 
                                label="Name" 
                                v-model="newTag.name" 
                                :rules="nameRules"
                                required
                                class="mb-2"
                            ></v-text-field>

                            <v-row>
                                <v-col cols="12" sm="6">
                                    <v-text-field 
                                        type="color" 
                                        label="Background Color" 
                                        v-model="newTag.background_color" 
                                        required
                                    ></v-text-field>
                                </v-col>
                                <v-col cols="12" sm="6">
                                    <v-text-field 
                                        type="color" 
                                        label="Font Color" 
                                        v-model="newTag.font_color" 
                                        required
                                    ></v-text-field>
                                </v-col>
                            </v-row>
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
