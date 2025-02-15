import mongoose, { Document, Schema, Types } from 'mongoose';
import { UserDocument } from '../models/user'; // Import UserDocument

interface Room {
  roomId: string;
  creator: Types.ObjectId | UserDocument;
  opponent: Types.ObjectId | UserDocument | null;
  topic: string;
  status: 'waiting' | 'in_progress' | 'completed';
  arguments: {
    player: Types.ObjectId | UserDocument;
    content: string;
    timestamp: Date;
  }[];
  result: {
    winner: Types.ObjectId | UserDocument | null;
    scores: {
      player1Score: number;
      player2Score: number;
    };
    reasoning: string;
    analysis: string;
  } | null;
  createdAt: Date;
}

export interface RoomDocument
  extends Document<Types.ObjectId, {}, Room>,
    Room {}

const RoomSchema = new Schema<RoomDocument>(
  {
    roomId: String,
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    opponent: { type: Schema.Types.ObjectId, ref: 'User' },
    topic: String,
    status: {
      type: String,
      enum: ['waiting', 'in_progress', 'completed'],
      default: 'waiting',
    },
    arguments: [
      {
        player: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        content: String,
        timestamp: Date,
      },
    ],
    result: {
      winner: { type: Schema.Types.ObjectId, ref: 'User' },
      scores: {
        player1Score: Number,
        player2Score: Number,
      },
      reasoning: String,
      analysis: String,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const Room = mongoose.model<RoomDocument>('Room', RoomSchema);
export default Room;
