document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const overlay = document.querySelector('.overlay');
    const navLinks = document.querySelectorAll('.nav-menu a');
    const header = document.querySelector('header');

    // Fungsi untuk menutup menu
    function closeMenu() {
        menuToggle.classList.remove('active');
        navMenu.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Toggle menu saat tombol hamburger diklik
    menuToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        this.classList.toggle('active');
        navMenu.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Tutup menu saat overlay diklik
    overlay.addEventListener('click', closeMenu);

    // Tutup menu saat link di menu diklik
    navLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Tutup menu saat mengklik di luar menu
    document.addEventListener('click', function(e) {
        if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
            closeMenu();
        }
    });

    // Efek scroll header
    window.addEventListener('scroll', function() {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });

    // Cegah event bubbling pada menu
    navMenu.addEventListener('click', function(e) {
        e.stopPropagation();
    });
});
