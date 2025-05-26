/** @format */

import mongoose from 'mongoose';

const MONGO_URI =
	process.env.MONGO_URI ||
	'mongodb+srv://hakixer:mynameisexcel2@mern-app.6jk1agk.mongodb.net/?retryWrites=true&w=majority&appName=mern-app';

export const connectToMongo = async (): Promise<void> => {
	try {
		await mongoose.connect(MONGO_URI);
		console.log('💚 MongoDB connected successfully!');
	} catch (error) {
		console.error('💔 MongoDB connection error:', error);
		process.exit(1);
	}
};
