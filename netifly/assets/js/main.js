// Initialize the Glide slider for the hero section
new Glide('#hero-slider', {
  type: 'carousel',
  autoplay: 3000,
  hoverpause: true,
  animationDuration: 400,
  perView: 1,
  gap: 0
}).mount();

// Initialize Mermaid for rendering flowcharts
mermaid.initialize({
  startOnLoad: true
});

// Initialize AOS animations
AOS.init({
  duration: 800,
  once: true
});

// Mobile menu toggle
const menuBtn = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
menuBtn.addEventListener('click', () => {
  mobileMenu.classList.toggle('hidden');
});


const consultation = () => {
  document.getElementById('inquiry').value = 'consultation';
  document.getElementById('message').value =
    'Dear Anvilcloud Administrator,\nI would like to request a consultation. Do you have time on xx.xx.xxxx at xx:xx or on xx.xx.xxxx at xx:xx?';
}
const trial = () => {
  document.getElementById('inquiry').value = 'trial';
  document.getElementById('message').innerText =
    'Dear Anvilcloud Administrator,\nI would like to request a free trial';
}

function required() {
  const inquiryValue = document.getElementById('inquiry').value;
  const phoneAsterisk = document.getElementById('phoneAsterisk');
  const phone = document.getElementById('phone');
 
  if (inquiryValue === 'consultation') {  
    phoneAsterisk.style.display = 'inline';
    phone.toggleAttribute('required');
  } else if (inquiryValue === 'trial') {
    phoneAsterisk.style.display = 'inline';
    phone.toggleAttribute('required');
  } else {
    phoneAsterisk.style.display = 'none';
    phoneAsterisk.toggleAttribute('required');
  }
}

document.addEventListener('DOMContentLoaded', function () {
  // Modal event listeners for Privacy Policy
  const privacyPolicyLink = document.getElementById('privacyPolicyLink');
  const privacyPolicyModal = document.getElementById('privacyPolicyModal');
  const closePrivacyPolicy = document.getElementById('closePrivacyPolicy');

  if (privacyPolicyLink && privacyPolicyModal && closePrivacyPolicy) {
    privacyPolicyLink.addEventListener('click', function (e) {
      e.preventDefault();
      privacyPolicyModal.classList.remove('hidden');
    });

    closePrivacyPolicy.addEventListener('click', function () {
      privacyPolicyModal.classList.add('hidden');
    });
  }

  // Modal event listeners for Terms of Service
  const termsModalLink = document.getElementById('termsModalLink');
  const termsModal = document.getElementById('termsModal');
  const closeTermsModal = document.getElementById('closeTermsModal');

  if (termsModalLink && termsModal && closeTermsModal) {
    termsModalLink.addEventListener('click', function (e) {
      e.preventDefault();
      termsModal.classList.remove('hidden');
    });

    closeTermsModal.addEventListener('click', function () {
      termsModal.classList.add('hidden');
    });
  }

  // Contact form submission with improved feedback and timeout
  const contactForm = document.getElementById('contact-form');
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const formResponse = document.getElementById('form-response');
  
  if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Disable the submit button and show a loading state
      submitButton.disabled = true;
      const originalButtonText = submitButton.textContent;
      submitButton.textContent = 'Sending...';

      // Gather and trim form data
      const data = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        company: document.getElementById('company').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        inquiry: document.getElementById('inquiry').value,
        message: document.getElementById('message').value.trim()
      };

      console.log('Form data:', data);

      // Create an AbortController to timeout the fetch request after 10 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch('http://localhost:3999/.netlify/functions/server', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const result = await response.json();
        console.log('Form submission result:', result);
        if (result.success) {
          formResponse.classList.remove('text-red-500');
          formResponse.classList.add('text-green-500');
          formResponse.textContent = 'Thank you for your message! We will get back to you soon.';

          // Optionally reset the form after a short delay
          setTimeout(() => {
            contactForm.reset();
            formResponse.textContent = '';
          }, 5000);
        } else {
          formResponse.classList.remove('text-green-500');
          formResponse.classList.add('text-red-500');
          formResponse.textContent = 'There was an error. Please try again.';
        }
      } catch (error) {
        console.error('Error submitting the form:', error);
        if (error.name === 'AbortError') {
          formResponse.classList.remove('text-green-500');
          formResponse.classList.add('text-red-500');
          formResponse.textContent = 'Request timed out. Please try again later.';
        } else {
          formResponse.classList.remove('text-green-500');
          formResponse.classList.add('text-red-500');
          formResponse.textContent = 'An unexpected error occurred. Please try again later.';
        }
      } finally {
        // Re-enable the submit button and restore the original text
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        contactForm.reset();
      }
    });
  }
});
