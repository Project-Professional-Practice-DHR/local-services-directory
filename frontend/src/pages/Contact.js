import React, { useEffect } from 'react';
import '../styles/Contact.css';

const Contact = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Animation on scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const elements = document.querySelectorAll('.animate__animated:not(.animate__animated--visible)');
      
      elements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (elementPosition < windowHeight - 100) {
          // Add class to trigger animation
          element.classList.add('animate__animated--visible');
          // Remove animation delay to prevent issues on resize
          element.style.animationDelay = '0s';
        }
      });
    };
    
    // Initial check on page load
    setTimeout(handleScroll, 500);
    
    // Add event listener for scroll
    window.addEventListener('scroll', handleScroll);
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="contact-page">
      {/* Hero Section - Modern design matching About page */}
      <div className="contact-hero modern-hero">
        <div className="container">
          <div className="hero-content">
            <h1>Get In Touch</h1>
            <p>We'd love to hear from you. Contact us with any questions or feedback.</p>
          </div>
        </div>
      </div>

      {/* Contact Information Section - styled like About page sections */}
      <section className="contact-section modern-section">
        <div className="container">
          <div className="section-grid">
            <div className="section-content animate__animated animate__fadeIn">
              <span className="section-badge">Our Contact Details</span>
              <h2>Reach out to us</h2>
              <p>
                Have questions about LocalServices? Our team is ready to assist you with any inquiries about our platform, using our services, or listing your business.
              </p>
              <p>
                We pride ourselves on being responsive and helpful. Choose your preferred method of communication below.
              </p>
            </div>
            <div className="section-image animate__animated animate__fadeInRight">
              <img src="https://img.freepik.com/premium-vector/customer-support-illustration-concept_23152-154.jpg" alt="Customer support" className="rounded-image" />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Methods - Grid layout similar to Values section in About page */}
      <section className="contact-methods-section modern-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge center">Contact Methods</span>
            <h2 className="animate__animated animate__fadeIn">Ways to reach our team</h2>
            <p className="animate__animated animate__fadeIn animate__delay-1s">Choose the method that works best for you. We're here to help!</p>
          </div>

          <div className="contact-methods-grid modern-steps">
            <div className="method-card modern-step-card animate__animated animate__fadeInUp animate__delay-1s">
              <div className="method-icon">✉️</div>
              <h3>Email Us</h3>
              <p>Get in touch via email for detailed inquiries and support requests.</p>
              <div className="method-details">
                <p><strong>Support:</strong> support@localservices.com</p>
                <p><strong>Info:</strong> info@localservices.com</p>
              </div>
            </div>

            <div className="method-card modern-step-card animate__animated animate__fadeInUp animate__delay-2s">
              <div className="method-icon">📞</div>
              <h3>Call Us</h3>
              <p>Speak directly with our customer support team for immediate assistance.</p>
              <div className="method-details">
                <p><strong>Phone:</strong> +44 (555) 123-4567</p>
                <p><strong>Hours:</strong> Mon-Fri: 9am-6pm EST</p>
              </div>
            </div>

            <div className="method-card modern-step-card animate__animated animate__fadeInUp animate__delay-3s">
              <div className="method-icon">📍</div>
              <h3>Visit Us</h3>
              <p>Visit our office for in-person meetings and discussions.</p>
              <div className="method-details">
                <p>10 Rosebery Avenue</p>
                <p>St James House, London, EC1R 4TF</p>
              </div>
            </div>

            <div className="method-card modern-step-card animate__animated animate__fadeInUp animate__delay-4s">
              <div className="method-icon">💬</div>
              <h3>Live Chat</h3>
              <p>Get instant support through our website's live chat feature.</p>
              <div className="method-details">
                <p><strong>Available:</strong> Mon-Fri: 9am-6pm EST</p>
                <p>Find the chat icon in the bottom right of our website</p>
              </div>
            </div>
          </div>
        </div>
      </section>

     {/* Social Media Section - styled like About page sections with inline SVGs */}
