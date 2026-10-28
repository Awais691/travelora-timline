# Travelora

A responsive, frontend-only travel agency website built with semantic HTML, Tailwind CSS Play CDN, custom CSS, and vanilla JavaScript.

## Run locally

1. Open the `travelora` folder in VS Code.
2. Install the **Live Server** extension if it is not already installed.
3. Right-click `index.html` and choose **Open with Live Server**.
4. The site opens in your browser. You can also open `index.html` directly, though a local server is more reliable for browser features.

The page loads Tailwind CSS from its Play CDN, Lucide icons, Google Fonts, and travel photography from Unsplash. An internet connection is needed for those external assets.

## Project files

- `index.html` contains the semantic page sections and dialogs.
- `css/style.css` contains responsive styling, motion, focus states, and reduced-motion support.
- `js/script.js` contains navigation, search, filters, dialogs, forms, carousel, accordion, and scroll behavior.

## Included interactions

- Responsive sticky navigation, mobile menu, active section indication, smooth anchor scrolling, and scroll-to-top.
- Destination search with date-range and traveler controls, empty states, and destination detail dialogs.
- Package category filters, text search, save buttons, package details, and prefilled booking inquiries.
- Gallery lightbox with previous/next controls, keyboard arrows, and Escape-to-close support.
- Previous/next testimonial controls, expandable FAQ items, and scroll-triggered reveals.
- Frontend validation for newsletter, contact, and booking inquiry forms, with success and error messages.
- Current copyright year and image-failure fallback styling.

## Demo and production notes

This project is a frontend demo. Search, dates, traveler selection, filters, modals, and validation run in the browser. The contact and booking forms do not send messages, the newsletter does not save email addresses, and there is no account system, live availability, payment processing, or database. Connect a backend, form service, email marketing provider, travel inventory API, and payment provider before using those workflows commercially. The displayed prices, reviews, statistics, email, phone number, and office address are sample content and should be replaced with verified business information.

Tailwind Play CDN is intended for prototyping and development, not production. For deployment, install Tailwind CSS as a build dependency, scan the HTML for used classes, generate a minimized stylesheet, and replace the CDN script with the built CSS. Review external image/font/icon licensing and availability as part of deployment.

## Customization

Edit destination and package cards in `index.html`, update the testimonial data in `js/script.js`, and adjust the colors in `css/style.css` and the Tailwind configuration in the page head. Sample prices and statistics are deliberately easy to find and change.
