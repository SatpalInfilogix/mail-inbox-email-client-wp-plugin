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
        <v-container fluid>
            <v-card class="mx-auto" max-width="800">
            <!-- Header with Close Button -->
            <v-toolbar dense flat>
                <v-toolbar-title>Email Preview</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn icon @click="closePreview">
                <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-toolbar>

            <v-divider></v-divider>

            <!-- Email Content -->
            <v-card-text style="overflow: auto; max-height: 70vh;">
                <!-- Email Headers -->
                <div class="email-headers">
                <!-- From -->
                <p class="text-body-2 my-1">
                    <span class="font-weight-bold">From:</span>
                    <span v-if="email.from && JSON.parse(email.from).length">
                    <span
                        v-for="fromRecipient in JSON.parse(email.from)"
                        :key="fromRecipient.emailAddress.address"
                    >
                        {{ fromRecipient.emailAddress.name }}
                        &lt;{{ fromRecipient.emailAddress.address }}&gt;
                    </span>
                    </span>
                </p>

                <!-- To -->
                <p class="text-body-2 my-1">
                    <span class="font-weight-bold">To:</span>
                    <span v-if="email.to_recipients && JSON.parse(email.to_recipients).length">
                    <span
                        v-for="toRecipient in JSON.parse(email.to_recipients)"
                        :key="toRecipient.emailAddress.address"
                    >
                        {{ toRecipient.emailAddress.name }}
                        &lt;{{ toRecipient.emailAddress.address }}&gt;
                    </span>
                    </span>
                </p>

                <!-- CC -->
                <p
                    class="text-body-2 my-1"
                    v-if="email.cc_recipients && JSON.parse(email.cc_recipients).length"
                >
                    <span class="font-weight-bold">CC:</span>
                    <span
                    v-for="ccRecipient in JSON.parse(email.cc_recipients)"
                    :key="ccRecipient.emailAddress.address"
                    >
                    {{ ccRecipient.emailAddress.name }}
                    &lt;{{ ccRecipient.emailAddress.address }}&gt;
                    </span>
                </p>

                <!-- BCC -->
                <p
                    class="text-body-2 my-1"
                    v-if="email.bcc_recipients && JSON.parse(email.bcc_recipients).length"
                >
                    <span class="font-weight-bold">BCC:</span>
                    <span
                    v-for="bccRecipient in JSON.parse(email.bcc_recipients)"
                    :key="bccRecipient.emailAddress.address"
                    >
                    {{ bccRecipient.emailAddress.name }}
                    &lt;{{ bccRecipient.emailAddress.address }}&gt;
                    </span>
                </p>

                <!-- Date & Time -->
                <p class="text-body-2 my-1">
                    <span class="font-weight-bold">Date & Time:</span>
                    {{ email.received_datetime }}
                </p>

                <!-- Subject -->
                <p class="text-body-2 mb-2 mt-1">
                    <span class="font-weight-bold">Subject:</span>
                    {{ email.subject }}
                </p>

                <v-divider></v-divider>
                </div>

                <!-- Email Body -->
                <div v-html="email.body_content" class="email-body"></div>
            </v-card-text>

            <!-- Actions -->
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text color="primary">Reply</v-btn>
                <v-btn text color="primary">Forward</v-btn>
            </v-card-actions>
            </v-card>
        </v-container>
    `
};