<section className="social-section modern-section">
  <div className="container">
    <div className="section-grid reverse">
      <div className="section-content animate__animated animate__fadeIn">
        <span className="section-badge">Connect With Us</span>
        <h2>Join our community on social media</h2>
        <p>
          Follow us on social media to stay updated with the latest news, features, and service provider highlights. We regularly share tips for finding the best local services and special promotions.
        </p>
        <div className="social-media">
              <a href="https://facebook.com" className="social-icon facebook" aria-label="Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="16" height="16">
                  <path fill="currentColor" d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"/>
                </svg>
              </a>
              <a href="https://twitter.com" className="social-icon twitter" aria-label="Twitter">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="16" height="16">
                  <path fill="currentColor" d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"/>
                </svg>
              </a>
              <a href="https://instagram.com" className="social-icon instagram" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="16" height="16">
                  <path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/>
                </svg>
              </a>
              <a href="https://linkedin.com" className="social-icon linkedin" aria-label="LinkedIn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="16" height="16">
                  <path fill="currentColor" d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z"/>
                </svg>
              </a>
            </div>
      </div>
      <div className="section-image animate__animated animate__fadeInLeft">
        <img src="https://news.temple.edu/sites/news/files/social-media_0.png?v=212136" alt="Social media connectivity" className="rounded-image" />
      </div>
    </div>
  </div>
</section>

      
      {/* FAQ Section - styled like values section in About page */}
      <section className="faq-section modern-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge center">FAQs</span>
            <h2 className="animate__animated animate__fadeIn">Frequently Asked Questions</h2>
            <p className="animate__animated animate__fadeIn animate__delay-1s">Find quick answers to common questions about our services and platform.</p>
          </div>
          
          <div className="faq-grid modern-services">
            <div className="faq-item modern-featured-card animate__animated animate__fadeInUp">
              <h3>How do I list my business on LocalServices?</h3>
              <p>To list your business, create an account and select "List Your Business" from your dashboard. Complete the required information, including your service categories, pricing, and availability.</p>
            </div>
            
            <div className="faq-item modern-featured-card animate__animated animate__fadeInUp animate__delay-1s">
              <h3>How does the booking system work?</h3>
              <p>Our booking system allows customers to see your availability and book appointments directly. You'll receive notifications about new bookings and can accept or suggest alternative times.</p>
            </div>
            
            <div className="faq-item modern-featured-card animate__animated animate__fadeInUp animate__delay-2s">
              <h3>What are the fees for service providers?</h3>
              <p>Service providers pay a small commission on completed bookings. We don't charge for creating a listing or maintaining your profile. You only pay when you earn.</p>
            </div>
            
            <div className="faq-item modern-featured-card animate__animated animate__fadeInUp animate__delay-3s">
              <h3>How are service providers vetted?</h3>
              <p>We verify business information, professional credentials, and insurance coverage. We also collect and monitor customer reviews to ensure quality service.</p>
            </div>
            
            <div className="faq-item modern-featured-card animate__animated animate__fadeInUp animate__delay-4s">
              <h3>What if I need to cancel a booking?</h3>
              <p>Customers and service providers can cancel bookings through their accounts. We encourage providing as much notice as possible and communicating directly with the other party.</p>
            </div>
            
            <div className="faq-item modern-featured-card animate__animated animate__fadeInUp animate__delay-5s">
              <h3>How do I leave a review?</h3>
              <p>After a service is completed, you'll receive a notification to leave a review. You can rate your experience and provide detailed feedback about the service provided.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="map-section modern-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge center">Our Location</span>
            <h2 className="animate__animated animate__fadeIn">Visit our office</h2>
            <p className="animate__animated animate__fadeIn animate__delay-1s">Find us at our headquarters in the heart of London City.</p>
          </div>
          
          <div className="map-container animate__animated animate__fadeIn">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1983.2906668609275!2d-0.1117296!3d51.5248017!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48761b4d6eab9423%3A0xa73d3d1546593e4b!2sQA%20Higher%20Education%2C%207-15%20Rosebery%20Ave%2C%20London%20EC1R%204SP%2C%20UK!5e0!3m2!1sen!2sus!4v1715080075685!5m2!1sen!2sus" 
              width="100%" 
              height="450" 
              style={{ border:0 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="LocalServices Location"
              className="rounded-map"
            ></iframe>
          </div>
        </div>
      </section>

      {/* CTA Section - matching About page */}
      <section className="contact-section cta-section modern-cta">
        <div className="container">
          <div className="cta-content animate__animated animate__fadeIn">
            <h2>Ready to explore LocalServices?</h2>
            <p>Browse services or list your business on our platform today</p>
            <div className="cta-buttons modern-cta-buttons">
              <a href="/services" className="cta-button primary modern-primary animate__animated animate__pulse animate__infinite">Browse Services</a>
              <a href="/list-business" className="cta-button secondary modern-secondary">List Your Business</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;