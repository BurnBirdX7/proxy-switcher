/**
 * @type {(browser.proxy._ProxyConfigProxyType)[]}
 */
const SUPPORTED_PROXY_TYPES = [
    "none", "autoDetect", "system", "manual", "autoConfig"
]

const ALARM_NAME = "IconSync"

const PROXY_NAMING = {
    "none": "Disabled",
    "autoDetect": "Auto Detect",
    "system": "System Proxy",
    "manual": "Manual Configuration",
    "autoConfig": "Auto Configuration",
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
    if (!await browser.extension.isAllowedIncognitoAccess()) {
        path = "icons/alert.svg";
        title = "Error: Incognito Access Required";
    } else if (SUPPORTED_PROXY_TYPES.includes(proxyType)) {
        path = `icons/proxy/${proxyType}.svg`;
        title = `Using: ${PROXY_NAMING[proxyType]}`;
    } else {
        path = "icons/alert.svg";
        title = `Error: Unknown proxy type: ${proxyType}`;
    }

    await browser.action.setIcon({path});
    await browser.action.setTitle({title});

    console.log("Icon successfully updated")
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

    const nextIdx = (idx + 1) % SUPPORTED_PROXY_TYPES.length;
    const nextType = SUPPORTED_PROXY_TYPES[nextIdx];

    console.debug(`Switching to type ${nextType}`);

    config.proxyType = nextType;
    return setProxySettings(config)
        .catch(reason => {
            console.error(`Failed to update proxy settings: "${reason}"`);
            if (iter < SUPPORTED_PROXY_TYPES.length) {
                console.warn("Trying next configuration");
                return cycleProxyTypes(config, iter + 1);
            }
        })
}

async function handleClick() {
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

browser.runtime.onInstalled.addListener(init);
browser.runtime.onStartup.addListener(init);

async function init() {
    // Handle clicks
    browser.action.onClicked.addListener(handleClick);

    // Handle icon actualization
    await browser.alarms.create(ALARM_NAME, {delayInMinutes: 1});
    browser.alarms.onAlarm.addListener(updateIndicationOnAlarm);
    browser.tabs.onActivated.addListener(updateIndication)
    browser.tabs.onUpdated.addListener(updateIndication)

    // Finish
    await updateIndication();
    console.log("Init complete");
}
