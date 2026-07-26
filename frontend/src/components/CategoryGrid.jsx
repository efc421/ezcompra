const categories = [
    { name: "Clothing", icon: "👕" },
    { name: "Electronics", icon: "💻" },
    { name: "Automotive", icon: "🚗" },
    { name: "Beauty", icon: "✨" },
    { name: "Home", icon: "🏠" },
    { name: "Trending", icon: "🔥" },
];

function CategoryGrid({ selectedCategory, setSelectedCategory }) {
    return (
        <section className="section">
            <div className="section-heading">
                <div>
                    <span className="eyebrow">Explore</span>
                    <h2>Shop by category</h2>
                </div>
            </div>

            <div className="category-grid">
                {categories.map((category) => (
                    <button
                        key={category.name}
                        type="button"
                        className={`category-card ${
                            selectedCategory === category.name ? "active" : ""
                        }`}
                        onClick={() => setSelectedCategory(category.name)}
                    >
                        <span className="category-icon">{category.icon}</span>

                        <strong>
                            {category.name === "Home"
                                ? "Home & Kitchen"
                                : category.name}
                        </strong>
                    </button>
                ))}
            </div>
        </section>
    );
}

export default CategoryGrid;