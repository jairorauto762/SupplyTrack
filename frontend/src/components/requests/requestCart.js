const CART_STORAGE_KEY = 'supplytrack-request-cart';

export function loadRequestCart() {
  try {
    const savedCart = sessionStorage.getItem(CART_STORAGE_KEY);
    const parsedCart = savedCart ? JSON.parse(savedCart) : [];
    return Array.isArray(parsedCart)
      ? parsedCart.filter((entry) => entry?.item?.id && Number.isInteger(entry.quantity) && entry.quantity > 0)
      : [];
  } catch (error) {
    console.error('Could not restore the saved request cart:', error);
    sessionStorage.removeItem(CART_STORAGE_KEY);
    return [];
  }
}

export function saveRequestCart(cart) {
  sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

export function addItemToRequestCart(item) {
  const cart = loadRequestCart();
  const existingItem = cart.find((entry) => entry.item.id === item.id);
  const updatedCart = existingItem
    ? cart.map((entry) => entry.item.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry)
    : [...cart, { item, quantity: 1 }];

  saveRequestCart(updatedCart);
}
