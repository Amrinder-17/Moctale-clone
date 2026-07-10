
const showremovebutton=document.getElementById('editlist')
    const hideremovebutton=document.getElementById('doneEditBtn')
    const removeMovieButton=document.querySelectorAll('.btn-remove-watched')
    showremovebutton.addEventListener('click',()=>{
        removeMovieButton.forEach(btn=>{
            btn.classList.add('show-btn');
        });
    });
    
    hideremovebutton.addEventListener('click',()=>{
        removeMovieButton.forEach(btn=>{
            btn.classList.remove('show-btn');
        });
    });

    const modalOverlay = document.getElementById('editCollectionModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const nameInput = document.getElementById('collectionName');
    const descInput = document.getElementById('collectionDesc');

    // --- 1. OPEN / CLOSE MODAL FUNCTIONS ---
    function openModal() {
        modalOverlay.classList.add('show');
        updateCounters();
    }

    function closeModal() {
        modalOverlay.classList.remove('show');
    }

   document.addEventListener('click', function(e) {
    const editBtn = e.target.closest('.edit-collection-btn');
    
    if (editBtn) {
        // 1. Extract the dynamic ID from the button's data attribute
        const collectionId = editBtn.getAttribute('data-id');
        
        // 2. Save that ID onto the modal form
        const form = document.getElementById('editCollectionForm');
        form.setAttribute('data-current-id', collectionId);
        
        // 3. Open the modal
        openModal(); 
    }
});
    // Close when clicking the 'X' or outside the card box
    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });


    // --- 2. CHARACTER COUNTER CONTROLS ---
    function updateCounters() {
        document.getElementById('nameCount').innerText = `${nameInput.value.length}/50`;
        document.getElementById('descCount').innerText = `${descInput.value.length}/150`;
    }

    nameInput.addEventListener('input', updateCounters);
    descInput.addEventListener('input', updateCounters);


    document.getElementById('editCollectionForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // 1. GET THE ID RIGHT HERE SO THE WHOLE SUBMIT FUNCTION CAN USE IT
    const collectionId = this.getAttribute('data-current-id'); 

    const formData = new FormData();
    formData.append('name', nameInput.value);
    formData.append('description', descInput.value);
    formData.append('csrfmiddlewaretoken', document.querySelector('[name=csrfmiddlewaretoken]').value);

    fetch(`/media/collection/update/${collectionId}/`, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            const nameDisplay = document.getElementById(`collection-name-display-${collectionId}`);
            const descDisplay = document.getElementById(`collection-desc-display-${collectionId}`);
            
            // Only update the display text if a non-empty string was returned from Django
            if (nameDisplay && data.name) nameDisplay.innerText = data.name;
            if (descDisplay && data.description) descDisplay.innerText = data.description;

            closeModal();
        } else {
            alert('Error updating entry.');
        }
    })
    .catch(err => console.error(err));
});
// Grab the elements securely

const DeleteModal = document.getElementById('editDeleteModal');
const closeDeleteBtn = document.getElementById('closeDeleteModalBtn');
const bannerForm = document.getElementById('editBannerForm');
const bannerInput = document.getElementById('DeleteModalInput');
const saveBannerBtn = document.getElementById('saveBannerBtn');


// --- OPEN / CLOSE CONTROLLERS ---
function openDeleteModal() {
    if (DeleteModal) DeleteModal.classList.add('show');
}
function closeDeleteModal() {
    if (DeleteModal) DeleteModal.classList.remove('show');
    if (bannerForm) bannerForm.reset();
}

// Only attach listeners if the matching modal HTML exists on the current page view
if (closeDeleteBtn && DeleteModal) {
    closeDeleteBtn.addEventListener('click', closeDeleteModal);
    DeleteModal.addEventListener('click', (e) => {
        if (e.target === DeleteModal) closeDeleteModal();
    });
}

