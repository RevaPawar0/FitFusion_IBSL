// ================= SCROLL ANIMATIONS =================

const animatedElements = document.querySelectorAll(
    ".section-heading, .why-card, .achievement-card, .membership-card, .shop-card, .product-card, .about-content, .instagram, .contact-container"
);

const observer = new IntersectionObserver(
    (entries) => {

        entries.forEach((entry) => {

            if (entry.isIntersecting) {

                entry.target.classList.add("show");

                observer.unobserve(entry.target);
            }

        });

    },
    {
        threshold: 0.15
    }
);

animatedElements.forEach((element) => {

    element.classList.add("hidden");

    observer.observe(element);

});


// ================= MOBILE NAVBAR =================

const menuBtn = document.getElementById("menuBtn");
const navLinks = document.querySelector(".nav-links");

if (menuBtn && navLinks) {

    menuBtn.addEventListener("click", () => {

        navLinks.classList.toggle("active");

    });


    // Close menu after clicking a link

    const navItems = navLinks.querySelectorAll("a");

    navItems.forEach((link) => {

        link.addEventListener("click", () => {

            navLinks.classList.remove("active");

        });

    });

}

// ================= CONTACT FORM =================

const contactForm = document.getElementById("contactForm");

if (contactForm) {

    contactForm.addEventListener("submit", (event) => {

        event.preventDefault();

        alert("Thank you! Your enquiry has been received.");

        contactForm.reset();

    });

}

// ================= BACK TO TOP =================

const backToTop = document.getElementById("backToTop");

if (backToTop) {

    window.addEventListener("scroll", () => {

        if (window.scrollY > 500) {
            backToTop.classList.add("show");
        } else {
            backToTop.classList.remove("show");
        }

    });

    backToTop.addEventListener("click", () => {

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });

}