export default {
    name: 'FullScreen',
    data() {
        return {
            isFullScreen: false,
        };
    }, 
    mounted() {
        // Add an event listener for full-screen changes
        document.addEventListener('fullscreenchange', this.onFullScreenChange);
        document.addEventListener('webkitfullscreenchange', this.onFullScreenChange);
        document.addEventListener('mozfullscreenchange', this.onFullScreenChange);
        document.addEventListener('MSFullscreenChange', this.onFullScreenChange);

        // Check if the user was in full-screen mode before page reload
        if (localStorage.getItem('isFullScreen') === 'true') {
            this.toggleFullScreen();
            
            const element = document.documentElement;
            element.requestFullscreen();
        }
    },
    beforeDestroy() {
        // Clean up the event listeners when the component is destroyed
        document.removeEventListener('fullscreenchange', this.onFullScreenChange);
        document.removeEventListener('webkitfullscreenchange', this.onFullScreenChange);
        document.removeEventListener('mozfullscreenchange', this.onFullScreenChange);
        document.removeEventListener('MSFullscreenChange', this.onFullScreenChange);
    },
    methods: {
        toggleFullScreen() {
            const element = document.documentElement; // The whole page

            // Check if the document is currently in full-screen mode
            if (!document.fullscreenElement &&
                !document.mozFullScreenElement &&
                !document.webkitFullscreenElement &&
                !document.msFullscreenElement) {
                // Enter full-screen mode
                if (element.requestFullscreen) {
                    element.requestFullscreen();
                } else if (element.mozRequestFullScreen) { // For Firefox
                    element.mozRequestFullScreen();
                } else if (element.webkitRequestFullscreen) { // For Chrome, Safari, and Opera
                    element.webkitRequestFullscreen();
                } else if (element.msRequestFullscreen) { // For IE/Edge
                    element.msRequestFullscreen();
                }

                document.body.classList.add('fullscreen-mode');
                this.isFullScreen = true;
                localStorage.setItem('isFullScreen', 'true');
            } else {
                // Exit full-screen mode
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.mozCancelFullScreen) { // For Firefox
                    document.mozCancelFullScreen();
                } else if (document.webkitExitFullscreen) { // For Chrome, Safari, and Opera
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) { // For IE/Edge
                    document.msExitFullscreen();
                }

                document.body.classList.remove('fullscreen-mode');
                this.isFullScreen = false;
                localStorage.setItem('isFullScreen', 'false');
            }
        },
        onFullScreenChange() {
            // Update the full-screen state when it changes
            this.isFullScreen = !!(
                document.fullscreenElement ||
                document.mozFullScreenElement ||
                document.webkitFullscreenElement ||
                document.msFullscreenElement
            );

            if (!this.isFullScreen) {
                document.body.classList.remove('fullscreen-mode');
                localStorage.setItem('isFullScreen', 'false');
            }
        }
    },
    template: `
        <v-icon class="cursor-pointer" @click="toggleFullScreen">{{ isFullScreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}</v-icon>
    `
};
