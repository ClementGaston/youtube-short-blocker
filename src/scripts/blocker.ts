import { SHORT_ITEM_ID } from "../utils/constants";

type ShowingRule = Record<SHORT_ITEM_ID, boolean>;

let showingRule: ShowingRule = {
	[SHORT_ITEM_ID.NAV_MENU]: false,
	[SHORT_ITEM_ID.MAIN_RECO]: false,
	[SHORT_ITEM_ID.SEARCH_RESULT]: false,
	[SHORT_ITEM_ID.VIDEO_RECO]: false,
	[SHORT_ITEM_ID.INF_SCROLLING]: false,
};

///////////////////////////////////////////////////////
//                       Utils                       //
///////////////////////////////////////////////////////
function throttle<T extends (...args: any[]) => void>(fn: T, wait: number): T {
	let lastCall = 0;
	let timeout: ReturnType<typeof setTimeout> | null = null;

	return function (...args: any[]) {
		const now = Date.now();

		const remaining = wait - (now - lastCall);
		if (remaining <= 0) {
			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
			lastCall = now;
			fn(...args);
		} else if (!timeout) {
			timeout = setTimeout(() => {
				lastCall = Date.now();
				timeout = null;
				fn(...args);
			}, remaining);
		}
	} as T;
}

const throttledApplyShowingRules = throttle(() => {
	if (showingRule) applyShowingRules(showingRule);
}, 300);

///////////////////////////////////////////////////////
//                     Load Data                     //
///////////////////////////////////////////////////////
async function getInitialData(): Promise<ShowingRule> {
	return new Promise((resolve) => {
		chrome.storage.sync.get(Object.values(SHORT_ITEM_ID), (result) => {
			const showingRule: ShowingRule = {
				[SHORT_ITEM_ID.NAV_MENU]: result[SHORT_ITEM_ID.NAV_MENU] ?? false,
				[SHORT_ITEM_ID.MAIN_RECO]: result[SHORT_ITEM_ID.MAIN_RECO] ?? false,
				[SHORT_ITEM_ID.SEARCH_RESULT]: result[SHORT_ITEM_ID.SEARCH_RESULT] ?? false,
				[SHORT_ITEM_ID.VIDEO_RECO]: result[SHORT_ITEM_ID.VIDEO_RECO] ?? false,
				[SHORT_ITEM_ID.INF_SCROLLING]: result[SHORT_ITEM_ID.INF_SCROLLING] ?? false,
			};

			resolve(showingRule);
		});
	});
}

///////////////////////////////////////////////////////
//                    Update Dom                     //
///////////////////////////////////////////////////////
function updateDisplayNavMenu(shouldDisplay: boolean, querySelector: string) {
	const nav = document.querySelector(querySelector) as HTMLElement | null;
	if (!nav) return;

	const items = nav.querySelector("#items") as HTMLElement | null;
	if (!items) return;

	const el = items.children[1] as HTMLElement | undefined;
	if (!el) return;

	el.style.display = shouldDisplay ? "block" : "none";
}

function updateDisplaySection(shouldDisplay: boolean, section: string) {
	const shortSections = document.querySelectorAll(section) as NodeListOf<HTMLElement>;

	for (const section of shortSections) {
		section.style.display = shouldDisplay ? "block" : "none";
	}
}

function redirectToWatch() {
	const videoId = window.location.pathname.split("/shorts/")[1]?.split("/")[0];

	if (videoId) {
		window.location.replace(`https://www.youtube.com/watch?v=${videoId}`);
	}
}

///////////////////////////////////////////////////////
//                 Apply Showing Rule                //
///////////////////////////////////////////////////////
function applyShowingRules(rules: ShowingRule) {
	const path = window.location.pathname;

	updateDisplayNavMenu(rules[SHORT_ITEM_ID.NAV_MENU], '[role="navigation"]'); // For desktop format
	updateDisplayNavMenu(rules[SHORT_ITEM_ID.NAV_MENU], "ytd-mini-guide-renderer"); // For tablet format
	updateDisplaySection(rules[SHORT_ITEM_ID.MAIN_RECO], "ytd-rich-section-renderer");

	if (path.startsWith("/results")) {
		updateDisplaySection(rules[SHORT_ITEM_ID.SEARCH_RESULT], "ytd-reel-shelf-renderer");
	}

	if (path.startsWith("/watch")) {
		updateDisplaySection(rules[SHORT_ITEM_ID.VIDEO_RECO], "ytd-reel-shelf-renderer");
	}

	if (!rules[SHORT_ITEM_ID.INF_SCROLLING] && path.startsWith("/shorts")) {
		redirectToWatch();
	}
}

///////////////////////////////////////////////////////
//                 Watch for Changes                 //
///////////////////////////////////////////////////////
function watchUrlChanges(callback: () => void) {
	let lastUrl = location.href;

	// Patch pushState
	const pushState = history.pushState;
	history.pushState = function (...args) {
		pushState.apply(history, args);
		onUrlChange();
	};

	// Patch replaceState
	const replaceState = history.replaceState;
	history.replaceState = function (...args) {
		replaceState.apply(history, args);
		onUrlChange();
	};

	// Listen to browser navigation (back/forward)
	window.addEventListener("popstate", onUrlChange);

	function onUrlChange() {
		const currentUrl = location.href;
		if (currentUrl !== lastUrl) {
			lastUrl = currentUrl;
			callback();
		}
	}
}

function watchDomChanges(callback: () => void) {
	const observer = new MutationObserver(() => {
		scheduleRerun(callback);
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});
}

function scheduleRerun(callback: () => void) {
	if ("requestIdleCallback" in window) {
		requestIdleCallback(() => callback(), { timeout: 300 });
	} else {
		setTimeout(callback, 150);
	}
}

///////////////////////////////////////////////////////
//           Listen for manual updates               //
///////////////////////////////////////////////////////
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	const id = message.id as SHORT_ITEM_ID;

	showingRule[id] = id in showingRule ? !showingRule[id] : true;

	throttledApplyShowingRules();

	sendResponse({ status: "done" }); // Resolves the port

	return true; // Tells Chrome this will respond async
});

///////////////////////////////////////////////////////
//                       Main                        //
///////////////////////////////////////////////////////
(async function main() {
	showingRule = await getInitialData();

	// Re-run on YouTube navigation (SPA)
	watchUrlChanges(throttledApplyShowingRules);

	// Re-run on new DOM elements (infinite scroll, recommendations)
	watchDomChanges(throttledApplyShowingRules);
})();
