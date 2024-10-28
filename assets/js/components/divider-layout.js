export default {
    props: {
        isSidebar: {
            type: Boolean,
            default: true,  // By default, it's the sidebar divider
        },
        sidebarWidth: {
            type: Number,
            required: true,
        },
        contentWidth: {
            type: Number,
            required: true,
        },
        previewWidth: {
            type: Number,
            required: true,
        },
        minSidebarWidth: {
            type: Number,
            default: 14,
        },
        minContentWidth: {
            type: Number,
            default: 20,
        },
        minPreviewWidth: {
            type: Number,
            default: 15,
        },
        showPreview: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            isDragging: false,
        };
    },
    methods: {
        startDrag(event) {
            this.isDragging = true;
            document.addEventListener('mousemove', this.onDrag);
            document.addEventListener('mouseup', this.stopDrag);
        },
        onDrag(event) {
            if (!this.isDragging) return;
            const container = this.$el.parentElement;
            const totalWidth = container.clientWidth;
            const offsetX = event.clientX - container.getBoundingClientRect().left;

            let newSidebarWidth = this.sidebarWidth;
            let newContentWidth = this.contentWidth;
            let newPreviewWidth = this.previewWidth;

            if (this.isSidebar) {
                // Sidebar dragging logic
                newSidebarWidth = ((offsetX / totalWidth) * 100);

                // Enforce minimum sidebar width
                if (newSidebarWidth < this.minSidebarWidth) {
                    newSidebarWidth = this.minSidebarWidth;
                }

                // Calculate remaining width
                let remainingWidth = 100 - newSidebarWidth;
                const minRemainingWidth = this.minContentWidth + (this.showPreview ? this.minPreviewWidth : 0);

                if (remainingWidth < minRemainingWidth) {
                    remainingWidth = minRemainingWidth;
                    newSidebarWidth = 100 - remainingWidth;
                }

                // Distribute remaining width between content and preview
                const totalContentPreviewWidth = parseFloat(this.contentWidth) + parseFloat(this.previewWidth);
                const contentRatio = this.contentWidth / totalContentPreviewWidth;
                const previewRatio = this.previewWidth / totalContentPreviewWidth;

                newContentWidth = remainingWidth * contentRatio;
                newPreviewWidth = remainingWidth * previewRatio;

                if (!this.showPreview) {
                    newContentWidth = remainingWidth;
                    newPreviewWidth = 0;
                }

                if (newContentWidth < this.minContentWidth) {
                    newContentWidth = this.minContentWidth;
                    newPreviewWidth = remainingWidth - newContentWidth;
                }

                if (this.showPreview && newPreviewWidth < this.minPreviewWidth) {
                    newPreviewWidth = this.minPreviewWidth;
                    newContentWidth = remainingWidth - newPreviewWidth;

                    if (newContentWidth < this.minContentWidth) {
                        newContentWidth = this.minContentWidth;
                        newPreviewWidth = remainingWidth - newContentWidth;
                    }
                }
            } else {
                // Content dragging logic
                newContentWidth = ((offsetX / totalWidth) * 100) - this.sidebarWidth;

                if (newContentWidth < this.minContentWidth) {
                    newContentWidth = this.minContentWidth;
                }

                newPreviewWidth = 100 - this.sidebarWidth - newContentWidth;

                if (newPreviewWidth < this.minPreviewWidth) {
                    newPreviewWidth = this.minPreviewWidth;
                    newContentWidth = 100 - this.sidebarWidth - newPreviewWidth;

                    if (newContentWidth < this.minContentWidth) {
                        newContentWidth = this.minContentWidth;
                        newPreviewWidth = 100 - this.sidebarWidth - newContentWidth;
                    }
                }
            }

            this.$emit('updateWidths', {
                sidebarWidth: parseFloat(newSidebarWidth).toFixed(2),
                contentWidth: parseFloat(newContentWidth).toFixed(2),
                previewWidth: parseFloat(newPreviewWidth).toFixed(2),
            });
        },
        stopDrag() {
            this.isDragging = false;
            document.removeEventListener('mousemove', this.onDrag);
            document.removeEventListener('mouseup', this.stopDrag);
        },
    },
    template: `
        <v-divider vertical @mousedown="startDrag" class="divider"></v-divider>
    `,
};
