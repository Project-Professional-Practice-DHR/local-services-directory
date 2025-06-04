import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import Profile from './pages/User/Profile';
import UserBookings from './pages/User/UserBookings';
import UserBookingDetails from './pages/User/UserBookingDetails'; // Make sure this points to the correct file
import UserReviews from './pages/User/UserReviews';
import Booking from './pages/Booking';
import Payment from './pages/Payment';
import ListBusiness from './pages/ListBusiness';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

const App = () => {
  // Simple auth guard component for admin routes
  const AdminRoute = ({ children }) => {
    const isAuthenticated = !!localStorage.getItem('adminToken');
    
    if (!isAuthenticated) {
      return <Login />;
    }
    
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Home page with Navbar and Footer */}
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Home />
              <Footer />
            </>
          }
        />
        
        {/* Login page without Navbar and Footer */}
        <Route path="/login" element={<Login />} />
        
        {/* Register page without Navbar and Footer */}
        <Route path="/register" element={<Register />} />
        
        {/* User Profile with Navbar and Footer */}
        <Route
          path="/profile"
          element={
            <>
              <Navbar />
              <Profile />
              <Footer />
            </>
          }
        />
        
        {/* User Bookings with Navbar and Footer */}
        <Route
          path="/profile/bookings"
          element={
            <>
              <Navbar />
              <UserBookings />
              <Footer />
            </>
          }
        />
        
        {/* User Booking Details with Navbar and Footer - Changed from :reference to :bookingId */}
        <Route
          path="/profile/bookings/:bookingId"
          element={
            <>
              <Navbar />
              <UserBookingDetails />
              <Footer />
            </>
          }
        />
        
        {/* Add additional booking-related routes - Changed from :reference to :bookingId */}
        <Route
          path="/profile/bookings/:bookingId/review"
          element={
            <>
              <Navbar />
              {/* You'll need to create this component */}
              <div>Review Page - To be implemented</div>
              <Footer />
            </>
          }
        />
        
        <Route
          path="/profile/bookings/:bookingId/reschedule"
          element={
            <>
              <Navbar />
              {/* You'll need to create this component */}
              <div>Reschedule Page - To be implemented</div>
              <Footer />
            </>
          }
        />
        
        {/* User Reviews with Navbar and Footer */}
        <Route
          path="/profile/reviews"
          element={
            <>
              <Navbar />
              <UserReviews />
              <Footer />
            </>
          }
        />
        
        {/* Contact page with Navbar and Footer */}
        <Route
          path="/contact"
          element={
            <>
              <Navbar />
              <Contact />
              <Footer />
            </>
          }
        />
        {/* FIXED: Single booking details route - matches the navigation from UserBookings */}
        <Route
          path="/userbooking/:id"
          element={
            <>
              <Navbar />
              <UserBookingDetails />
              <Footer />
            </>
          }
        />
        
        {/* About page with Navbar and Footer */}
        <Route
          path="/about"
          element={
            <>
              <Navbar />
              <About />
              <Footer />
            </>
          }
        />
        
        {/* Service List Page with Navbar and Footer */}
        <Route
          path="/services"
          element={
            <>
              <Navbar />
              <Services />
              <Footer />
            </>
          }
        />
        
        {/* Individual Service Detail Page with Navbar and Footer */}
        <Route
          path="/services/:id"
          element={
            <>
              <Navbar />
              <ServiceDetail />
              <Footer />
            </>
          }
        />
              
        {/* Booking Page with Navbar and Footer */}
        <Route
          path="/booking/:id"
          element={
            <>
              <Navbar />
              <Booking />
              <Footer />
            </>
          }
        />
        
        {/* Payment Pages with Navbar and Footer */}
        <Route
          path="/payment/:bookingRef"
          element={
            <>
              <Navbar />
              <Payment />
              <Footer />
            </>
          }
        />
      
        {/* List Business Page with Navbar and Footer */}
        <Route
          path="/list-business"
          element={
            <>
              <Navbar />
              <ListBusiness />
              <Footer />
            </>
          }
        />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        
        <Route
          path="/admin/services"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        
        <Route
          path="/admin/bookings"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        
        <Route
          path="/admin/analytics"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        
        <Route
          path="/admin/moderation"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        
        <Route
          path="/admin/settings"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;