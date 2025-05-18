$(document).ready(function() {
    // Mobile menu toggle
    $('.mobile-menu').click(function() {
        $('.nav-links').toggleClass('active');
    });

    // Testimonial slider
    const testimonials = $('.testimonial');
    const dots = $('.dot');
    let currentIndex = 0;

    // Initialize first testimonial
    $(testimonials[0]).addClass('fade-in');
    $(dots[0]).addClass('active');

    // Hide all testimonials except first one
    for (let i = 1; i < testimonials.length; i++) {
        $(testimonials[i]).hide();
    }

    // Function to show a specific testimonial
    function showTestimonial(index) {
        // Hide all testimonials
        testimonials.hide().removeClass('fade-in');
        dots.removeClass('active');

        // Show selected testimonial
        $(testimonials[index]).show().addClass('fade-in');
        $(dots[index]).addClass('active');
        currentIndex = index;
    }

    // Click event for dots
    dots.each(function(index) {
        $(this).click(function() {
            showTestimonial(index);
        });
    });

    // Auto rotate testimonials
    setInterval(function() {
        let nextIndex = currentIndex + 1;
        if (nextIndex >= testimonials.length) {
            nextIndex = 0;
        }
        showTestimonial(nextIndex);
    }, 5000);

    // Smooth scroll for navigation
    $('a[href^="#"]').on('click', function(e) {
        e.preventDefault();

        const target = $(this.getAttribute('href'));
        if(target.length) {
            $('html, body').stop().animate({
                scrollTop: target.offset().top - 70
            }, 500);
        }
    });

    // Animation on scroll
    $(window).scroll(function() {
        const windowHeight = $(window).height();
        const scrollTop = $(window).scrollTop();
        
        $('.feature-card, .team-member').each(function() {
            const elementTop = $(this).offset().top;
            
            if (elementTop < (scrollTop + windowHeight - 100)) {
                $(this).addClass('slide-in');
            }
        });
    });
});