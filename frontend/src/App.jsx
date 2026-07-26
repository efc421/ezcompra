import { useMemo, useState } from "react";
import "./App.css";

import Header from "./components/Header";
import Hero from "./components/Hero";
import CategoryGrid from "./components/CategoryGrid";
import ProductGrid from "./components/ProductGrid";
import SellerBanner from "./components/SellerBanner";
import Footer from "./components/Footer";

import products from "./data/products";

function App() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All Categories");
    const [cartCount, setCartCount] = useState(0);

    const filteredProducts = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return products.filter((product) => {
            const matchesCategory =
                selectedCategory === "All Categories" ||
                product.category === selectedCategory;

            const searchableText = [
                product.name,
                product.brand,
                product.category,
                product.description,
            ]
                .join(" ")
                .toLowerCase();

            const matchesSearch =
                normalizedSearch === "" ||
                searchableText.includes(normalizedSearch);

            return matchesCategory && matchesSearch;
        });
    }, [searchTerm, selectedCategory]);

    function addToCart() {
        setCartCount((currentCount) => currentCount + 1);
    }

    return (
        <>
            <Header
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                cartCount={cartCount}
            />

            <main className="page-container">
                <Hero />

                <CategoryGrid
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                />

                <ProductGrid
                    products={filteredProducts}
                    addToCart={addToCart}
                />

                <SellerBanner />
            </main>

            <Footer />
        </>
    );
}

export default App;