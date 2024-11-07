export default {
    name: 'EditKpiRule',
    props: {
        rule: {
            type: Object,
            required: true
        },
        categories: {
            type: Array,
            required: true
        },
        tags: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            editRule: {
                action: this.rule.actionType,
                category: this.categories.find(category => category.id == this.rule.categoryId) || null,
                tag: this.tags.find(tag => tag.id == this.rule.tagId) || null,
                time: this.rule.time,
                defaultPoints: this.rule.defaultPoints,
                points: this.rule.points,
                timeType: 'Minutes'
            },
            dialog: false,
            snackbar: false,
            snackbarMessage: '',
            snackbarColor: 'success',
        };
    },
    methods: {
        async handleSubmit(event) {
            if (event) event.preventDefault();

            // Custom validation for either category or tag
            if (!this.editRule.category && !this.editRule.tag) {
                this.showSnackbar('Please select at least one: Category or Tag.', 'error');
                return;
            }


            if(this.editRule.category && this.editRule.tag && !this.editRule.action){
                this.showSnackbar('Please select action type to save this rule.', 'error');
                return;
            }
            
            const { valid } = await this.$refs.editRuleForm.validate()

            if (valid){
                const formdata = new FormData();
                const timeInMinutes = this.editRule.timeType === 'Hours' 
                    ? this.editRule.time * 60 
                    : this.editRule.time;

                formdata.append("action", "update_kpi_rule");
                formdata.append("id", this.rule.id);
                formdata.append("time", timeInMinutes);
                formdata.append("defaultPoints", this.editRule.defaultPoints);
                formdata.append("category", this.editRule.category ? this.editRule.category.id : '');
                formdata.append("tag", this.editRule.tag ? this.editRule.tag.id : '');
                formdata.append("points", this.editRule.points);
                formdata.append("actionType", this.editRule.action);
                
                const response = await fetch(ajaxurl, {
                    method: 'POST',
                    body: formdata
                });

                const apiResponse = await response.json();

                if(apiResponse.success){
                    this.dialog = false;
                    this.$emit('reloadRules');
                    this.showSnackbar('Rule updated successfully!', 'success');
                } else {
                    this.showSnackbar(apiResponse.data.message || 'Failed to update rule.', 'error');
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
                <v-card title="Edit rule">
                    <v-card-text>
                        <v-form ref="editRuleForm" @keydown.enter="handleSubmit" class="form-inputs">
                            <v-select
                                label="Action Type"
                                v-model="editRule.action" 
                                :items="['Assign Tag', 'Assign Category']"
                                v-if="editRule.category && editRule.tag"
                            ></v-select>  
                            
                            <v-row class="no-detail-spacing">
                            <v-col cols="12" sm="6" md="6">                                
                                <v-select
                                    label="Category"
                                    v-model="editRule.category"
                                    :items="categories"
                                    item-title="name"
                                    item-value="id"
                                    return-object
                                >
                                    <template v-slot:selection="{ item }">
                                        <v-chip
                                            :style="{
                                                backgroundColor: item.raw.backgroundColor,
                                                color: item.raw.fontColor,
                                            }"
                                            small
                                            v-if="item.raw.name"
                                        >
                                            {{ item.raw.name }}
                                            <v-icon
                                                small
                                                @click.stop="editRule.category = null"
                                                class="ml-1"
                                            >
                                                mdi-close
                                            </v-icon>
                                        </v-chip>
                                    </template>

                                    <template v-slot:item="{ props, item: categoryItem }">
                                        <v-list-item v-bind="props"></v-list-item>
                                    </template>
                                </v-select>
                            </v-col>
                            
                            <v-col cols="12" sm="6" md="6">
                                <v-select
                                    label="Tag"
                                    v-model="editRule.tag"
                                    :items="tags"
                                    item-title="name"
                                    item-value="id"
                                    return-object
                                >
                                    <template v-slot:selection="{ item }">
                                        <v-chip
                                            :style="{
                                                backgroundColor: item.raw.backgroundColor,
                                                color: item.raw.fontColor,
                                            }"
                                            small
                                            v-if="item.raw.name"
                                        >
                                            {{ item.raw.name }}

                                            <v-icon
                                                small
                                                @click.stop="editRule.tag = null"
                                                class="ml-1"
                                            >
                                                mdi-close
                                            </v-icon>
                                        </v-chip>
                                    </template>

                                    <template v-slot:item="{ props, item: categoryItem }">
                                        <v-list-item v-bind="props"></v-list-item>
                                    </template>
                                </v-select>
                            </v-col>
                        </v-row>

                        <v-row>
                            <v-col cols="12" sm="4" md="4">
                                <v-text-field 
                                label="Time" 
                                v-model="editRule.time" 
                                :rules="[
                                    v => !v || (!isNaN(parseFloat(v)) && isFinite(v)) || 'Time must be a valid number'
                                ]"
                                type="number"
                                required
                            ></v-text-field>
                            </v-col>

                            <v-col cols="12" sm="4" md="4">
                                <v-select
                                    label="Time Type"
                                    v-model="editRule.timeType" 
                                    :items="['Minutes', 'Hours']"
                                ></v-select>  
                            </v-col>

                            <v-col cols="12" sm="4" md="4">
                                <v-text-field 
                                label="Cred Points" 
                                v-model="editRule.points" 
                                :rules="[
                                    v => !v || (!isNaN(parseFloat(v)) && isFinite(v)) || 'Points must be a valid number'
                                ]"
                                type="number"
                                required
                            ></v-text-field>
                            </v-col>
                        </v-row>
                            
                            <v-text-field 
                                label="Default Cred Points" 
                                v-model="editRule.defaultPoints" 
                                :rules="[
                                    v => !!v || 'Default Cred Points is required',
                                    v => Number.isInteger(Number(v)) || 'Default Cred Points must be a number'
                                ]"
                                type="number"
                                required
                            ></v-text-field>
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
