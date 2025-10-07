let configPromise = null;

export function loadExtensionConfig() {
	if (!configPromise) {
		const url = chrome.runtime.getURL("lib/config.json");
		configPromise = fetch(url).then(async (response) => {
			if (!response.ok) {
				throw new Error(`Failed to load extension configuration (${response.status})`);
			}
			return response.json();
		});
	}
	return configPromise;
}
