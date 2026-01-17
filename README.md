# 🚀 NexCommerce - Modern Full-Stack E-Commerce Platform

A next-generation e-commerce platform built with Next.js, Express, and TypeScript. Features a custom chart builder, dynamic theme system, multi-payment gateway support, and comprehensive admin dashboard.

## ✨ Key Features

### 🎨 **Custom Chart Builder**
- Visual analytics dashboard builder
- Dynamic data source configuration
- Customizable chart types with filters and aggregations
- Real-time data processing

### 🎭 **Dynamic Theme System**
- Customizable themes with colors, fonts, and layouts
- Multiple active theme management
- Dark/light mode support
- Theme preview and activation

### 💳 **Multi-Payment Gateway**
- Stripe integration
- JazzCash support
- EasyPaisa integration
- Multiple payment methods per user
- Secure payment processing

### 📦 **Product Management**
- Product catalog with categories
- Image and video media support
- Size-based inventory management
- Product archiving
- Best sellers tracking
- Discount system (product & category level)

### 🛒 **Shopping Experience**
- Shopping cart with persistent storage
- Guest checkout support
- Abandoned cart recovery with email notifications
- Order management and tracking
- Product reviews with media support

### 🎯 **Offers & Promotions**
- Dynamic offer system
- Category-based discounts
- Product-specific offers
- Banner management with JSON configuration
- Time-based offer scheduling

### 👥 **User Management**
- User authentication (Email/Password)
- Google OAuth integration
- Email verification system
- Password reset functionality
- User profiles with address management
- Role-based access control (Admin/User)

### 📊 **Admin Dashboard**
- Comprehensive analytics
- Custom chart builder
- Order management
- User management
- Product management
- Review moderation
- Refund & return processing
- Settings management

### 📧 **Email System**
- Order confirmation emails
- Shipping notifications
- Abandoned cart reminders
- Newsletter system
- Password reset emails
- Email verification codes

### 🔒 **Security Features**
- XSS protection
- Rate limiting
- Helmet.js security headers
- Password hashing with bcrypt
- JWT authentication
- Input validation and sanitization

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 16.1.1 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **State Management:** Redux Toolkit
- **Data Fetching:** TanStack React Query
- **Forms:** Formik + Yup
- **Charts:** Chart.js + React Chart.js 2
- **Animations:** GSAP
- **Icons:** Lucide React

### Backend
- **Framework:** Express.js 5.2.1
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma 6.19.1
- **Authentication:** Passport.js (Google OAuth)
- **Payments:** Stripe
- **Storage:** Supabase Storage
- **Email:** Nodemailer
- **Security:** Helmet, HPP, XSS-Clean, Express Rate Limit

## 📁 Project Structure

```
├── client/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/           # Next.js app router pages
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── features/      # Feature-based modules
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and config
│   │   ├── services/      # API service layer
│   │   ├── store/         # Redux store
│   │   └── types/         # TypeScript types
│   └── public/            # Static assets
│
└── server/                 # Express backend application
    ├── controllers/        # Route controllers
    ├── routes/             # API routes
    ├── prisma/             # Database schema & migrations
    ├── utils/              # Utility functions
    ├── templates/          # Email templates
    ├── scripts/            # Database scripts
    └── seeders/            # Database seeders
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL database
- Stripe account (for payments)
- Supabase account (for storage, optional)
- Google OAuth credentials (for Google login)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Shirt
   ```

2. **Install dependencies**
   ```bash
   # Install client dependencies
   cd client
   npm install

   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Set up environment variables**

   Create `.env` file in the `server` directory:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

   # JWT
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=7d

   # Server
   PORT=5000
   NODE_ENV=development

   # Stripe
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret

   # Email (Nodemailer)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password

   # Supabase (optional)
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   SUPABASE_BUCKET=your_bucket_name

   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   ```

   Create `.env.local` file in the `client` directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

4. **Set up the database**
   ```bash
   cd server
   
   # Generate Prisma Client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate dev
   
   # (Optional) Seed the database
   npx prisma db seed
   ```

5. **Run the development servers**

   Terminal 1 - Backend:
   ```bash
   cd server
   npm run dev
   ```

   Terminal 2 - Frontend:
   ```bash
   cd client
   npm run dev
   ```

6. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📜 Available Scripts

