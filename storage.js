/**
 * @type {(browser.proxy._ProxyConfigProxyType)[]}
 */
export const SUPPORTED_PROXY_TYPES = [
    "none", "autoDetect", "system", "manual", "autoConfig"
];

export class Storage {

    /**
     * @return {Promise<browser.proxy._ProxyConfigProxyType[]>}
     */
    static async getEnabledProxyTypes() {
        const {types} = await browser.storage.local.get({
            types: SUPPORTED_PROXY_TYPES
        });
        return types;
    }

    /**
     * @param proxyTypes {browser.proxy._ProxyConfigProxyType[]}
     * @return {Promise<void>}
     */
    static async setEnabledProxyTypes(proxyTypes) {
        return browser.storage.local.set({
            types: proxyTypes
        })
    }

}


