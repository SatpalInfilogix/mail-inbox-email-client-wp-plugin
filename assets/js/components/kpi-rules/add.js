export default {
    name: 'AddKpiRule',
    props: {
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
            newRule: {
                action: '',
                category: '',
                tag: '',
                time: 0,
                defaultPoints: 0,
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
            if (!this.newRule.category && !this.newRule.tag) {
                this.showSnackbar('Please select at least one: Category or Tag.', 'error');
                return;
            }


            if(this.newRule.category && this.newRule.tag && !this.newRule.action){
                this.showSnackbar('Please action type to save this rule.', 'error');
                return;
            }
            
            const { valid } = await this.$refs.addRuleForm.validate()

            if (valid){
                const formdata = new FormData();
                const timeInMinutes = this.newRule.timeType === 'Hours' 
                    ? this.newRule.time * 60 
                    : this.newRule.time;

                formdata.append("action", "create_kpi_rule");
                formdata.append("time", timeInMinutes);
                formdata.append("defaultPoints", this.newRule.defaultPoints);
                formdata.append("category", this.newRule.category ? this.newRule.category.id : '');
                formdata.append("tag", this.newRule.tag ? this.newRule.tag.id : '');
                formdata.append("points", this.newRule.points);
                formdata.append("actionType", this.newRule.action);
                
                const response = await fetch(ajaxurl, {
                    method: 'POST',
                    body: formdata
                });

                const apiResponse = await response.json();

                if(apiResponse.success){
                    this.dialog = false;
                    this.resetForm();
                    this.$emit('reloadRules');
                    this.showSnackbar('New rule added successfully!', 'success');
                } else {
                    this.showSnackbar(apiResponse.data.message || 'Failed to add new rule.', 'error');
                }
            }
        },
        resetForm() {
            this.newRule = {
                action: '',
                category: '',
                tag: '',
                time: 0,
                defaultPoints: 0,
                timeType: 'Minutes'
            };
            this.$refs.addRuleForm.resetValidation();
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
                    text="Add new rule"
                    variant="flat"
                    prepend-icon="mdi-plus"
                ></v-btn>
            </template>

            <template v-slot:default="{ isActive }">
                <v-card title="Add new rule">
                    <v-card-text>
                        <v-form ref="addRuleForm" @keydown.enter="handleSubmit" class="form-inputs">
                            <v-select
                                label="Action Type"
                                v-model="newRule.action" 
                                :items="['Assign Tag', 'Assign Category']"
                                v-if="newRule.category && newRule.tag"
                            ></v-select>  
                            
                            <v-row class="no-detail-spacing">
                            <v-col cols="12" sm="6" md="6">
                                <v-select
                                    label="Category"
                                    v-model="newRule.category"
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
                                                @click.stop="newRule.category = null"
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
                                    v-model="newRule.tag"
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
                                                @click.stop="newRule.tag = null"
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
                                v-model="newRule.time" 
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
                                    v-model="newRule.timeType" 
                                    :items="['Minutes', 'Hours']"
                                ></v-select>  
                            </v-col>

                            <v-col cols="12" sm="4" md="4">
                                <v-text-field 
                                label="Cred Points" 
                                v-model="newRule.points" 
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
                                v-model="newRule.defaultPoints" 
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
