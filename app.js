document.addEventListener('DOMContentLoaded', () => {
    const billDateInput = document.getElementById('bill-date');
    const restaurantNameInput = document.getElementById('restaurant-name');
    const billTotalInput = document.getElementById('bill-total');
    const personNameInput = document.getElementById('person-name-input');
    const namesListDiv = document.getElementById('names-list');
    const paidBySelect = document.getElementById('paid-by-select');
    const resetBtn = document.getElementById('reset-btn');
    const saveBtn = document.getElementById('save-btn');
    const exportBtn = document.getElementById('export-btn');
    const resultDiv = document.getElementById('result');
    const historyList = document.getElementById('history-list');
    const savedPersonNamesDatalist = document.getElementById('saved-names-datalist');
    const savedRestaurantsDatalist = document.getElementById('saved-restaurants-datalist');
    const billSlipUpload = document.getElementById('bill-slip-upload');
    const billSlipContainer = document.getElementById('bill-slip-container');
    const billSlipImage = document.getElementById('bill-slip-image');
    const removeBillSlipBtn = document.getElementById('remove-bill-slip-btn');

    let currentBillSlip = null; // To hold the base64 string of the uploaded image
    let currentNames = []; // Now: { name: string, pax: number, paid: boolean }

    // --- Initial Setup ---
    function initialize() {
        billDateInput.valueAsDate = new Date();
        populateSavedNames();
        renderHistory();
    }

    // --- Rendering Functions ---
    function renderNames() {
        namesListDiv.innerHTML = '';
        const previousPayer = paidBySelect.value;
        paidBySelect.innerHTML = '<option value="everyone" selected>Everyone (Split Proportionally)</option>';
        
        currentNames.forEach(person => {
            const personContainer = document.createElement('div');
            personContainer.className = 'd-flex justify-content-between align-items-center mb-2 p-2 rounded';
            personContainer.style.backgroundColor = '#f8f9fa';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = person.name;
            nameSpan.className = 'fw-bold';

            const paxControls = document.createElement('div');
            paxControls.className = 'd-flex align-items-center';

            const minusBtn = document.createElement('button');
            minusBtn.className = 'btn btn-sm btn-outline-secondary';
            minusBtn.textContent = '-';
            minusBtn.onclick = () => updatePax(person.name, -1);

            const paxSpan = document.createElement('span');
            paxSpan.className = 'mx-2';
            paxSpan.textContent = person.pax;

            const plusBtn = document.createElement('button');
            plusBtn.className = 'btn btn-sm btn-outline-secondary';
            plusBtn.textContent = '+';
            plusBtn.onclick = () => updatePax(person.name, 1);

            const removeBtn = document.createElement('button');
            removeBtn.className = 'btn-close ms-3';
            removeBtn.onclick = () => removeName(person.name);

            paxControls.appendChild(minusBtn);
            paxControls.appendChild(paxSpan);
            paxControls.appendChild(plusBtn);

            personContainer.appendChild(nameSpan);
            personContainer.appendChild(paxControls);
            personContainer.appendChild(removeBtn);
            namesListDiv.appendChild(personContainer);

            const option = document.createElement('option');
            option.value = person.name;
            option.textContent = person.name;
            paidBySelect.appendChild(option);
        });

        if (currentNames.some(p => p.name === previousPayer)) {
            paidBySelect.value = previousPayer;
        }
    }

    function calculateAndDisplay() {
        const restaurantName = restaurantNameInput.value.trim();
        const billTotal = parseFloat(billTotalInput.value);
        const names = currentNames;
        const totalPax = names.reduce((sum, person) => sum + person.pax, 0);
        const payer = paidBySelect.value;

        if (isNaN(billTotal) || billTotal <= 0 || totalPax === 0) {
            resultDiv.innerHTML = '';
            return;
        }

        saveAllPersonNames(names.map(p => p.name));
        saveRestaurantName(restaurantName);
        populateSavedNames();

        const totalAmount = billTotal;
        const amountPerShare = totalAmount / totalPax;

        let resultHTML = `<div class="alert alert-info">`;
        if (restaurantName) {
            resultHTML += `<h4 class="alert-heading">${restaurantName}</h4>`;
        }
        resultHTML += `<p class="mb-1"><strong>Total Bill:</strong> ${totalAmount.toFixed(2)}</p><hr>`;

        const listItems = [];

        if (payer === 'everyone') {
            resultHTML += `<p class="mb-2 fs-5"><strong>Price per Share:</strong> ${amountPerShare.toFixed(2)}</p>`;
            names.forEach((person, index) => {
                const personTotal = person.pax * amountPerShare;
                const isPaid = person.paid;
                const itemClass = isPaid ? 'list-group-item-success' : '';
                const badgeClass = isPaid ? 'bg-success' : 'bg-primary';
                const badgeText = isPaid ? 'Paid' : personTotal.toFixed(2);

                listItems.push(`
                    <li class="list-group-item d-flex justify-content-between align-items-center ${itemClass}">
                        <div>
                            <input class="form-check-input me-2" type="checkbox" id="paid-checkbox-${index}" ${isPaid ? 'checked' : ''} data-name="${person.name}">
                            ${person.name} (${person.pax} pax)
                        </div>
                        <span class="badge ${badgeClass} rounded-pill">${badgeText}</span>
                    </li>`);
            });
        } else {
            resultHTML += `<p class="mb-2 fs-5"><strong>Paid by:</strong> ${payer}</p>`;
            names.forEach((person, index) => {
                const personOwes = person.pax * amountPerShare;
                const isPaid = person.paid;
                const itemClass = isPaid ? 'list-group-item-success' : '';
                const badgeClass = isPaid ? 'bg-success' : 'bg-danger';
                const badgeText = isPaid ? 'Paid' : `Owes ${personOwes.toFixed(2)}`;

                if (person.name === payer) {
                    listItems.push(`<li class="list-group-item d-flex justify-content-between align-items-center list-group-item-success">${person.name} (Payer) <span class="badge bg-success rounded-pill">Paid ${totalAmount.toFixed(2)}</span></li>`);
                } else {
                    listItems.push(`
                        <li class="list-group-item d-flex justify-content-between align-items-center ${itemClass}">
                            <div>
                                <input class="form-check-input me-2" type="checkbox" id="paid-checkbox-${index}" ${isPaid ? 'checked' : ''} data-name="${person.name}">
                                ${person.name} (${person.pax} pax)
                            </div>
                            <span class="badge ${badgeClass} rounded-pill">${badgeText}</span>
                        </li>`);
                }
            });
        }

        resultHTML += `<ul class="list-group">${listItems.join('')}</ul></div>`;
        resultDiv.innerHTML = resultHTML;

        // Add event listeners after rendering
        resultDiv.querySelectorAll('.form-check-input').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                togglePaidStatus(e.target.dataset.name, e.target.checked);
            });
        });
    }

    // --- Data Manipulation Functions ---
    function addPerson(name) {
        if (name && !currentNames.some(p => p.name === name)) {
            currentNames.push({ name, pax: 1, paid: false });
            renderNames();
            calculateAndDisplay();
        }
    }

    function removeName(nameToRemove) {
        currentNames = currentNames.filter(person => person.name !== nameToRemove);
        renderNames();
        calculateAndDisplay();
    }

    function updatePax(name, change) {
        const person = currentNames.find(p => p.name === name);
        if (person) {
            person.pax = Math.max(1, person.pax + change);
            renderNames();
            calculateAndDisplay();
        }
    }

    function togglePaidStatus(name, isPaid) {
        const person = currentNames.find(p => p.name === name);
        if (person) {
            person.paid = isPaid;
            calculateAndDisplay(); // Re-render to show visual feedback
        }
    }

    function handleBillSlipUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                currentBillSlip = e.target.result;
                billSlipImage.src = currentBillSlip;
                billSlipContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }

    function removeBillSlip() {
        currentBillSlip = null;
        billSlipUpload.value = ''; // Reset file input
        billSlipContainer.style.display = 'none';
        billSlipImage.src = '#';
    }

    // --- History Functions ---
    function saveHistory() {
        const restaurantName = restaurantNameInput.value.trim();
        const billTotal = parseFloat(billTotalInput.value);
        
        if (!restaurantName || isNaN(billTotal) || billTotal <= 0 || currentNames.length === 0) {
            alert('Please fill in all fields before saving.');
            return;
        }

        const historyItem = {
            id: Date.now(),
            billDate: billDateInput.value,
            restaurantName,
            billTotal,
            names: currentNames,
            payer: paidBySelect.value,
            billSlip: currentBillSlip
        };

        let history = getBillHistory();
        history.unshift(historyItem);
        saveBillHistory(history);
        renderHistory();
    }

    function renderHistory() {
        historyList.innerHTML = '';
        let history = getBillHistory();
        history.forEach(item => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            
            const text = document.createElement('span');
            const totalPax = (item.names || []).reduce((sum, p) => sum + (p.pax || 1), 0);
            const payerText = item.payer === 'everyone' ? `Split (${totalPax} pax)` : `Paid by ${item.payer}`;
            const billDate = new Date(item.billDate || item.id).toLocaleDateString();
            text.textContent = `${item.restaurantName} - ${item.billTotal.toFixed(2)} (${payerText}) - ${billDate}`;
            text.style.cursor = 'pointer';
            text.onclick = () => loadHistoryItem(item.id);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-outline-danger';
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                deleteHistoryItem(item.id);
            };

            li.appendChild(text);
            li.appendChild(deleteBtn);
            historyList.appendChild(li);
        });
    }

    function loadHistoryItem(id) {
        let history = getBillHistory();
        const item = history.find(h => h.id === id);
        if (item) {
            billDateInput.value = item.billDate || new Date(item.id).toISOString().slice(0, 10);
            restaurantNameInput.value = item.restaurantName;
            billTotalInput.value = item.billTotal;
            currentNames = item.names.map(p => (typeof p === 'string') ? { name: p, pax: 1, paid: false } : { ...p, paid: p.paid || false });
            
            if (item.billSlip) {
                currentBillSlip = item.billSlip;
                billSlipImage.src = currentBillSlip;
                billSlipContainer.style.display = 'block';
            } else {
                removeBillSlip();
            }

            renderNames();
            paidBySelect.value = item.payer || 'everyone';
            calculateAndDisplay();
        }
    }

    function deleteHistoryItem(id) {
        let history = getBillHistory();
        history = history.filter(h => h.id !== id);
        saveBillHistory(history);
        renderHistory();
    }

    function exportToPNG() {
        const resultNode = document.querySelector('#result .alert');
        if (!resultNode) {
            alert('Nothing to export!');
            return;
        }

        html2canvas(resultNode, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            backgroundColor: '#f8f9fa'
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `bill-splitter-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }

    // --- Datalist & LocalStorage ---
    function populateSavedNames() {
        const savedPersonNames = getSavedPersonNames();
        savedPersonNamesDatalist.innerHTML = '';
        savedPersonNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            savedPersonNamesDatalist.appendChild(option);
        });

        const savedRestaurantNames = getSavedRestaurantNames();
        savedRestaurantsDatalist.innerHTML = '';
        savedRestaurantNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            savedRestaurantsDatalist.appendChild(option);
        });
    }

    // --- Event Listeners ---
    personNameInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            addPerson(personNameInput.value.trim());
            personNameInput.value = '';
        }
    });

    [restaurantNameInput, billTotalInput, paidBySelect].forEach(el => {
        el.addEventListener('input', calculateAndDisplay);
    });

    resetBtn.addEventListener('click', () => {
        billDateInput.valueAsDate = new Date();
        restaurantNameInput.value = '';
        billTotalInput.value = '';
        personNameInput.value = '';
        currentNames = [];
        removeBillSlip();
        renderNames();
        paidBySelect.value = 'everyone';
        resultDiv.innerHTML = '';
    });

    saveBtn.addEventListener('click', saveHistory);
    exportBtn.addEventListener('click', exportToPNG);
    billSlipUpload.addEventListener('change', handleBillSlipUpload);
    removeBillSlipBtn.addEventListener('click', removeBillSlip);

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js').catch(console.error);
        });
    }

    initialize();
});





