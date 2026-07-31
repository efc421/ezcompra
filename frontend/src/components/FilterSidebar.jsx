function FilterSidebar({
    priceFilter,
    setPriceFilter,
}) {
    const priceOptions = [
        {
            label: "All Prices",
            value: "all",
        },
        {
            label: "Under $25",
            value: "under25",
        },
        {
            label: "$25 - $50",
            value: "25-50",
        },
        {
            label: "$50 - $100",
            value: "50-100",
        },
        {
            label: "$100 - $250",
            value: "100-250",
        },
        {
            label: "Over $250",
            value: "over250",
        },
    ];

    return (
        <aside className="filter-sidebar">

            <h3>Filters</h3>

            <div className="filter-section">

                <h4>Price</h4>

                {priceOptions.map((option) => (
                    <label
                        key={option.value}
                        className="filter-option"
                    >
                        <input
                            type="radio"
                            name="price"
                            checked={
                                priceFilter ===
                                option.value
                            }
                            onChange={() =>
                                setPriceFilter(
                                    option.value
                                )
                            }
                        />

                        {option.label}
                    </label>
                ))}

            </div>

        </aside>
    );
}

export default FilterSidebar;