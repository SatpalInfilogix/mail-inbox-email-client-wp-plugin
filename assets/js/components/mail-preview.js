export default {
    name: 'MailPreview',
    props: {
        email: {
            type: Object,
            required: true
        },
        isLoading: {
            type: Boolean,
            default: true
        }
    },
    data() {
        return {
            showMenu: false,
            menuX: 0,
            menuY: 0,
            menuAttachment: null,
        }
    },
    methods: {
        closePreview() {
            this.$emit('closePreview');
        },
        contentDir() {
            return window.mailInbox.siteUrl + '/wp-content';
        },
        openInNewTab(url) {
            window.open(url, '_blank');
        },
        downloadAttachment(attachment) {
            const link = document.createElement('a');
            link.href = this.contentDir() + '/' + attachment.path;
            link.download = attachment.name;
            link.click();
        },
        downloadAllAttachments() {
            if (this.email.attachments && this.email.attachments.length > 0) {
                this.email.attachments.forEach(attachment => {
                    this.downloadAttachment(attachment);
                });
            }
            this.hideContextMenu();
        },
        showContextMenu(event, attachment) {
            event.preventDefault();
            this.menuX = event.clientX;
            this.menuY = event.clientY;
            this.menuAttachment = attachment;
            this.showMenu = true;
        },
        hideContextMenu() {
            this.showMenu = false;
            this.menuAttachment = null;
        },
        updateIframeContent() {
            const iframe = this.$refs.emailIframe;
            const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
            iframeDocument.open();
            iframeDocument.write(this.email.body_content);
            iframeDocument.close();

            // Adjust the iframe height after content is loaded
            iframe.onload = () => {
                this.adjustIframeHeight();
            };

            // Fallback in case onload doesn't fire
            setTimeout(() => {
                this.adjustIframeHeight();
            }, 500);
        },
        adjustIframeHeight() {
            const iframe = this.$refs.emailIframe;
            const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
            const iframeBody = iframeDocument.body;
            const contentHeight = iframeBody.scrollHeight;

            // Measure heights of other elements
            const emailHeadersHeight = this.$refs.emailHeaders ? this.$refs.emailHeaders.offsetHeight : 0;
            const cardActionsHeight = this.$refs.cardActions ? this.$refs.cardActions.offsetHeight : 0;

            // Calculate the maximum available height
            const windowHeight = window.innerHeight;
            const maxIframeHeight = windowHeight - emailHeadersHeight - cardActionsHeight - 50; // Adjust 50px for padding/margins

            // Set the iframe height to fit content or available space
            iframe.style.height = Math.min(contentHeight, maxIframeHeight) + 'px';
        },
    },
    watch: {
        email: {
            handler() {
                if(this.email){
                    this.updateIframeContent();
                }
            },
            deep: true,
        },
    },
    mounted() {
        if(this.email){
            this.updateIframeContent();
        }
    },
    template: `
        <v-container fluid class="pt-0">
            <v-card class="mx-auto" max-width="800">
            <!-- Email Content -->
            <v-card-text style="overflow: auto; max-height: 100vh;">
                <v-overlay
                    :model-value="isLoading"
                    class="align-center justify-center"
                    contained
                >
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                    <span class="ml-3">Loading...</span>
                </v-overlay>
                
                <!-- Email Headers -->
                <div class="email-headers" ref="emailHeaders" v-if="email">
                    <!-- From -->
                    <div class="d-flex justify-space-between">
                        <p class="text-body-2 my-1" v-for="toRecipient in JSON.parse(email.to_recipients)">
                            <span class="font-weight-bold">From:</span> 
                            {{ toRecipient.emailAddress.name }}
                        </p>
                        <v-icon @click="closePreview" class="me-2">mdi-close</v-icon>
                    </div>

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

                    <div v-if="email.attachments.length > 0">
                        <p class="text-body-2 mb-2 mt-1">
                            <span class="font-weight-bold">Attachments:</span>
                            <div v-for="attachment in email.attachments">
                                <a :href="contentDir() + '/' + attachment.path" 
                                    target="_blank" 
                                    @click.prevent="openInNewTab(contentDir() + '/' + attachment.path)"
                                    @contextmenu="showContextMenu($event, attachment)"
                                >{{ attachment.name }}</a>
                            </div>

                            <v-menu
                                v-model="showMenu"
                                    :style="{ left: menuX + 'px', top: menuY + 'px' }"
                                    absolute
                                >
                                <v-list class="text-grey-darken-3">
                                    <v-list-item @click="downloadAttachment(menuAttachment)">
                                        <v-icon left>mdi-download</v-icon>
                                        Download Attachment
                                    </v-list-item>

                                    <v-list-item @click="downloadAllAttachments">
                                        <v-icon left>mdi-download-multiple</v-icon>
                                        Download All Attachments
                                    </v-list-item>
                                </v-list>
                            </v-menu>
                        </p>
                    </div>

                    <v-divider></v-divider>
                </div>

                <!-- Email Body -->
                <iframe ref="emailIframe" class="email-body-iframe" style="width: 100%; height: 45vh; border: none;"></iframe>
            </v-card-text>

            <!-- Actions -->
            <v-card-actions ref="cardActions">
                <v-spacer></v-spacer>
                <v-btn color="primary" variant="tonal">
                    <v-icon left>mdi-reply</v-icon>
                    Reply
                </v-btn>
                <v-btn color="primary" variant="tonal">
                    <v-icon left>mdi-forward</v-icon>
                    Forward
                </v-btn>
            </v-card-actions>
            </v-card>
        </v-container>
    `
};
