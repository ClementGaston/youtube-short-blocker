import { useEffect, useState } from "react";

export const useChromeStorageBoolean = (key: string, defaultValue = false) => {
	const [value, setValue] = useState<boolean>(defaultValue);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		chrome.storage.sync.get([key], (result) => {
			setValue(result[key] ?? defaultValue);
			setLoading(false);
		});
	}, [key]);

	const set = (newValue: boolean) => {
		setValue(newValue);
		chrome.storage.sync.set({ [key]: newValue });

		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			const tab = tabs[0];

			if (tab.id) {
				chrome.tabs.sendMessage(tab.id, { id: key }, (response) => {
					console.log("Content script responded:", response);
				});
			}
		});
	};

	return { value, setValue: set, loading };
};
