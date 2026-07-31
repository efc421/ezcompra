import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import products from "../data/products";
import { useCart } from "../hooks/useCart";
import { useWishlist } from "../hooks/useWishlist";

function ProductPage() {
  const { id } = useParams();

  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  const { addToCart } = useCart();

  const {
    isInWishlist,
    toggleWishlist,
  } = useWishlist();

  const product = useMemo(() => {
    return products.find(
      (item) => String(item.id) === String(id)
    );
  }, [id]);

  useEffect(() => {
    if (!product) {
      return;
    }

    setQuantity(1);
    setIsAdded(false);
    setSelectedImage(product.images?.[0] || "");
    setImageFailed(false);
  }, [product]);

  function decreaseQuantity() {
    setQuantity((currentQuantity) =>
      Math.max(1, currentQuantity - 1)
    );
  }

  function increaseQuantity() {
    setQuantity((currentQuantity) =>
      Math.min(product.stock, currentQuantity + 1)
    );
  }

  function handleAddToCart() {
    addToCart(product, quantity);
    setIsAdded(true);

    window.setTimeout(() => {
      setIsAdded(false);
    }, 1200);
  }

  function handleWishlist() {
    toggleWishlist(product);
  }

  function handleImageSelection(image) {
    setSelectedImage(image);
    setImageFailed(false);
  }

  if (!product) {
    return (
      <main className="page-container product-page">
        <div className="product-not-found">
          <h1>Product not found</h1>

          <p>
            The product you selected does not exist.
          </p>

          <Link to="/" className="back-home-link">
            Return to homepage
          </Link>
        </div>
      </main>
    );
  }

  const saved = isInWishlist(product.id);
  const rating = Number(product.rating) || 0;

  const stars =
    "★".repeat(rating) +
    "☆".repeat(5 - rating);

  return (
    <main className="page-container product-page">
      <Link to="/" className="back-home-link">
        ← Back to products
      </Link>

      <section className="product-details-layout">
        <div className="product-gallery">
          <div
            className={`product-detail-image ${
              product.imageClass || ""
            }`}
          >
            {!imageFailed && selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
                onError={() => setImageFailed(true)}
              />
            ) : (
              <span>
                {product.imageLabel || product.name}
              </span>
            )}
          </div>

          {product.images?.length > 0 && (
            <div className="product-thumbnails">
              {product.images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  className={
                    selectedImage === image
                      ? "product-thumbnail active"
                      : "product-thumbnail"
                  }
                  onClick={() =>
                    handleImageSelection(image)
                  }
                  aria-label={`View product image ${
                    index + 1
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} view ${
                      index + 1
                    }`}
                    onError={(event) => {
                      event.currentTarget.style.display =
                        "none";
                    }}
                  />

                  <span>{index + 1}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-detail-info">
          <div className="product-detail-heading">
            <div>
              <span className="product-category">
                {product.category}
              </span>

              <p className="product-brand">
                {product.brand}
              </p>
            </div>

            <button
              type="button"
              className={
                saved
                  ? "product-detail-wishlist-button active"
                  : "product-detail-wishlist-button"
              }
              onClick={handleWishlist}
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
          </div>

          <h1>{product.name}</h1>

          <div className="rating">
            {stars}{" "}
            <span>
              ({product.reviews} reviews)
            </span>
          </div>

          <strong className="product-detail-price">
            ${Number(product.price).toFixed(2)}
          </strong>

          <p className="product-description">
            {product.description}
          </p>

          <p
            className={
              product.stock > 0
                ? "product-stock"
                : "product-stock out-of-stock"
            }
          >
            {product.stock > 0
              ? `${product.stock} available`
              : "Out of stock"}
          </p>

          <div className="quantity-section">
            <span>Quantity</span>

            <div className="quantity-controls">
              <button
                type="button"
                onClick={decreaseQuantity}
                disabled={quantity === 1}
                aria-label="Decrease quantity"
              >
                −
              </button>

              <strong>{quantity}</strong>

              <button
                type="button"
                onClick={increaseQuantity}
                disabled={
                  quantity >= product.stock ||
                  product.stock === 0
                }
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            className={
              saved
                ? "product-detail-save-button active"
                : "product-detail-save-button"
            }
            onClick={handleWishlist}
          >
            <span>{saved ? "♥" : "♡"}</span>

            {saved
              ? "Saved to wishlist"
              : "Save to wishlist"}
          </button>

          <button
            className="product-detail-cart-button"
            type="button"
            onClick={handleAddToCart}
            disabled={
              isAdded || product.stock === 0
            }
          >
            {product.stock === 0
              ? "Out of stock"
              : isAdded
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