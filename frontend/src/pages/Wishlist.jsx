import { Link } from "react-router-dom";

import { useCart } from "../hooks/useCart";
import { useWishlist } from "../hooks/useWishlist";

function Wishlist() {
  const { addToCart } = useCart();

  const {
    wishlistItems,
    removeFromWishlist,
    clearWishlist,
  } = useWishlist();

  if (wishlistItems.length === 0) {
    return (
      <main className="page-container">
        <section className="wishlist-page">
          <div className="wishlist-empty">
            <span className="wishlist-empty-icon">♡</span>

            <h1>Your wishlist is empty</h1>

            <p>
              Save products you like and they will appear here.
            </p>

            <Link to="/" className="wishlist-home-button">
              Continue shopping
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-container">
      <section className="wishlist-page">
        <div className="wishlist-header">
          <div>
            <span className="eyebrow">Saved products</span>

            <h1>My wishlist</h1>

            <p>
              {wishlistItems.length}{" "}
              {wishlistItems.length === 1
                ? "product"
                : "products"}{" "}
              saved
            </p>
          </div>

          <button
            type="button"
            className="clear-wishlist-button"
            onClick={clearWishlist}
          >
            Clear wishlist
          </button>
        </div>

        <div className="wishlist-grid">
          {wishlistItems.map((product) => {
            const rating = Number(product.rating) || 0;

            const stars =
              "★".repeat(rating) +
              "☆".repeat(5 - rating);

            const productImage =
              product.images?.[0] || product.image || "";

            return (
              <article
                className="wishlist-card"
                key={product.id}
              >
                <Link
                  to={`/product/${product.id}`}
                  className="wishlist-card-link"
                  aria-label={`View ${product.name}`}
                >
                  <div
                    className={`wishlist-product-image ${
                      product.imageClass || ""
                    }`}
                  >
                    {productImage ? (
                      <img
                        src={productImage}
                        alt={product.name}
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <span>
                        {product.imageLabel || product.name}
                      </span>
                    )}
                  </div>

                  <div className="wishlist-product-info">
                    <div>
                      <span className="product-category">
                        {product.category}
                      </span>

                      <span className="product-brand">
                        {product.brand}
                      </span>
                    </div>

                    <h2>{product.name}</h2>

                    <div className="rating">
                      {stars}{" "}
                      <span>({product.reviews || 0})</span>
                    </div>

                    <strong className="wishlist-product-price">
                      ${Number(product.price).toFixed(2)}
                    </strong>
                  </div>
                </Link>

                <div className="wishlist-card-actions">
                  <button
                    type="button"
                    className="wishlist-add-cart-button"
                    onClick={() => addToCart(product)}
                  >
                    Add to cart
                  </button>

                  <button
                    type="button"
                    className="wishlist-remove-button"
                    onClick={() =>
                      removeFromWishlist(product.id)
                    }
                  >
                    Remove
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default Wishlist;