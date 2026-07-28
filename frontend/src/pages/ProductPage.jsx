import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import products from "../data/products";
import { useCart } from "../hooks/useCart";

function ProductPage() {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const { addToCart } = useCart();

  const product = useMemo(() => {
    return products.find((item) => String(item.id) === String(id));
  }, [id]);

  function decreaseQuantity() {
    setQuantity((currentQuantity) =>
      Math.max(1, currentQuantity - 1)
    );
  }

  function increaseQuantity() {
    setQuantity((currentQuantity) => currentQuantity + 1);
  }

  function handleAddToCart() {
    addToCart(product, quantity);
    setIsAdded(true);

    window.setTimeout(() => {
      setIsAdded(false);
    }, 1200);
  }

  if (!product) {
    return (
      <main className="page-container product-page">
        <div className="product-not-found">
          <h1>Product not found</h1>
          <p>The product you selected does not exist.</p>

          <Link to="/" className="back-home-link">
            Return to homepage
          </Link>
        </div>
      </main>
    );
  }

  const stars =
    "★".repeat(product.rating) + "☆".repeat(5 - product.rating);

  return (
    <main className="page-container product-page">
      <Link to="/" className="back-home-link">
        ← Back to products
      </Link>

      <section className="product-details-layout">
        <div className={`product-detail-image ${product.imageClass}`}>
          <span>{product.imageLabel}</span>
        </div>

        <div className="product-detail-info">
          <span className="product-category">
            {product.category}
          </span>

          <p className="product-brand">
            {product.brand}
          </p>

          <h1>{product.name}</h1>

          <div className="rating">
            {stars} <span>({product.reviews} reviews)</span>
          </div>

          <strong className="product-detail-price">
            ${product.price.toFixed(2)}
          </strong>

          <p className="product-description">
            {product.description}
          </p>

          <div className="quantity-section">
            <span>Quantity</span>

            <div className="quantity-controls">
              <button
                type="button"
                onClick={decreaseQuantity}
                aria-label="Decrease quantity"
              >
                −
              </button>

              <strong>{quantity}</strong>

              <button
                type="button"
                onClick={increaseQuantity}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <button
            className="product-detail-cart-button"
            type="button"
            onClick={handleAddToCart}
            disabled={isAdded}
          >
            {isAdded
              ? "Added to cart"
              : `Add ${quantity} to cart`}
          </button>

          <Link to="/cart" className="back-home-link">
            View cart
          </Link>
        </div>
      </section>
    </main>
  );
}

export default ProductPage;