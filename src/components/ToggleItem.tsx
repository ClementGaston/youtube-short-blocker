import { useChromeStorageBoolean } from "../utils/useChromeStorageBoolean";

interface Props {
	id: string;
	label: string;
}

function ToggleItem({ id, label }: Props) {
	const { value: isShowing, setValue: setIsShowing, loading } = useChromeStorageBoolean(id, false);

	function handleChange() {
		const newValue = !isShowing;

		setIsShowing(newValue);
	}

	if (loading) {
		return <span className="loading loading-spinner"></span>;
	}

	return (
		<div className="flex gap-4 items-center max-w-120">
			<input
				id={id}
				type="checkbox"
				defaultChecked={!isShowing}
				checked={!isShowing}
				onChange={handleChange}
				className="toggle toggle-primary"
			/>
			<label htmlFor={id} className="cursor-pointer select-none text-base">
				{label}
			</label>
		</div>
	);
}

export default ToggleItem;
