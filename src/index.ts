/** @format */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();
import { start } from './lib/client';
const port = process.env.PORT || 3000;
const nikka = express();

nikka.get('/', (req: Request, res: Response) => {
	console.log('');
});

nikka.listen(port, () => {
	console.log('Starting');
	start();
	console.log('started');
	console.log('running on port', port);
});
