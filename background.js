const SupportedProxyTypes = [
    "none", "system", "manual"
]

const AlarmName = "IconSync"


async function updateIcon() {
    const config = await browser.proxy.settings.get({});

    const type = config.value.proxyType;

    const path = SupportedProxyTypes.includes(type.proxyType)
        ? `icons/proxy/${type}.svg`
        : `icons/alert.svg`;

    await browser.action.setIcon({path})

    console.log("Icon successfully updated")
}

/**
 * @param alarm {browser.alarms.Alarm}
 */
async function updateIconOnAlarm(alarm) {
    if (alarm.name === AlarmName) {
        return updateIcon();
    }
}

async function handleClick() {
    await updateIcon();
}

browser.runtime.onInstalled.addListener(init);
browser.runtime.onStartup.addListener(init);

async function init() {
    // Handle clicks
    browser.action.onClicked.addListener(handleClick);

    // Handle icon actualization
    await browser.alarms.create(AlarmName, {delayInMinutes: 1});
    browser.alarms.onAlarm.addListener(updateIcon);
    browser.tabs.onActivated.addListener(updateIcon)
    browser.tabs.onUpdated.addListener(updateIcon)

    // Finish
    await updateIcon();
    console.log("Init complete");
}
