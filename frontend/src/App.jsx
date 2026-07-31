import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import { CartProvider } from "./hooks/useCart";
import { WishlistProvider } from "./hooks/useWishlist";

import Home from "./pages/Home";
import ProductPage from "./pages/ProductPage";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";

function App() {
  return (
    <CartProvider>
      <WishlistProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />

            <Route
              path="/product/:id"
              element={<ProductPage />}
            />

            <Route path="/cart" element={<Cart />} />

            <Route
              path="/wishlist"
              element={<Wishlist />}
            />
          </Routes>
        </BrowserRouter>
      </WishlistProvider>
    </CartProvider>
  );
}

export default App;