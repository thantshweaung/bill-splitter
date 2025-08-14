// storage.js

const PERSON_NAMES_KEY = 'bill_splitter_person_names';
const RESTAURANT_NAMES_KEY = 'bill_splitter_restaurant_names';
const BILL_HISTORY_KEY = 'bill_splitter_bill_history';

// --- Person Names ---

function getSavedPersonNames() {
    const names = localStorage.getItem(PERSON_NAMES_KEY);
    return names ? JSON.parse(names) : [];
}

function savePersonName(name) {
    let names = getSavedPersonNames();
    if (!names.includes(name)) {
        names.push(name);
        localStorage.setItem(PERSON_NAMES_KEY, JSON.stringify(names));
    }
}

function saveAllPersonNames(namesArray) {
    let existingNames = getSavedPersonNames();
    namesArray.forEach(name => {
        if (!existingNames.includes(name)) {
            existingNames.push(name);
        }
    });
    localStorage.setItem(PERSON_NAMES_KEY, JSON.stringify(existingNames));
}

// --- Restaurant Names ---

function getSavedRestaurantNames() {
    const names = localStorage.getItem(RESTAURANT_NAMES_KEY);
    return names ? JSON.parse(names) : [];
}

function saveRestaurantName(name) {
    let names = getSavedRestaurantNames();
    if (name && !names.includes(name)) {
        names.push(name);
        localStorage.setItem(RESTAURANT_NAMES_KEY, JSON.stringify(names));
    }
}

// --- Bill History ---

function getBillHistory() {
    const history = localStorage.getItem(BILL_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
}

function saveBillHistory(history) {
    localStorage.setItem(BILL_HISTORY_KEY, JSON.stringify(history));
}
