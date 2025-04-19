import ToggleItem from "./components/ToggleItem";
import { SHORT_ITEM_ID } from "./utils/constants";

function App() {
	return (
		<div className="p-4 mw-320 flex-col flex gap-4">
			<h1 className="text-2xl underline font-bold">
				Block Youtube Short from:
			</h1>
			<div className="flex-col flex gap-4">
				<ToggleItem
					id={SHORT_ITEM_ID.NAV_MENU}
					label="Navigation menu"
				/>
				<ToggleItem
					id={SHORT_ITEM_ID.MAIN_RECO}
					label="Main recommandations"
				/>
				<ToggleItem
					id={SHORT_ITEM_ID.SEARCH_RESULT}
					label="Search results"
				/>
				<ToggleItem
					id={SHORT_ITEM_ID.VIDEO_RECO}
					label="Video recommandations"
				/>
				<div className="divider m-0"></div>
				<ToggleItem
					id={SHORT_ITEM_ID.INF_SCROLLING}
					label="Remove the infinite scrolling"
				/>
			</div>
		</div>
	);
}

export default App;
