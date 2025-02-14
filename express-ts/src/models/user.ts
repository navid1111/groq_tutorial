import bcrypt from 'bcryptjs';
import mongoose, { Document, Schema, Types } from 'mongoose';

interface User {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone_number?: string;
  user_roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Now, extend Document with the User interface
export interface UserDocument
  extends Document<Types.ObjectId, {}, User>,
    User {}

const UserSchema = new Schema<UserDocument>(
  {
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, minlength: 6, select: false, required: true },
    phone_number: { type: String },
    user_roles: { type: [String], required: true, default: ['user'] },
  },
  { timestamps: true },
);

// hash the password before creating the database
UserSchema.pre<UserDocument>('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

const User =
  mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);

export default User;
