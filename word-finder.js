class WordFinder {
    constructor() {
        this.wordInput = document.getElementById('wordInput');
        this.findButton = document.getElementById('findButton');
        this.resultsDiv = document.getElementById('results');
        
        this.bindEvents();
    }

    bindEvents() {
        this.findButton.addEventListener('click', () => this.findWord());
        this.wordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.findWord();
            }
        });
    }

    findWord() {
        const searchWord = this.wordInput.value.trim();
        
        if (!searchWord) {
            this.displayResults('Please enter a word to search for.');
            return;
        }

        const occurrences = this.searchForWord(searchWord);
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
                    context: this.getContext(text, match.index, word.length)
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

    formatResults(searchWord, occurrences) {
        if (occurrences.length === 0) {
            return `No occurrences of "${searchWord}" found.`;
        }

        let html = `<strong>Found ${occurrences.length} occurrence(s) of "${searchWord}":</strong><br><br>`;
        
        occurrences.forEach((occurrence, index) => {
            html += `<div class="result-item">
                <strong>#${index + 1}:</strong> Left: ${occurrence.left}px, Top: ${occurrence.top}px<br>
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