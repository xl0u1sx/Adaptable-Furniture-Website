$(document).ready(function() {
  $('.dot').on('click', function(e) {
    e.stopPropagation();

    const $dot = $(this);
    
    const name = $dot.data('name');
    const price = $dot.data('price');
    const imgFile = $dot.data('img');
    
    const $card = $('#info-card');
    const $title = $card.find('.product-title');
    const $price = $card.find('.product-price');
    const $imgContainer = $card.find('.product-img'); 

    $title.text(name);
    $price.text(price);
    
    $imgContainer.html(`<img src="img/${imgFile}" alt="${name}" style="width:100%; height:auto; display:block;">`);

    const pos = $dot.position(); 
    
    $card.css({
      top: (pos.top + 30) + 'px', 
      left: (pos.left) + 'px',
      position: 'absolute'
    }).stop(true, true).fadeIn(200);
  });

  $(document).on('click', function() {
    $('#info-card').fadeOut(200);
  });
});