var api_call_made = false;
var vendorID = null;
var sessionDetails = null;

$(function () {
  progressively.init({
    onLoadComplete: () => {
      console.log("done loading");
    }
  });
  getSessionDetails();
  addDismissNotificationListeners();
  addMobileMenuListener();
  addSignupListener();
  addBlur();
  addAjaxListeners();
  addCloseModalListeners();
  addBookingListeners();
  addBookFulfillmentListener();
  addSwitchViewListeners();
});

function addSignupListener() {
  $('.toggle-form').click(e => {
    let $self = $(e.currentTarget);

    $('.toggle-form').parent().removeClass('is-active');
    $self.parent().addClass('is-active');

    if ($self.hasClass('show-vendor')) {
      $('.vendor-signup').show();
      $('.organizer-signup').hide();
      $('.signup-container').addClass('expanded-form');
    } else {
      $('.vendor-signup').hide();
      $('.organizer-signup').show();
      $('.signup-container').removeClass('expanded-form');
    }
  })
}

function addBlur() {
  $('.vendor-card').on({
    mouseover: e => {
      let $self = $(e.currentTarget);
      $self.children('.vendor-card-image').addClass('in-focus');
      $self.children('.vendor-icon').addClass('slide-up');
      $self.children('.vendor-text').addClass('text-shown');
    },
    mouseleave: e => {
      let $self = $(e.currentTarget);
      $self.children('.vendor-card-image').removeClass('in-focus');
      $self.children('.vendor-icon').removeClass('slide-up');
      $self.children('.vendor-text').removeClass('text-shown');
    }
  });
}

function addAjaxListeners() {
  $('.getVendorByType').on('click', e => {
    let $self = $(e.currentTarget);
    let type = $self.attr('data-type');
    api_call_made = true;
    makeSidelinkActive(type);
    getVendorByType(type);
  });
}

function getVendorByType(type) {
  // Adding loading indicators for loading vendors call
  $(document).bind("ajaxStart.vendorCall", () => {
    $('.overlay-container').show();
    $('.vendor-list-card .overlay').show();
  });
  $(document).bind("ajaxStop.vendorCall", () => {
    $('.overlay-container').hide();
    $('.vendor-list-card .overlay').hide();
    console.log('complete!');
  });

  makeSidelinkActive(type);

  $.ajax({
    method: 'GET',
    url: '/getvendors',
    data: {
      "type": type
    }
  })
  .done(json => {
    console.log(json);
    displayVendors(json);
    api_call_made = false;
  })
  .fail((xhr, status, error) => {
    console.log(xhr, status, error);
  })
}

function makeSidelinkActive(type) {
  // Remove all active classes from links
  $('.getVendorByType').removeClass('is-active');
  // Add active class to all vendors link (special case)
  if (type === "all") {
    $('.getVendorByType').eq(0).addClass('is-active');
  }
  // Add active class to link with href that corresponds to type passed in to AJAX call
  $('a[href="#' + type + '"]').addClass('is-active');
}

function displayVendors(json) {
  let $wrapper = $(".vendor-list-card-wrapper")

  $wrapper.empty();

  $.each(json.vendors, function(index, value) {
    let $vendorCardWrapper = $("<div />", {"class": "tile is-parent vendor-list-card"});
    let $card = $("<article />", {"class": "tile is-child card"}).attr("data-vendor-id", value.id);
    $card.append('<div class="overlay"></div>');

    $card.append(
      $('<div />', {"class": "card-content"}).append(
        $('<div />', {"class": "media"}).append(
          $('<div />', {"class": "media-content"}).append(
            $('<p />', {"class": "title is-3 vendorName"}).text(value.contactName),
            $('<p />', {"class": "subtitle is-5 vendorType"}).text(value.vendorType)
          )
        ),
        $('<div />', {"class": "content"}).append(
          $('<p />', {"class": "businessName"}).text(value.businessName),
          $('<p />', {"class": "vendorLocation"}).text(value.city + ", " + value.state)
        )
      ),
      $('<footer />', {"class": "card-footer"}).append(
        $('<a />', {"class": "card-footer-item book-button"}).append(
          $('<span />', {"class": "icon"}).append(
            $('<i />', {"class": "mdi mdi-plus-circle"})
          )
        ).append(" Book Now"),
        $('<a />', {"class": "card-footer-item"}).attr("href", "/portfolio?id=" + value.id).append(
          $('<span />', {"class": "icon"}).append(
            $('<i />', {"class": "mdi mdi-treasure-chest"})
          )
        ).append(" View Portfolio")
      )
    );
    $vendorCardWrapper.append($card);
    $wrapper.append($vendorCardWrapper);
  });
}