### Client Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Server Scripts
```bash
npm run dev              # Start development server with watch
npm start                # Start production server
npm run db:view          # View database data
npm run db:status        # Check database status
npm run db:switch        # Switch database connection
npm run db:fix-local     # Fix local database issues
npm run seed:best-sellers # Seed best sellers
npm run seed:offers      # Seed offers
npm run seed:abandoned-carts # Seed abandoned carts
npm run cleanup:media    # Cleanup local media files
```

## 🎯 Main Features Breakdown

### Authentication & Authorization
- Email/password registration and login
- Google OAuth 2.0 integration
- Email verification with code-based system
- Password reset with secure token system
- Role-based access control (Admin/User)

### Product Catalog
- Product CRUD operations
- Category management
- Product media (images & videos)
- Size-based inventory
- Product archiving
- Best sellers algorithm
- Advanced filtering and search

### Shopping Cart
- Persistent cart storage
- Size selection
- Quantity management
- Real-time price calculations
- Discount application

### Order Management
- Order creation and processing
- Guest checkout
- Order status tracking
- Order history
- Invoice generation

### Payment Processing
- Stripe payment integration
- Multiple payment methods
- Payment intent creation
- Webhook handling
- Payment method management

### Reviews & Ratings
- Product reviews with ratings
- Review media upload
- Review moderation
- Review approval system
- Homepage review display

### Offers & Discounts
- Dynamic offer creation
- Category-level discounts
- Product-specific offers
- Time-based offers
- Banner management

### Admin Features
- Custom chart builder
- Analytics dashboard
- User management
- Product management
- Order management
- Review moderation
- Refund/return processing
- Theme management
- Settings configuration

### Email Notifications
- Order confirmations
- Shipping notifications
- Abandoned cart reminders
- Newsletter emails
- Password reset emails
- Email verification

## 🔌 API Endpoints

### Authentication
- `POST /users/signup` - User registration
- `POST /users/login` - User login
- `POST /users/logout` - User logout
- `GET /users/auth/google` - Google OAuth
- `POST /users/verify-email` - Verify email
- `POST /users/reset-password` - Reset password

### Products
- `GET /products` - Get all products
- `GET /products/:id` - Get product by ID
- `GET /products/best-sellers` - Get best sellers
- `POST /products` - Create product (Admin)
- `PATCH /products/:id` - Update product (Admin)
- `DELETE /products/:id` - Delete product (Admin)

### Cart
- `GET /cart` - Get user cart
- `POST /cart` - Add item to cart
- `PATCH /cart/:id` - Update cart item
- `DELETE /cart/:id` - Remove cart item

### Orders
- `GET /orders` - Get all orders (Admin)
- `GET /orders/my-orders` - Get user orders
- `GET /orders/:id` - Get order by ID
- `POST /orders/checkout` - Create order
- `POST /orders/guest-checkout` - Guest checkout

### Reviews
- `GET /reviews` - Get all reviews
- `GET /reviews/homepage` - Get homepage reviews
- `POST /reviews` - Create review
- `PATCH /reviews/:id` - Update review
- `DELETE /reviews/:id` - Delete review

### Payments
- `GET /payments/methods` - Get payment methods
- `POST /payments/methods` - Add payment method
- `POST /payments/intent` - Create payment intent
- `GET /payments/stripe-key` - Get Stripe public key

## 🗄️ Database Schema

The application uses PostgreSQL with Prisma ORM. Key models include:

- **User** - User accounts and profiles
- **Product** - Product catalog
- **Category** - Product categories
- **Cart** - Shopping carts
- **Order** - Order management
- **Review** - Product reviews
- **Offer** - Promotional offers
- **PaymentMethod** - Payment methods
- **Theme** - Theme configurations
- **Settings** - Application settings
- **Banner** - Marketing banners
- **Refund** - Refund processing
- **Return** - Return processing

## 🔐 Security

- XSS protection with xss-clean
- SQL injection prevention with Prisma
- Rate limiting on API endpoints
- Helmet.js for security headers
- Password hashing with bcrypt
- JWT token-based authentication
- CORS configuration
- Input validation and sanitization

## 📝 License

This project is licensed under the ISC License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, email your-email@example.com or open an issue in the repository.

---

Built with ❤️ using Next.js, Express, and TypeScript
