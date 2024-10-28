export default {
    name: 'ErrorsModel',
    props: {
        title: {
            type: String,
            default: 'Error'
        },
        description: {
            type: String,
            default: 'An error occurred. Please try again.'
        },
        btnText: {
            type: String,
            default: 'Ok'
        },
        visible: {
            type: Boolean,
            default: false
        },
        onBtnClick: {
            type: Function,
            default: () => { }
        }
    },
    methods: {
        handleBtnClick() {
            this.onBtnClick();
        },
        closeModal(){
            this.$emit('update:visible', false);
        }
    },
    template: `
        <v-dialog
            v-model="visible"
            max-width="500"
            persistent
        >
            <v-card>
            <v-card-title class="d-flex justify-space-between">
                <span class="headline">{{ title }}</span>
                <v-btn density="compact" icon="mdi-close" @click="closeModal"></v-btn>
            </v-card-title>

            <v-card-text>
                <div v-html="description"></div>
            </v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                class="bg-primary"
                color="#5865f2"
                @click="handleBtnClick"
                >
                {{ btnText }}
                </v-btn>
            </v-card-actions>
            </v-card>
        </v-dialog>
        `
};
