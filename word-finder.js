class WordFinder {
    constructor() {
        this.wordInput = document.getElementById('wordInput');
        this.findButton = document.getElementById('findButton');
        this.resultsDiv = document.getElementById('results');
        this.currentOccurrences = [];
        this.scrollTimeout = null;
        
        this.bindEvents();
    }

    bindEvents() {
        this.findButton.addEventListener('click', () => this.findWord());
        this.wordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.findWord();
            }
        });
        
        // Add scroll handler with debouncing
        window.addEventListener('scroll', () => this.debounceScroll());
    }

    debounceScroll() {
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }
        
        this.scrollTimeout = setTimeout(() => {
            if (this.currentOccurrences.length > 0) {
                this.updateVisibilityStatus();
            }
        }, 100); // 100ms debounce
    }

    findWord() {
        const searchWord = this.wordInput.value.trim();
        
        if (!searchWord) {
            this.displayResults('Please enter a word to search for.');
            this.currentOccurrences = [];
            return;
        }

        const occurrences = this.searchForWord(searchWord);
        this.currentOccurrences = occurrences;
        this.displayResults(this.formatResults(searchWord, occurrences));
    }

    searchForWord(word) {
        const occurrences = [];
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Skip script tags and the word finder panel
                    const parent = node.parentElement;
                    if (parent.tagName === 'SCRIPT' || 
                        parent.closest('.word-finder-panel')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        let node;
        while (node = walker.nextNode()) {
            const text = node.textContent;
            const regex = new RegExp(word, 'gi');
            let match;

            while ((match = regex.exec(text)) !== null) {
                const range = document.createRange();
                range.setStart(node, match.index);
                range.setEnd(node, match.index + word.length);
                
                const rect = range.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
                
                occurrences.push({
                    word: match[0],
                    left: Math.round(rect.left + scrollLeft),
                    top: Math.round(rect.top + scrollTop),
                    context: this.getContext(text, match.index, word.length),
                    range: range.cloneRange() // Store the range for viewport checking
                });
            }
        }

        return occurrences;
    }

    getContext(text, index, wordLength) {
        const contextRadius = 30;
        const start = Math.max(0, index - contextRadius);
        const end = Math.min(text.length, index + wordLength + contextRadius);
        
        let context = text.substring(start, end).trim();
        
        if (start > 0) context = '...' + context;
        if (end < text.length) context = context + '...';
        
        return context;
    }

    isInViewport(occurrence) {
        if (!occurrence.range) {
            // Fallback to original logic if no range stored
            const viewportTop = window.pageYOffset || document.documentElement.scrollTop;
            const viewportBottom = viewportTop + window.innerHeight;
            const buffer = 50;
            
            return occurrence.top >= (viewportTop - buffer) && 
                   occurrence.top <= (viewportBottom + buffer);
        }

        // Use the stored range to get current position
        try {
            const rect = occurrence.range.getBoundingClientRect();
            const buffer = 50;
            
            // Check if element is currently visible in viewport
            return rect.top >= -buffer && 
                   rect.bottom <= (window.innerHeight + buffer) &&
                   rect.left >= -buffer &&
                   rect.right <= (window.innerWidth + buffer);
        } catch (e) {
            // Range might be invalid, fallback to coordinate-based check
            const viewportTop = window.pageYOffset || document.documentElement.scrollTop;
            const viewportBottom = viewportTop + window.innerHeight;
            const buffer = 50;
            
            return occurrence.top >= (viewportTop - buffer) && 
                   occurrence.top <= (viewportBottom + buffer);
        }
    }

    updateVisibilityStatus() {
        if (this.currentOccurrences.length === 0) return;
        
        const searchWord = this.wordInput.value.trim();
        this.displayResults(this.formatResults(searchWord, this.currentOccurrences));
    }

    formatResults(searchWord, occurrences) {
        if (occurrences.length === 0) {
            return `No occurrences of "${searchWord}" found.`;
        }

        const visibleCount = occurrences.filter(occ => this.isInViewport(occ)).length;
        const hiddenCount = occurrences.length - visibleCount;

        let html = `<strong>Found ${occurrences.length} occurrence(s) of "${searchWord}":</strong><br>`;
        html += `<small>📍 ${visibleCount} visible, 👁️ ${hiddenCount} hidden</small><br><br>`;
        
        occurrences.forEach((occurrence, index) => {
            const isVisible = this.isInViewport(occurrence);
            const statusClass = isVisible ? 'result-item-visible' : 'result-item-hidden';
            const statusIcon = isVisible ? '📍' : '👁️';
            
            html += `<div class="result-item ${statusClass}">
                <strong>${statusIcon} #${index + 1}:</strong> Left: ${occurrence.left}px, Top: ${occurrence.top}px<br>
                <em>Context:</em> ${occurrence.context}
            </div>`;
        });

        return html;
    }

    displayResults(content) {
        this.resultsDiv.innerHTML = content;
    }
}

// Initialize the word finder when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new WordFinder();
});