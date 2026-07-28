import { Link } from "react-router-dom";
import { useCart } from "../hooks/useCart";

function Cart() {
  const {
    cartItems,
    cartSubtotal,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
  } = useCart();

  const estimatedTax = cartSubtotal * 0.06;
  const shipping = cartSubtotal === 0 || cartSubtotal >= 50 ? 0 : 7.99;
  const total = cartSubtotal + estimatedTax + shipping;

  if (cartItems.length === 0) {
    return (
      <main className="page-container cart-page">
        <div className="empty-cart">
          <h1>Your cart is empty</h1>
          <p>Add some products to continue shopping.</p>

          <Link to="/" className="back-home-link">
            Continue shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container cart-page">
      <div className="cart-page-heading">
        <div>
          <span className="eyebrow">Your order</span>
          <h1>Shopping Cart</h1>
        </div>

        <button
          type="button"
          className="clear-cart-button"
          onClick={clearCart}
        >
          Clear cart
        </button>
      </div>

      <div className="cart-layout">
        <section className="cart-items">
          {cartItems.map((item) => (
            <article className="cart-item" key={item.id}>
              <Link
                to={`/product/${item.id}`}
                className={`cart-item-image ${item.imageClass}`}
              >
                <span>{item.imageLabel}</span>
              </Link>

              <div className="cart-item-info">
                <span className="product-category">
                  {item.category}
                </span>

                <h2>
                  <Link to={`/product/${item.id}`}>
                    {item.name}
                  </Link>
                </h2>

                <p>{item.brand}</p>

                <strong>${item.price.toFixed(2)}</strong>

                <div className="cart-item-actions">
                  <div className="quantity-controls">
                    <button
                      type="button"
                      onClick={() => decreaseQuantity(item.id)}
                      aria-label={`Decrease ${item.name} quantity`}
                    >
                      −
                    </button>

                    <strong>{item.quantity}</strong>

                    <button
                      type="button"
                      onClick={() => increaseQuantity(item.id)}
                      aria-label={`Increase ${item.name} quantity`}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    className="remove-item-button"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>

              <strong className="cart-item-total">
                ${(item.price * item.quantity).toFixed(2)}
              </strong>
            </article>
          ))}
        </section>

        <aside className="order-summary">
          <h2>Order Summary</h2>

          <div className="summary-row">
            <span>Subtotal</span>
            <strong>${cartSubtotal.toFixed(2)}</strong>
          </div>

          <div className="summary-row">
            <span>Estimated tax</span>
            <strong>${estimatedTax.toFixed(2)}</strong>
          </div>

          <div className="summary-row">
            <span>Shipping</span>
            <strong>
              {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
            </strong>
          </div>

          <div className="summary-row summary-total">
            <span>Total</span>
            <strong>${total.toFixed(2)}</strong>
          </div>

          <button
            type="button"
            className="checkout-button"
          >
            Proceed to checkout
          </button>

          <Link to="/" className="continue-shopping-link">
            Continue shopping
          </Link>
        </aside>
      </div>
    </main>
  );
}

export default Cart;