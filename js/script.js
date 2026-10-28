(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const toast = $('#toast');
  let toastTimer;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3200);
  }

  function openDialog(dialog) {
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('dialog-open');
  }

  $$('dialog').forEach((dialog) => {
    dialog.addEventListener('close', () => {
      if (!$$('dialog[open]').length) document.body.classList.remove('dialog-open');
    });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
    $('.dialog-close', dialog)?.addEventListener('click', () => dialog.close());
  });

  // Keep the date controls internally consistent without requiring dates for a general search.
  const checkIn = $('#check-in');
  const checkOut = $('#check-out');
  const today = new Date();
  const localDate = (date) => {
    const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return adjusted.toISOString().slice(0, 10);
  };
  checkIn.min = localDate(today);
  checkOut.min = localDate(today);
  checkIn.addEventListener('change', () => {
    checkOut.min = checkIn.value || localDate(today);
    if (checkOut.value && checkIn.value && checkOut.value < checkIn.value) checkOut.value = '';
  });

  // Mobile navigation closes after selection and reflects its expanded state.
  const menuToggle = $('#menu-toggle');
  const mobileNav = $('#mobile-nav');
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
    mobileNav.hidden = isOpen;
    menuToggle.innerHTML = `<i data-lucide="${isOpen ? 'menu' : 'x'}" aria-hidden="true"></i>`;
    window.lucide?.createIcons();
  });
  $$('#mobile-nav a').forEach((link) => link.addEventListener('click', () => {
    mobileNav.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    menuToggle.innerHTML = '<i data-lucide="menu" aria-hidden="true"></i>';
    window.lucide?.createIcons();
  }));

  // Update sticky header, back-to-top visibility, and the current section indicator.
  const header = $('.site-header');
  const scrollTopButton = $('#scroll-top');
  const navLinks = $$('.desktop-nav .nav-link');
  const observedSections = ['top', 'destinations', 'packages', 'about', 'contact']
    .map((id) => document.getElementById(id)).filter(Boolean);
  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${visible.target.id}`;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-20% 0px -65% 0px', threshold: [0, 0.1, 0.3, 0.6] });
  observedSections.forEach((section) => sectionObserver.observe(section));
  const updateScrollState = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 20);
    scrollTopButton.classList.toggle('is-visible', window.scrollY > 500);
  };
  window.addEventListener('scroll', updateScrollState, { passive: true });
  updateScrollState();
  scrollTopButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Filter destination cards by the submitted place query and report the selected trip details.
  const tripForm = $('#trip-search-form');
  const destinationQuery = $('#destination-query');
  const destinationCards = $$('.destination-card');
  const destinationEmpty = $('#destination-empty');
  const tripMessage = $('#trip-search-message');
  tripForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = destinationQuery.value.trim().toLowerCase();
    const departure = checkIn.value;
    const returnDate = checkOut.value;
    if ((departure && !returnDate) || (!departure && returnDate)) {
      tripMessage.textContent = 'Choose both a departure and return date, or leave both blank.';
      checkIn.focus();
      return;
    }
    if (departure && returnDate && returnDate < departure) {
      tripMessage.textContent = 'Your return date must be after your departure date.';
      checkOut.focus();
      return;
    }
    const matches = destinationCards.filter((card) => {
      const text = `${card.dataset.destination} ${card.dataset.country}`.toLowerCase();
      const match = !query || text.includes(query);
      card.hidden = !match;
      return match;
    });
    destinationEmpty.hidden = matches.length > 0;
    const travelerCount = $('#travelers').selectedOptions[0].textContent;
    const dateText = departure ? `, ${departure} to ${returnDate}` : '';
    tripMessage.textContent = matches.length
      ? `Showing ${matches.length} ${matches.length === 1 ? 'destination' : 'destinations'} for ${travelerCount}${dateText}. Choose a place to explore it.`
      : `No destinations match “${destinationQuery.value.trim()}”. Try a country or another destination.`;
    document.getElementById('destinations').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  destinationQuery.addEventListener('input', () => {
    if (!destinationQuery.value.trim()) {
      destinationCards.forEach((card) => { card.hidden = false; });
      destinationEmpty.hidden = true;
      tripMessage.textContent = '';
    }
  });

  // Destination detail modal.
  const destinationDialog = $('#destination-dialog');
  const openDestination = (card) => {
    $('#destination-dialog-title').textContent = card.dataset.destination;
    $('#destination-dialog-country').textContent = card.dataset.country;
    $('#destination-dialog-description').textContent = card.dataset.description;
    $('#destination-dialog-rating').textContent = card.dataset.rating;
    $('#destination-dialog-price').textContent = card.dataset.price;
    const image = $('#destination-dialog-image');
    image.src = $('img', card).src;
    image.alt = $('img', card).alt;
    $('#destination-plan').dataset.destination = `${card.dataset.destination}, ${card.dataset.country}`;
    openDialog(destinationDialog);
  };
  $$('.destination-open').forEach((button) => button.addEventListener('click', () => openDestination(button.closest('.destination-card'))));
  $('#destination-plan').addEventListener('click', (event) => {
    const destination = event.currentTarget.dataset.destination;
    destinationDialog.close();
    openBooking(`I'm interested in visiting ${destination}.`);
  });

  // Package filters and text search always compose, so neither control resets the other.
  const packageCards = $$('.package-card');
  const packageQuery = $('#package-query');
  const packageEmpty = $('#package-empty');
  let packageFilter = 'all';
  const filterPackages = () => {
    const query = packageQuery.value.trim().toLowerCase();
    let count = 0;
    packageCards.forEach((card) => {
      const categoryMatch = packageFilter === 'all' || card.dataset.category === packageFilter;
      const textMatch = !query || `${card.dataset.title} ${card.dataset.destination} ${card.textContent}`.toLowerCase().includes(query);
      const visible = categoryMatch && textMatch;
      card.hidden = !visible;
      if (visible) count += 1;
    });
    packageEmpty.hidden = count > 0;
  };
  $$('.filter-button').forEach((button) => button.addEventListener('click', () => {
    packageFilter = button.dataset.filter;
    $$('.filter-button').forEach((filter) => {
      const selected = filter === button;
      filter.classList.toggle('is-selected', selected);
      filter.setAttribute('aria-pressed', String(selected));
    });
    filterPackages();
  }));
  packageQuery.addEventListener('input', filterPackages);

  // Package details and booking inquiry.
  const packageDialog = $('#package-dialog');
  const bookingDialog = $('#booking-dialog');
  const bookingForm = $('#booking-form');
  const bookingMessage = $('#booking-message');
  let selectedPackage = null;
  const openPackageDetails = (card) => {
    selectedPackage = card;
    $('#package-dialog-title').textContent = card.dataset.title;
    $('#package-dialog-destination').textContent = `${card.dataset.destination} · ${card.dataset.duration}`;
    $('#package-dialog-description').textContent = card.dataset.description;
    $('#package-dialog-duration').textContent = card.dataset.duration;
    $('#package-dialog-price').textContent = card.dataset.price;
    const image = $('#package-dialog-image');
    image.src = card.dataset.image;
    image.alt = `${card.dataset.title} in ${card.dataset.destination}`;
    openDialog(packageDialog);
  };
  $$('.package-details').forEach((button) => button.addEventListener('click', () => openPackageDetails(button.closest('.package-card'))));

  function openBooking(context) {
    bookingForm.reset();
    bookingMessage.className = 'booking-message';
    bookingMessage.textContent = 'This demo does not send your details. A backend or form service is needed.';
    $('#booking-context').textContent = context;
    openDialog(bookingDialog);
    $('input[name="name"]', bookingForm).focus({ preventScroll: true });
  }
  $$('.book-package').forEach((button) => button.addEventListener('click', () => {
    const card = button.closest('.package-card');
    selectedPackage = card;
    openBooking(`${card.dataset.title} · ${card.dataset.destination} · ${card.dataset.duration} · from ${card.dataset.price} per person`);
  }));
  $('#package-dialog-book').addEventListener('click', () => {
    if (!selectedPackage) return;
    const card = selectedPackage;
    packageDialog.close();
    openBooking(`${card.dataset.title} · ${card.dataset.destination} · ${card.dataset.duration} · from ${card.dataset.price} per person`);
  });
  bookingForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = $('input[name="name"]', bookingForm).value.trim();
    const email = $('input[name="email"]', bookingForm).value.trim();
    if (!name || !email) {
      bookingMessage.className = 'booking-message is-error';
      bookingMessage.textContent = 'Please enter your name and email address.';
      (!name ? $('input[name="name"]', bookingForm) : $('input[name="email"]', bookingForm)).focus();
      return;
    }
    if (!emailPattern.test(email)) {
      bookingMessage.className = 'booking-message is-error';
      bookingMessage.textContent = 'Please enter a valid email address.';
      $('input[name="email"]', bookingForm).focus();
      return;
    }
    bookingMessage.className = 'booking-message is-success';
    bookingMessage.textContent = 'Your inquiry is ready. This demo has not sent it; connect a backend or form service to deliver it.';
  });

  // Gallery lightbox uses the same ordered tile list for buttons and arrow keys.
  const galleryTiles = $$('.gallery-tile');
  const lightbox = $('#lightbox-dialog');
  let galleryIndex = 0;
  const renderGalleryImage = () => {
    const tile = galleryTiles[galleryIndex];
    const image = $('img', tile);
    $('#lightbox-image').src = image.src;
    $('#lightbox-image').alt = image.alt;
    $('#lightbox-caption').textContent = tile.dataset.caption;
    $('#lightbox-count').textContent = `${String(galleryIndex + 1).padStart(2, '0')} / ${String(galleryTiles.length).padStart(2, '0')}`;
  };
  const moveGallery = (direction) => {
    galleryIndex = (galleryIndex + direction + galleryTiles.length) % galleryTiles.length;
    renderGalleryImage();
  };
  galleryTiles.forEach((tile, index) => tile.addEventListener('click', () => {
    galleryIndex = index;
    renderGalleryImage();
    openDialog(lightbox);
  }));
  $('.lightbox-prev').addEventListener('click', () => moveGallery(-1));
  $('.lightbox-next').addEventListener('click', () => moveGallery(1));
  document.addEventListener('keydown', (event) => {
    if (!lightbox.open) return;
    if (event.key === 'ArrowLeft') moveGallery(-1);
    if (event.key === 'ArrowRight') moveGallery(1);
    if (event.key === 'Escape') {
      event.preventDefault();
      lightbox.close();
    }
  });

  // Testimonial carousel; controls remain fully keyboard accessible.
  const testimonials = [
    { name: 'Amara Lewis', place: 'Bali, Indonesia', quote: 'The itinerary felt like someone had listened to the way we actually travel. We found little places we would never have discovered alone, and somehow still had time to do nothing.', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80', alt: 'Amara Lewis' },
    { name: 'Daniel Kim', place: 'Swiss Alps, Switzerland', quote: 'From the first call to the last train connection, every detail just worked. Our guide made the mountains feel less like a postcard and more like a place we belonged.', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80', alt: 'Daniel Kim' },
    { name: 'Sofia & Mateo', place: 'Kyoto, Japan', quote: 'We wanted a honeymoon that felt personal, not packaged. Travelora gave us the confidence to wander and the kind of local recommendations we still talk about.', image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=120&q=80', alt: 'Sofia and Mateo' }
  ];
  let testimonialIndex = 0;
  const renderTestimonial = () => {
    const testimonial = testimonials[testimonialIndex];
    $('#testimonial-content').innerHTML = `<div class="testimonial-stars" aria-label="5 out of 5 stars">★★★★★</div><blockquote class="testimonial-quote">“${testimonial.quote}”</blockquote><div class="testimonial-person"><img src="${testimonial.image}" alt="${testimonial.alt}" loading="lazy"><div><strong>${testimonial.name}</strong><small>${testimonial.place}</small></div></div>`;
    $('#testimonial-progress').style.width = `${((testimonialIndex + 1) / testimonials.length) * 100}%`;
    $('#testimonial-count').textContent = `${String(testimonialIndex + 1).padStart(2, '0')} / ${String(testimonials.length).padStart(2, '0')}`;
  };
  const moveTestimonial = (direction) => {
    testimonialIndex = (testimonialIndex + direction + testimonials.length) % testimonials.length;
    renderTestimonial();
  };
  $('#testimonial-prev').addEventListener('click', () => moveTestimonial(-1));
  $('#testimonial-next').addEventListener('click', () => moveTestimonial(1));
  renderTestimonial();

  // Single-open accordion keeps the FAQ compact, with state exposed to assistive technology.
  $$('.faq-question').forEach((button) => button.addEventListener('click', () => {
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    $$('.faq-question').forEach((otherButton) => {
      otherButton.setAttribute('aria-expanded', 'false');
      document.getElementById(otherButton.getAttribute('aria-controls')).hidden = true;
    });
    button.setAttribute('aria-expanded', String(!isExpanded));
    document.getElementById(button.getAttribute('aria-controls')).hidden = isExpanded;
  }));

  // Newsletter validation is local only; no subscriber data leaves the browser.
  $('#newsletter-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const input = $('#newsletter-email');
    const message = $('#newsletter-message');
    const email = input.value.trim();
    if (!emailPattern.test(email)) {
      message.className = 'newsletter-message is-error';
      message.textContent = 'Please enter a valid email address.';
      input.focus();
      return;
    }
    message.className = 'newsletter-message';
    message.textContent = 'Thanks. This demo has not saved your email; connect an email platform to collect subscriptions.';
  });

  // Contact form validates required fields and email but deliberately does not fake delivery.
  $('#contact-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const message = $('#contact-message');
    const values = Object.fromEntries(new FormData(form));
    const required = ['name', 'email', 'subject', 'message'];
    const missing = required.find((field) => !String(values[field] || '').trim());
    if (missing) {
      message.className = 'contact-message is-error';
      message.textContent = 'Please complete every field before sending.';
      form.elements.namedItem(missing).focus();
      return;
    }
    if (!emailPattern.test(String(values.email).trim())) {
      message.className = 'contact-message is-error';
      message.textContent = 'Please enter a valid email address.';
      form.elements.namedItem('email').focus();
      return;
    }
    message.className = 'contact-message is-success';
    message.textContent = 'Your message is valid. This demo has not delivered it; connect a backend or form service.';
  });

  // Images fall back to their frame color rather than leaving a broken-image glyph.
  $$('img').forEach((image) => {
    image.addEventListener('error', () => {
      image.dataset.failed = 'true';
      image.alt = image.alt ? `${image.alt} (image unavailable)` : 'Image unavailable';
    }, { once: true });
  });

  // Reveal elements as they enter the viewport, while respecting reduced-motion preferences.
  const revealItems = $$('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-revealed'));
  }

  $('#current-year').textContent = String(new Date().getFullYear());
  window.lucide?.createIcons();
})();
