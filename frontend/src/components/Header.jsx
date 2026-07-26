const navigationCategories = [
    "All Categories",
    "Clothing",
    "Electronics",
    "Automotive",
    "Beauty",
    "Home",
    "Trending",
];

function Header({
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    cartCount,
}) {
    function handleSubmit(event) {
        event.preventDefault();
    }

    return (
        <header className="site-header">
            <div className="header-inner">
                <div className="top-bar">
                    <a className="logo" href="/">
                        EZCOMPRA
                    </a>

                    <form className="search-form" onSubmit={handleSubmit}>
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(event.target.value)
                            }
                            placeholder="Search products, brands and categories"
                            aria-label="Search products"
                        />

                        <button type="submit">Search</button>
                    </form>

                    <nav className="account-nav" aria-label="Account navigation">
                        <a href="#signin">Sign in</a>
                        <a href="#orders">Orders</a>

                        <button className="cart-button" type="button">
                            Cart
                            <span className="cart-count">{cartCount}</span>
                        </button>
                    </nav>
                </div>

                <nav
                    className="category-navigation"
                    aria-label="Product categories"
                >
                    {navigationCategories.map((category) => (
                        <button
                            key={category}
                            type="button"
                            className={
                                selectedCategory === category ? "active" : ""
                            }
                            onClick={() => setSelectedCategory(category)}
                        >
                            {category === "Home" ? "Home & Kitchen" : category}
                        </button>
                    ))}
                </nav>
            </div>
        </header>
    );
}

export default Header;