// Global click event (Always safe because it listens to the document object wrapper)
document.addEventListener('click', function(e) {
    const triggerBtn = e.target.closest('.edit-banner-btn');
    if (triggerBtn) {
        const collectionId = triggerBtn.getAttribute('data-id');
        if (bannerForm) {
            bannerForm.setAttribute('data-current-id', collectionId);
            openDeleteModal();
        }
    }
});

// --- PROCESS FILE UPLOAD ONLY IF BUTTON EXISTS ---
if (saveBannerBtn && bannerForm && bannerInput) {
    saveBannerBtn.addEventListener('click', function(e) {
        e.preventDefault();

        const collectionId = bannerForm.getAttribute('data-current-id');
        
        if (bannerInput.files.length === 0) {
            alert("Please select an image file first.");
            return;
        }

        const formData = new FormData();
        formData.append('banner', bannerInput.files[0]);
        formData.append('csrfmiddlewaretoken', bannerForm.querySelector('[name=csrfmiddlewaretoken]').value);

        fetch(`/media/collection/update-banner/${collectionId}/`, {
            method: 'POST',
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                const bannerContainer = document.getElementById(`collection-banner-container-${collectionId}`);
                
                if (bannerContainer && data.banner_url) {
                    bannerContainer.style.backgroundImage = `url('${data.banner_url}')`;
                    
                    const placeholderLogo = bannerContainer.querySelector('.placeholder-logo');
                    if (placeholderLogo) {
                        placeholderLogo.remove();
                    }
                }
                closeDeleteModal();
            } else {
                alert('Error uploading image.');
            }
        })
        .catch(err => console.error(err));
    });
}

const deleteCollectionModal = document.getElementById('deleteCollectionModal');
const deleteCollectionForm = document.getElementById('deleteCollectionForm');
const actualDeleteBtn = document.getElementById('deleteCollectionBtn');

const closeCrossBtn = document.getElementById('closeDeleteModalBtn');
const cancelTextBtn = document.getElementById('cancelDeleteBtn');

// --- MODAL DISPLAY UTILITIES ---
function openDeleteCollectionModal() {
    if (deleteCollectionModal) deleteCollectionModal.classList.add('show');
}

function closeDeleteCollectionModal() {
    if (deleteCollectionModal) deleteCollectionModal.classList.remove('show');
}

// --- CONSOLIDATED CLOSE LISTENERS ---
if (deleteCollectionModal) {
    
    // Close via the text 'Cancel' button
    if (cancelTextBtn) cancelTextBtn.addEventListener('click', closeDeleteCollectionModal);
    
    // Close by clicking anywhere on the dim backdrop overlay background
    deleteCollectionModal.addEventListener('click', (e) => {
        if (e.target === deleteCollectionModal) closeDeleteCollectionModal();
    });
}

// --- GLOBAL CLICK EVENT (Open trigger) ---
document.addEventListener('click', function(e) {
    const triggerBtn = e.target.closest('.delete-collection-btn');
    
    if (triggerBtn) {
        const collectionId = triggerBtn.getAttribute('data-id');
        
        if (deleteCollectionModal) {
            deleteCollectionModal.setAttribute('data-target-id', collectionId);
            openDeleteCollectionModal();
        } else {
            alert("JavaScript Error: Could not find HTML element with id='deleteCollectionModal'.");
        }
    }
});

// --- ACTUAL BACKEND AJAX DELETION ---
if (actualDeleteBtn && deleteCollectionForm) {
    actualDeleteBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        const collectionId = deleteCollectionModal.getAttribute('data-target-id');
        if (!collectionId) {
            console.error("No collection ID found assigned to the modal container attributes.");
            return;
        }

        const formData = new FormData();
        formData.append('csrfmiddlewaretoken', deleteCollectionForm.querySelector('[name=csrfmiddlewaretoken]').value);

        fetch(`/media/collection/delete/${collectionId}/`, {
            method: 'POST',
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                window.location.href = data.redirect_url;
            } else {
                alert('Error deleting collection.');
            }
        })
        .catch(err => console.error("Network Fetch Error:", err));
    });
}
