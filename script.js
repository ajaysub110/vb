document.addEventListener('DOMContentLoaded', () => {
    // --- Password Protection Logic ---
    const passwordScreen = document.getElementById('passwordScreen');
    const passwordForm = document.getElementById('passwordForm');
    const passwordInput = document.getElementById('passwordInput');
    const passwordError = document.getElementById('passwordError');
    const appContent = document.getElementById('appContent');
    const sessionKey = 'visionBoardSessionActive';

    // !!! REPLACE THIS WITH YOUR ACTUAL SHA-256 HASH !!!
    // Example hash for password 'password123'
    const CORRECT_PASSWORD_HASH = 'b25f4b2e9482d556cf390cf76dcca1728f6c92d40f8ec2fbc6532cfaee81f3b0'; 

    async function checkPassword(enteredPassword) {
        passwordError.textContent = ''; // Clear previous errors
        if (!enteredPassword) return false;

        try {
            // Hash the entered password using SHA-256
            const encoder = new TextEncoder();
            const data = encoder.encode(enteredPassword);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            
            // Convert ArrayBuffer to hex string
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const enteredHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            console.log('Entered Hash:', enteredHash);
            console.log('Correct Hash:', CORRECT_PASSWORD_HASH);

            if (enteredHash === CORRECT_PASSWORD_HASH) {
                return true;
            } else {
                passwordError.textContent = 'Incorrect password.';
                return false;
            }
        } catch (error) {
            console.error('Error hashing password:', error);
            passwordError.textContent = 'Error checking password. Try again.';
            return false;
        }
    }

    function showAppContent() {
        // Ensure elements exist before manipulating them
        if (passwordScreen && appContent) {
            passwordScreen.style.display = 'none';
            appContent.style.display = 'block'; 
            sessionStorage.setItem(sessionKey, 'true');
            document.title = "Cutus' Canvas"; // Update tab title
            initializeAppLogic(); 
        } else {
            console.error('Password screen or app content element not found!');
        }
    }

    // Check session storage first
    if (sessionStorage.getItem(sessionKey) === 'true') {
        console.log('Active session found, skipping password.');
        showAppContent();
    } else {
        // No active session, make sure password screen is visible and add listener
        if (passwordScreen) {
            passwordScreen.style.display = 'flex'; // Make sure it's visible if no session
            if (passwordForm) {
                passwordForm.addEventListener('submit', async (event) => {
                    event.preventDefault();
                    const enteredPassword = passwordInput ? passwordInput.value : '';
                    const isCorrect = await checkPassword(enteredPassword);
                    if (isCorrect) {
                        showAppContent();
                    } else {
                        if (passwordInput) {
                            passwordInput.value = ''; // Clear input on failure
                            passwordInput.focus();
                        }
                    }
                });
            } else {
                console.error('Password form not found!');
            }
        } else {
             console.error('Password screen not found! Cannot set up listener.');
        }
    }
    // --- End Password Protection Logic ---

    // --- Initialize App Logic (Run only after password success) ---
    function initializeAppLogic() {
        console.log('Initializing app logic...');

        // --- START Firebase Setup ---
        // TODO: Replace with your actual Firebase project configuration
        const firebaseConfig = {
            apiKey: "AIzaSyDMMbL4iXRioL2iKEpGf1WcZoLClLyMTvw",
            authDomain: "visionboard-6ccfb.firebaseapp.com",
            projectId: "visionboard-6ccfb",
            storageBucket: "visionboard-6ccfb.firebasestorage.app",
            messagingSenderId: "700195149017",
            appId: "1:700195149017:web:185af64436f8315a911ac8",
            measurementId: "G-HZTLYPH18Z"
          };

        // Initialize Firebase
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        const database = firebase.database();
        const itemsRef = database.ref('visionBoardItems');
        // --- END Firebase Setup ---

        // Get DOM elements
        const addItemBtn = document.getElementById('addItemBtn');
        const modal = document.getElementById('addItemModal');
        const closeButton = document.querySelector('.close-button');
        const addItemForm = document.getElementById('addItemForm');
        const board = document.getElementById('board');
        const userBigBtn = document.getElementById('userBigBtn');
        const userLilBtn = document.getElementById('userLilBtn');

        let editingItemId = null; 
        let currentAdder = 'big';

        // --- START Modal Helper Functions ---
        function openModalForAdd() {
            editingItemId = null; 
            if (addItemForm) {
                addItemForm.reset(); 
            }
            if (modal) {
                modal.querySelector('h2').textContent = 'Add New Item';
                modal.querySelector('button[type="submit"]').textContent = 'Add Item';
                modal.classList.add('display');
            }
        }

        function openModalForEdit(item) {
            editingItemId = item.id;
            if (addItemForm) {
                document.getElementById('itemName').value = item.name;
                document.getElementById('itemLink').value = item.link || '';
                document.getElementById('itemImage').value = item.imageUrl || '';
                document.getElementById('itemDescription').value = item.description || '';
            }
            if (modal) {
                modal.querySelector('h2').textContent = 'Edit Item';
                modal.querySelector('button[type="submit"]').textContent = 'Save Changes';
                modal.classList.add('display');
            }
        }

        function closeModal() {
            if (modal) modal.classList.remove('display');
            editingItemId = null; 
            if (addItemForm) addItemForm.reset(); 
        }
        // --- END Modal Helper Functions ---

        // --- User Toggle Logic ---
        function setActiveUser(selectedUser) {
            currentAdder = selectedUser;
            if (selectedUser === 'big') {
                userBigBtn.classList.add('active');
                userLilBtn.classList.remove('active');
            } else { 
                userLilBtn.classList.add('active');
                userBigBtn.classList.remove('active');
            }
            console.log('Current adder set to:', currentAdder);
        }

        // Ensure buttons exist before adding listeners
        if (userBigBtn && userLilBtn) {
            userBigBtn.addEventListener('click', () => setActiveUser('big'));
            userLilBtn.addEventListener('click', () => setActiveUser('lil'));
        } else {
            console.error('User toggle buttons not found!');
        }
        // --- End User Toggle Logic ---

        // --- Firebase Functions ---
        function saveItemToFirebase(itemData) {
            if (itemData.id) {
                itemsRef.child(itemData.id).set(itemData)
                    .then(() => console.log("Item saved to Firebase:", itemData))
                    .catch(error => console.error("Error saving item to Firebase:", error));
            } else {
                console.error("Cannot save item without an ID", itemData);
            }
        }

        function deleteItemFromFirebase(itemId) {
            itemsRef.child(itemId).remove()
                .then(() => console.log("Item deleted from Firebase, ID:", itemId))
                .catch(error => console.error("Error deleting item from Firebase:", error));
        }
        // --- End Firebase Functions ---

        // --- Modal Handling & FAB Logic ---
        if (addItemBtn && modal && closeButton) {
            addItemBtn.addEventListener('click', () => {
                openModalForAdd();
            });

            closeButton.addEventListener('click', () => {
                closeModal();
            });

            window.addEventListener('click', (event) => {
                if (modal.classList.contains('display') && !modal.contains(event.target) && event.target !== addItemBtn) {
                    closeModal();
                }
            });
        } else {
            console.error('FAB or Modal elements not found!');
        }
        // --- END Modal Handling & FAB Logic ---

        // --- Form Submission (Add/Edit) ---
        if (addItemForm) {
            addItemForm.addEventListener('submit', (event) => {
                event.preventDefault(); 

                const itemData = {
                    name: document.getElementById('itemName').value,
                    link: document.getElementById('itemLink').value,
                    imageUrl: document.getElementById('itemImage').value,
                    description: document.getElementById('itemDescription').value,
                    id: editingItemId || Date.now().toString(),
                    adder: editingItemId ? null : currentAdder, 
                    order: editingItemId ? null : Date.now() // Add initial order for new items
                };

                if (!itemData.name) {
                    alert('Item name is required!');
                    return;
                }

                if (editingItemId) {
                    // Logic for editing - preserve original adder and order
                    itemsRef.child(editingItemId).once('value', (snapshot) => {
                        const existingItem = snapshot.val();
                        if (existingItem) {
                            itemData.adder = existingItem.adder; // Preserve original adder
                            itemData.order = existingItem.order || Date.now(); // Preserve order or set if missing
                            saveItemToFirebase(itemData);
                        } else {
                            console.error('Item to edit not found in Firebase');
                        }
                    });
                } else {
                    // Save new item to Firebase
                    saveItemToFirebase(itemData);
                }
                
                closeModal();
            });
        } else {
            console.error('Add item form not found!');
        }
        // --- End Form Submission ---

        // --- Board Click Listener (for edit/delete actions) ---
        if (board) {
            board.addEventListener('click', (event) => {
                const itemDiv = event.target.closest('.board-item');
                const target = event.target;

                if (!itemDiv || !itemDiv.dataset.id) {
                    return;
                }
                
                const itemId = itemDiv.dataset.id;

                if (target.classList.contains('delete-item-btn')) {
                    if (confirm('Are you sure you want to delete this item?')) {
                        deleteItem(itemId);
                    }
                } else if (target.classList.contains('edit-item-btn')) {
                    openModalForEditWithFirebase(itemId);
                }
            });
        }

        // Helper function for opening edit modal (fetching data from Firebase)
        function openModalForEditWithFirebase(itemId) {
            itemsRef.child(itemId).once('value', (snapshot) => {
                const itemToEdit = snapshot.val();
                if (itemToEdit) {
                    openModalForEdit(itemToEdit);
                } else {
                    console.error('Item to edit not found in Firebase, ID:', itemId);
                    alert('Sorry, couldn\'t find that item to edit.');
                }
            }, (errorObject) => {
                console.error("Firebase read failed for edit: " + errorObject.name);
                alert('Error fetching item details for editing.');
            });
        }

        // --- Function to Delete Item ---
        function deleteItem(idToDelete) {
            console.log('[Delete] Attempting to delete item with ID:', idToDelete);
            deleteItemFromFirebase(idToDelete);
        }
        // --- End Function to Delete Item ---

        // --- Function to Create/Add Item Element to Board ---
        function addItemToBoard(name, link, imageUrl, description, id, adder) { 
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('board-item');
            itemDiv.dataset.id = id;

            if (imageUrl) {
                const imgElement = document.createElement('img');
                imgElement.src = imageUrl;
                imgElement.alt = name; 
                imgElement.classList.add('product-image'); 
                imgElement.onerror = () => { imgElement.style.display = 'none'; };
                itemDiv.appendChild(imgElement);
            }

            if (adder) {
                const iconImg = document.createElement('img');
                iconImg.classList.add('adder-icon');
                iconImg.src = adder === 'big' ? 'assets/donkey.png' : 'assets/lion.png';
                iconImg.alt = adder === 'big' ? "Big's item" : "Lil's item";
                itemDiv.appendChild(iconImg);
            }

            const actionBtnsContainer = document.createElement('div');
            actionBtnsContainer.classList.add('item-actions');

            const editBtn = document.createElement('button');
            editBtn.classList.add('edit-item-btn');
            editBtn.innerHTML = '&#9998;'; 
            editBtn.setAttribute('aria-label', 'Edit item');
            actionBtnsContainer.appendChild(editBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-item-btn');
            deleteBtn.innerHTML = '&times;'; 
            deleteBtn.setAttribute('aria-label', 'Delete item'); 
            actionBtnsContainer.appendChild(deleteBtn);
            
            itemDiv.appendChild(actionBtnsContainer);

            const contentContainer = document.createElement('div');
            contentContainer.classList.add('item-content');
            const nameElement = document.createElement('h2');
            nameElement.textContent = name;
            contentContainer.appendChild(nameElement);
            if (description) {
                const descElement = document.createElement('p');
                descElement.textContent = description;
                contentContainer.appendChild(descElement);
            }
            if (link) {
                const linkElement = document.createElement('a');
                linkElement.href = link;
                linkElement.textContent = 'View Link';
                linkElement.target = '_blank'; 
                linkElement.rel = 'noopener noreferrer'; 
                contentContainer.appendChild(linkElement);
            }
            itemDiv.appendChild(contentContainer);
            
            const placeholder = board.querySelector('#board-placeholder');
            if (placeholder) {
                placeholder.remove();
            }

            board.appendChild(itemDiv);
        }
        // --- End Function to Create/Add Item Element to Board ---

        // --- START Render Board Function ---
        function renderBoard(itemsData) {
            if (!board) { 
                console.error("renderBoard: Board element not found!"); 
                return; 
            }
            board.innerHTML = ''; // Clear board before repopulating
            
            console.log('[RenderBoard] Rendering with Items:', itemsData);

            const itemsArray = Object.values(itemsData || {});
            
            // Sort items by order
            itemsArray.sort((a, b) => (a.order || 0) - (b.order || 0));
            
            itemsArray.forEach(item => {
                if (item && typeof item === 'object' && item.name && item.id) {
                    addItemToBoard(item.name, item.link || '', item.imageUrl || '', item.description || '', item.id, item.adder);
                } else {
                    console.warn('[RenderBoard] Skipping invalid item:', item);
                }
            });

            displayPlaceholderIfNeeded();
            initializeSortable(); 
        }
        // --- END Render Board Function ---

        // --- Load initial items & Set up Listeners ---
        function loadInitialItemsAndListen() {
            if (!board) { 
                console.error("loadInitialItemsAndListen: Board element not found!"); 
                return; 
            }

            itemsRef.on('value', (itemsSnapshot) => {
                console.log('[Firebase Listener] Items data changed or loaded.');
                const currentItemsData = itemsSnapshot.val() || {};
                renderBoard(currentItemsData);
            }, (errorObject) => {
                console.error("[Firebase Listener] Items read failed: " + errorObject.name);
                board.innerHTML = '<p style="color:red; text-align:center;">Error loading items from database.</p>';
            });
        }
        // --- End Load Initial Items & Listeners ---

        function displayPlaceholderIfNeeded() {
            if (!board.hasChildNodes()) {
                 if (!board.querySelector('#board-placeholder')) {
                    board.innerHTML = '<p id="board-placeholder" style="text-align: center; width: 100%; grid-column: 1 / -1; color: #777;">Your vision board is empty. Click the + button to add items!</p>';
                }
            } else {
                const placeholder = board.querySelector('#board-placeholder');
                if (placeholder) {
                    placeholder.remove();
                }
            }
        }
        
        function initializeSortable() {
            if (typeof Sortable !== 'undefined') {
                if (board.sortableInstance) {
                    board.sortableInstance.destroy(); // Destroy previous instance if exists
                }
                board.sortableInstance = new Sortable(board, {
                    animation: 150,
                    ghostClass: 'sortable-ghost',
                    onEnd: function (evt) {
                        console.log('Drag ended.');
                        const boardChildren = Array.from(board.children);
                        let updates = {};
                        let currentOrder = 0;

                        boardChildren.forEach((childElement) => {
                            if (childElement.classList.contains('board-item') && childElement.dataset.id) {
                                updates[`visionBoardItems/${childElement.dataset.id}/order`] = currentOrder++;
                            }
                        });

                        if (Object.keys(updates).length > 0) {
                            database.ref().update(updates)
                                .then(() => console.log('Order updated in Firebase', updates))
                                .catch(error => console.error('Error updating order in Firebase:', error));
                        }
                    }
                });
            } else {
                console.error('SortableJS is not loaded!');
            }
        }

        loadInitialItemsAndListen();

    } // --- End initializeAppLogic ---

}); 