function addMobileMenuListener() {
  // Get all "navbar-burger" elements
  var $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

  // Check if there are any navbar burgers
  if ($navbarBurgers.length > 0) {

    // Add a click event on each of them
    $navbarBurgers.forEach(function ($el) {
      $el.addEventListener('click', function () {

        // Get the target from the "data-target" attribute
        var target = $el.dataset.target;
        var $target = document.getElementById(target);

        // Toggle the class on both the "navbar-burger" and the "navbar-menu"
        $el.classList.toggle('is-active');
        $target.classList.toggle('is-active');

      });
    });
  }
}

function addBookingListeners() {
  $(document).on('click', '.book-button', e => {
    if (sessionDetails.session === false) {
      alert("You must be logged in to book a vendor.");
    } else {
      $('#bookingModal').addClass('is-active');
      vendorID = $(e.currentTarget).parent().parent().attr('data-vendor-id');
      $('#bookRequestName').val($(e.currentTarget).parent().siblings('.card-content').find('.vendorName').text());
      $('#bookRequestBusiness').val($(e.currentTarget).parent().siblings('.card-content').find('.businessName').text());
      // Adding DatePicker each time a booking modal is active
      var datePicker = new DatePicker(document.getElementById('bookRequestDate'), {dataFormat: "yyyy-mm-dd"});
    }
  });
}

function addCloseModalListeners() {
  $(document).on('click', '#modalCloseButton, #modalCloseLayer, #cancelButton', e => {
    $('#bookingModal').removeClass('is-active');
    $('.datepicker').remove();
    $('#bookRequestDate').val("");
    resetModalView();
  });
}

function addBookFulfillmentListener() {
  $('#bookVendor').on('click', e => {
    let vendorId = vendorID;
    let date = $('#bookRequestDate').val();
    postBookRequest(vendorId, date);
  });
}

function postBookRequest(id, date) {
  // First unbind main ajax animation from happening
  $(document).unbind("ajaxStart.vendorCall");
  // Adding loading indicators for booking call
  $(document).bind("ajaxStart.bookingCall", () => {
    $('.modal-card-body .overlay').fadeTo("fast", 0.75);
    $('#bookVendor').addClass('is-loading');
  });
  $(document).bind("ajaxStop.bookingCall", () => {
    $('.modal-card-body .overlay').fadeOut("fast");
    $('#bookVendor').removeClass('is-loading');
    console.log('complete!');
  });
  $.ajax({
    method: "POST",
    url: "/book",
    data: {
      "vendorID": id,
      "date": date
    }
  })
  .done(json => {
    displayBookingConfirmation(json);
    console.log(json);
  })
  .fail((xhr) => {
    displayErrorMessage(xhr.responseJSON.message);
  });
}

function displayBookingConfirmation(json) {
  const info = json.bookingInfo;

  $('.bookingInputBox, #bookingFooter').hide();

  $('#bookingInfoBox').append('<p class="subtitle detail">' + info.book_date + '</p>');
  $('#vendorBusinessBox').append('<p class="subtitle detail">' + info.vendor_business + '</p>');
  $('#vendorNameBox').append('<p class="subtitle detail">' + info.vendor_name + '</p>');

  $('.confirmationMessage, #confirmFooter').show();
}

function displayErrorMessage(err) {
  $('.bookingInputBox, #bookingFooter').hide();
  
  $('.errorMessage').append('<p class="subtitle">' + err + '</p>');

  $('.errorMessage, #confirmFooter').show();
}

function resetModalView() {
  const $inputView = $('.bookingInputBox, #bookingFooter');
  const $confirmView = $('.confirmationMessage, #confirmFooter');

  $inputView.show();
  $confirmView.hide();
  $('.detail').remove();
}

function getSessionDetails() {
  $.ajax({
    method: "GET",
    url: "/session",
    data: {
      "source": "ajax"
    }
  }).done(data => {
    sessionDetails = data;
    console.log(data);
  });
}

function addDismissNotificationListeners() {
  $('.flash-dismiss').on('click', e => {
    $(e.currentTarget).parent().remove();
  });
}

function addSwitchViewListeners() {
  $('.navbar-item.is-tab').on('click', e => {
    $('.navbar-item.is-tab').removeClass('is-active');
    $(e.currentTarget).addClass('is-active');
  });
}
