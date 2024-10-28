export default {
    name: 'MailPreview',
    props: {
        email: {
            type: Object,
            required: true
        },
    },
    methods: {
        closePreview() {
            this.$emit('closePreview');
        }
    },
    template: `
        <v-container>
            <v-card>
               <v-card class="mx-auto" max-width="600">
                    <v-card-item>
                        
                        <div class="d-flex justify-space-between">
                            <p class="text-body-2 my-1" v-for="toRecipient in JSON.parse(email.to_recipients)">
                                <span class="font-weight-bold">From:</span> 
                                {{ toRecipient.emailAddress.name }}
                            </p>
                            <v-icon @click="closePreview" class="me-2">mdi-close</v-icon>
                        </div>

                        <p class="text-body-2 my-1" v-for="ccRecipient in JSON.parse(email.cc_recipients)">
                            <span class="font-weight-bold">CC:</span> 
                            {{ ccRecipient.emailAddress.name }}
                        </p>
                        <p class="text-body-2 my-1" v-for="bccRecipient in JSON.parse(email.bcc_recipients)">
                            <span class="font-weight-bold">BCC:</span> 
                            {{ bccRecipient.emailAddress.name }}
                        </p>

                        <p class="text-body-2 my-1" v-for="toRecipient in JSON.parse(email.to_recipients)">
                            <span class="font-weight-bold">Date & Time:</span> 
                            {{ email.received_datetime }}
                        </p>
                        
                        <p class="text-body-2 mb-2 mt-1">
                            <span class="font-weight-bold">Subject:</span> 
                            {{ email.subject }}
                        </p>

                        <v-divider></v-divider>

                        <div v-html="email.body_content"></div>
                    </v-card-item>

                    <v-card-actions>
                        <v-btn text color="primary">Reply</v-btn>
                        <v-btn text color="primary">Forward</v-btn>
                    </v-card-actions>
                </v-card>
            </v-card>
        </v-container>
    `
};
