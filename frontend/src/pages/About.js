import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/About.css';

const About = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [hasBusiness, setHasBusiness] = useState(false);
  
  // Check authentication status and business listing status
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      
      if (token && isLoggedIn) {
        setIsAuthenticated(true);
        
        // Try to get user data
        const userDataString = localStorage.getItem('user');
        if (userDataString) {
          try {
            const parsedUserData = JSON.parse(userDataString);
            setUserData(parsedUserData);
            
            // Check if user has a business listed
            const hasBusinessListed = localStorage.getItem('hasBusiness') === 'true' || 
              (parsedUserData.businessId !== undefined && parsedUserData.businessId !== null);
            setHasBusiness(hasBusinessListed);
          } catch (e) {
            console.error('Error parsing user data', e);
          }
        }
      } else {
        setIsAuthenticated(false);
        setUserData(null);
        setHasBusiness(false);
      }
    };
    
    checkAuth();
  }, []);

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
    <div className="about-page">
      {/* Hero Section - Modern design */}
      <div className="about-hero modern-hero">
        <div className="container">
          <div className="hero-content">
            <h1>About LocalServices</h1>
            <p>Connecting communities with trusted local services since 2023</p>
          </div>
        </div>
      </div>

      {/* Our Mission */}
      <section className="about-section mission-section modern-section">
        <div className="container">
          <div className="section-grid">
            <div className="section-content animate__animated animate__fadeIn">
              <span className="section-badge">Our Mission</span>
              <h2>Transforming how communities connect with local services</h2>
              <p>
                At LocalServices, we're dedicated to making it easy for people to find reliable, skilled professionals in their local area. We believe everyone deserves access to quality services without the frustration of endless searching and uncertainty.
              </p>
              <p>
                Our platform bridges the gap between service providers and customers, creating a trusted marketplace where quality, reliability, and customer satisfaction are always the priority.
              </p>
            </div>
            <div className="section-image animate__animated animate__fadeInRight">
              <img src="https://i.pinimg.com/736x/1d/64/3c/1d643c667ecdc9169f3a27236b868a7f.jpg" alt="Team collaboration" className="rounded-image" />
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="about-section story-section modern-section">
        <div className="container">
          <div className="section-grid reverse">
            <div className="section-content animate__animated animate__fadeIn">
              <span className="section-badge">Our Story</span>
              <h2>From idea to community platform</h2>
              <p>
                LocalServices began when our founder struggled to find reliable local services after moving to a new city. After weeks of asking neighbors, searching online, and dealing with unreturned calls, a simple idea emerged: create a single trusted platform where finding quality local services is simple and stress-free.
              </p>
              <p>
                Founded in 2023, we've grown from a small team with a big vision to a thriving marketplace connecting thousands of service providers with customers across the country.
              </p>
            </div>
            <div className="section-image animate__animated animate__fadeInLeft">
              <img src="https://i.pinimg.com/736x/f2/65/32/f26532a17b2d949dd49b5db74e9a5a06.jpg" alt="Company growth" className="rounded-image" />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section - Improved styling */}
      <section className="about-section values-section modern-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge center">Our Values</span>
            <h2 className="animate__animated animate__fadeIn">What drives us every day</h2>
            <p className="animate__animated animate__fadeIn animate__delay-1s">Our core values guide everything we do, from how we build our platform to how we interact with our community.</p>
          </div>

          <div className="values-grid modern-steps">
            <div className="value-card modern-step-card animate__animated animate__fadeInUp animate__delay-1s">
              <div className="value-icon">🤝</div>
              <h3>Trust</h3>
              <p>We believe trust is earned through transparency, reliability, and consistently exceeding expectations.</p>
            </div>

            <div className="value-card modern-step-card animate__animated animate__fadeInUp animate__delay-2s">
              <div className="value-icon">⭐</div>
              <h3>Quality</h3>
              <p>We're committed to connecting customers with only the most qualified and dedicated service providers.</p>
            </div>

            <div className="value-card modern-step-card animate__animated animate__fadeInUp animate__delay-3s">
              <div className="value-icon">💡</div>
              <h3>Innovation</h3>
              <p>We constantly evolve our platform to make finding and providing services simpler and more efficient.</p>
            </div>

            <div className="value-card modern-step-card animate__animated animate__fadeInUp animate__delay-4s">
              <div className="value-icon">🏠</div>
              <h3>Community</h3>
              <p>We strengthen local economies by supporting small businesses and connecting neighbors with local experts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="about-section team-section modern-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge center">Our Team</span>
            <h2 className="animate__animated animate__fadeIn">Meet the people behind LocalServices</h2>
            <p className="animate__animated animate__fadeIn animate__delay-1s">
              Our diverse team combines expertise in technology, customer service, and local business to build the best platform possible.
            </p>
          </div>

          <div className="team-grid modern-services">
            <div className="team-member modern-featured-card animate__animated animate__fadeInUp">
              <div className="member-image modern-profile-image">
                <img src="/images/ritik.jpg" alt="Ritik Sah" onError={(e) => {
                  e.target.src = "https://via.placeholder.com/300x300?text=Ritik+Sah";
                }} className="rounded-full" />
              </div>
              <h3>Ritik Sah</h3>
              <p className="member-role">Co-Founder & Backend Lead</p>
              <p className="member-bio">Led the design and implementation of scalable backend architecture. Managed server-side logic, API development, authentication systems, and cloud infrastructure. Focused on performance, security, and system reliability to support rapid product growth.</p>
            </div>

            <div className="team-member modern-featured-card animate__animated animate__fadeInUp animate__delay-2s">
              <div className="member-image modern-profile-image">
                <img src="/images/deepak.jpg" alt="Deepak Pokhrel" onError={(e) => {
                  e.target.src = "https://via.placeholder.com/300x300?text=Deepak+Pokhrel";
                }} className="rounded-full" />
              </div>
              <h3>Deepak Pokhrel</h3>
              <p className="member-role">Co-Founder & Frontend Lead</p>
              <p className="member-bio">Directed the development of the user interface and overall user experience. Built responsive, accessible, and dynamic web applications using modern frameworks. Translated product vision into seamless and engaging frontend experiences.</p>
            </div>

            <div className="team-member modern-featured-card animate__animated animate__fadeInUp animate__delay-1s">
              <div className="member-image modern-profile-image">
                <img src="/images/hritik.jpg" alt="Hritik Kumar Sah" onError={(e) => {
                  e.target.src = "https://via.placeholder.com/300x300?text=Hritik+Kumar+Sah";
                }} className="rounded-full" />
              </div>
              <h3>Hritik Kumar Sah</h3>
              <p className="member-role">Co-Founder & Database Lead</p>
              <p className="member-bio">Architected and maintained the core data infrastructure. Designed efficient schemas, optimized queries, and ensured data integrity, security, and scalability. Played a key role in decision-making around storage solutions, backups, and system resilience.

