document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', function() {
      const productElement = this.closest('.product');
      const productId = productElement.getAttribute('data-product-id');
      const color = productElement.querySelector('.color-select').value;
      const size = productElement.querySelector('.size-select').value;
      const quantity = productElement.querySelector('.quantity-input').value;

      console.log('Adding product to cart:', productId, color, size, quantity);
      addToCart(productId, color, size, quantity);
    });
  });

  function addToCart(productId, color, size, quantity) {
    fetch('/cart/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId, color, size, quantity }),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Product added to cart:', data);
      // Optionally update the UI to reflect the addition to the cart
    })
    .catch(error => {
      console.error('Error adding product to cart:', error);
    });
  }
});
