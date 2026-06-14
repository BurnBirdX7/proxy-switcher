import {SUPPORTED_PROXY_TYPES, PROXY_NAMING, Storage} from '/shared.js';

const CHECKBOX_NAME = 'types-checkbox';

/**
 * @param type {string}
 * @return {HTMLInputElement}
 */
function createCheckbox(type) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `type-${type}`;
    checkbox.name = CHECKBOX_NAME;
    checkbox.value = type;
    checkbox.className = 'proxy-type-checkbox';
    return checkbox;
}

/**
 * @param type {string}
 * @returns {HTMLLabelElement}
 */
function createLabel(type) {
    const label = document.createElement('label');
    label.htmlFor = `type-${type}`;

    const img = document.createElement('img');
    img.src = `/icons/proxy/${type}.svg`;
    img.alt = type;
    img.className = 'proxy-icon';

    const text = document.createTextNode(PROXY_NAMING[type]);

    label.appendChild(img);
    label.appendChild(text);
    return label;
}

/**
 * @returns {HTMLInputElement[]}
 */
function getCheckboxes() {
    const nodeList = document.querySelectorAll(`input[type="checkbox"][name="${CHECKBOX_NAME}"]`);
    return Array.from(nodeList);
}

/**
 */
function disableLastCheckbox() {
    const optionBoxes = getCheckboxes();
    const checkedCount = optionBoxes.filter(cb => cb.checked).length;

    if (checkedCount <= 2) {
        optionBoxes.filter(c => c.checked).forEach(c => c.disabled = true);
    } else {
        optionBoxes.forEach(c => c.disabled = false);
    }
}

/**
 * @returns {string[]}
 */
function getCheckedBoxes() {
    const optionBoxes = getCheckboxes();
    return optionBoxes.filter(cb => cb.checked).map(checkbox => checkbox.value);
}

async function constructForm() {
    const container = document.getElementById('proxy-types-container');

    // Create checkboxes for each supported proxy type
    SUPPORTED_PROXY_TYPES.forEach(type => {
        const wrapper = document.createElement('div');
        wrapper.className = 'proxy-type-wrapper';

        const label = createLabel(type);
        const checkbox = createCheckbox(type);

        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);
        container.appendChild(wrapper);
    });

    // Load saved state
    const enabledTypes = await Storage.getEnabledProxyTypes();
    enabledTypes.forEach(type => {
        const checkbox = document.getElementById(`type-${type}`);
        if (checkbox) {
            checkbox.checked = true;
        }
    });

    disableLastCheckbox();

    // Handle checkbox changes
    container.addEventListener('change', async (event) => {
        if (event.target.name === CHECKBOX_NAME) {
            const selectedTypes = getCheckedBoxes();
            await Storage.setEnabledProxyTypes(selectedTypes);
            disableLastCheckbox();
        }
    });
}

await constructForm();