</p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="about-section impact-section modern-stats">
        <div className="container">
          <div className="section-header">
            <span className="section-badge center">Our Impact</span>
            <h2 className="animate__animated animate__fadeIn">Making a difference in communities</h2>
            <p className="animate__animated animate__fadeIn animate__delay-1s">We're proud of the positive impact we've made since our launch.</p>
          </div>

          <div className="impact-stats stats-container">
            <div className="stat-card modern-stat-card animate__animated animate__fadeInUp">
              <div className="stat-icon">👥</div>
              <div className="stat-number" data-count="5000">5,000+</div>
              <div className="stat-label">Service Providers</div>
            </div>
            
            <div className="stat-card modern-stat-card animate__animated animate__fadeInUp animate__delay-1s">
              <div className="stat-icon">✅</div>
              <div className="stat-number" data-count="20000">20,000+</div>
              <div className="stat-label">Happy Customers</div>
            </div>
            
            <div className="stat-card modern-stat-card animate__animated animate__fadeInUp animate__delay-2s">
              <div className="stat-icon">🌎</div>
              <div className="stat-number" data-count="50">50+</div>
              <div className="stat-label">Cities Served</div>
            </div>
            
            <div className="stat-card modern-stat-card animate__animated animate__fadeInUp animate__delay-3s">
              <div className="stat-icon">⭐</div>
              <div className="stat-number" data-count="4.8">4.8/5</div>
              <div className="stat-label">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Join Us CTA - Based on authentication state */}
      <section className="about-section cta-section modern-cta">
        <div className="container">
          <div className="cta-content animate__animated animate__fadeIn">
            <h2>Ready to get started?</h2>
            {!isAuthenticated ? (
              <>
                <p>Join our platform today to list your business or find services</p>
                <div className="cta-buttons modern-cta-buttons">
                  <Link to="/register" className="cta-button primary modern-primary animate__animated animate__pulse animate__infinite">Register Now</Link>
                  <Link to="/login" className="cta-button secondary modern-secondary">Login</Link>
                </div>
              </>
            ) : (
              <>
                <p>Discover top-rated service providers in your area</p>
                <div className="cta-buttons modern-cta-buttons">
                  <Link to="/services" className="cta-button primary modern-primary animate__animated animate__pulse animate__infinite">Browse Services</Link>
                  {!hasBusiness && (
                    <Link to="/list-business" className="cta-button secondary modern-secondary">List Your Business</Link>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;