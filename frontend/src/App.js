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
import UserBookingDetails from './pages/User/UserBookingDetails';
import UserReviews from './pages/User/UserReviews';
import Booking from './pages/Booking';
import Payment from './pages/Payment';
import ListBusiness from './pages/ListBusiness';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import { Navigate } from 'react-router-dom';

const App = () => {
  // Fixed admin auth guard component
  const AdminRoute = ({ children }) => {
    // Check for admin token and user data
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    const userStr = localStorage.getItem('user') || localStorage.getItem('adminUser');
    
    console.log('AdminRoute check - Token exists:', !!token);
    console.log('AdminRoute check - User data exists:', !!userStr);
    
    if (!token) {
      console.log('No token found, redirecting to admin login');
      return <Navigate to="/admin/login" replace />;
    }

    if (!userStr) {
      console.log('No user data found, redirecting to admin login');
      return <Navigate to="/admin/login" replace />;
    }

    try {
      const userData = JSON.parse(userStr);
      console.log('User role:', userData.role);
      
      if (userData.role !== 'admin') {
        console.log('User is not admin, redirecting to admin login');
        return <Navigate to="/admin/login" replace />;
      }
      
      console.log('Admin authentication successful');
      return children;
    } catch (err) {
      console.error('Error parsing user data:', err);
      return <Navigate to="/admin/login" replace />;
    }
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
        
        {/* User Booking Details with Navbar and Footer */}
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
        
        {/* Add additional booking-related routes */}
        <Route
          path="/profile/bookings/:bookingId/review"
          element={
            <>
              <Navbar />
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
        
        {/* Single booking details route */}
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

        {/* Admin Routes - Fixed */}
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
          path="/booking"
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