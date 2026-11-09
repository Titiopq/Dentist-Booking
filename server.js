const express = require('express');
const dotenv = require('dotenv');
const cookieParser=require('cookie-parser');
const connectDB = require('./config/db');
const cors = require('cors');
const mongoSanitize=require('@exortek/express-mongo-sanitize');
const helmet=require('helmet');
const {xss}=require('express-xss-sanitizer');
const rateLimit=require('express-rate-limit');
const hpp=require('hpp');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');

//Route files
const hospitals = require ('./routes/hospitals');
const auth = require ('./routes/auth');
const appointments = require ('./routes/appointments');
const dentists = require ('./routes/dentists');

//Load env vars
dotenv.config({path:'./config/config.env'});

//Connect to database
connectDB();

const app=express();

app.set('query parser', 'extended');

//add body parser
app.use(express.json());

//add cookie parser
app.use(cookieParser());

//Sanitize data
app.use(mongoSanitize());

//Set security headers
app.use(helmet());

//Prevent XSS attacks
app.use(xss());

//Rate Limiting
const limiter=rateLimit({
    windowMs:10*60*1000,//10 mins
    max: 100
});
app.use(limiter);

//Prevent http param pollutions
app.use((req,res,next)=>{ Object.defineProperty(req,'query',{value:{...req.query},writable:true}); next(); });
app.use(hpp());

app.use(cors());

app.set('trust proxy', 1);

app.use('/api/v1/hospitals',hospitals)
app.use('/api/v1/auth',auth)
app.use('/api/v1/appointments',appointments)
app.use('/api/v1/dentists',dentists)

const swaggerOptions={
    swaggerDefinition:{
        openapi: '3.0.0',
        info: {
            title: 'Library API',
            version: '1.0.0',
            description: 'A simple Express VacQ API'
        },
        servers: [
            {
                url: 'http://localhost:5003/api/v1',
            }
        ],
    },
    apis:['./routes/*.js'],
};
const swaggerDocs=swaggerJsDoc(swaggerOptions);
app.use('/api-docs',swaggerUI.serve, swaggerUI.setup(swaggerDocs));


const PORT=process.env.PORT || 5003;

const server = app.listen(PORT, console.log('Server running in ', process.env.NODE_ENV, ' mode on port ', PORT));

//Handle unhandled promise rejections
process.on('unhandledRejection', (err,promise)=>{
    console.log(`Error: ${err.message}`); 
    //Close server & exit process
    server.close(()=>process.exit(1)); 
});
