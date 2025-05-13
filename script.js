document.addEventListener('DOMContentLoaded', () => {
    const addButton = document.getElementById('addButton');
    const modal = document.getElementById('addItemModal');
    const closeButton = document.querySelector('.close-button');
    const addItemForm = document.getElementById('addItemForm');
    const board = document.getElementById('board');
    const userBigBtn = document.getElementById('userBigBtn');
    const userLilBtn = document.getElementById('userLilBtn');

    const STORAGE_KEY = 'visionBoardItems';
    let editingItemId = null; // Track the ID of the item being edited
    let currentAdder = 'big'; // Default adder updated

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

    userBigBtn.addEventListener('click', () => setActiveUser('big'));
    userLilBtn.addEventListener('click', () => setActiveUser('lil'));
    // ------------------------

    // --- Local Storage Functions ---
    function getItemsFromStorage() {
        const itemsJson = localStorage.getItem(STORAGE_KEY);
        try {
            return itemsJson ? JSON.parse(itemsJson) : [];
        } catch (e) {
            console.error('Error parsing items from localStorage', e);
            return []; // Return empty array on error
        }
    }

    function saveItemsToStorage(items) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch (e) {
            console.error('Error saving items to localStorage', e);
        }
    }
    // -----------------------------

    // --- Modal Handling --- 
    function openModalForAdd() {
        editingItemId = null; // Ensure we are in add mode
        addItemForm.reset(); // Clear the form
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
        editingItemId = null; // Reset editing state when closing
        addItemForm.reset(); // Also reset form on close
    }

    // Show modal for adding
    addButton.addEventListener('click', openModalForAdd);

    // Hide modal listeners
    closeButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
    // ----------------------

    // Handle form submission (Add or Edit)
    addItemForm.addEventListener('submit', (event) => {
        event.preventDefault(); 

        const itemData = {
            name: document.getElementById('itemName').value,
            link: document.getElementById('itemLink').value,
            imageUrl: document.getElementById('itemImage').value,
            description: document.getElementById('itemDescription').value,
            id: editingItemId || Date.now().toString(),
            adder: editingItemId ? null : currentAdder // Store adder only when adding new, retain original on edit
        };

        if (!itemData.name) {
            alert('Item name is required!');
            return;
        }

        let currentItems = getItemsFromStorage();

        if (editingItemId) {
            // --- Update existing item ---
            const itemIndex = currentItems.findIndex(item => item.id === editingItemId);
            if (itemIndex > -1) {
                // Preserve the original adder when editing
                const originalAdder = currentItems[itemIndex].adder;
                itemData.adder = originalAdder; // Ensure we keep the original adder
                currentItems[itemIndex] = itemData;
                saveItemsToStorage(currentItems);
                updateItemInBoard(itemData);
            } else {
                console.error('Item to edit not found in storage');
            }
            // -------------------------
        } else {
            // --- Add new item ---
            addItemToBoard(itemData.name, itemData.link, itemData.imageUrl, itemData.description, itemData.id, itemData.adder);
            currentItems.push(itemData);
            saveItemsToStorage(currentItems);
             // ---------------------
        }
        
        closeModal(); // Close modal and reset form/state
    });

    // --- Event Listener for Edit/Delete Items (using Event Delegation) ---
    board.addEventListener('click', (event) => {
        const target = event.target;
        const itemDiv = target.closest('.board-item');

        if (!itemDiv || !itemDiv.dataset.id) return; // Exit if click wasn't on an item
        
        const itemId = itemDiv.dataset.id;

        if (target.classList.contains('delete-item-btn')) {
            // Confirm before deleting (optional but good UX)
            if (confirm('Are you sure you want to delete this item?')) {
                 deleteItem(itemId);
            }
        } else if (target.classList.contains('edit-item-btn')) {
            const currentItems = getItemsFromStorage();
            const itemToEdit = currentItems.find(item => item.id === itemId);
            if (itemToEdit) {
                openModalForEdit(itemToEdit);
            } else {
                console.error('Item to edit not found');
            }
        }
    });
    // ----------------------------------------------------------------

    // --- Function to Delete Item ---
    function deleteItem(idToDelete) {
        console.log('[Delete] Attempting to delete item with ID (from DOM):', idToDelete, `(Type: ${typeof idToDelete})`);
        
        const itemToRemove = board.querySelector(`.board-item[data-id="${idToDelete}"]`);
        if (itemToRemove) {
            itemToRemove.remove();
            console.log('[Delete] Removed item from DOM.');
        } else {
            console.warn('[Delete] Could not find item in DOM to remove with ID:', idToDelete);
        }

        let currentItems = getItemsFromStorage();
        console.log('[Delete] Items currently in localStorage (before filter):', JSON.parse(JSON.stringify(currentItems)));
        console.log('[Delete] Listing IDs from localStorage items:');
        currentItems.forEach((item, idx) => {
            if (item && typeof item === 'object') {
                console.log(`  Storage Item ${idx} - ID: ${item.id} (Type: ${typeof item.id}), Name: ${item.name || 'N/A'}`);
            } else {
                console.log(`  Storage Item ${idx} is not a valid object:`, item);
            }
        });

        const initialCount = currentItems.length;
        const idToDeleteString = String(idToDelete); // Ensure we compare strings

        currentItems = currentItems.filter(item => {
            const itemIDString = item && item.id ? String(item.id) : null;
            if (itemIDString === null) {
                console.warn('[Delete Filter] Item in storage is missing an ID:', item);
                return true; // Keep items that are malformed (should have been caught by migration)
            }
            return itemIDString !== idToDeleteString;
        });
        const finalCount = currentItems.length;

        if (initialCount === finalCount) {
            console.warn('[Delete] Filter did NOT remove item. ID:', idToDeleteString, 'was likely not found or matched in localStorage items.');
        } else {
            console.log('[Delete] Filter successfully removed item from array. ID:', idToDeleteString);
        }

        saveItemsToStorage(currentItems);
        console.log('[Delete] Items in localStorage (after filter and save):', JSON.parse(JSON.stringify(getItemsFromStorage())));

        if (currentItems.length === 0 && !board.querySelector('#board-placeholder')) {
             board.innerHTML = '<p id="board-placeholder" style="text-align: center; width: 100%; grid-column: 1 / -1; color: #777;">Your vision board is empty. Click the + button to add items!</p>';
        }
    }
    // -----------------------------

    // --- Function to Create/Add Item Element to Board ---
    function addItemToBoard(name, link, imageUrl, description, id, adder) {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('board-item');
        itemDiv.dataset.id = id; 

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

        // Edit Button
        const editBtn = document.createElement('button');
        editBtn.classList.add('edit-item-btn');
        editBtn.innerHTML = '&#9998;'; // Pencil symbol
        editBtn.setAttribute('aria-label', 'Edit item');
        actionBtnsContainer.appendChild(editBtn);

        // Delete Button
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

        if (imageUrl) {
            const imgElement = document.createElement('img');
            imgElement.src = imageUrl;
            imgElement.alt = name; 
            imgElement.onerror = () => {
                imgElement.alt = `${name} (Image failed to load)`;
                imgElement.style.display = 'none'; 
            };
            contentContainer.appendChild(imgElement);
        }

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
    // ------------------------------------------------------

    // --- Function to Update Item Element in Board ---
    function updateItemInBoard(itemData) {
        const itemDiv = board.querySelector(`.board-item[data-id="${itemData.id}"]`);
        if (!itemDiv) return;

        // Note: We don't need to update the adder class here as it shouldn't change on edit.

        const contentContainer = itemDiv.querySelector('.item-content');
        if (!contentContainer) return; // Should exist based on addItemToBoard

        // Clear existing content (safer than trying to update individual elements)
        contentContainer.innerHTML = ''; 

        // Re-add content based on itemData (similar to addItemToBoard)
        const nameElement = document.createElement('h2');
        nameElement.textContent = itemData.name;
        contentContainer.appendChild(nameElement);

        if (itemData.imageUrl) {
            const imgElement = document.createElement('img');
            imgElement.src = itemData.imageUrl;
            imgElement.alt = itemData.name; 
            imgElement.onerror = () => { 
                imgElement.alt = `${itemData.name} (Image failed to load)`;
                imgElement.style.display = 'none'; 
            };
            contentContainer.appendChild(imgElement);
        }

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
    // ---------------------------------------------

    // --- Load initial items --- 
    function loadInitialItems() {
        board.innerHTML = ''; 
        let items = getItemsFromStorage();
        let needsSave = false; 

        console.log('[Before Migration] Items from localStorage:', JSON.parse(JSON.stringify(items))); // Deep copy for logging

        // --- Migration & Cleanup --- 
        // Step 1: Filter out any null or non-object items and items that are just an ID (legacy bug guard)
        const validItems = items.filter(item => {
            if (item && typeof item === 'object' && Object.keys(item).length > 1) { // Ensure it's an object with more than just an ID potentially
                return true;
            }
            console.warn('[Migration] Removing invalid item:', item);
            needsSave = true; // Mark for save if we remove invalid items
            return false;
        });

        // Step 2: Ensure all valid items have an ID and potentially a default adder
        const migratedItems = validItems.map((item, index) => {
            // Assign ID if missing
            if (typeof item === 'object' && item !== null && (!item.id || String(item.id).trim() === '')) {
                item.id = 'migrated-' + Date.now().toString() + '-' + index; 
                needsSave = true; 
                console.log(`[Migration] Assigned ID ${item.id} to item:`, item.name);
            }
            // Assign default adder if missing (for older items)
            if (typeof item === 'object' && item !== null && !item.adder) {
                item.adder = 'big'; // Default older items to 'big'
                needsSave = true;
                console.log(`[Migration] Assigned default adder 'big' to item:`, item.name);
            }
            // Migration for old adder values
            if (typeof item === 'object' && item !== null && item.adder === 'ajay') {
                item.adder = 'big';
                needsSave = true;
                console.log(`[Migration] Changed adder from 'ajay' to 'big' for item:`, item.name);
            }
            if (typeof item === 'object' && item !== null && item.adder === 'gf') {
                item.adder = 'lil';
                needsSave = true;
                console.log(`[Migration] Changed adder from 'gf' to 'lil' for item:`, item.name);
            }
            return item;
        });

        if (needsSave) {
            console.log('[Migration] Saving updated items to localStorage:', JSON.parse(JSON.stringify(migratedItems)));
            saveItemsToStorage(migratedItems);
            items = migratedItems; // Use the migrated list for display
        } else {
            items = migratedItems; // Ensure we are using the potentially filtered (even if no IDs added) list
        }
        // ---------------------------------------------

        console.log('[After Migration] Items to be displayed:', JSON.parse(JSON.stringify(items)));

        if (items.length === 0) {
            board.innerHTML = '<p id="board-placeholder" style="text-align: center; width: 100%; grid-column: 1 / -1; color: #777;">Your vision board is empty. Click the + button to add items!</p>';
        } else {
            items.forEach(item => {
                if (item && typeof item === 'object' && item.name && item.id) { // Added check for item.id
                    addItemToBoard(
                        item.name,
                        item.link || '',
                        item.imageUrl || '',
                        item.description || '',
                        item.id,
                        item.adder // Pass the adder
                    );
                } else {
                    console.warn('[Display] Skipping invalid item structure:', item);
                }
            });
        }
    }
    
    loadInitialItems(); // Load items when the DOM is ready
    // ---------------------------

}); 