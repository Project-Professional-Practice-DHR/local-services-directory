import React from 'react';
import '../styles/ListBusiness.css';

const ListBusiness = () => {
  return (
    <div className="list-business-container">
      <div className="content-wrapper">
        <h1>List Your Business with Us</h1>
        <p>
          We're excited to help you get started! To list your business on our platform, you can choose between visiting our office or submitting your documents online.
        </p>
        
        <div className="submission-options">
          <h2>Two Ways to List Your Business</h2>
          
          <div className="option offline-option">
            <h3>Option 1: Visit Our Office</h3>
            <p>123 Business Avenue<br />Suite 456, New York, NY 10001</p>
            <p><strong>Office Hours:</strong> Monday - Friday, 9:00 AM - 5:00 PM</p>
            <p>Please bring physical copies of all required documents listed below.</p>
            <p>Our staff will guide you through the process and answer any questions on the spot.</p>
          </div>
          
          <div className="option online-option">
            <h3>Option 2: Submit Online</h3>
            <p>Scan all your documents and email them to: <a href="mailto:info@serviceshub.com">info@serviceshub.com</a></p>
            <p>In the subject line, please write: "Business Listing - [Your Business Name]"</p>
            <p><strong>Important:</strong> Please ensure all scanned documents are clearly legible (PDF format preferred).</p>
            <p>Include your preferred contact method in the email body for faster processing.</p>
            <p>We will review your submission and contact you within 2-3 business days.</p>
          </div>
        </div>
        
        <div className="contact-info">
          <h3>Contact Us</h3>
          <p>Email: <a href="mailto:info@serviceshub.com">info@serviceshub.com</a></p>
          <p>Phone: <a href="tel:+15551234567">+1 (555) 123-4567</a></p>
        </div>
        
        <div className="required-documents">
          <h3>Documents Required to List Your Business</h3>
          <ul>
            <li>Business License or Registration Certificate</li>
            <li>Proof of Address (Utility Bill or Lease Agreement)</li>
            <li>Valid Government-issued ID (for the business owner)</li>
            <li>Tax Identification Number (TIN)</li>
            <li>Service or Product Portfolio (if applicable)</li>
            <li>Insurance Documents (if required by category)</li>
          </ul>
        </div>
        
        <div className="benefits-section">
          <h3>Benefits of Listing Your Business With Us</h3>
          <ul>
            <li>Increased visibility to thousands of potential customers</li>
            <li>Customizable business profile to showcase your services</li>
            <li>Customer reviews and rating system to build credibility</li>
            <li>Optional premium listing features for enhanced promotion</li>
            <li>Monthly analytics reports on profile views and engagement</li>
          </ul>
        </div>
        
        <div className="next-steps">
          <h3>What Happens Next?</h3>
          <ol>
            <li>Submit your documents (online or in person)</li>
            <li>Our team reviews your application</li>
            <li>You receive confirmation email with login credentials</li>
            <li>Complete your business profile</li>
            <li>Your listing goes live on our platform!</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ListBusiness;