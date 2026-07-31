import {
    useEffect,
    useMemo,
    useState,
} from "react";
import { useSearchParams } from "react-router-dom";

import "../App.css";

import Header from "../components/Header";
import Hero from "../components/Hero";
import CategoryGrid from "../components/CategoryGrid";
import FilterSidebar from "../components/FilterSidebar";
import ProductGrid from "../components/ProductGrid";
import SellerBanner from "../components/SellerBanner";
import Footer from "../components/Footer";

import products from "../data/products";
import { useCart } from "../hooks/useCart";

function Home() {
    const [searchParams, setSearchParams] =
        useSearchParams();

    const searchFromUrl =
        searchParams.get("search") || "";

    const categoryFromUrl =
        searchParams.get("category") ||
        "All Categories";

    const sortFromUrl =
        searchParams.get("sort") || "featured";

    const priceFromUrl =
        searchParams.get("price") || "all";

    const [searchTerm, setSearchTerm] =
        useState(searchFromUrl);

    const [
        selectedCategory,
        setSelectedCategory,
    ] = useState(categoryFromUrl);

    const [sortOption, setSortOption] =
        useState(sortFromUrl);

    const [priceFilter, setPriceFilter] =
        useState(priceFromUrl);

    const { addToCart, cartCount } = useCart();

    useEffect(() => {
        setSearchTerm(searchFromUrl);
    }, [searchFromUrl]);

    useEffect(() => {
        setSelectedCategory(categoryFromUrl);
    }, [categoryFromUrl]);

    useEffect(() => {
        setSortOption(sortFromUrl);
    }, [sortFromUrl]);

    useEffect(() => {
        setPriceFilter(priceFromUrl);
    }, [priceFromUrl]);

    useEffect(() => {
        const parameters = new URLSearchParams();

        if (searchTerm.trim()) {
            parameters.set(
                "search",
                searchTerm.trim()
            );
        }

        if (
            selectedCategory !== "All Categories"
        ) {
            parameters.set(
                "category",
                selectedCategory
            );
        }

        if (sortOption !== "featured") {
            parameters.set("sort", sortOption);
        }

        if (priceFilter !== "all") {
            parameters.set("price", priceFilter);
        }

        setSearchParams(parameters, {
            replace: true,
        });
    }, [
        searchTerm,
        selectedCategory,
        sortOption,
        priceFilter,
        setSearchParams,
    ]);

    const filteredAndSortedProducts =
        useMemo(() => {
            const normalizedSearch = searchTerm
                .trim()
                .toLowerCase();

            const filtered = products.filter(
                (product) => {
                    const productPrice =
                        Number(product.price);

                    const matchesCategory =
                        selectedCategory ===
                            "All Categories" ||
                        product.category ===
                            selectedCategory;

                    const searchableText = [
                        product.name,
                        product.brand,
                        product.category,
                        product.description,
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                    const matchesSearch =
                        normalizedSearch === "" ||
                        searchableText.includes(
                            normalizedSearch
                        );

                    let matchesPrice = true;

                    switch (priceFilter) {
                        case "under25":
                            matchesPrice =
                                productPrice < 25;
                            break;

                        case "25-50":
                            matchesPrice =
                                productPrice >= 25 &&
                                productPrice <= 50;
                            break;

                        case "50-100":
                            matchesPrice =
                                productPrice > 50 &&
                                productPrice <= 100;
                            break;

                        case "100-250":
                            matchesPrice =
                                productPrice > 100 &&
                                productPrice <= 250;
                            break;

                        case "over250":
                            matchesPrice =
                                productPrice > 250;
                            break;

                        default:
                            matchesPrice = true;
                    }

                    return (
                        matchesCategory &&
                        matchesSearch &&
                        matchesPrice
                    );
                }
            );

            const sorted = [...filtered];

            switch (sortOption) {
                case "price-low":
                    sorted.sort(
                        (a, b) =>
                            Number(a.price) -
                            Number(b.price)
                    );
                    break;

                case "price-high":
                    sorted.sort(
                        (a, b) =>
                            Number(b.price) -
                            Number(a.price)
                    );
                    break;

                case "rating":
                    sorted.sort(
                        (a, b) =>
                            Number(b.rating || 0) -
                            Number(a.rating || 0)
                    );
                    break;

                case "reviews":
                    sorted.sort(
                        (a, b) =>
                            Number(b.reviews || 0) -
                            Number(a.reviews || 0)
                    );
                    break;

                case "name-az":
                    sorted.sort((a, b) =>
                        a.name.localeCompare(b.name)
                    );
                    break;

                case "name-za":
                    sorted.sort((a, b) =>
                        b.name.localeCompare(a.name)
                    );
                    break;

                case "newest":
                    sorted.sort((a, b) => {
                        if (
                            a.createdAt &&
                            b.createdAt
                        ) {
                            return (
                                new Date(b.createdAt) -
                                new Date(a.createdAt)
                            );
                        }

                        return (
                            Number(b.id) -
                            Number(a.id)
                        );
                    });
                    break;

                default:
                    break;
            }

            return sorted;
        }, [
            searchTerm,
            selectedCategory,
            sortOption,
            priceFilter,
        ]);

    function clearFilters() {
        setSearchTerm("");
        setSelectedCategory("All Categories");
        setSortOption("featured");
        setPriceFilter("all");
    }

    const filtersAreActive =
        searchTerm.trim() !== "" ||
        selectedCategory !== "All Categories" ||
        sortOption !== "featured" ||
        priceFilter !== "all";

    return (
        <>
            <Header
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCategory={
                    selectedCategory
                }
                setSelectedCategory={
                    setSelectedCategory
                }
                cartCount={cartCount}
            />

            <main className="page-container">
                <Hero />

                <CategoryGrid
                    selectedCategory={
                        selectedCategory
                    }
                    setSelectedCategory={
                        setSelectedCategory
                    }
                />

                <section className="product-results-bar">
                    <div className="product-results-info">
                        <strong>
                            {
                                filteredAndSortedProducts.length
                            }{" "}
                            {filteredAndSortedProducts.length ===
                            1
                                ? "product"
                                : "products"}
                        </strong>

                        {searchTerm.trim() && (
                            <span>
                                for “{searchTerm.trim()}”
                            </span>
                        )}

                        {selectedCategory !==
                            "All Categories" && (
                            <span>
                                in {selectedCategory}
                            </span>
                        )}
                    </div>

                    <div className="product-results-actions">
                        {filtersAreActive && (
                            <button
                                type="button"
                                className="clear-filters-button"
                                onClick={clearFilters}
                            >
                                Clear filters
                            </button>
                        )}

                        <label
                            className="sort-control"
                            htmlFor="product-sort"
                        >
                            <span>Sort by</span>

                            <select
                                id="product-sort"
                                value={sortOption}
                                onChange={(event) =>
                                    setSortOption(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="featured">
                                    Featured
                                </option>

                                <option value="newest">
                                    Newest
                                </option>

                                <option value="price-low">
                                    Price: Low to High
                                </option>

                                <option value="price-high">
                                    Price: High to Low
                                </option>

                                <option value="rating">
                                    Highest Rated
                                </option>

                                <option value="reviews">
                                    Most Reviews
                                </option>

                                <option value="name-az">
                                    Name: A to Z
                                </option>

                                <option value="name-za">
                                    Name: Z to A
                                </option>
                            </select>
                        </label>
                    </div>
                </section>

                <section className="marketplace-layout">
                    <FilterSidebar
                        priceFilter={priceFilter}
                        setPriceFilter={
                            setPriceFilter
                        }
                    />

                    <div className="marketplace-products">
                        <ProductGrid
                            products={
                                filteredAndSortedProducts
                            }
                            addToCart={addToCart}
                        />
                    </div>
                </section>

                <SellerBanner />
            </main>

            <Footer />
        </>
    );
}

export default Home;