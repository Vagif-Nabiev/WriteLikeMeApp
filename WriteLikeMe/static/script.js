document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('drawingCanvas');
    const ctx = canvas.getContext('2d');
    const letterInput = document.getElementById('letterInput');
    const saveButton = document.getElementById('saveLetter');
    const clearButton = document.getElementById('clearCanvas');
    const generateButton = document.getElementById('generateText');
    const textInput = document.getElementById('textInput');
    const previewContainer = document.getElementById('previewContainer');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const brushSizeInput = document.getElementById('brushSize');
    const brushPreview = document.getElementById('brushPreview');
    const brushSizeValue = document.getElementById('brushSizeValue');
    const lettersGrid = document.getElementById('lettersGrid');

    // Load saved brush size from localStorage
    const savedBrushSize = localStorage.getItem('brushSize');
    if (savedBrushSize) {
        brushSizeInput.value = savedBrushSize;
        updateBrushPreview(savedBrushSize);
    }

    // Set canvas size for letter drawing
    const canvasWidth = 128;
    const canvasHeight = 128;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = '128px';
    canvas.style.height = '128px';
    canvas.style.border = '2px solid #000';
    canvas.style.background = '#fff';

    // Initialize brush size
    ctx.lineWidth = brushSizeInput.value * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000';

    function updateBrushPreview(size) {
        const previewSize = Math.min(size * 2, 20); // Cap the preview size at 20px
        brushPreview.style.width = `${previewSize}px`;
        brushPreview.style.height = `${previewSize}px`;
        brushSizeValue.textContent = `${size * 2}px`;
    }

    // Update brush size and preview when slider changes
    brushSizeInput.addEventListener('input', () => {
        const size = brushSizeInput.value;
        ctx.lineWidth = size * 2;
        updateBrushPreview(size);
        // Save to localStorage
        localStorage.setItem('brushSize', size);
    });

    // Initialize brush preview
    updateBrushPreview(brushSizeInput.value);

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    function getMousePos(canvas, evt) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        // Handle both mouse and touch events
        let clientX, clientY;
        if (evt.type.includes('touch')) {
            // Get the first touch point
            const touch = evt.touches[0] || evt.changedTouches[0];
            clientX = touch.clientX;
            clientY = touch.clientY;
        } else {
            clientX = evt.clientX;
            clientY = evt.clientY;
        }
        
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    // Mouse events
    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        const pos = getMousePos(canvas, e);
        [lastX, lastY] = [pos.x, pos.y];
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        const pos = getMousePos(canvas, e);
        drawLine(lastX, lastY, pos.x, pos.y);
        [lastX, lastY] = [pos.x, pos.y];
    });

    // Touch events with improved handling
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent scrolling
        isDrawing = true;
        const pos = getMousePos(canvas, e);
        [lastX, lastY] = [pos.x, pos.y];
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault(); // Prevent scrolling
        if (!isDrawing) return;
        const pos = getMousePos(canvas, e);
        drawLine(lastX, lastY, pos.x, pos.y);
        [lastX, lastY] = [pos.x, pos.y];
    }, { passive: false });

    function drawLine(x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = brushSizeInput.value * 2;
        ctx.stroke();
    }

    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);

    function stopDrawing() {
        isDrawing = false;
    }

    clearButton.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Do NOT fill with white, keep transparent
    });

    // Do NOT fill background on load, keep transparent

    // Save letter
    saveButton.addEventListener('click', async () => {
        const letter = letterInput.value;
        if (!letter || !/^[a-zA-Z]$/.test(letter)) {
            alert('Please enter a valid letter (A-Z or a-z)');
            return;
        }

        const imageData = canvas.toDataURL('image/png');
        try {
            const response = await fetch('/save_letter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    letter: letter,
                    image: imageData
                })
            });

            if (response.ok) {
                alert('Letter saved successfully!');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                // Do NOT fill with white, keep transparent
                letterInput.value = '';
            } else {
                alert('Error saving letter');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error saving letter');
        }
    });

    // Function to check if user is logged in
    function isUserLoggedIn() {
        return document.body.classList.contains('logged-in');
    }

    // Function to remove message with fade effect
    function removeMessageWithFade(element) {
        if (!element) return;
        
        // Add fade-out class
        element.classList.add('fade-out');
        
        // Remove element after animation
        setTimeout(() => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 500); // 500ms = duration of fade animation
    }

    // Function to handle message display and auto-removal
    function showTemporaryMessage(message, type) {
        // Remove any existing messages
        const existingMessages = document.querySelectorAll('.error-message, .warning-message');
        existingMessages.forEach(msg => {
            if (msg.parentNode) {
                msg.parentNode.removeChild(msg);
            }
        });
        
        // Create new message element
        const messageDiv = document.createElement('div');
        messageDiv.className = type + '-message';
        messageDiv.textContent = message;
        
        // Insert message before preview container
        const previewContainer = document.getElementById('previewContainer');
        previewContainer.insertAdjacentElement('beforebegin', messageDiv);
        
        // Set timeout to remove message
        setTimeout(() => removeMessageWithFade(messageDiv), 3000);
    }

    // Update the generate text function
    document.getElementById('generateText').addEventListener('click', function() {
        const text = document.getElementById('textInput').value;
        const pageStyle = document.querySelector('input[name="pageStyle"]:checked').value;
        
        fetch('/generate_text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text, pageStyle })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Error generating text');
                });
            }
            return response.json();
        })
        .then(data => {
            const previewContainer = document.getElementById('previewContainer');
            previewContainer.innerHTML = `<img src="${data.image}" alt="Generated text" style="max-width: 100%;">`;
            
            // Store the current text and page style for download
            window.currentGeneratedText = { text, pageStyle };
            
            // Show appropriate buttons/message based on login status
            const downloadButtons = document.getElementById('downloadButtons');
            const loginPrompt = document.getElementById('loginPrompt');
            
            if (isUserLoggedIn()) {
                downloadButtons.style.display = 'flex';
                loginPrompt.style.display = 'none';
            } else {
                downloadButtons.style.display = 'none';
                loginPrompt.style.display = 'block';
            }
            
            // Show warning if there are missing letters
            if (data.warning) {
                showTemporaryMessage(data.warning, 'warning');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            const previewContainer = document.getElementById('previewContainer');
            previewContainer.innerHTML = '';
            
            // Show error message
            showTemporaryMessage(error.message, 'error');
            
            // Hide download buttons and login prompt
            document.getElementById('downloadButtons').style.display = 'none';
            document.getElementById('loginPrompt').style.display = 'none';
        });
    });

    // Remove the download button event listeners for non-logged-in users
    if (isUserLoggedIn()) {
        document.getElementById('downloadPNG').addEventListener('click', async () => {
            if (!window.currentGeneratedText) return;
            
            try {
                const response = await fetch('/download/png', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(window.currentGeneratedText),
                });
                
                if (response.ok) {
                    // Get the blob from the response
                    const blob = await response.blob();
                    
                    // Create a URL for the blob
                    const url = window.URL.createObjectURL(blob);
                    
                    // Create a temporary link element
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = 'handwritten_text.png';
                    
                    // Add the link to the document, click it, and remove it
                    document.body.appendChild(a);
                    a.click();
                    
                    // Clean up
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                } else if (response.status === 401) {
                    // User is not logged in
                    alert('Please log in to download files');
                    window.location.href = '/login';
                } else {
                    const errorData = await response.json();
                    alert(errorData.error || 'Error downloading PNG file. Please try again.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while downloading the PNG file.');
            }
        });

        document.getElementById('downloadPDF').addEventListener('click', async () => {
            if (!window.currentGeneratedText) return;
            
            try {
                const response = await fetch('/download/pdf', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(window.currentGeneratedText),
                });
                
                if (response.ok) {
                    // Get the blob from the response
                    const blob = await response.blob();
                    
                    // Create a URL for the blob
                    const url = window.URL.createObjectURL(blob);
                    
                    // Create a temporary link element
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = 'handwritten_text.pdf';
                    
                    // Add the link to the document, click it, and remove it
                    document.body.appendChild(a);
                    a.click();
                    
                    // Clean up
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                } else if (response.status === 401) {
                    // User is not logged in
                    alert('Please log in to download files');
                    window.location.href = '/login';
                } else {
                    const errorData = await response.json();
                    alert(errorData.error || 'Error downloading PDF file. Please try again.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred while downloading the PDF file.');
            }
        });
    }

    // --- Manage Letters Tab Logic ---
    async function loadLetters() {
        const lowercaseGrid = document.getElementById('lettersGrid');
        const uppercaseGrid = document.getElementById('uppercaseGrid');
        
        lowercaseGrid.innerHTML = '<p>Loading...</p>';
        uppercaseGrid.innerHTML = '<p>Loading...</p>';
        
        try {
            const response = await fetch('/list_letters');
            if (!response.ok) throw new Error('Failed to fetch letters');
            const data = await response.json();
            
            if (!data.letters.length) {
                lowercaseGrid.innerHTML = '<p>No letters saved yet.</p>';
                uppercaseGrid.innerHTML = '<p>No letters saved yet.</p>';
                return;
            }

            // Clear grids
            lowercaseGrid.innerHTML = '';
            uppercaseGrid.innerHTML = '';

            // Sort letters into lowercase and uppercase
            const lowercaseLetters = data.letters.filter(letter => letter.letter === letter.letter.toLowerCase());
            const uppercaseLetters = data.letters.filter(letter => letter.letter === letter.letter.toUpperCase());

            // Function to create letter item
            const createLetterItem = (letterObj) => {
                const div = document.createElement('div');
                div.className = 'letter-item';
                div.innerHTML = `
                    <div class="letter-label">${letterObj.letter}</div>
                    <img src="/letters/${letterObj.filename}" alt="${letterObj.letter}">
                    <button data-filename="${letterObj.filename}" class="delete-letter-btn">Delete</button>
                `;
                return div;
            };

            // Add letters to respective grids
            lowercaseLetters.forEach(letterObj => {
                lowercaseGrid.appendChild(createLetterItem(letterObj));
            });

            uppercaseLetters.forEach(letterObj => {
                uppercaseGrid.appendChild(createLetterItem(letterObj));
            });

            // Add delete handlers
            document.querySelectorAll('.delete-letter-btn').forEach(btn => {
                btn.onclick = async (e) => {
                    const filename = btn.getAttribute('data-filename');
                    if (!confirm('Delete this letter?')) return;
                    const resp = await fetch('/delete_letter', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ filename })
                    });
                    if (resp.ok) {
                        loadLetters();
                    } else {
                        alert('Failed to delete letter.');
                    }
                };
            });

        } catch (err) {
            lowercaseGrid.innerHTML = '<p>Error loading letters.</p>';
            uppercaseGrid.innerHTML = '<p>Error loading letters.</p>';
        }
    }

    // Attach group-header event listeners ONCE, after DOM is loaded
    document.querySelectorAll('.group-header').forEach(header => {
        header.addEventListener('click', () => {
            const group = header.dataset.group;
            const content = document.getElementById(`${group}-letters`);
            const arrow = header.querySelector('.arrow');
            header.classList.toggle('collapsed');
            content.classList.toggle('active');
        });
    });

    // Tab switching (add manage tab logic)
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tab = button.dataset.tab;
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            tabContents.forEach(content => {
                content.style.display = content.id === `${tab}-tab` ? 'block' : 'none';
            });
            if (tab === 'manage') {
                loadLetters();
            }
        });
    });

    // Add cleanup function for temporary letters
    function cleanupTemporaryLetters() {
        // Only clear letters if this is a real window close (not navigation)
        if (!isUserLoggedIn() && window.performance.navigation.type === PerformanceNavigation.TYPE_RELOAD) {
            fetch('/clear_temp_letters', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            }).catch(error => console.error('Error cleaning up temporary letters:', error));
        }
    }

    // Add event listener for actual window close
    window.addEventListener('beforeunload', function(e) {
        // Only clear if this is a real window close (not navigation)
        if (!isUserLoggedIn() && !e.target.activeElement?.closest('a')) {
            cleanupTemporaryLetters();
        }
    });
}); 