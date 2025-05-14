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
        const stacksRef = database.ref('stacks'); // <-- NEW: Firebase reference for stacks
        // --- END Firebase Setup ---

        // All the previous code from DOMContentLoaded goes here
        const mainFabBtn = document.getElementById('mainFabBtn'); // <-- NEW: Main FAB
        const fabAddItemBtn = document.getElementById('fabAddItemBtn'); // <-- NEW: Add Item sub-FAB
        const fabCreateStackBtn = document.getElementById('fabCreateStackBtn'); // <-- NEW: Create Stack sub-FAB
        const doneStackingBtn = document.getElementById('doneStackingBtn'); // <-- NEW: Done Stacking button

        const modal = document.getElementById('addItemModal');
        const closeButton = document.querySelector('.close-button');
        const addItemForm = document.getElementById('addItemForm');
        const board = document.getElementById('board');
        const userBigBtn = document.getElementById('userBigBtn');
        const userLilBtn = document.getElementById('userLilBtn');

        const STORAGE_KEY = 'visionBoardItems';
        let editingItemId = null; 
        let currentAdder = 'big';
        let isStackCreationMode = false; // <-- NEW: State for stack creation mode
        let selectedCardsForStack = []; // <-- NEW: Array to store IDs of cards selected for stack

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

        // --- Firebase Stack Functions (Consolidated) ---
        function createStackInFirebase(stackName, itemIds) {
            const stackId = Date.now().toString(); // Simple unique ID for the stack
            const stackData = {
                id: stackId,
                name: stackName,
                createdAt: firebase.database.ServerValue.TIMESTAMP, // Use server timestamp
                itemIds: itemIds // Store an array of item IDs in the stack
            };

            const updates = {};
            updates[`/stacks/${stackId}`] = stackData;
            itemIds.forEach(itemId => {
                updates[`/visionBoardItems/${itemId}/stackId`] = stackId;
            });

            return database.ref().update(updates)
                .then(() => {
                    console.log('Stack created and items updated successfully:', stackId);
                    return stackId;
                })
                .catch(error => {
                    console.error('Error creating stack:', error);
                    throw error; // Re-throw to be caught by caller if needed
                });
        }

        function removeItemFromStackFirebase(itemId, currentStackId) {
            const updates = {};
            updates[`/visionBoardItems/${itemId}/stackId`] = null;

            return database.ref().update(updates)
                .then(() => {
                    console.log(`Item ${itemId} removed from stack ${currentStackId}`);
                    // Check if the stack is now empty and potentially delete it
                    return checkAndDeleteEmptyStack(currentStackId);
                })
                .catch(error => {
                    console.error(`Error removing item ${itemId} from stack:`, error);
                    throw error;
                });
        }

        function checkAndDeleteEmptyStack(stackId) {
            if (!stackId) return Promise.resolve();

            return itemsRef.orderByChild('stackId').equalTo(stackId).once('value')
                .then(snapshot => {
                    if (!snapshot.exists()) {
                        // No items left in this stack, so delete the stack itself
                        console.log(`Stack ${stackId} is empty, deleting.`);
                        return stacksRef.child(stackId).remove()
                            .then(() => console.log(`Stack ${stackId} deleted.`))
                            .catch(error => console.error(`Error deleting empty stack ${stackId}:`, error));
                    } else {
                        console.log(`Stack ${stackId} still has items.`);
                        return Promise.resolve(); // Stack is not empty, do nothing
                    }
                });
        }
        // --- End Firebase Stack Functions ---

        // --- "Done Stacking" Button Handler ---
        if (doneStackingBtn) {
            doneStackingBtn.addEventListener('click', () => {
                if (selectedCardsForStack.length < 1) { // Require at least 1 item for a stack
                    alert('Please select at least one item to create a stack.');
                    return;
                }

                const stackName = prompt('Enter a name for your new stack:');
                if (stackName && stackName.trim() !== '') {
                    createStackInFirebase(stackName.trim(), [...selectedCardsForStack]) // Pass a copy
                        .then(() => {
                            alert(`Stack "${stackName.trim()}" created!`);
                        })
                        .catch(error => {
                            alert('Failed to create stack. See console for details.');
                        })
                        .finally(() => {
                            exitStackCreationMode();
                        });
                } else if (stackName !== null) { // User pressed OK but entered no name
                    alert('Stack name cannot be empty.');
                } else {
                    // User pressed Cancel on the prompt, just exit stack creation mode
                    exitStackCreationMode();
                }
            });
        }
        // --- End "Done Stacking" Button Handler ---

        // --- Modal Handling & FAB Logic ---
        function toggleFabOptions() {
            const secondaryButtons = [fabAddItemBtn, fabCreateStackBtn];
            // Use the first button to determine current visibility state
            const currentlyVisible = secondaryButtons[0] && secondaryButtons[0].classList.contains('visible');

            console.log('Toggling FAB options. Currently visible:', currentlyVisible);
            
            if (currentlyVisible) {
                // Hide them
                secondaryButtons.forEach(btn => {
                    if (btn) {
                        btn.classList.remove('visible');
                        if (btn.id === 'fabCreateStackBtn') console.log('Attempting to hide fabCreateStackBtn by removing .visible');
                    }
                });
                setTimeout(() => {
                    secondaryButtons.forEach(btn => {
                        if (btn && !btn.classList.contains('visible')) {
                            btn.style.display = 'none';
                            if (btn.id === 'fabCreateStackBtn') console.log('fabCreateStackBtn display set to none');
                        }
                    });
                }, 200); // Match CSS transition time (0.2s)
            } else {
                // Show them
                secondaryButtons.forEach(btn => {
                    if (btn) {
                        btn.style.display = 'block';
                        if (btn.id === 'fabCreateStackBtn') console.log('fabCreateStackBtn display set to block');
                    }
                });
                setTimeout(() => {
                    secondaryButtons.forEach(btn => {
                        if (btn) {
                            btn.classList.add('visible');
                            if (btn.id === 'fabCreateStackBtn') console.log('Attempting to show fabCreateStackBtn by adding .visible');
                        }
                    });
                }, 10); // Short delay for display:block to take effect
            }
        }

        function enterStackCreationMode() {
            isStackCreationMode = true;
            selectedCardsForStack = [];
            doneStackingBtn.style.display = 'block';
            fabAddItemBtn.style.display = 'none';
            fabCreateStackBtn.style.display = 'none';
            fabAddItemBtn.classList.remove('visible');
            fabCreateStackBtn.classList.remove('visible');
            // Optionally, add a class to the board or body to indicate stack creation mode
            board.classList.add('stack-creation-active'); 
            console.log('Entered stack creation mode');
        }

        function exitStackCreationMode() {
            isStackCreationMode = false;
            doneStackingBtn.style.display = 'none';
            selectedCardsForStack.forEach(cardId => {
                const cardEl = board.querySelector(`.board-item[data-id="${cardId}"]`);
                if (cardEl) cardEl.classList.remove('selected-for-stack');
            });
            selectedCardsForStack = [];
            board.classList.remove('stack-creation-active');
            console.log('Exited stack creation mode');
        }

        if (mainFabBtn && fabAddItemBtn && fabCreateStackBtn && doneStackingBtn && modal && closeButton) {
            mainFabBtn.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent window click from closing immediately
                if (isStackCreationMode) {
                    // If in stack mode, main FAB click could cancel it or do nothing for now.
                    // Let's make it do nothing for now, user must click "Done Stacking" or an explicit cancel.
                    return; 
                }
                toggleFabOptions();
            });

            fabAddItemBtn.addEventListener('click', () => {
                if (isStackCreationMode) exitStackCreationMode(); // Exit stack mode if trying to add item
                openModalForAdd();
                toggleFabOptions(); // Hide options after selection
            });

            fabCreateStackBtn.addEventListener('click', () => {
                enterStackCreationMode();
                // No need to toggleFabOptions here as enterStackCreationMode hides them
            });

            // doneStackingBtn listener will be added later with stack creation logic

            closeButton.addEventListener('click', () => {
                closeModal();
                if (isStackCreationMode) exitStackCreationMode(); // Also exit if modal is closed
            });

            window.addEventListener('click', (event) => {
                if (modal.classList.contains('display') && !modal.contains(event.target) && event.target !== fabAddItemBtn && event.target !== mainFabBtn && event.target !== fabCreateStackBtn) {
                    closeModal();
                    if (isStackCreationMode) exitStackCreationMode(); 
                }
                // Close FAB options if clicking outside the FAB container when options are visible
                if (fabAddItemBtn.classList.contains('visible') && !mainFabBtn.contains(event.target) && !fabAddItemBtn.contains(event.target) && !fabCreateStackBtn.contains(event.target)) {
                    toggleFabOptions();
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

                // let currentItems = getItemsFromStorage(); // Replaced by Firebase

                if (editingItemId) {
                    // Logic for editing needs to be adapted for Firebase
                    // For now, we assume editing will update the item in Firebase
                    // We need to fetch the item first to preserve its original adder if not passed
                    itemsRef.child(editingItemId).once('value', (snapshot) => {
                        const existingItem = snapshot.val();
                        if (existingItem) {
                            itemData.adder = existingItem.adder; // Preserve original adder
                            itemData.order = existingItem.order || Date.now(); // Preserve order or set if missing during edit
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

        // --- Combined Board Click Listener (for actions AND stack selection) ---
        if (board) {
            board.addEventListener('click', (event) => {
                const itemDiv = event.target.closest('.board-item');
                const target = event.target;

                if (isStackCreationMode) {
                    if (itemDiv && itemDiv.dataset.id && !target.closest('.item-actions')) {
                        // In stack creation mode & clicked on a card body (not an action button within it)
                        const itemId = itemDiv.dataset.id;
                        if (itemDiv.classList.contains('stacked-item') && !selectedCardsForStack.includes(itemId)) {
                            alert('This item is already part of another stack and cannot be added to a new one unless unstacked first.');
                            return;
                        }
                        const index = selectedCardsForStack.indexOf(itemId);
                        if (index > -1) {
                            selectedCardsForStack.splice(index, 1);
                            itemDiv.classList.remove('selected-for-stack');
                        } else {
                            selectedCardsForStack.push(itemId);
                            itemDiv.classList.add('selected-for-stack');
                        }
                        console.log('Selected cards for stack:', selectedCardsForStack);
                        return; // Handled stack selection, stop further processing for this click
                    }
                    // If in stack creation mode and click was on an action button, it will be handled below if it's a stack-action-btn.
                    // Or if it was on edit/delete, those sections will now correctly check isStackCreationMode.
                }

                // Regular click processing (not in stack selection mode, or on an action button during stack mode)
                if (!itemDiv || !itemDiv.dataset.id) return;
                const itemId = itemDiv.dataset.id;
                const itemStackId = itemDiv.dataset.stackId || null;

                if (target.classList.contains('delete-item-btn')) {
                    if (isStackCreationMode) return; 
                    if (confirm('Are you sure you want to delete this item?')) {
                        deleteItem(itemId);
                    }
                } else if (target.classList.contains('edit-item-btn')) {
                    if (isStackCreationMode) return; 
                    openModalForEditWithFirebase(itemId); // Renamed for clarity
                } else if (target.classList.contains('stack-action-btn')) {
                    if (itemStackId) { // "Unstack" button clicked
                        if (isStackCreationMode) {
                            alert("Please finish or cancel the current stack creation before unstacking items.");
                            return;
                        }
                        if (confirm(`Are you sure you want to remove "${itemDiv.querySelector('h2').textContent}" from its stack?`)) {
                            removeItemFromStackFirebase(itemId, itemStackId)
                                .then(() => alert('Item removed from stack.'))
                                .catch(() => alert('Failed to remove item from stack.'));
                        }
                    } else { // "Add to Stack / Create Stack" button clicked
                        if (!isStackCreationMode) {
                            enterStackCreationMode();
                        }
                        // Toggle selection for the current card
                        const index = selectedCardsForStack.indexOf(itemId);
                        if (index > -1) { // Already selected (e.g. by clicking card body first, then stack icon)
                            // Optional: could unselect, or do nothing as it's already selected
                            // For simplicity, let's assume if you click stack icon on selected card, it remains selected.
                            // If it was NOT selected, it gets added.
                        } else {
                            if (itemDiv.classList.contains('stacked-item')) {
                                alert('This item is already part of another stack.');
                                return;
                            }
                            selectedCardsForStack.push(itemId);
                            itemDiv.classList.add('selected-for-stack');
                        }
                        console.log('Selected cards for stack:', selectedCardsForStack);
                    }
                }
            });
        }

        // Helper function for opening edit modal (fetching data from Firebase)
        function openModalForEditWithFirebase(itemId) {
            itemsRef.child(itemId).once('value', (snapshot) => {
                const itemToEdit = snapshot.val();
                if (itemToEdit) {
                    openModalForEdit(itemToEdit); // Original openModalForEdit now just populates form
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

        // --- Function to Create/Add Item Element to Board (ensure it includes the stack button logic) ---
        function addItemToBoard(name, link, imageUrl, description, id, adder, stackId) { 
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('board-item');
            itemDiv.dataset.id = id;

            if (stackId) { 
                itemDiv.classList.add('stacked-item');
                itemDiv.dataset.stackId = stackId; 
            }

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
            
            const stackActionBtn = document.createElement('button');
            stackActionBtn.classList.add('stack-action-btn'); 
            if (stackId) {
                stackActionBtn.innerHTML = '&#128441;'; 
                stackActionBtn.title = 'Remove from Stack';
                stackActionBtn.classList.add('unstack-btn');
            } else {
                stackActionBtn.innerHTML = '&#128440;'; 
                stackActionBtn.title = 'Add to Stack / Create Stack';
                stackActionBtn.classList.add('add-to-stack-btn');
            }
            actionBtnsContainer.appendChild(stackActionBtn);
            
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
            if (placeholder) placeholder.remove();
            board.appendChild(itemDiv);
        }
        // --- End Function to Create/Add Item Element ---

        // --- Function to Update Item Element in Board ---
        // ... (ensure updateItemInBoard is present) ...

        // --- Load initial items (ensure it passes stackId to addItemToBoard) ---
        function loadInitialItems() {
            if (!board) { console.error("Board element not found during init!"); return; }
            board.innerHTML = ''; // Clear the board for Firebase items

            itemsRef.on('value', (snapshot) => {
                board.innerHTML = ''; // Clear board before repopulating
                const itemsData = snapshot.val();
                console.log('[Firebase] Data received:', itemsData);

                if (itemsData) {
                    const itemsArray = Object.values(itemsData);

                    // Sort items by the 'order' property. Items without an order get a default (e.g., 0 or Date.now()).
                    itemsArray.sort((a, b) => {
                        const orderA = a.order === undefined ? Date.now() : a.order;
                        const orderB = b.order === undefined ? Date.now() : b.order;
                        return orderA - orderB;
                    });

                    itemsArray.forEach(item => {
                        if (item && typeof item === 'object' && item.name && item.id) {
                            addItemToBoard(
                                item.name,
                                item.link || '',
                                item.imageUrl || '',
                                item.description || '',
                                item.id,
                                item.adder,
                                item.stackId || null // Pass stackId to addItemToBoard
                            );
                        } else {
                            console.warn('[Firebase Display] Skipping invalid item structure:', item);
                        }
                    });
                }
                
                if (!board.hasChildNodes() || (itemsData && Object.keys(itemsData).length === 0)) {
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
            
            // Initialize SortableJS on the board after items are loaded/re-rendered
            if (typeof Sortable !== 'undefined') {
                new Sortable(board, {
                    animation: 150,
                    ghostClass: 'sortable-ghost', // Class name for the dragging item
                    onEnd: function (evt) {
                        console.log('Drag ended.');
                        const items = board.querySelectorAll('.board-item');
                        let updates = {};
                        items.forEach((item, index) => {
                            const itemId = item.dataset.id;
                            if (itemId) {
                                // Update the order property for each item in Firebase
                                // We collect all updates and send them as a single multi-path update for efficiency
                                updates[`${itemId}/order`] = index;
                            } else {
                                console.warn('Found a board item without a data-id during reorder', item);
                            }
                        });

                        if (Object.keys(updates).length > 0) {
                            itemsRef.update(updates)
                                .then(() => console.log('Order updated in Firebase', updates))
                                .catch(error => console.error('Error updating order in Firebase:', error));
                        } else {
                            console.log('No items with IDs found to update order.');
                        }
                        // Firebase listener will automatically re-render in the new order.
                    }
                });
            } else {
                console.error('SortableJS is not loaded!');
            }
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