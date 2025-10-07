export function sendBackgroundRequest(type, payload = {}) {
	return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage({ type, payload }, (response) => {
			const lastError = chrome.runtime.lastError;
			if (lastError) {
				reject(new Error(lastError.message));
				return;
			}
			if (!response) {
				reject(new Error("No response from background service."));
				return;
			}
			if (!response.success) {
				reject(new Error(response.error ?? "Unknown background error."));
				return;
			}
			resolve(response.data);
		});
	});
}

export function storageSyncGet(keys) {
	return new Promise((resolve, reject) => {
		chrome.storage.sync.get(keys, (result) => {
			const lastError = chrome.runtime.lastError;
			if (lastError) {
				reject(new Error(lastError.message));
				return;
			}
			resolve(result);
		});
	});
}

export function storageSyncSet(values) {
	return new Promise((resolve, reject) => {
		chrome.storage.sync.set(values, () => {
			const lastError = chrome.runtime.lastError;
			if (lastError) {
				reject(new Error(lastError.message));
				return;
			}
			resolve();
		});
	});
}
