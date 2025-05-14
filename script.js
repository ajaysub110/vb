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

        // All the previous code from DOMContentLoaded goes here
        const addButton = document.getElementById('addButton');
        const modal = document.getElementById('addItemModal');
        const closeButton = document.querySelector('.close-button');
        const addItemForm = document.getElementById('addItemForm');
        const board = document.getElementById('board');
        const userBigBtn = document.getElementById('userBigBtn');
        const userLilBtn = document.getElementById('userLilBtn');

        const STORAGE_KEY = 'visionBoardItems';
        let editingItemId = null; 
        let currentAdder = 'big'; 

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

        // Ensure buttons exist before adding listeners (they are inside #appContent)
        if (userBigBtn && userLilBtn) {
            userBigBtn.addEventListener('click', () => setActiveUser('big'));
            userLilBtn.addEventListener('click', () => setActiveUser('lil'));
        } else {
            console.error('User toggle buttons not found!');
        }
        // --- End User Toggle Logic ---

        // --- Local Storage Functions ---
        // These are being replaced by Firebase functions
        /*
        function getItemsFromStorage() {
            const itemsJson = localStorage.getItem(STORAGE_KEY);
            try {
                return itemsJson ? JSON.parse(itemsJson) : [];
            } catch (e) {
                console.error('Error parsing items from localStorage', e);
                return [];
            }
        }

        function saveItemsToStorage(items) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
            } catch (e) {
                console.error('Error saving items to localStorage', e);
            }
        }
        */
        // --- End Local Storage Functions ---

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

        // --- Modal Handling --- 
        function openModalForAdd() {
            editingItemId = null; 
            addItemForm.reset(); 
            modal.querySelector('h2').textContent = 'Add New Item';
            modal.querySelector('button[type="submit"]').textContent = 'Add Item';
            modal.classList.add('display');
        }

        function openModalForEdit(item) {
            editingItemId = item.id;
            document.getElementById('itemName').value = item.name;
            document.getElementById('itemLink').value = item.link || '';
            document.getElementById('itemImage').value = item.imageUrl || '';
            document.getElementById('itemDescription').value = item.description || '';
            modal.querySelector('h2').textContent = 'Edit Item';
            modal.querySelector('button[type="submit"]').textContent = 'Save Changes';
            modal.classList.add('display');
        }

        function closeModal() {
            modal.classList.remove('display');
            editingItemId = null; 
            addItemForm.reset(); 
        }

        // Ensure modal elements exist
        if (addButton && closeButton && modal) {
            addButton.addEventListener('click', openModalForAdd);
            closeButton.addEventListener('click', closeModal);
            window.addEventListener('click', (event) => {
                if (event.target === modal) {
                    closeModal();
                }
            });
        } else {
             console.error('Modal elements (addButton, closeButton, modal) not found!');
        }
        // --- End Modal Handling ---

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
                    adder: editingItemId ? null : currentAdder 
                };

                if (!itemData.name) {
                    alert('Item name is required!');
                    return;
                }

                // let currentItems = getItemsFromStorage(); // Replaced by Firebase

                if (editingItemId) {
                    // Logic for editing needs to be adapted for Firebase
                    // For now, we assume editing will update the item in Firebase
                    // We need to fetch the item first to preserve its original adder if not passed
                    itemsRef.child(editingItemId).once('value', (snapshot) => {
                        const existingItem = snapshot.val();
                        if (existingItem) {
                            itemData.adder = existingItem.adder; // Preserve original adder
                            saveItemToFirebase(itemData);
                            // updateItemInBoard(itemData); // UI update will be handled by Firebase listener
                        } else {
                            console.error('Item to edit not found in Firebase');
                        }
                    });
                } else {
                    // addItemToBoard(itemData.name, itemData.link, itemData.imageUrl, itemData.description, itemData.id, itemData.adder); // UI update by listener
                    // currentItems.push(itemData); // No local array to push to
                    saveItemToFirebase(itemData); // Save new item to Firebase
                }
                
                closeModal();
            });
        } else {
            console.error('Add item form not found!');
        }
        // --- End Form Submission ---

        // --- Event Listener for Edit/Delete Items ---
        if (board) {
            board.addEventListener('click', (event) => {
                const target = event.target;
                const itemDiv = target.closest('.board-item');

                if (!itemDiv || !itemDiv.dataset.id) return; 
                
                const itemId = itemDiv.dataset.id;

                if (target.classList.contains('delete-item-btn')) {
                    if (confirm('Are you sure you want to delete this item?')) {
                         deleteItem(itemId);
                    }
                } else if (target.classList.contains('edit-item-btn')) {
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
            });
        } else {
            console.error('Board element not found!');
        }
        // --- End Event Listener ---

        // --- Function to Delete Item ---
        function deleteItem(idToDelete) {
            console.log('[Delete] Attempting to delete item with ID (from DOM):', idToDelete, `(Type: ${typeof idToDelete})`);
            
            // const itemToRemove = board.querySelector(`.board-item[data-id="${idToDelete}"]`); // UI update by listener
            // if (itemToRemove) {
            //     itemToRemove.remove();
            //     console.log('[Delete] Removed item from DOM.');
            // } else {
            //     console.warn('[Delete] Could not find item in DOM to remove with ID:', idToDelete);
            // }

            deleteItemFromFirebase(idToDelete); // Delete from Firebase

            // let currentItems = getItemsFromStorage(); // Replaced
            // ... (rest of the old localStorage delete logic is removed) ...
            // saveItemsToStorage(currentItems);

            // if (currentItems.length === 0 && !board.querySelector('#board-placeholder')) { // Placeholder logic needs adjustment
            //      board.innerHTML = '<p id="board-placeholder" style="text-align: center; width: 100%; grid-column: 1 / -1; color: #777;">Your vision board is empty. Click the + button to add items!</p>';
            // }
        }
        // --- End Function to Delete Item ---

        // --- Function to Create/Add Item Element to Board ---
        function addItemToBoard(name, link, imageUrl, description, id, adder) { 
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('board-item');
            itemDiv.dataset.id = id;

            // --- Add Product Image (if exists, as first child for stacking) ---
            if (imageUrl) {
                const imgElement = document.createElement('img');
                imgElement.src = imageUrl;
                imgElement.alt = name; 
                imgElement.classList.add('product-image'); // Add class for specific styling
                imgElement.onerror = () => {
                    // imgElement.alt = `${name} (Image failed to load)`; // Alt is already set
                    imgElement.style.display = 'none'; 
                };
                itemDiv.appendChild(imgElement);
            }
            // ----------------------------------

            // --- Add Adder Icon (Top-Left) ---
            if (adder) {
                const iconImg = document.createElement('img');
                iconImg.classList.add('adder-icon');
                iconImg.src = adder === 'big' ? 'assets/donkey.png' : 'assets/lion.png';
                iconImg.alt = adder === 'big' ? "Big's item" : "Lil's item";
                itemDiv.appendChild(iconImg);
            }
            // ----------------------------------

            // --- Add Action Buttons Container (Top-Right) ---
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
            // ----------------------------------

            // --- Add Item Content (Name, Image, Desc, Link) ---
            const contentContainer = document.createElement('div');
            contentContainer.classList.add('item-content');

            const nameElement = document.createElement('h2');
            nameElement.textContent = name;
            contentContainer.appendChild(nameElement);

            // Product image is now a direct child of itemDiv, not here
            /* if (imageUrl) { ... } */

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
            // -----------------------------------------------
            
            const placeholder = board.querySelector('#board-placeholder');
            if (placeholder) {
                placeholder.remove();
            }

            board.appendChild(itemDiv);
        }
        // --- End Function to Create/Add Item Element ---

        // --- Function to Update Item Element in Board ---
        function updateItemInBoard(itemData) {
            const itemDiv = board.querySelector(`.board-item[data-id="${itemData.id}"]`);
            if (!itemDiv) return;

            // --- Update Product Image ---
            let existingProductImage = itemDiv.querySelector('.product-image');
            if (existingProductImage) {
                existingProductImage.remove();
            }
            if (itemData.imageUrl) {
                const imgElement = document.createElement('img');
                imgElement.src = itemData.imageUrl;
                imgElement.alt = itemData.name;
                imgElement.classList.add('product-image');
                imgElement.onerror = () => {
                    imgElement.style.display = 'none';
                };
                // Add the image as the first child of itemDiv for proper layering
                itemDiv.insertBefore(imgElement, itemDiv.firstChild);
            }
            // ---------------------------

            // Note: We don't need to update the adder class here as it shouldn't change on edit.
            const contentContainer = itemDiv.querySelector('.item-content');
            if (!contentContainer) {
                // Should not happen if addItemToBoard always creates it, but good guard
                console.error("Item content container not found for update", itemData.id);
                return;
            }

            contentContainer.innerHTML = ''; 

            const nameElement = document.createElement('h2');
            nameElement.textContent = itemData.name;
            contentContainer.appendChild(nameElement);

            if (itemData.description) {
                const descElement = document.createElement('p');
                descElement.textContent = itemData.description;
                contentContainer.appendChild(descElement);
            }

            if (itemData.link) {
                const linkElement = document.createElement('a');
                linkElement.href = itemData.link;
                linkElement.textContent = 'View Link';
                linkElement.target = '_blank'; 
                linkElement.rel = 'noopener noreferrer'; 
                contentContainer.appendChild(linkElement);
            }
        }
        // --- End Function to Update Item Element ---

        // --- Load initial items ---
        function loadInitialItems() {
            if (!board) { console.error("Board element not found during init!"); return; }
            board.innerHTML = ''; // Clear the board for Firebase items

            itemsRef.on('value', (snapshot) => {
                board.innerHTML = ''; // Clear board before repopulating
                const items = snapshot.val();
                console.log('[Firebase] Data received:', items);

                if (items) {
                    Object.values(items).forEach(item => {
                        if (item && typeof item === 'object' && item.name && item.id) {
                            addItemToBoard(
                                item.name,
                                item.link || '',
                                item.imageUrl || '',
                                item.description || '',
                                item.id,
                                item.adder
                            );
                        } else {
                            console.warn('[Firebase Display] Skipping invalid item structure:', item);
                        }
                    });
                }
                
                if (!board.hasChildNodes() || (items && Object.keys(items).length === 0)) {
                    if (!board.querySelector('#board-placeholder')) {
                        board.innerHTML = '<p id="board-placeholder" style="text-align: center; width: 100%; grid-column: 1 / -1; color: #777;">Your vision board is empty. Click the + button to add items!</p>';
                    }
                } else {
                    const placeholder = board.querySelector('#board-placeholder');
                    if (placeholder) {
                        placeholder.remove();
                    }
                }
            }, (errorObject) => {
                console.error("The read failed: " + errorObject.name);
                board.innerHTML = '<p style="color:red; text-align:center;">Error loading items from database.</p>';
            });
            
            // Old localStorage loading logic removed
            /*
            let items = getItemsFromStorage();
            let needsSave = false;

            console.log('[Before Migration] Items from localStorage:', JSON.parse(JSON.stringify(items)));

            // --- Migration & Cleanup ---
            // ... (migration logic removed as it was for localStorage) ...
            // ---------------------------------------------

            console.log('[After Migration] Items to be displayed:', JSON.parse(JSON.stringify(items)));

            if (items.length === 0) {
                board.innerHTML = '<p id="board-placeholder" style="text-align: center; width: 100%; grid-column: 1 / -1; color: #777;">Your vision board is empty. Click the + button to add items!</p>';
            } else {
                items.forEach(item => {
                    if (item && typeof item === 'object' && item.name && item.id) {
                        addItemToBoard(
                            item.name,
                            item.link || '',
                            item.imageUrl || '',
                            item.description || '',
                            item.id,
                            item.adder
                        );
                    } else {
                        console.warn('[Display] Skipping invalid item structure:', item);
                    }
                });
            }
            */
        }
        // --- End Load Initial Items ---
        
        // --- Firebase Listeners for real-time updates ---
        // The 'value' listener in loadInitialItems already handles add, update, delete by re-rendering.
        // For more granular control, you could use:
        // itemsRef.on('child_added', snapshot => { ... addItemToBoard(snapshot.val()) ... });
        // itemsRef.on('child_changed', snapshot => { ... updateItemInBoard(snapshot.val()) ... });
        // itemsRef.on('child_removed', snapshot => { ... removeItemFromBoard(snapshot.key) ... });
        // However, for simplicity and robustness with current structure, 'value' listener is often sufficient.

        loadInitialItems(); // Load items when the app logic initializes

    } // --- End initializeAppLogic ---

}); 