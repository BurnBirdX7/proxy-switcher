import {SUPPORTED_PROXY_TYPES, PROXY_NAMING, Storage} from "/shared.js";

const ALARM_NAME = "IconSync"

/**
 * @param title {string}
 * @param iconPath {string}
 */
async function setIndication(title, iconPath) {
    await browser.action.setIcon({path: iconPath});
    await browser.action.setTitle({title: title});
}

/**
 * @return {Promise<browser.proxy.ProxyConfig>}
 */
async function getProxySettings() {
    let details = await browser.proxy.settings.get({});
    return details.value;
}

/**
 * @param settings {browser.proxy.ProxyConfig}
 */
async function setProxySettings(settings) {
    return browser.proxy.settings.set({value: settings});
}

async function updateIndication() {
    const {proxyType} = await getProxySettings()

    let path, title;
    if (SUPPORTED_PROXY_TYPES.includes(proxyType)) {
        path = `icons/proxy/${proxyType}.svg`;
        title = `Using: ${PROXY_NAMING[proxyType]}`;
    } else {
        path = "icons/alert.svg";
        title = `Error: Unknown proxy type: ${proxyType}`;
    }

    await setIndication(title, path);

    console.log("Indication successfully updated")
}

/**
 * @param alarm {browser.alarms.Alarm}
 */
async function updateIndicationOnAlarm(alarm) {
    if (alarm.name === ALARM_NAME) {
        console.debug("Updating indication on alarm");
        return updateIndication();
    }
}

/**
 * @param type {browser.proxy._ProxyConfigProxyType}
 * @return {Promise<browser.proxy._ProxyConfigProxyType>}
 */
async function getNextType(type) {
    const enabledTypes = await Storage.getEnabledProxyTypes();

    const startIdx = SUPPORTED_PROXY_TYPES.findIndex(value => value === type);
    for (let shift = 1; shift < SUPPORTED_PROXY_TYPES.length; shift++) {
        const candidateIdx = (startIdx + shift) % SUPPORTED_PROXY_TYPES.length;
        const candidateType = SUPPORTED_PROXY_TYPES[candidateIdx];
        if (enabledTypes.includes(candidateType)) {
            return candidateType;
        }
    }

    throw new Error("Failed to get next type. None of the types are enabled?");
}

/**
 * @param config {browser.proxy.ProxyConfig}
 * @param iter {number}
 */
async function cycleProxyTypes(config, iter = 1) {
    const proxyType = config.proxyType;
    const idx = SUPPORTED_PROXY_TYPES.findIndex(value => value === proxyType);

    if (idx === -1) {
        // TODO: Communicate failure
        console.error(`Met unsupported type ${proxyType}. Do nothing.`);
        return updateIndication();
    }

    const nextType = await getNextType(proxyType);

    console.debug(`Switching to type ${nextType}`);

    config.proxyType = nextType;
    return setProxySettings(config)
        .catch(reason => {
            console.error(`Failed to update switch to ${nextType} settings: "${reason}"`);
            if (iter < SUPPORTED_PROXY_TYPES.length) {
                console.warn("Trying next configuration");
                return cycleProxyTypes(config, iter + 1);
            }
        })
}

async function handleClick() {
    if (!await Storage.getInitialized()) {
        console.error("Extension is not initialized");
        return;
    }

    const ready = await browser.extension.isAllowedIncognitoAccess();
    if (!ready) {
        console.warn("Can't update - not enough permissions");
        return;
    }
    const config = await getProxySettings();
    console.debug("Click, current config: ", config);
    return cycleProxyTypes(config)
        .then(updateIndication)
        .catch(reason => console.error(`Failed to update proxy settings: ${reason}`));
}

async function oneTimeInit() {
    if (await Storage.getInitialized()) {
        return;
    }

    let incognitoAllowed = await browser.extension.isAllowedIncognitoAccess();
    if (!incognitoAllowed) {
        console.error("Can't init - not enough permissions");
        return setIndication("Error: Incognito Access Required", "icons/alert.svg");
    }

    // Take control of the config from user
    let configAsserted = await getProxySettings()
        .then(setProxySettings)
        .then(() => {
            console.log("Asserted config control")
            return true;
        })
        .catch(() => {
            console.error("Failed to assert config control");
            return false;
        });
    if (!configAsserted) {
        console.error("Failed to init");
        return setIndication("Error: Can't control config", "icons/alert.svg");
    }

    // Handle indicator drift
    await browser.alarms.create(ALARM_NAME, {delayInMinutes: 2});

    // Finish
    await updateIndication();
    await Storage.setInitialized();
    console.log("Init complete");
}

browser.action.onClicked.addListener(handleClick);
browser.alarms.onAlarm.addListener(updateIndicationOnAlarm);
browser.tabs.onActivated.addListener(updateIndication);

await oneTimeInit();
