# Twitter Application

A modern social media application built with Next.js and Prisma, featuring user authentication, tweet management, reactions, and following system.

## Features

- 🔐 User authentication (register, login, logout)
- 👤 User profiles
- 📝 Tweet creation and management
- 🔄 Follow/unfollow functionality
- 👍 Reaction system (Like, Love, Funny)
- 📊 Role-based access control
- 🖼️ Image upload support for tweets

## Technologies Used

### Frontend

- Next.js 15.5.5
- React 19.1.0
- TypeScript
- Tailwind CSS

### Backend

- Next.js API Routes
- Prisma ORM
- PostgreSQL Database
- JSON Web Tokens (JWT)
- bcryptjs for password hashing

### Development Tools

- TypeScript
- ESLint
- Prisma CLI
- ts-node

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (LTS version recommended)
- PostgreSQL database
- npm or yarn package manager

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/Wesamdah/vica_twitter_task.git
   cd twitter_app
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory and add the following:

   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name"
   JWT_SECRET="your-secret-key"
   ```

4. **Database Setup**

   ```bash
   # Generate Prisma Client
   npx prisma generate

   # Run migrations
   npx prisma migrate dev

   # (Optional) Seed the database
   npx prisma db seed
   ```

5. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

   The application will be available at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── src/
│   ├── app/               # Next.js app directory
│   │   ├── api/          # API routes
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── lib/              # Utility libraries
│   └── utils/            # Helper functions
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
└── public/              # Static files
```

## API Routes

- **Authentication**

  - POST `/api/auth/register` - Register new user
  - POST `/api/auth/login` - User login
  - POST `/api/auth/logout` - User logout
  - GET `/api/auth/profile/:id` - Get user profile

- **Tweets**

  - GET `/api/tweets` - Get all tweets
  - POST `/api/tweets` - Create new tweet
  - GET `/api/tweets/:id` - Get specific tweet
  - PUT `/api/tweets/:id` - Update tweet
  - DELETE `/api/tweets/:id` - Delete tweet

- **Reactions**

  - POST `/api/reaction` - Add reaction to tweet
  - GET `/api/tweets/:id/reactions` - Get tweet reactions

- **Follow System**
  - POST `/api/follow/:id` - Follow/unfollow user
  - GET `/api/follow/:id/count` - Get follower/following count

## Database Schema

The application uses a PostgreSQL database with the following main models:

- User
- Tweet
- Reaction
- Follow
- Role
- Permission
- PermissionRoles

For detailed schema information, check `prisma/schema.prisma`.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available for all developers [#Wessam_Dahrouj].
