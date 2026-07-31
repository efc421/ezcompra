import { useEffect, useState } from "react";
import {
    Link,
    useLocation,
    useNavigate,
} from "react-router-dom";

import { useWishlist } from "../hooks/useWishlist";

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
    searchTerm = "",
    setSearchTerm,
    selectedCategory = "All Categories",
    setSelectedCategory,
    cartCount = 0,
}) {
    const navigate = useNavigate();
    const location = useLocation();

    const { wishlistCount } = useWishlist();

    const [headerSearch, setHeaderSearch] =
        useState(searchTerm);

    useEffect(() => {
        setHeaderSearch(searchTerm);
    }, [searchTerm]);

    function updateHomeFilters(search, category) {
        const parameters = new URLSearchParams();

        if (search.trim()) {
            parameters.set("search", search.trim());
        }

        if (
            category &&
            category !== "All Categories"
        ) {
            parameters.set("category", category);
        }

        const queryString = parameters.toString();

        navigate(
            queryString ? `/?${queryString}` : "/"
        );
    }

    function handleSearchChange(event) {
        const newSearchTerm = event.target.value;

        setHeaderSearch(newSearchTerm);

        if (typeof setSearchTerm === "function") {
            setSearchTerm(newSearchTerm);
        }

        if (location.pathname === "/") {
            const parameters = new URLSearchParams(
                location.search
            );

            if (newSearchTerm.trim()) {
                parameters.set(
                    "search",
                    newSearchTerm
                );
            } else {
                parameters.delete("search");
            }

            const queryString = parameters.toString();

            navigate(
                queryString ? `/?${queryString}` : "/",
                { replace: true }
            );
        }
    }

    function handleSubmit(event) {
        event.preventDefault();

        updateHomeFilters(
            headerSearch,
            selectedCategory
        );
    }

    function handleCategorySelection(category) {
        if (
            typeof setSelectedCategory === "function"
        ) {
            setSelectedCategory(category);
        }

        updateHomeFilters(headerSearch, category);
    }

    return (
        <header className="site-header">
            <div className="header-inner">
                <div className="top-bar">
                    <Link className="logo" to="/">
                        EZCOMPRA
                    </Link>

                    <form
                        className="search-form"
                        onSubmit={handleSubmit}
                    >
                        <input
                            type="search"
                            value={headerSearch}
                            onChange={handleSearchChange}
                            placeholder="Search products, brands and categories"
                            aria-label="Search products"
                        />

                        <button type="submit">
                            Search
                        </button>
                    </form>

                    <nav
                        className="account-nav"
                        aria-label="Account navigation"
                    >
                        <a href="#signin">
                            Sign in
                        </a>

                        <a href="#orders">
                            Orders
                        </a>

                        <Link
                            to="/wishlist"
                            className="wishlist-header-button"
                            aria-label={`Wishlist with ${wishlistCount} items`}
                        >
                            <span className="header-action-icon">
                                ♥
                            </span>

                            <span className="header-action-label">
                                Wishlist
                            </span>

                            <span className="wishlist-count">
                                {wishlistCount}
                            </span>
                        </Link>

                        <Link
                            to="/cart"
                            className="cart-button"
                            aria-label={`Cart with ${cartCount} items`}
                        >
                            <span className="header-action-icon">
                                🛒
                            </span>

                            <span className="header-action-label">
                                Cart
                            </span>

                            <span className="cart-count">
                                {cartCount}
                            </span>
                        </Link>
                    </nav>
                </div>

                <nav
                    className="category-navigation"
                    aria-label="Product categories"
                >
                    {navigationCategories.map(
                        (category) => (
                            <button
                                key={category}
                                type="button"
                                className={
                                    selectedCategory ===
                                    category
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    handleCategorySelection(
                                        category
                                    )
                                }
                            >
                                {category === "Home"
                                    ? "Home & Kitchen"
                                    : category}
                            </button>
                        )
                    )}
                </nav>
            </div>
        </header>
    );
}

export default Header;