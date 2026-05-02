import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import express from 'express';

export const applyMiddlewares = (app, config) => {
    app.use(cors({
        origin: config.CLIENT_URL,
        credentials: true,
    }));

    app.use(helmet());
    // app.use(rateLimit({
    //     windowMs: 15 * 60 * 1000,
    //     max: 100
    // }));

    app.use(express.json({ limit: '10kb' }));
    app.use(express.urlencoded({ extended: true }));

    app.use(cookieParser());

    if (config.NODE_ENV === 'development') {
        app.use(morgan('dev'));
    }
};