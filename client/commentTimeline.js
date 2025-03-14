
class TimelineComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        
        // Initial start time
        this.timeZero = new Date().getTime();
        // 1000 pixels = 5min
        this.pixelsPerMs = 5000 / (5 * 60 * 1000);
        this.viewOffsetSeconds = 0;
        this.elapsed = 0;
        this.recentEventTopPosition = 0;
        this.eventYOffset = 0;
        
        // Shadow DOM content
        this.shadowRoot.innerHTML = `
        <style>
        .timeline-container {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #f0f0f0;
        }
        .timeline {
            position: absolute;
            display: flex;
            height: 100%;
            white-space: nowrap;
            will-change: transform;
        }
        .minute-marker {
            height: 100%;
            border-left: 2px dotted gray;
            position: absolute;
            font-size: 12px;
            padding-left: 2px;
        }
        .event {
            position: absolute;
        }
        </style>
        <div class="timeline-container" id="timeline-container">
        <div class="timeline" id="timeline"></div>
        </div>
        `;
        
        this.timeline = this.shadowRoot.getElementById("timeline");
        
        // Create minute markers
        // pixels between markers
        console.log('pixels between markers', 1000 * 60 * this.pixelsPerMs);
        for (let i = -60; i < 60; i++) {
            const marker = document.createElement("div");
            marker.className = "minute-marker";
            marker.style.left = `${i * 1000 * 60 * this.pixelsPerMs}px`;
            marker.style.width = 1000 * 60 * this.pixelsPerMs;
            marker.innerText = new Date(this.timeZero + i * 60000).toLocaleTimeString();
            this.timeline.appendChild(marker);
        }
        
        const nowLine = document.createElement("div");
        nowLine.id = "now-line";
        nowLine.style.position = "absolute";
        nowLine.style.left = "0";
        nowLine.style.width = "2px";
        nowLine.style.height = "100%";
        // dotted left border
        nowLine.style.borderLeft = "2px dotted red";
        this.timeline.appendChild(nowLine);
        
        
        this.startScrolling();
    }
    
    connectedCallback() {
        this.offsetMakeNowToPercentFromLeft(0.8);
    }
    
    
    startScrolling() {
        const step = () => {
            this.elapsed = new Date().getTime() - this.timeZero + this.viewOffsetSeconds * 1000;
            this.timeline.style.transform = `translateX(${-this.elapsed * this.pixelsPerMs}px)`;
            // adjust now line
            const nowLine = this.shadowRoot.getElementById("now-line");
            nowLine.style.left = `${(this.elapsed * this.pixelsPerMs) - (this.viewOffsetSeconds * this.pixelsPerMs)}px`;
            requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }
    
    addEvent(timestamp, htmlContent) {
        const timeDiff = timestamp - this.timeZero;
        const eventDiv = document.createElement("div");
        eventDiv.className = "event";
        eventDiv.style.left = `${timeDiff * this.pixelsPerMs}px`;
        eventDiv.innerHTML = htmlContent;
        // Stack events from bottom to top
        const eventCount = this.timeline.querySelectorAll('.event').length;
        // use recentEventTopPosition to stack events from bottom to top
        eventDiv.style.bottom = `${this.recentEventTopPosition+10}px`;
        this.recentEventTopPosition += 30 + eventDiv.clientHeight;
        // top position reaches top end of timeline, reset to 0
        if (this.recentEventTopPosition > this.timeline.clientHeight) {
            this.recentEventTopPosition = 0;
        }
        this.timeline.appendChild(eventDiv);
    }
    
    offsetViewSeconds(seconds) {
        this.viewOffsetSeconds += seconds;
    }
    
    offsetViewPixels(pixels) {
        this.viewOffsetSeconds += pixels / this.pixelsPerMs / 1000
    }
    
    offsetMakeNowToPercentFromLeft(percent) {
        // offset in pixels by client width
        const timelinecontainer = this.shadowRoot.getElementById("timeline-container");
        
        const offset = timelinecontainer.clientWidth * percent;
        console.log('offset', offset);
        this.viewOffsetSeconds = (- offset / this.pixelsPerMs / 1000)+ this.elapsed / 1000;
    }
    
    
}

customElements.define("comments-timeline", TimelineComponent);




