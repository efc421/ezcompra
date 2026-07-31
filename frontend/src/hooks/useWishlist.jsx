import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const WishlistContext = createContext(null);
const STORAGE_KEY = "ezcompra-wishlist";

function getSavedWishlist() {
  try {
    const savedWishlist = localStorage.getItem(STORAGE_KEY);
    return savedWishlist ? JSON.parse(savedWishlist) : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState(getSavedWishlist);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(wishlistItems)
    );
  }, [wishlistItems]);

  function isInWishlist(productId) {
    return wishlistItems.some(
      (item) => String(item.id) === String(productId)
    );
  }

  function addToWishlist(product) {
    setWishlistItems((currentItems) => {
      const alreadySaved = currentItems.some(
        (item) => String(item.id) === String(product.id)
      );

      if (alreadySaved) {
        return currentItems;
      }

      return [...currentItems, product];
    });
  }

  function removeFromWishlist(productId) {
    setWishlistItems((currentItems) =>
      currentItems.filter(
        (item) => String(item.id) !== String(productId)
      )
    );
  }

  function toggleWishlist(product) {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  }

  function clearWishlist() {
    setWishlistItems([]);
  }

  const wishlistCount = wishlistItems.length;

  const value = useMemo(
    () => ({
      wishlistItems,
      wishlistCount,
      isInWishlist,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      clearWishlist,
    }),
    [wishlistItems]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error(
      "useWishlist must be used inside WishlistProvider"
    );
  }

  return context;
}