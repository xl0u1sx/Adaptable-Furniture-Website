$(document).ready(function() {
  $('.dot').on('click', function(e) {
    e.stopPropagation();

    // 1. Grab data from the dot
    const name = $(this).data('name');
    const price = $(this).data('price');
    
    // 2. Update the card content
    $('#info-card .product-title').text(name);
    $('#info-card .product-price').text(price);

    // 3. Just show it (it will stay where the CSS tells it to stay)
    $('#info-card').stop(true, true).fadeIn(200);
  });

  // Hide card when clicking the background
  $(document).on('click', function() {
    $('#info-card').fadeOut(200);
  });
});