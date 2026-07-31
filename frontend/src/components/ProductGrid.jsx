import { useState } from "react";
import { Link } from "react-router-dom";

import { useWishlist } from "../hooks/useWishlist";

function ProductCard({ product, addToCart }) {
  const [isAdded, setIsAdded] = useState(false);

  const {
    isInWishlist,
    toggleWishlist,
  } = useWishlist();

  const saved = isInWishlist(product.id);

  function handleAddToCart() {
    addToCart(product);
    setIsAdded(true);

    window.setTimeout(() => {
      setIsAdded(false);
    }, 1000);
  }

  function handleWishlistClick(event) {
    event.preventDefault();
    event.stopPropagation();
    toggleWishlist(product);
  }

  const stars =
    "★".repeat(product.rating) +
    "☆".repeat(5 - product.rating);

  return (
    <article className="product-card">
      <button
        type="button"
        className={
          saved
            ? "wishlist-button active"
            : "wishlist-button"
        }
        onClick={handleWishlistClick}
        aria-label={
          saved
            ? `Remove ${product.name} from wishlist`
            : `Add ${product.name} to wishlist`
        }
        title={
          saved
            ? "Remove from wishlist"
            : "Add to wishlist"
        }
      >
        {saved ? "♥" : "♡"}
      </button>

      <Link
        to={`/product/${product.id}`}
        className="product-card-link"
        aria-label={`View ${product.name}`}
      >
        <div className={`product-image ${product.imageClass}`}>
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <span>{product.imageLabel}</span>
          )}
        </div>

        <div className="product-info">
          <div>
            <span className="product-category">
              {product.category}
            </span>

            <span className="product-brand">
              {product.brand}
            </span>
          </div>

          <h3>{product.name}</h3>

          <div className="rating">
            {stars} <span>({product.reviews})</span>
          </div>
        </div>
      </Link>

      <div className="product-bottom">
        <strong>${product.price.toFixed(2)}</strong>

        <button
          className="add-cart-button"
          type="button"
          onClick={handleAddToCart}
          disabled={isAdded}
        >
          {isAdded ? "Added" : "Add"}
        </button>
      </div>
    </article>
  );
}

function ProductGrid({ products, addToCart }) {
  return (
    <section className="section" id="featured-products">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Popular now</span>
          <h2>Featured products</h2>
        </div>

        <a href="#featured-products">View all</a>
      </div>

      <div className="product-grid">
        {products.length > 0 ? (
          products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              addToCart={addToCart}
            />
          ))
        ) : (
          <div className="empty-products">
            <h3>No products found</h3>
            <p>Try another search or category.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default ProductGrid;