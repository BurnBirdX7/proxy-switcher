import { SUPPORTED_PROXY_TYPES, Storage } from '/shared.js';

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

function createLabel(type) {
    const label = document.createElement('label');
    label.htmlFor = `type-${type}`;

    const img = document.createElement('img');
    img.src = `/icons/proxy/${type}.svg`;
    img.alt = type;
    img.className = 'proxy-icon';

    const text = document.createTextNode(` ${type}`);

    label.appendChild(img);
    label.appendChild(text);
    return label;
}

async function constructForm() {
    const container = document.getElementById('proxy-types-container');
    const form = document.getElementById('proxy-form');

    // Create checkboxes for each supported proxy type
    SUPPORTED_PROXY_TYPES.forEach(type => {
        const wrapper = document.createElement('div');
        wrapper.className = 'proxy-type-wrapper';

        const checkbox = createCheckbox(type);
        const label = createLabel(type);

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

    // Handle checkbox changes
    container.addEventListener('change', async (event) => {
        if (event.target.name === CHECKBOX_NAME) {
            const formData = new FormData(form);
            const selectedTypes = formData.getAll(CHECKBOX_NAME);
            await Storage.setEnabledProxyTypes(selectedTypes);
        }
    });
}

await constructForm();